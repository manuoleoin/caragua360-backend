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
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.local.count({ where: { isActive: true } }),
      this.prisma.itinerary.count(),
      this.prisma.itinerary.count({ where: { status: "PENDING" } }),
      this.prisma.suggestion.count({ where: { status: "PENDING" } }),
      this.prisma.event.count({ where: { isActive: true } }),
      this.prisma.review.count(),
      this.prisma.favorite.count(),
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
  async balneabilityAdmin(req: ApiRequest) {
    return await getBalneabilityOverview();
  }
  async balneabilityRefresh(req: ApiRequest) {
    const result = await syncBalneability();
    return { ...result, overview: await getBalneabilityOverview() };
  }
}
