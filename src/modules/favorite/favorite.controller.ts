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
import { FavoriteService } from "./favorite.service";
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
export class FavoriteController {
  constructor(private readonly service: FavoriteService) {}
  @Get("favorites")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  listFavorites(@Req() req: ApiRequest) {
    return this.service.listFavorites(req);
  }
  @Post("favorites")
  @HttpCode(201)
  @Access(true, [])
  @UseGuards(SessionGuard)
  addFavorite(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(favoriteSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.addFavorite(req);
  }
  @Delete("favorites/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  removeFavorite(@Req() req: ApiRequest) {
    return this.service.removeFavorite(req);
  }
}
