const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../dist/main");
const { prisma } = require("../dist/config/database");
const { SignJWT } = require("jose");
const { env } = require("../dist/config/environment");
const routes = require("../routes.json");
let app, server;
const user = {
  id: 1,
  fullName: "Teste",
  username: "teste",
  email: "teste@example.com",
  role: "TOURIST",
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
};
before(async () => {
  prisma.session.findUnique = async () => ({
    id: "test-session",
    user,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60000),
  });
  prisma.local.findMany = async () => [];
  app = await createApp();
  server = app.getHttpServer();
});
after(async () => {
  await app?.close();
});
test("health and anonymous session retain their response contracts", async () => {
  assert.deepEqual(
    (await request(server).get("/api/health").expect(200)).body,
    { status: "ok", service: "caragua360" },
  );
  assert.deepEqual(
    (await request(server).get("/api/auth/me").expect(200)).body,
    { user: null },
  );
});
test("public list and invalid list query", async () => {
  assert.deepEqual(
    (await request(server).get("/api/locals").expect(200)).body,
    { locals: [] },
  );
  await request(server).get("/api/locals?limit=999999").expect(422);
});
test("invalid registration is rejected before reaching the database", async () => {
  const response = await request(server)
    .post("/api/auth/register")
    .send({ email: "invalid", password: "1" })
    .expect(422);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
});
test("anonymous protected routes return 401", async () => {
  for (const path of [
    "/api/users/me",
    "/api/admin/stats",
    "/api/locals/1",
    "/api/favorites",
    "/api/itineraries/mine",
  ]) {
    assert.equal((await request(server).get(path)).status, 401, path);
  }
});
test("valid bearer and cookie sessions work; tourists cannot access admin", async () => {
  const token = await new SignJWT({ sid: "test-session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.jwtIssuer)
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(env.jwtSecret));
  const response = await request(server)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  assert.equal(response.body.user.id, 1);
  await request(server)
    .get("/api/admin/stats")
    .set("Authorization", `Bearer ${token}`)
    .expect(403);
  assert.equal(
    (
      await request(server)
        .get("/api/auth/me")
        .set("Cookie", `${env.sessionCookieName}=${token}`)
        .expect(200)
    ).body.user.id,
    1,
  );
  await request(server)
    .post("/api/uploads")
    .set("Authorization", `Bearer ${token}`)
    .attach("photo", Buffer.from("test"), "test.txt")
    .expect(415);
});
test("malformed cookie and token do not crash public endpoints", async () => {
  await request(server)
    .get("/api/auth/me")
    .set("Cookie", `${env.sessionCookieName}=%ZZ`)
    .expect(200);
  await request(server)
    .get("/api/users/me")
    .set("Authorization", "Bearer invalid")
    .expect(401);
});
test("every original route is registered with its original method", async () => {
  const { DiscoveryService } = require("@nestjs/core");
  const {
    PATH_METADATA,
    METHOD_METADATA,
  } = require("@nestjs/common/constants");
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  const registered = new Set();
  for (const controller of app.get(require("../dist/app.module").AppModule)
    ? app.container.getModules().values()
    : []) {
    for (const { instance } of controller.controllers.values()) {
      if (!instance) continue;
      for (const name of Object.getOwnPropertyNames(
        Object.getPrototypeOf(instance),
      )) {
        const fn = instance[name];
        if (typeof fn !== "function") continue;
        const path = Reflect.getMetadata(PATH_METADATA, fn);
        const method = Reflect.getMetadata(METHOD_METADATA, fn);
        if (path !== undefined && method !== undefined)
          registered.add(`${methods[method]} /api/${path}`);
      }
    }
  }
  for (const route of routes)
    assert.ok(
      registered.has(`${route.method} ${route.path}`),
      `${route.method} ${route.path}`,
    );
});
