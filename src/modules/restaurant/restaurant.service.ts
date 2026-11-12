import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import { getQuery } from "../../middlewares/validationMiddleware";
import { firstPhoto, parseId, slugify } from "../../utils/helpers";

function data(body: any) {
  return {
    name: body.name,
    description: body.description,
    neighborhood: body.neighborhood ?? null,
    address: body.address ?? null,
    contact: body.contact ?? null,
    cuisine: body.cuisine ?? null,
    openingHours: body.openingHours ?? void 0,
    priceRange: body.priceRange ?? null,
    isActive: body.isActive,
  };
}

@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}
  async listRestaurants(req: ApiRequest) {
    const query = getQuery(req);
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        isActive: true,
        ...(query.neighborhood ? { neighborhood: query.neighborhood } : {}),
        ...(query.cuisine ? { cuisine: { contains: query.cuisine } } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q } },
                { cuisine: { contains: query.q } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" as const },
      take: query.limit ?? 50,
      include: { photos: { orderBy: { sortOrder: "asc" as const }, take: 1 } },
    });
    return {
      restaurants: restaurants.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        neighborhood: item.neighborhood,
        cuisine: item.cuisine,
        priceRange: item.priceRange,
        openingHours: item.openingHours,
        summary: item.description.slice(0, 160),
        photo: firstPhoto(item.photos),
      })),
    };
  }
  async getRestaurant(req: ApiRequest) {
    const key = req.params.id;
    const numeric = Number(key);
    const item = await this.prisma.restaurant.findFirst({
      where:
        Number.isInteger(numeric) && numeric > 0
          ? { id: numeric }
          : { slug: key },
      include: { photos: { orderBy: { sortOrder: "asc" as const } } },
    });
    if (!item || (!item.isActive && req.user?.role !== "ADMIN")) {
      throw new AppError(404, "NOT_FOUND", "Restaurante n\xE3o encontrado.");
    }
    const favorite = await this.prisma.favorite.findFirst({
      where: { userId: req.user!.id, restaurantId: item.id },
    });
    return { restaurant: { ...item, isFavorite: Boolean(favorite) } };
  }
  async createRestaurant(req: ApiRequest) {
    const photos = req.body.photos ?? [];
    const base = slugify(req.body.name);
    let slug = base;
    let n = 1;
    while (await this.prisma.restaurant.findUnique({ where: { slug } }))
      slug = `${base}-${++n}`;
    const restaurant = await this.prisma.restaurant.create({
      data: {
        ...data(req.body),
        slug,
        photos: {
          create: photos.map((url, index) => ({ url, sortOrder: index })),
        },
      },
      include: { photos: true },
    });
    return { restaurant };
  }
  async updateRestaurant(req: ApiRequest) {
    const id = parseId(req.params.id, "restaurante");
    const photos = req.body.photos ?? [];
    const restaurant = await this.prisma.$transaction(async (tx) => {
      await tx.restaurant.update({ where: { id }, data: data(req.body) });
      if (photos.length > 0) {
        await tx.restaurantPhoto.deleteMany({ where: { restaurantId: id } });
        await tx.restaurantPhoto.createMany({
          data: photos.map((url, index) => ({
            restaurantId: id,
            url,
            sortOrder: index,
          })),
        });
      }
      return tx.restaurant.findUniqueOrThrow({
        where: { id },
        include: { photos: true },
      });
    });
    return { restaurant };
  }
  async deleteRestaurant(req: ApiRequest) {
    const id = parseId(req.params.id, "restaurante");
    await this.prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }
}
