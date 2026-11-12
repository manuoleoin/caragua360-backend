import { Injectable } from "@nestjs/common";
import { Response } from "express";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import {
  anonymizeAndDeleteAccount,
  clearSessionCookie,
  publicUser,
} from "../../services/authService";
import { storeImage } from "../../services/uploadService";
import { AppError } from "../../middlewares/errorMiddleware";
import { parseId } from "../../utils/helpers";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async meHandler(req: ApiRequest, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!user) throw new AppError(404, "NOT_FOUND", "Conta n\xE3o encontrada.");
    const [itineraries, favorites, reviews] = await Promise.all([
      this.prisma.itinerary.count({ where: { userId: user.id } }),
      this.prisma.favorite.count({ where: { userId: user.id } }),
      this.prisma.review.count({ where: { userId: user.id } }),
    ]);
    return {
      user: {
        ...publicUser(user),
        stats: { itineraries, favorites, reviews },
        emailConfigured: Boolean(process.env.SMTP_HOST),
      },
    };
  }
  async updateMeHandler(req: ApiRequest, res: Response) {
    const data = req.body;
    const user = await this.prisma.user.update({
      where: { id: req.user!.id },
      data: {
        fullName: data.fullName,
        city: data.city === void 0 ? void 0 : data.city,
        neighborhood: data.neighborhood === void 0 ? void 0 : data.neighborhood,
        photoUrl: data.photoUrl === void 0 ? void 0 : data.photoUrl,
      },
    });
    return { user: publicUser(user) };
  }
  async uploadPhotoHandler(req: ApiRequest, res: Response) {
    if (!req.file)
      throw new AppError(
        400,
        "FILE_REQUIRED",
        "Selecione uma imagem para enviar.",
      );
    const url = await storeImage(req.file, "perfil");
    const user = await this.prisma.user.update({
      where: { id: req.user!.id },
      data: { photoUrl: url },
    });
    return { user: publicUser(user), photoUrl: url };
  }
  async deleteMeHandler(req: ApiRequest, res: Response) {
    await anonymizeAndDeleteAccount(req.user!.id, req.sessionId);
    clearSessionCookie(res);
    return {
      success: true,
      message:
        "Conta exclu\xEDda. Seus conte\xFAdos hist\xF3ricos foram preservados sem dados pessoais.",
    };
  }
  async listUsersHandler(req: ApiRequest, res: Response) {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" as const },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
        city: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { itineraries: true, reviews: true } },
      },
    });
    return { users };
  }
  async updateUserAdminHandler(req: ApiRequest, res: Response) {
    const id = parseId(req.params.id, "usu\xE1rio");
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: req.body.role, isActive: req.body.isActive },
    });
    return { user: publicUser(user) };
  }
}
