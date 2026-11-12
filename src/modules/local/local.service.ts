import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import { getQuery } from "../../middlewares/validationMiddleware";
import {
  averageRating,
  firstPhoto,
  parseId,
  slugify,
} from "../../utils/helpers";
const photoSelect = {
  select: { url: true, caption: true },
  orderBy: { sortOrder: "asc" as const },
};
function card(local: any) {
  return {
    id: local.id,
    slug: local.slug,
    name: local.name,
    category: local.category,
    neighborhood: local.neighborhood,
    summary: local.description.slice(0, 180),
    sea: local.sea,
    profile: local.profile,
    photo: firstPhoto(local.photos),
    rating: averageRating(local.reviews),
    reviewsCount: local.reviews.length,
  };
}

function localData(body: any) {
  const photos = body.photos ?? [];
  const data = {
    name: body.name,
    category: body.category,
    description: body.description,
    neighborhood: body.neighborhood ?? null,
    address: body.address ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    access: body.access ?? null,
    accessibility: body.accessibility ?? null,
    capacity: body.capacity ?? null,
    sea: body.sea ?? null,
    structure: body.structure ?? null,
    profile: body.profile ?? null,
    characteristics: body.characteristics ?? void 0,
    isActive: body.isActive,
  };
  return { data, photos };
}

@Injectable()
export class LocalService {
  constructor(private readonly prisma: PrismaService) {}
  async listLocals(req: ApiRequest) {
    const query = getQuery(req);
    const where = {
      isActive: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.neighborhood ? { neighborhood: query.neighborhood } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q } },
              { description: { contains: query.q } },
              { neighborhood: { contains: query.q } },
            ],
          }
        : {}),
    };
    const locals = await this.prisma.local.findMany({
      where,
      orderBy: [{ category: "asc" as const }, { name: "asc" as const }],
      take: query.limit ?? 100,
      include: {
        photos: { ...photoSelect, take: 1 },
        reviews: { select: { rating: true } },
      },
    });
    return { locals: locals.map(card) };
  }
  async randomLocal(req: ApiRequest) {
    const total = await this.prisma.local.count({ where: { isActive: true } });
    if (total === 0)
      throw new AppError(404, "NOT_FOUND", "Nenhum destino cadastrado.");
    const skip = Math.floor(Math.random() * total);
    const local = await this.prisma.local.findFirst({
      where: { isActive: true },
      skip,
      select: { id: true, slug: true },
    });
    return { local };
  }
  async getLocal(req: ApiRequest) {
    const key = req.params.id;
    const numeric = Number(key);
    const local = await this.prisma.local.findFirst({
      where:
        Number.isInteger(numeric) && numeric > 0
          ? { id: numeric }
          : { slug: key },
      include: {
        photos: photoSelect,
        reviews: {
          orderBy: { createdAt: "desc" as const },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                photoUrl: true,
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" as const },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                photoUrl: true,
              },
            },
          },
        },
        balneability: { orderBy: { measuredAt: "desc" as const }, take: 1 },
      },
    });
    if (!local || (!local.isActive && req.user?.role !== "ADMIN")) {
      throw new AppError(404, "NOT_FOUND", "Destino n\xE3o encontrado.");
    }
    const favorite = req.user
      ? await this.prisma.favorite.findFirst({
          where: { userId: req.user!.id, localId: local.id },
          select: { id: true },
        })
      : null;
    return {
      local: {
        ...local,
        rating: averageRating(local.reviews),
        reviewsCount: local.reviews.length,
        isFavorite: Boolean(favorite),
        balneability: local.balneability[0] ?? null,
      },
    };
  }
  async createLocal(req: ApiRequest) {
    const { data, photos } = localData(req.body);
    const base = slugify(data.name);
    let slug = base;
    let n = 1;
    while (await this.prisma.local.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${base}-${n}`;
    }
    const local = await this.prisma.local.create({
      data: {
        ...data,
        slug,
        createdById: req.user!.id,
        photos: {
          create: photos.map((url, index) => ({ url, sortOrder: index })),
        },
      },
      include: { photos: photoSelect },
    });
    return { local };
  }
  async updateLocal(req: ApiRequest) {
    const id = parseId(req.params.id, "destino");
    const { data, photos } = localData(req.body);
    const local = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.local.update({ where: { id }, data });
      if (photos.length > 0) {
        await tx.localPhoto.deleteMany({ where: { localId: id } });
        await tx.localPhoto.createMany({
          data: photos.map((url, index) => ({
            localId: id,
            url,
            sortOrder: index,
          })),
        });
      }
      return tx.local.findUniqueOrThrow({
        where: { id },
        include: { photos: photoSelect },
      });
    });
    return { local };
  }
  async deleteLocal(req: ApiRequest) {
    const id = parseId(req.params.id, "destino");
    await this.prisma.local.update({
      where: { id },
      data: { isActive: false },
    });
    return {
      success: true,
      message: "Destino inativado; o hist\xF3rico foi preservado.",
    };
  }
}
