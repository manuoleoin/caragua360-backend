import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { checkDatabase } from "../config/database";
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { status: "ok", service: "caragua360" };
  }
  @Get("db")
  async database(@Res({ passthrough: true }) res: Response) {
    const ok = await checkDatabase();
    res.status(ok ? 200 : 503);
    return { database: ok ? "ok" : "unavailable" };
  }
}
