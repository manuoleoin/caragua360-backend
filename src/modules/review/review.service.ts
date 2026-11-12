import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService, prisma } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import { averageRating, parseId } from "../../utils/helpers";
const userSelect = { id: true, fullName: true, username: true, photoUrl: true };
async function assertTarget(localId: any, itineraryId: any) {
  if (localId) {
    const local = await prisma.local.findUnique({
      where: { id: localId },
      select: { isActive: true },
    });
    if (!local || !local.isActive)
      throw new AppError(404, "NOT_FOUND", "Destino n\xE3o encontrado.");
  }
  if (itineraryId) {
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
      select: { status: true },
    });
    if (!itinerary)
      throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
  }
}

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}
  async listReviews(req: ApiRequest) {
    const localId = req.query.localId ? Number(req.query.localId) : void 0;
    const itineraryId = req.query.itineraryId
      ? Number(req.query.itineraryId)
      : void 0;
    if (!localId && !itineraryId)
      throw new AppError(
        400,
        "TARGET_REQUIRED",
        "Informe localId ou itineraryId.",
      );
    const reviews = await this.prisma.review.findMany({
      where: {
        ...(localId ? { localId } : {}),
        ...(itineraryId ? { itineraryId } : {}),
      },
      orderBy: { createdAt: "desc" as const },
      include: { user: { select: userSelect } },
    });
    return { reviews, average: averageRating(reviews) };
  }
  async createReview(req: ApiRequest) {
    const { localId, itineraryId, rating, comment } = req.body;
    await assertTarget(localId, itineraryId);
    const existing = await this.prisma.review.findFirst({
      where: {
        userId: req.user!.id,
        localId: localId ?? null,
        itineraryId: itineraryId ?? null,
      },
    });
    if (existing) {
      throw new AppError(
        409,
        "REVIEW_EXISTS",
        "Voc\xEA j\xE1 avaliou este conte\xFAdo. Edite sua avalia\xE7\xE3o.",
      );
    }
    const review = await this.prisma.review.create({
      data: {
        userId: req.user!.id,
        localId: localId ?? null,
        itineraryId: itineraryId ?? null,
        rating,
        comment: comment ?? null,
      },
      include: { user: { select: userSelect } },
    });
    return { review };
  }
  async updateReview(req: ApiRequest) {
    const id = parseId(req.params.id, "avalia\xE7\xE3o");
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review)
      throw new AppError(
        404,
        "NOT_FOUND",
        "Avalia\xE7\xE3o n\xE3o encontrada.",
      );
    if (review.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Voc\xEA s\xF3 pode editar suas pr\xF3prias avalia\xE7\xF5es.",
      );
    }
    const updated = await this.prisma.review.update({
      where: { id },
      data: { rating: req.body.rating, comment: req.body.comment ?? null },
      include: { user: { select: userSelect } },
    });
    return { review: updated };
  }
  async deleteReview(req: ApiRequest) {
    const id = parseId(req.params.id, "avalia\xE7\xE3o");
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review)
      throw new AppError(
        404,
        "NOT_FOUND",
        "Avalia\xE7\xE3o n\xE3o encontrada.",
      );
    if (review.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Voc\xEA s\xF3 pode excluir suas pr\xF3prias avalia\xE7\xF5es.",
      );
    }
    await this.prisma.review.delete({ where: { id } });
    return { success: true };
  }
  async listComments(req: ApiRequest) {
    const localId = req.query.localId ? Number(req.query.localId) : void 0;
    const itineraryId = req.query.itineraryId
      ? Number(req.query.itineraryId)
      : void 0;
    if (!localId && !itineraryId)
      throw new AppError(
        400,
        "TARGET_REQUIRED",
        "Informe localId ou itineraryId.",
      );
    const comments = await this.prisma.comment.findMany({
      where: {
        ...(localId ? { localId } : {}),
        ...(itineraryId ? { itineraryId } : {}),
      },
      orderBy: { createdAt: "desc" as const },
      include: { user: { select: userSelect } },
    });
    return { comments };
  }
  async createComment(req: ApiRequest) {
    const { localId, itineraryId, content } = req.body;
    await assertTarget(localId, itineraryId);
    const comment = await this.prisma.comment.create({
      data: {
        userId: req.user!.id,
        localId: localId ?? null,
        itineraryId: itineraryId ?? null,
        content,
      },
      include: { user: { select: userSelect } },
    });
    return { comment };
  }
  async deleteComment(req: ApiRequest) {
    const id = parseId(req.params.id, "coment\xE1rio");
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment)
      throw new AppError(404, "NOT_FOUND", "Coment\xE1rio n\xE3o encontrado.");
    if (comment.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Voc\xEA s\xF3 pode excluir seus pr\xF3prios coment\xE1rios.",
      );
    }
    await this.prisma.comment.delete({ where: { id } });
    return { success: true };
  }
}
