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
import { LocalService } from "./local.service";
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
export class LocalController {
  constructor(private readonly service: LocalService) {}
  @Get("locals")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  listLocals(
    @Req() req: ApiRequest,
    @Query(new ZodPipe(listQuerySchema)) validated: any,
  ) {
    req.validatedQuery = validated;
    return this.service.listLocals(req);
  }
  @Get("locals/random")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  randomLocal(@Req() req: ApiRequest) {
    return this.service.randomLocal(req);
  }
  @Get("locals/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  getLocal(@Req() req: ApiRequest) {
    return this.service.getLocal(req);
  }
  @Post("locals")
  @HttpCode(201)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  createLocal(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(localSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createLocal(req);
  }
  @Put("locals/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  updateLocal(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(localSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateLocal(req);
  }
  @Delete("locals/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  deleteLocal(@Req() req: ApiRequest) {
    return this.service.deleteLocal(req);
  }
}
