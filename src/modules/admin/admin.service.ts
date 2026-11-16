import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import { parseId } from "../../utils/helpers";
import {
  getBalneabilityOverview,
  syncBalneability,
} from "../../services/balneabilityService";
const userSelect = { id: true, fullName: true, username: true, photoUrl: true };
const CONTRIBUTION_TYPES = ["activity", "restaurant", "accommodation"] as const;
type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  async statsHandler(req: ApiRequest) {
    const [
      users,
      locals,
      itineraries,
      pending,
      suggestions,
      events,
      reviews,
      favorites,
      pendingEvents,
      pendingActivities,
      pendingRestaurants,
      pendingAccommodations,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.local.count({ where: { isActive: true } }),
      this.prisma.itinerary.count(),
      this.prisma.itinerary.count({ where: { status: "PENDING" } }),
      this.prisma.suggestion.count({ where: { status: "PENDING" } }),
      this.prisma.event.count({
        where: { isActive: true, status: "APPROVED" },
      }),
      this.prisma.review.count(),
      this.prisma.favorite.count(),
      this.prisma.event.count({ where: { status: "PENDING" } }),
      this.prisma.activity.count({ where: { status: "PENDING" } }),
      this.prisma.restaurant.count({ where: { status: "PENDING" } }),
      this.prisma.accommodation.count({ where: { status: "PENDING" } }),
    ]);
    return {
      stats: {
        users,
        locals,
        itineraries,
        pendingItineraries: pending,
        pendingSuggestions: suggestions,
        events,
        reviews,
        favorites,
        pendingEvents,
        pendingContributions:
          pendingActivities + pendingRestaurants + pendingAccommodations,
      },
    };
  }
  async pendingItineraries(req: ApiRequest) {
    const itineraries = await this.prisma.itinerary.findMany({
      where: { status: "PENDING" },
      orderBy: { submittedAt: "asc" as const },
      include: {
        user: { select: userSelect },
        days: {
          include: { places: true },
          orderBy: { dayNumber: "asc" as const },
        },
      },
    });
    return { itineraries };
  }
  async allItineraries(req: ApiRequest) {
    const status = req.query.status;
    const itineraries = await this.prisma.itinerary.findMany({
      where: status ? { status } : {},
      orderBy: { updatedAt: "desc" as const },
      include: {
        user: { select: userSelect },
        _count: { select: { days: true, places: true } },
      },
    });
    return { itineraries };
  }
  async approveItinerary(req: ApiRequest) {
    const id = parseId(req.params.id, "roteiro");
    const itinerary = await this.prisma.itinerary.findUnique({ where: { id } });
    if (!itinerary)
      throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
    if (itinerary.status !== "PENDING")
      throw new AppError(
        409,
        "INVALID_STATUS",
        "Somente roteiros pendentes podem ser aprovados.",
      );
    const updated = await this.prisma.itinerary.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedById: req.user!.id,
        rejectionReason: null,
        publishedAt: /* @__PURE__ */ new Date(),
      },
    });
    return { itinerary: updated };
  }
  async rejectItinerary(req: ApiRequest) {
    const id = parseId(req.params.id, "roteiro");
    const itinerary = await this.prisma.itinerary.findUnique({ where: { id } });
    if (!itinerary)
      throw new AppError(404, "NOT_FOUND", "Roteiro n\xE3o encontrado.");
    if (itinerary.status !== "PENDING")
      throw new AppError(
        409,
        "INVALID_STATUS",
        "Somente roteiros pendentes podem ser rejeitados.",
      );
    const updated = await this.prisma.itinerary.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedById: req.user!.id,
        rejectionReason: req.body.reason,
        publishedAt: null,
      },
    });
    return { itinerary: updated };
  }
  async pendingEvents(req: ApiRequest) {
    const events = await this.prisma.event.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" as const },
      include: {
        createdBy: { select: userSelect },
        photos: { orderBy: { sortOrder: "asc" as const } },
      },
    });
    return { events };
  }
  private async pendingEventOrFail(id: number, action: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new AppError(404, "NOT_FOUND", "Evento não encontrado.");
    if (event.status !== "PENDING")
      throw new AppError(
        409,
        "INVALID_STATUS",
        `Somente eventos pendentes podem ser ${action}.`,
      );
    return event;
  }
  async approveEvent(req: ApiRequest) {
    const id = parseId(req.params.id, "evento");
    await this.pendingEventOrFail(id, "aprovados");
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        rejectionReason: null,
      },
    });
    return { event };
  }
  async rejectEvent(req: ApiRequest) {
    const id = parseId(req.params.id, "evento");
    await this.pendingEventOrFail(id, "rejeitados");
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        rejectionReason: req.body.reason,
      },
    });
    return { event };
  }
  async pendingContributions(req: ApiRequest) {
    const args = {
      where: { status: "PENDING" as const },
      orderBy: { createdAt: "asc" as const },
      include: {
        createdBy: { select: userSelect },
        photos: { orderBy: { sortOrder: "asc" as const } },
      },
    };
    const [activities, restaurants, accommodations] = await Promise.all([
      this.prisma.activity.findMany(args),
      this.prisma.restaurant.findMany(args),
      this.prisma.accommodation.findMany(args),
    ]);
    return { activities, restaurants, accommodations };
  }
  async reviewContribution(req: ApiRequest, status: "APPROVED" | "REJECTED") {
    const type = req.params.type as ContributionType;
    if (!CONTRIBUTION_TYPES.includes(type))
      throw new AppError(404, "NOT_FOUND", "Tipo de conteúdo inválido.");
    const id = parseId(req.params.id, "conteúdo");
    // Os três modelos têm os mesmos campos de moderação.
    const model = this.prisma[type] as any;
    const item = await model.findUnique({ where: { id } });
    if (!item)
      throw new AppError(404, "NOT_FOUND", "Conteúdo não encontrado.");
    if (item.status !== "PENDING")
      throw new AppError(
        409,
        "INVALID_STATUS",
        "Somente envios pendentes podem ser analisados.",
      );
    const updated = await model.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        rejectionReason: status === "REJECTED" ? req.body.reason : null,
      },
    });
    return { item: updated };
  }
  async balneabilityAdmin(req: ApiRequest) {
    return await getBalneabilityOverview();
  }
  async balneabilityRefresh(req: ApiRequest) {
    const result = await syncBalneability();
    return { ...result, overview: await getBalneabilityOverview() };
  }
}
