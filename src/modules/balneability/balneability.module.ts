import { Module } from "@nestjs/common";
import { BalneabilityController } from "./balneability.controller";
import { BalneabilityService } from "./balneability.service";
@Module({
  controllers: [BalneabilityController],
  providers: [BalneabilityService],
})
export class BalneabilityModule {}
