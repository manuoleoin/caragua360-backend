import { z } from "zod";
const photos = z.array(z.string().max(500)).max(10).optional();
const localSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.enum(["PRAIA", "TRILHA", "CACHOEIRA", "PONTO"]),
  description: z.string().trim().min(10).max(8e3),
  neighborhood: z.string().max(120).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  access: z.string().max(2e3).optional().nullable(),
  accessibility: z.string().max(2e3).optional().nullable(),
  capacity: z.string().max(120).optional().nullable(),
  sea: z.string().max(160).optional().nullable(),
  structure: z.string().max(2e3).optional().nullable(),
  profile: z.string().max(160).optional().nullable(),
  characteristics: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean().optional(),
  photos,
});
const accommodationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.enum(["Hotel", "Pousada"]).default("Pousada"),
  description: z.string().trim().min(10).max(5e3),
  neighborhood: z.string().max(120).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  contactPhone: z.string().max(60).optional().nullable(),
  contactEmail: z
    .string()
    .email()
    .max(191)
    .optional()
    .nullable()
    .or(z.literal("")),
  website: z.string().max(255).optional().nullable(),
  amenities: z.array(z.string().max(80)).max(20).optional().nullable(),
  priceRange: z.string().max(80).optional().nullable(),
  isActive: z.boolean().optional(),
  photos,
});
const restaurantSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5e3),
  neighborhood: z.string().max(120).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  contact: z.string().max(160).optional().nullable(),
  cuisine: z.string().max(120).optional().nullable(),
  openingHours: z.record(z.string(), z.string().max(120)).optional().nullable(),
  priceRange: z.string().max(80).optional().nullable(),
  isActive: z.boolean().optional(),
  photos,
});
const activitySchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5e3),
  neighborhood: z.string().max(120).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  contact: z.string().max(160).optional().nullable(),
  schedule: z.string().max(255).optional().nullable(),
  priceInfo: z.string().max(160).optional().nullable(),
  isActive: z.boolean().optional(),
  photos,
});
const eventSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5e3),
  startDate: z.string().min(4),
  endDate: z.string().optional().nullable(),
  time: z.string().max(120).optional().nullable(),
  place: z.string().trim().min(2).max(160),
  address: z.string().max(255).optional().nullable(),
  entryInfo: z.string().max(2e3).optional().nullable(),
  isActive: z.boolean().optional(),
  photos,
});
const sustainabilitySchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.enum(["DICA", "ORIENTACAO", "CAMPANHA", "PROJETO", "DESCARTE"]),
  summary: z.string().trim().min(5).max(500),
  content: z.string().trim().min(10).max(8e3),
  imageUrl: z.string().max(500).optional().nullable(),
  published: z.boolean().optional(),
});
const suggestionSchema = z.object({
  type: z.enum(["NOVO_PONTO", "CORRECAO", "DICA", "RECOMENDACAO"]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4e3),
  localId: z.number().int().positive().optional().nullable(),
});
const reviewSchema = z
  .object({
    localId: z.number().int().positive().optional(),
    itineraryId: z.number().int().positive().optional(),
    rating: z.number().int().min(1, "Informe uma nota de 1 a 5.").max(5),
    comment: z.string().max(2e3).optional().nullable(),
  })
  .refine((data) => Boolean(data.localId) !== Boolean(data.itineraryId), {
    message: "Informe um local ou um roteiro para avaliar.",
  });
const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1, "Informe uma nota de 1 a 5.").max(5),
  comment: z.string().max(2e3).optional().nullable(),
});
const commentSchema = z
  .object({
    localId: z.number().int().positive().optional(),
    itineraryId: z.number().int().positive().optional(),
    content: z.string().trim().min(2, "Escreva um coment\xE1rio.").max(2e3),
  })
  .refine((data) => Boolean(data.localId) !== Boolean(data.itineraryId), {
    message: "Informe um local ou um roteiro para comentar.",
  });
const favoriteSchema = z
  .object({
    localId: z.number().int().positive().optional(),
    accommodationId: z.number().int().positive().optional(),
    restaurantId: z.number().int().positive().optional(),
    itineraryId: z.number().int().positive().optional(),
  })
  .refine(
    (data) =>
      [
        data.localId,
        data.accommodationId,
        data.restaurantId,
        data.itineraryId,
      ].filter(Boolean).length === 1,
    { message: "Informe exatamente um conte\xFAdo para favoritar." },
  );
const listQuerySchema = z.object({
  q: z.string().max(120).optional(),
  category: z.enum(["PRAIA", "TRILHA", "CACHOEIRA", "PONTO"]).optional(),
  neighborhood: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export {
  accommodationSchema,
  activitySchema,
  commentSchema,
  eventSchema,
  favoriteSchema,
  listQuerySchema,
  localSchema,
  restaurantSchema,
  reviewSchema,
  reviewUpdateSchema,
  suggestionSchema,
  sustainabilitySchema,
};
