import { z } from "zod";
const password = z
  .string()
  .min(8, "A senha deve ter no m\xEDnimo 8 caracteres.")
  .max(72, "A senha deve ter no m\xE1ximo 72 caracteres.")
  .regex(/[A-Za-z]/, "A senha deve conter ao menos uma letra.")
  .regex(/[0-9]/, "A senha deve conter ao menos um n\xFAmero.");
const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo.").max(160),
    email: z.string().trim().email("Informe um e-mail v\xE1lido.").max(191),
    password,
    confirmPassword: z.string(),
    role: z.enum(["TOURIST", "RESIDENT"]).default("TOURIST"),
    city: z.string().trim().max(120).optional().or(z.literal("")),
    neighborhood: z.string().trim().max(120).optional().or(z.literal("")),
    photoUrl: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas n\xE3o conferem.",
  });
const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail v\xE1lido."),
  password: z.string().min(1, "Informe a senha."),
});
const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail v\xE1lido."),
});
const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "Token inv\xE1lido."),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas n\xE3o conferem.",
  });
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas n\xE3o conferem.",
  });
export {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
};
