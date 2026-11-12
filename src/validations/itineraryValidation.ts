import { z } from "zod";
const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));
const photoSchema = z.object({
  url: z.string().min(1).max(500),
  caption: z.string().max(255).optional().nullable(),
});
const placeSchema = z.object({
  localId: z.number().int().positive().optional().nullable(),
  placeName: z.string().trim().min(2, "Informe o nome do local.").max(160),
  comments: z.string().max(2e3).optional().nullable(),
  knewPlace: z.boolean().optional().nullable(),
  visitDate: optionalDate,
  visitTime: z.string().max(20).optional().nullable(),
  visitDuration: z.string().max(60).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  photos: z.array(photoSchema).max(6).optional(),
});
const daySchema = z.object({
  dayNumber: z.number().int().min(1).max(30),
  notes: z.string().max(1e3).optional().nullable(),
  places: z.array(placeSchema).max(20).default([]),
});
const itinerarySchema = z
  .object({
    title: z.string().trim().min(3, "Informe um t\xEDtulo.").max(160),
    description: z.string().trim().min(10, "Descreva o roteiro.").max(5e3),
    daysCount: z.number().int().min(1).max(30),
    startDate: optionalDate,
    endDate: optionalDate,
    coverPhotoUrl: z.string().max(500).optional().nullable(),
    days: z.array(daySchema).max(30).default([]),
  })
  .refine(
    (data) => data.days.length === 0 || data.days.length === data.daysCount,
    {
      path: ["days"],
      message:
        "A quantidade de dias informada n\xE3o confere com os dias preenchidos.",
    },
  )
  .refine((data) => data.days.every((day) => day.dayNumber <= data.daysCount), {
    path: ["days"],
    message: "H\xE1 um dia maior que a quantidade informada.",
  });
const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Informe o motivo da rejei\xE7\xE3o.")
    .max(1e3),
});
const submitSchema = z.object({}).optional();
export { itinerarySchema, rejectSchema, submitSchema };
