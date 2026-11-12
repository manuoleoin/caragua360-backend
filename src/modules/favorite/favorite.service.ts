import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import { parseId } from "../../utils/helpers";
const photo = { orderBy: { sortOrder: "asc" as const }, take: 1 };

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}
  async listFavorites(req: ApiRequest) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" as const },
      include: {
        local: {
          include: { photos: photo, reviews: { select: { rating: true } } },
        },
        accommodation: { include: { photos: photo } },
        restaurant: { include: { photos: photo } },
        itinerary: {
          select: {
            id: true,
            title: true,
            coverPhotoUrl: true,
            status: true,
            daysCount: true,
          },
        },
      },
    });
    return { favorites };
  }
  async addFavorite(req: ApiRequest) {
    const { localId, accommodationId, restaurantId, itineraryId } = req.body;
    if (
      localId &&
      !(await this.prisma.local.findUnique({ where: { id: localId } }))
    )
      throw new AppError(404, "NOT_FOUND", "Destino n\xE3o encontrado.");
    if (
      accommodationId &&
      !(await this.prisma.accommodation.findUnique({
        where: { id: accommodationId },
      }))
    )
      throw new AppError(404, "NOT_FOUND", "Hospedagem n\xE3o encontrada.");
    if (
      restaurantId &&
      !(await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      }))
    )
      throw new AppError(404, "NOT_FOUND", "Restaurante n\xE3o encontrado.");
    if (itineraryId) {
      const itinerary = await this.prisma.itinerary.findUnique({
        where: { id: itineraryId },
      });
      if (!itinerary || itinerary.status !== "APPROVED")
        throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
    }
    const existing = await this.prisma.favorite.findFirst({
      where: {
        userId: req.user!.id,
        localId: localId ?? null,
        accommodationId: accommodationId ?? null,
        restaurantId: restaurantId ?? null,
        itineraryId: itineraryId ?? null,
      },
    });
    if (existing)
      throw new AppError(
        409,
        "ALREADY_FAVORITE",
        "Este conte\xFAdo j\xE1 est\xE1 nos seus favoritos.",
      );
    const favorite = await this.prisma.favorite.create({
      data: {
        userId: req.user!.id,
        localId: localId ?? null,
        accommodationId: accommodationId ?? null,
        restaurantId: restaurantId ?? null,
        itineraryId: itineraryId ?? null,
      },
    });
    return { favorite };
  }
  async removeFavorite(req: ApiRequest) {
    const id = parseId(req.params.id, "favorito");
    const favorite = await this.prisma.favorite.findUnique({ where: { id } });
    if (!favorite)
      throw new AppError(404, "NOT_FOUND", "Favorito n\xE3o encontrado.");
    if (favorite.userId !== req.user!.id)
      throw new AppError(403, "FORBIDDEN", "Favorito de outro usu\xE1rio.");
    await this.prisma.favorite.delete({ where: { id } });
    return { success: true };
  }
}
