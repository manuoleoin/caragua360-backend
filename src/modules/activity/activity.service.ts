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
    location: body.location ?? null,
    contact: body.contact ?? null,
    schedule: body.schedule ?? null,
    priceInfo: body.priceInfo ?? null,
    isActive: body.isActive,
  };
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}
  async listActivities(req: ApiRequest) {
    const query = getQuery(req);
    const activities = await this.prisma.activity.findMany({
      where: {
        isActive: true,
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q } },
                { description: { contains: query.q } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" as const },
      take: query.limit ?? 50,
      include: { photos: { orderBy: { sortOrder: "asc" as const }, take: 1 } },
    });
    return {
      activities: activities.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        location: item.location,
        schedule: item.schedule,
        priceInfo: item.priceInfo,
        summary: item.description.slice(0, 160),
        photo: firstPhoto(item.photos),
      })),
    };
  }
  async getActivity(req: ApiRequest) {
    const key = req.params.id;
    const numeric = Number(key);
    const item = await this.prisma.activity.findFirst({
      where:
        Number.isInteger(numeric) && numeric > 0
          ? { id: numeric }
          : { slug: key },
      include: { photos: { orderBy: { sortOrder: "asc" as const } } },
    });
    if (!item || (!item.isActive && req.user?.role !== "ADMIN")) {
      throw new AppError(404, "NOT_FOUND", "Atividade n\xE3o encontrada.");
    }
    return { activity: item };
  }
  async createActivity(req: ApiRequest) {
    const photos = req.body.photos ?? [];
    const base = slugify(req.body.name);
    let slug = base;
    let n = 1;
    while (await this.prisma.activity.findUnique({ where: { slug } }))
      slug = `${base}-${++n}`;
    const activity = await this.prisma.activity.create({
      data: {
        ...data(req.body),
        slug,
        photos: {
          create: photos.map((url, index) => ({ url, sortOrder: index })),
        },
      },
      include: { photos: true },
    });
    return { activity };
  }
  async updateActivity(req: ApiRequest) {
    const id = parseId(req.params.id, "atividade");
    const photos = req.body.photos ?? [];
    const activity = await this.prisma.$transaction(async (tx) => {
      await tx.activity.update({ where: { id }, data: data(req.body) });
      if (photos.length > 0) {
        await tx.activityPhoto.deleteMany({ where: { activityId: id } });
        await tx.activityPhoto.createMany({
          data: photos.map((url, index) => ({
            activityId: id,
            url,
            sortOrder: index,
          })),
        });
      }
      return tx.activity.findUniqueOrThrow({
        where: { id },
        include: { photos: true },
      });
    });
    return { activity };
  }
  async deleteActivity(req: ApiRequest) {
    const id = parseId(req.params.id, "atividade");
    await this.prisma.activity.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }
}
