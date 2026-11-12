import { z } from "zod";
const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(160)
    .optional(),
  city: z.string().trim().max(120).nullable().optional(),
  neighborhood: z.string().trim().max(120).nullable().optional(),
  photoUrl: z.string().max(500).nullable().optional(),
});
const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "TOURIST", "RESIDENT"]),
});
export { updateProfileSchema, updateRoleSchema };
