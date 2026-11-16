import { ApiRequest } from "./api-request";

/** Papéis que podem enviar conteúdo colaborativo (atividades, restaurantes, hospedagens). */
export const CONTRIBUTOR_ROLES = ["ADMIN", "RESIDENT"];

/**
 * Campos de moderação gravados na criação.
 * Admin publica direto; residente entra como PENDING e sempre ativo
 * (não controla a visibilidade do próprio envio).
 */
export function approvalOnCreate(req: ApiRequest) {
  const user = req.user!;
  if (user.role === "ADMIN") {
    return {
      status: "APPROVED" as const,
      createdById: user.id,
      reviewedById: user.id,
      reviewedAt: new Date(),
    };
  }
  return { status: "PENDING" as const, createdById: user.id, isActive: true };
}

/** Conteúdo não aprovado ou inativo só é visível ao admin (e o pendente, ao autor). */
export function canViewModerated(
  item: { isActive: boolean; status: string; createdById: number | null },
  req: ApiRequest,
) {
  if (req.user?.role === "ADMIN") return true;
  if (!item.isActive) return false;
  if (item.status === "APPROVED") return true;
  return Boolean(req.user) && item.createdById === req.user!.id;
}
