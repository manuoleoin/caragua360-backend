import nodemailer from "nodemailer";
import { env } from "../config/environment";
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.pass }
        : void 0,
    });
  }
  return transporter;
}
function emailConfigured() {
  return Boolean(env.smtp.host);
}
async function sendPasswordResetEmail(to: any, name: any, link: any) {
  const transport = getTransporter();
  if (!transport) {
    console.warn(
      `[email] SMTP n\xE3o configurado. Link de recupera\xE7\xE3o para ${to}: ${link}`,
    );
    return { mode: "console" };
  }
  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject: "Caragua360 \u2014 redefini\xE7\xE3o de senha",
    text: `Ol\xE1, ${name}. Recebemos um pedido para redefinir sua senha no Caragua360. Acesse o link (v\xE1lido por 24 horas): ${link}`,
    html: `<p>Ol\xE1, ${name}.</p><p>Recebemos um pedido para redefinir sua senha no Caragua360.</p><p><a href="${link}">Redefinir minha senha</a> \u2014 o link \xE9 v\xE1lido por 24 horas.</p><p>Se n\xE3o foi voc\xEA, ignore este e-mail.</p>`,
  });
  return { mode: "smtp" };
}
export { emailConfigured, sendPasswordResetEmail };
