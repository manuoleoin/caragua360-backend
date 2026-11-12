import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/http";
import { env } from "./config/environment";

export async function createApp() {
  if (
    env.isProduction &&
    (!process.env.CARAGUA_JWT_SECRET || env.jwtSecret.length < 32)
  )
    throw new Error(
      "Configure CARAGUA_JWT_SECRET com pelo menos 32 caracteres.",
    );
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(json({ limit: "2mb" }));
  app.use(urlencoded({ extended: true, limit: "2mb" }));
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useStaticAssets(env.uploadDir, { prefix: "/uploads/", maxAge: "7d" });
  if (env.publicSiteUrl)
    app.enableCors({ origin: env.publicSiteUrl, credentials: true });
  app.enableShutdownHooks();
  await app.init();
  return app;
}
if (require.main === module) {
  createApp()
    .then((app) => app.listen(env.port, "0.0.0.0"))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
