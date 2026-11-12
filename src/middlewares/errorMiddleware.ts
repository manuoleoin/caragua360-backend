import { Prisma } from "@prisma/client";
import multer from "multer";
class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message2 =
      err.code === "LIMIT_FILE_SIZE"
        ? "A imagem deve ter no m\xE1ximo 5 MB."
        : "N\xE3o foi poss\xEDvel receber o arquivo enviado.";
    res
      .status(400)
      .json({ error: { code: "UPLOAD_INVALID", message: message2 } });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "J\xE1 existe um registro com estes dados.",
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res
        .status(404)
        .json({
          error: { code: "NOT_FOUND", message: "Registro n\xE3o encontrado." },
        });
      return;
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error("[database] indispon\xEDvel:", err.message);
    res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Banco de dados indispon\xEDvel no momento.",
      },
    });
    return;
  }
  const message = err instanceof Error ? err.message : "Erro inesperado";
  console.error("[server] erro n\xE3o tratado:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: env_safeMessage(message),
    },
  });
};
function env_safeMessage(message: any) {
  return process.env.NODE_ENV === "production"
    ? "Erro interno do servidor."
    : message;
}
export { AppError, errorHandler };
