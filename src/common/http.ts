import {
  ArgumentMetadata,
  ArgumentsHost,
  Catch,
  CanActivate,
  ExecutionContext,
  ExceptionFilter,
  HttpException,
  Injectable,
  PipeTransform,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { jwtVerify } from "jose";
import { ZodType } from "zod";
import { memoryStorage } from "multer";
import { prisma } from "../config/database";
import { env } from "../config/environment";
import { AppError, errorHandler } from "../middlewares/errorMiddleware";
import { publicUser } from "../services/authService";
import { ApiRequest } from "./api-request";

export const Access = (required: boolean, roles: string[]) =>
  SetMetadata("access", { required, roles });

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<ApiRequest>();
    const policy = this.reflector.get<{ required: boolean; roles: string[] }>(
      "access",
      context.getHandler(),
    );
    const header = req.headers.authorization;
    const cookie = req.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${env.sessionCookieName}=`));
    try {
      const token = header?.startsWith("Bearer ")
        ? header.slice(7).trim()
        : cookie
          ? decodeURIComponent(cookie.slice(env.sessionCookieName.length + 1))
          : undefined;
      if (token) {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(env.jwtSecret),
          { issuer: env.jwtIssuer, algorithms: ["HS256"] },
        );
        if (typeof payload.sid === "string") {
          const session = await prisma.session.findUnique({
            where: { id: payload.sid },
            include: { user: true },
          });
          if (
            session &&
            !session.revokedAt &&
            session.expiresAt.getTime() > Date.now() &&
            session.user.isActive &&
            !session.user.deletedAt
          ) {
            req.user = publicUser(session.user);
            req.sessionId = session.id;
          }
        }
      }
    } catch {
      /* Invalid or expired tokens retain the original anonymous behavior. */
    }
    if (policy?.required && !req.user)
      throw new AppError(
        401,
        "UNAUTHENTICATED",
        "FaÃ§a login para acessar este conteÃºdo.",
      );
    if (
      policy?.roles.length &&
      (!req.user || !policy.roles.includes(req.user!.role))
    )
      throw new AppError(
        403,
        "FORBIDDEN",
        "VocÃª nÃ£o tem permissÃ£o para esta aÃ§Ã£o.",
      );
    return true;
  }
}

export class ZodPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}
  transform(value: unknown, _metadata?: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success)
      throw new AppError(
        422,
        "VALIDATION_ERROR",
        "Verifique os dados informados.",
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    return result.data;
  }
}

export const imageOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.mimetype,
      )
    )
      return callback(
        new AppError(
          415,
          "UNSUPPORTED_MEDIA",
          "Envie uma imagem JPG, PNG, WEBP ou GIF.",
        ),
        false,
      );
    callback(null, true);
  },
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    if (error instanceof HttpException) {
      const status = error.getStatus();
      return http
        .getResponse()
        .status(status)
        .json({
          error: {
            code: status === 404 ? "NOT_FOUND" : "HTTP_ERROR",
            message: error.message,
          },
        });
    }
    errorHandler(error, http.getRequest(), http.getResponse(), undefined);
  }
}
