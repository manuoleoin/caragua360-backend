import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import {
  averageRating,
  firstPhoto,
  parseId,
  toDate,
} from "../../utils/helpers";
const userSelect = { id: true, fullName: true, username: true, photoUrl: true };
const itineraryInclude = {
  user: { select: userSelect },
  days: {
    orderBy: { dayNumber: "asc" as const },
    include: {
      places: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          local: {
            select: { id: true, slug: true, name: true, category: true },
          },
          photos: true,
        },
      },
    },
  },
  photos: true,
  reviews: {
    include: { user: { select: userSelect } },
    orderBy: { createdAt: "desc" as const },
  },
  likes: { select: { userId: true } },
  _count: { select: { favorites: true } },
};
function serialize(itinerary: any, viewerId: any) {
  const { likes, reviews, ...rest } = itinerary;
  return {
    ...rest,
    coverPhoto:
      itinerary.coverPhotoUrl ??
      firstPhoto(
        itinerary.days.flatMap((day) =>
          day.places.flatMap((place) => place.photos),
        ),
      ),
    rating: averageRating(reviews),
    reviewsCount: reviews.length,
    likesCount: likes.length,
    likedByMe: viewerId
      ? likes.some((like) => like.userId === viewerId)
      : false,
  };
}
async function persistDays(tx: any, itineraryId: any, input: any) {
  for (const day of input.days) {
    const createdDay = await tx.itineraryDay.create({
      data: { itineraryId, dayNumber: day.dayNumber, notes: day.notes ?? null },
    });
    for (const [index, place] of day.places.entries()) {
      await tx.itineraryPlace.create({
        data: {
          itineraryId,
          dayId: createdDay.id,
          localId: place.localId ?? null,
          placeName: place.placeName,
          comments: place.comments ?? null,
          knewPlace: place.knewPlace ?? null,
          visitDate: toDate(place.visitDate),
          visitTime: place.visitTime ?? null,
          visitDuration: place.visitDuration ?? null,
          rating: place.rating ?? null,
          sortOrder: index,
          photos: {
            create: (place.photos ?? []).map((photo) => ({
              itineraryId,
              url: photo.url,
              caption: photo.caption ?? null,
            })),
          },
        },
      });
    }
  }
}

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}
  async listMyItineraries(req: ApiRequest) {
    const itineraries = await this.prisma.itinerary.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" as const },
      include: itineraryInclude,
    });
    return {
      itineraries: itineraries.map((item) => serialize(item, req.user!.id)),
    };
  }
  async listPublicItineraries(req: ApiRequest) {
    const q = typeof req.query.q === "string" ? req.query.q : void 0;
    const itineraries = await this.prisma.itinerary.findMany({
      where: {
        status: "APPROVED",
        publishedAt: { not: null },
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { publishedAt: "desc" as const },
      include: itineraryInclude,
    });
    return {
      itineraries: itineraries.map((item) => serialize(item, req.user?.id)),
    };
  }
  async getItinerary(req: ApiRequest) {
    const id = parseId(req.params.id, "roteiro");
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
      include: itineraryInclude,
    });
    if (!itinerary)
      throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
    const isOwner = req.user?.id === itinerary.userId;
    const isAdmin = req.user?.role === "ADMIN";
    const isPublic = itinerary.status === "APPROVED" && itinerary.publishedAt;
    if (!isOwner && !isAdmin && !isPublic) {
      throw new AppError(
        404,
        "NOT_FOUND",
        "Roteiro n\xE3o encontrado ou ainda n\xE3o publicado.",
      );
    }
    return { itinerary: serialize(itinerary, req.user?.id) };
  }
  async createItinerary(req: ApiRequest) {
    const input = req.body;
    const itinerary = await this.prisma.$transaction(async (tx) => {
      const created = await tx.itinerary.create({
        data: {
          userId: req.user!.id,
          title: input.title,
          description: input.description,
          daysCount: input.daysCount,
          startDate: toDate(input.startDate),
          endDate: toDate(input.endDate),
          coverPhotoUrl: input.coverPhotoUrl ?? null,
          status: "DRAFT",
        },
      });
      await persistDays(tx, created.id, input);
      return tx.itinerary.findUniqueOrThrow({
        where: { id: created.id },
        include: itineraryInclude,
      });
    });
    return { itinerary: serialize(itinerary, req.user!.id) };
  }
  async updateItinerary(req: ApiRequest) {
    const id = parseId(req.params.id, "roteiro");
    const current = await this.prisma.itinerary.findUnique({ where: { id } });
    if (!current)
      throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
    if (current.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Voc\xEA s\xF3 pode editar seus pr\xF3prios roteiros.",
      );
    }
    if (current.status === "PENDING") {
      throw new AppError(
        409,
        "ITINERARY_IN_REVIEW",
        "Aguarde a an\xE1lise antes de editar o roteiro.",
      );
    }
    const input = req.body;
    const backToDraft = current.status === "APPROVED";
    const itinerary = await this.prisma.$transaction(async (tx) => {
      await tx.itineraryPlace.deleteMany({ where: { itineraryId: id } });
      await tx.itineraryDay.deleteMany({ where: { itineraryId: id } });
      await tx.itineraryPhoto.deleteMany({ where: { itineraryId: id } });
      await tx.itinerary.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          daysCount: input.daysCount,
          startDate: toDate(input.startDate),
          endDate: toDate(input.endDate),
          coverPhotoUrl: input.coverPhotoUrl ?? null,
          ...(backToDraft ? { status: "DRAFT", publishedAt: null } : {}),
        },
      });
      await persistDays(tx, id, input);
      return tx.itinerary.findUniqueOrThrow({
        where: { id },
        include: itineraryInclude,
      });
    });
    return { itinerary: serialize(itinerary, req.user!.id) };
  }
  async deleteItinerary(req: ApiRequest) {
    const id = parseId(req.params.id, "roteiro");
    const current = await this.prisma.itinerary.findUnique({ where: { id } });
    if (!current)
      throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
    if (current.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Voc\xEA s\xF3 pode excluir seus pr\xF3prios roteiros.",
      );
    }
    await this.prisma.itinerary.delete({ where: { id } });
    return { success: true };
  }
  async submitItinerary(req: ApiRequest) {
    const id = parseId(req.params.id, "roteiro");
    const current = await this.prisma.itinerary.findUnique({
      where: { id },
      include: { days: { include: { places: true } } },
    });
    if (!current)
      throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
    if (current.userId !== req.user!.id)
      throw new AppError(403, "FORBIDDEN", "Roteiro de outro usu\xE1rio.");
    if (!["DRAFT", "REJECTED"].includes(current.status)) {
      throw new AppError(
        409,
        "INVALID_STATUS",
        "Este roteiro n\xE3o pode ser enviado para an\xE1lise.",
      );
    }
    if (current.days.flatMap((day) => day.places).length === 0) {
      throw new AppError(
        422,
        "EMPTY_ITINERARY",
        "Adicione pelo menos um local antes de enviar.",
      );
    }
    const itinerary = await this.prisma.itinerary.update({
      where: { id },
      data: {
        status: "PENDING",
        submittedAt: /* @__PURE__ */ new Date(),
        rejectionReason: null,
      },
      include: itineraryInclude,
    });
    return { itinerary: serialize(itinerary, req.user!.id) };
  }
  async toggleLike(req: ApiRequest) {
    const id = parseId(req.params.id, "roteiro");
    const itinerary = await this.prisma.itinerary.findUnique({ where: { id } });
    if (!itinerary || itinerary.status !== "APPROVED")
      throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
    const existing = await this.prisma.itineraryLike.findUnique({
      where: { userId_itineraryId: { userId: req.user!.id, itineraryId: id } },
    });
    if (existing) {
      await this.prisma.itineraryLike.delete({ where: { id: existing.id } });
      return { liked: false };
      return;
    }
    await this.prisma.itineraryLike.create({
      data: { userId: req.user!.id, itineraryId: id },
    });
    return { liked: true };
  }
}
