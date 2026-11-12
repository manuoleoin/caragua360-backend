import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
const userSelect = { id: true, fullName: true, username: true };

@Injectable()
export class SuggestionService {
  constructor(private readonly prisma: PrismaService) {}
  async createSuggestion(req: ApiRequest) {
    const suggestion = await this.prisma.suggestion.create({
      data: {
        userId: req.user!.id,
        type: req.body.type,
        title: req.body.title,
        description: req.body.description,
        localId: req.body.localId ?? null,
        status: "PENDING",
      },
    });
    return { suggestion };
  }
  async listMySuggestions(req: ApiRequest) {
    const suggestions = await this.prisma.suggestion.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" as const },
      include: { local: { select: { id: true, name: true } } },
    });
    return { suggestions };
  }
  async listAllSuggestions(req: ApiRequest) {
    const status = req.query.status;
    const suggestions = await this.prisma.suggestion.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" as const },
      include: {
        user: { select: userSelect },
        local: { select: { id: true, name: true } },
      },
    });
    return { suggestions };
  }
  async reviewSuggestion(req: ApiRequest) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      throw new AppError(400, "INVALID_ID", "Identificador inv\xE1lido.");
    const approve = req.params.action === "approve";
    if (!approve && !req.params.action.startsWith("reject")) {
      throw new AppError(400, "INVALID_ACTION", "A\xE7\xE3o inv\xE1lida.");
    }
    const suggestion = await this.prisma.suggestion.findUnique({
      where: { id },
    });
    if (!suggestion)
      throw new AppError(404, "NOT_FOUND", "Sugest\xE3o n\xE3o encontrada.");
    if (suggestion.status !== "PENDING")
      throw new AppError(
        409,
        "ALREADY_REVIEWED",
        "Sugest\xE3o j\xE1 analisada.",
      );
    const updated = await this.prisma.suggestion.update({
      where: { id },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        adminNote: req.body?.note ?? null,
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedById: req.user!.id,
      },
    });
    return { suggestion: updated };
  }
}
