import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Req,
  Res,
  HttpCode,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { z } from "zod";
import { ApiRequest } from "../../common/api-request";
import { Access, SessionGuard, ZodPipe, imageOptions } from "../../common/http";
import { AdminService } from "./admin.service";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../../validations/authValidation";
import { updateProfileSchema } from "../../validations/userValidation";
import {
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
} from "../../validations/contentValidation";
import {
  itinerarySchema,
  rejectSchema,
} from "../../validations/itineraryValidation";
@Controller()
export class AdminController {
  constructor(private readonly service: AdminService) {}
  @Get("admin/stats")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  statsHandler(@Req() req: ApiRequest) {
    return this.service.statsHandler(req);
  }
  @Get("admin/itineraries/pending")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  pendingItineraries(@Req() req: ApiRequest) {
    return this.service.pendingItineraries(req);
  }
  @Get("admin/itineraries")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  allItineraries(@Req() req: ApiRequest) {
    return this.service.allItineraries(req);
  }
  @Patch("admin/itineraries/:id/approve")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  approveItinerary(@Req() req: ApiRequest) {
    return this.service.approveItinerary(req);
  }
  @Patch("admin/itineraries/:id/reject")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  rejectItinerary(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(rejectSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.rejectItinerary(req);
  }
  @Get("admin/balneabilidade")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  balneabilityAdmin(@Req() req: ApiRequest) {
    return this.service.balneabilityAdmin(req);
  }
  @Post("admin/balneabilidade/sync")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  balneabilityRefresh(@Req() req: ApiRequest) {
    return this.service.balneabilityRefresh(req);
  }
}
