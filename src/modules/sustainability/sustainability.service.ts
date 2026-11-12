import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { PrismaService } from "../../config/database";
import { AppError } from "../../middlewares/errorMiddleware";
import { parseId, slugify } from "../../utils/helpers";

@Injectable()
export class SustainabilityService {
  constructor(private readonly prisma: PrismaService) {}
  async listSustainability(req: ApiRequest) {
    const category = req.query.category;
    const contents = await this.prisma.sustainabilityContent.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      orderBy: [{ category: "asc" as const }, { createdAt: "desc" as const }],
    });
    return { contents };
  }
  async getSustainability(req: ApiRequest) {
    const content = await this.prisma.sustainabilityContent.findUnique({
      where: { slug: req.params.slug },
    });
    if (!content || (!content.published && req.user?.role !== "ADMIN")) {
      throw new AppError(404, "NOT_FOUND", "Conte\xFAdo n\xE3o encontrado.");
    }
    return { content };
  }
  async listAllSustainability(req: ApiRequest) {
    const contents = await this.prisma.sustainabilityContent.findMany({
      orderBy: { updatedAt: "desc" as const },
    });
    return { contents };
  }
  async createSustainability(req: ApiRequest) {
    const base = slugify(req.body.title);
    let slug = base;
    let n = 1;
    while (
      await this.prisma.sustainabilityContent.findUnique({ where: { slug } })
    )
      slug = `${base}-${++n}`;
    const content = await this.prisma.sustainabilityContent.create({
      data: { ...req.body, slug },
    });
    return { content };
  }
  async updateSustainability(req: ApiRequest) {
    const id = parseId(req.params.id, "conte\xFAdo");
    const content = await this.prisma.sustainabilityContent.update({
      where: { id },
      data: req.body,
    });
    return { content };
  }
  async deleteSustainability(req: ApiRequest) {
    const id = parseId(req.params.id, "conte\xFAdo");
    await this.prisma.sustainabilityContent.delete({ where: { id } });
    return { success: true };
  }
}
