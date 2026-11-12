import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "../config/database";
import { env } from "../config/environment";
import { AppError } from "../middlewares/errorMiddleware";
import { sendPasswordResetEmail } from "./emailService";
const secretKey = new TextEncoder().encode(env.jwtSecret);
function publicUser(user: any) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    city: user.city,
    neighborhood: user.neighborhood,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt,
  };
}
function hashPassword(password: any) {
  return bcrypt.hash(password, 10);
}
function verifyPassword(password: any, hash: any) {
  return bcrypt.compare(password, hash);
}
function slugUsername(name: any) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  return base || "visitante";
}
async function uniqueUsername(name: any) {
  const base = slugUsername(name);
  let candidate = base;
  let suffix = 1;
  while (suffix < 1e3) {
    const exists = await prisma.user.findUnique({
      where: { username: candidate },
    });
    if (!exists) return candidate;
    suffix += 1;
    candidate = `${base}.${suffix}`;
  }
  return `${base}.${randomUUID().slice(0, 6)}`;
}
async function createSession(user: any, req: any) {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + env.sessionTtlMs);
  await prisma.session.create({
    data: {
      id,
      userId: user.id,
      expiresAt,
      ipAddress: req.ip?.slice(0, 64) ?? null,
      userAgent: req.headers["user-agent"]?.slice(0, 255) ?? null,
    },
  });
  const token = await new SignJWT({ sid: id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuer(env.jwtIssuer)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1e3))
    .sign(secretKey);
  return { token, expiresAt };
}
function setSessionCookie(res: any, token: any) {
  res.cookie(env.sessionCookieName, token, {
    httpOnly: true,
    // O Preview pÃºblico Ã© HTTPS e fica em iframe de outro domÃ­nio.
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/",
    maxAge: env.sessionTtlMs,
  });
}
function clearSessionCookie(res: any) {
  res.clearCookie(env.sessionCookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/",
  });
}
async function register(input: any, req: any) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(
      409,
      "EMAIL_IN_USE",
      "J\xE1 existe uma conta com este e-mail.",
    );
  }
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      username: await uniqueUsername(input.fullName),
      email,
      passwordHash: await hashPassword(input.password),
      // O cadastro pÃºblico nunca cria administradores.
      role: input.role === "RESIDENT" ? "RESIDENT" : "TOURIST",
      city: input.city?.trim() || null,
      neighborhood: input.neighborhood?.trim() || null,
      photoUrl: input.photoUrl ?? null,
      lastLoginAt: /* @__PURE__ */ new Date(),
    },
  });
  const { token } = await createSession(user, req);
  return { user: publicUser(user), token };
}
async function login(emailInput: any, password: any, req: any) {
  const email = emailInput.trim().toLowerCase();
  const since = new Date(Date.now() - env.loginLockMinutes * 60 * 1e3);
  const failures = await prisma.loginAttempt.findMany({
    where: { email, success: false, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" as const },
  });
  if (failures.length >= env.loginMaxAttempts) {
    const last = failures[0];
    const unlockAt = new Date(
      last.createdAt.getTime() + env.loginLockMinutes * 60 * 1e3,
    );
    const minutes = Math.max(
      1,
      Math.ceil((unlockAt.getTime() - Date.now()) / 6e4),
    );
    throw new AppError(
      429,
      "LOGIN_BLOCKED",
      `Muitas tentativas incorretas. Tente novamente em ${minutes} minuto(s).`,
      { unlockAt },
    );
  }
  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    user &&
    !user.deletedAt &&
    user.isActive &&
    (await verifyPassword(password, user.passwordHash));
  if (!valid || !user) {
    await prisma.loginAttempt.create({
      data: { email, success: false, ipAddress: req.ip?.slice(0, 64) ?? null },
    });
    const remaining = Math.max(0, env.loginMaxAttempts - failures.length - 1);
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      remaining > 0
        ? `E-mail ou senha incorretos. Restam ${remaining} tentativa(s).`
        : "E-mail ou senha incorretos. A conta foi bloqueada por 15 minutos.",
    );
  }
  await prisma.$transaction([
    prisma.loginAttempt.deleteMany({ where: { email, success: false } }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: /* @__PURE__ */ new Date() },
    }),
  ]);
  const { token } = await createSession(user, req);
  return { user: publicUser(user), token };
}
async function logout(sessionId: any) {
  if (!sessionId) return;
  await prisma.session
    .update({
      where: { id: sessionId },
      data: { revokedAt: /* @__PURE__ */ new Date() },
    })
    .catch(() => void 0);
}
async function requestPasswordReset(emailInput: any, origin: any) {
  const email = emailInput.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || !user.isActive) {
    return { sent: true };
  }
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: /* @__PURE__ */ new Date() },
  });
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + env.passwordResetTtlMs),
    },
  });
  const link = `${origin.replace(/\/+$/, "")}/redefinir-senha?token=${token}`;
  const delivery = await sendPasswordResetEmail(
    user.email,
    user.fullName,
    link,
  );
  return {
    sent: true,
    delivery: delivery.mode,
    devLink: delivery.mode === "console" ? link : void 0,
  };
}
async function resetPassword(token: any, newPassword: any) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw new AppError(
      400,
      "INVALID_RESET_TOKEN",
      "O link de recupera\xE7\xE3o \xE9 inv\xE1lido ou expirou.",
    );
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: /* @__PURE__ */ new Date() },
    }),
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: /* @__PURE__ */ new Date() },
    }),
  ]);
  return { success: true };
}
async function changePassword(
  userId: any,
  currentPassword: any,
  newPassword: any,
  sessionId: any,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError(
      400,
      "INVALID_PASSWORD",
      "A senha atual est\xE1 incorreta.",
    );
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        NOT: sessionId ? { id: sessionId } : void 0,
      },
      data: { revokedAt: /* @__PURE__ */ new Date() },
    }),
  ]);
  return { success: true };
}
async function anonymizeAndDeleteAccount(userId: any, sessionId: any) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "NOT_FOUND", "Conta n\xE3o encontrada.");
  await prisma.$transaction([
    prisma.session.updateMany({
      where: { userId },
      data: { revokedAt: /* @__PURE__ */ new Date() },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.loginAttempt.deleteMany({ where: { email: user.email } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        fullName: "Conta exclu\xEDda",
        username: `conta.excluida.${userId}`,
        email: `conta-excluida-${userId}-${randomUUID().slice(0, 8)}@caragua360.invalid`,
        passwordHash: await hashPassword(randomUUID()),
        city: null,
        neighborhood: null,
        photoUrl: null,
        isActive: false,
        deletedAt: /* @__PURE__ */ new Date(),
      },
    }),
  ]);
  void sessionId;
  return { success: true };
}
export {
  anonymizeAndDeleteAccount,
  changePassword,
  clearSessionCookie,
  createSession,
  hashPassword,
  login,
  logout,
  publicUser,
  register,
  requestPasswordReset,
  resetPassword,
  setSessionCookie,
  uniqueUsername,
  verifyPassword,
};
