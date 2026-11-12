import { AppError } from "../middlewares/errorMiddleware";
function slugify(value: any) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}
function parseId(value: any, label = "registro") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(
      400,
      "INVALID_ID",
      `Identificador de ${label} inv\xE1lido.`,
    );
  }
  return id;
}
function averageRating(reviews: any) {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
function firstPhoto(photos: any) {
  return photos?.[0]?.url ?? null;
}
function toDate(value: any) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
export { averageRating, firstPhoto, parseId, slugify, toDate };
