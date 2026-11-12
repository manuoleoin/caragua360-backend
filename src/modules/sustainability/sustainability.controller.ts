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
import { SustainabilityService } from "./sustainability.service";
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
export class SustainabilityController {
  constructor(private readonly service: SustainabilityService) {}
  @Get("sustainability")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  listSustainability(@Req() req: ApiRequest) {
    return this.service.listSustainability(req);
  }
  @Get("sustainability/:slug")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  getSustainability(@Req() req: ApiRequest) {
    return this.service.getSustainability(req);
  }
  @Get("admin/sustainability")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  listAllSustainability(@Req() req: ApiRequest) {
    return this.service.listAllSustainability(req);
  }
  @Post("sustainability")
  @HttpCode(201)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  createSustainability(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(sustainabilitySchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createSustainability(req);
  }
  @Put("sustainability/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  updateSustainability(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(sustainabilitySchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateSustainability(req);
  }
  @Delete("sustainability/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  deleteSustainability(@Req() req: ApiRequest) {
    return this.service.deleteSustainability(req);
  }
}
