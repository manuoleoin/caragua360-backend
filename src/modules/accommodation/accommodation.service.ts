import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import { getQuery } from "../../middlewares/validationMiddleware";
import { firstPhoto, parseId, slugify } from "../../utils/helpers";

function data(body: any) {
  return {
    name: body.name,
    category: body.category ?? "Pousada",
    description: body.description,
    neighborhood: body.neighborhood ?? null,
    address: body.address ?? null,
    contactPhone: body.contactPhone ?? null,
    contactEmail: body.contactEmail || null,
    website: body.website ?? null,
    amenities: body.amenities ?? void 0,
    priceRange: body.priceRange ?? null,
    isActive: body.isActive,
  };
}

@Injectable()
export class AccommodationService {
  constructor(private readonly prisma: PrismaService) {}
  async listAccommodations(req: ApiRequest) {
    const query = getQuery(req);
    const accommodations = await this.prisma.accommodation.findMany({
      where: {
        isActive: true,
        ...(query.neighborhood ? { neighborhood: query.neighborhood } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q } },
                { neighborhood: { contains: query.q } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" as const },
      take: query.limit ?? 50,
      include: { photos: { orderBy: { sortOrder: "asc" as const }, take: 1 } },
    });
    return {
      accommodations: accommodations.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        category: item.category,
        neighborhood: item.neighborhood,
        priceRange: item.priceRange,
        amenities: item.amenities,
        summary: item.description.slice(0, 160),
        photo: firstPhoto(item.photos),
      })),
    };
  }
  async getAccommodation(req: ApiRequest) {
    const key = req.params.id;
    const numeric = Number(key);
    const item = await this.prisma.accommodation.findFirst({
      where:
        Number.isInteger(numeric) && numeric > 0
          ? { id: numeric }
          : { slug: key },
      include: { photos: { orderBy: { sortOrder: "asc" as const } } },
    });
    if (!item || (!item.isActive && req.user?.role !== "ADMIN")) {
      throw new AppError(404, "NOT_FOUND", "Hospedagem n\xE3o encontrada.");
    }
    const favorite = await this.prisma.favorite.findFirst({
      where: { userId: req.user!.id, accommodationId: item.id },
    });
    return { accommodation: { ...item, isFavorite: Boolean(favorite) } };
  }
  async createAccommodation(req: ApiRequest) {
    const photos = req.body.photos ?? [];
    const base = slugify(req.body.name);
    let slug = base;
    let n = 1;
    while (await this.prisma.accommodation.findUnique({ where: { slug } }))
      slug = `${base}-${++n}`;
    const accommodation = await this.prisma.accommodation.create({
      data: {
        ...data(req.body),
        slug,
        photos: {
          create: photos.map((url, index) => ({ url, sortOrder: index })),
        },
      },
      include: { photos: true },
    });
    return { accommodation };
  }
  async updateAccommodation(req: ApiRequest) {
    const id = parseId(req.params.id, "hospedagem");
    const photos = req.body.photos ?? [];
    const accommodation = await this.prisma.$transaction(async (tx) => {
      await tx.accommodation.update({ where: { id }, data: data(req.body) });
      if (photos.length > 0) {
        await tx.accommodationPhoto.deleteMany({
          where: { accommodationId: id },
        });
        await tx.accommodationPhoto.createMany({
          data: photos.map((url, index) => ({
            accommodationId: id,
            url,
            sortOrder: index,
          })),
        });
      }
      return tx.accommodation.findUniqueOrThrow({
        where: { id },
        include: { photos: true },
      });
    });
    return { accommodation };
  }
  async deleteAccommodation(req: ApiRequest) {
    const id = parseId(req.params.id, "hospedagem");
    await this.prisma.accommodation.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }
}
