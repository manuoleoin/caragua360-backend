import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import { getQuery } from "../../middlewares/validationMiddleware";
import { firstPhoto, parseId, slugify, toDate } from "../../utils/helpers";

function data(body: any) {
  const startDate = toDate(body.startDate);
  if (!startDate)
    throw new AppError(422, "INVALID_DATE", "Data de in\xEDcio inv\xE1lida.");
  return {
    name: body.name,
    description: body.description,
    startDate,
    endDate: toDate(body.endDate ?? null),
    time: body.time ?? null,
    place: body.place,
    address: body.address ?? null,
    entryInfo: body.entryInfo ?? null,
    isActive: body.isActive,
  };
}

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}
  async listEvents(req: ApiRequest) {
    const query = getQuery(req);
    const events = await this.prisma.event.findMany({
      where: {
        isActive: true,
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q } },
                { place: { contains: query.q } },
              ],
            }
          : {}),
      },
      orderBy: { startDate: "asc" as const },
      take: query.limit ?? 50,
      include: { photos: { orderBy: { sortOrder: "asc" as const }, take: 1 } },
    });
    return {
      events: events.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description.slice(0, 160),
        startDate: item.startDate,
        endDate: item.endDate,
        time: item.time,
        place: item.place,
        photo: firstPhoto(item.photos),
      })),
    };
  }
  async getEvent(req: ApiRequest) {
    const key = req.params.id;
    const numeric = Number(key);
    const event = await this.prisma.event.findFirst({
      where:
        Number.isInteger(numeric) && numeric > 0
          ? { id: numeric }
          : { slug: key },
      include: { photos: { orderBy: { sortOrder: "asc" as const } } },
    });
    if (!event || (!event.isActive && req.user?.role !== "ADMIN")) {
      throw new AppError(404, "NOT_FOUND", "Evento n\xE3o encontrado.");
    }
    return { event };
  }
  async createEvent(req: ApiRequest) {
    const photos = req.body.photos ?? [];
    const base = slugify(req.body.name);
    let slug = base;
    let n = 1;
    while (await this.prisma.event.findUnique({ where: { slug } }))
      slug = `${base}-${++n}`;
    const event = await this.prisma.event.create({
      data: {
        ...data(req.body),
        slug,
        photos: {
          create: photos.map((url, index) => ({ url, sortOrder: index })),
        },
      },
      include: { photos: true },
    });
    return { event };
  }
  async updateEvent(req: ApiRequest) {
    const id = parseId(req.params.id, "evento");
    const photos = req.body.photos ?? [];
    const event = await this.prisma.$transaction(async (tx) => {
      await tx.event.update({ where: { id }, data: data(req.body) });
      if (photos.length > 0) {
        await tx.eventPhoto.deleteMany({ where: { eventId: id } });
        await tx.eventPhoto.createMany({
          data: photos.map((url, index) => ({
            eventId: id,
            url,
            sortOrder: index,
          })),
        });
      }
      return tx.event.findUniqueOrThrow({
        where: { id },
        include: { photos: true },
      });
    });
    return { event };
  }
  async deleteEvent(req: ApiRequest) {
    const id = parseId(req.params.id, "evento");
    await this.prisma.event.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }
}
