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
import { RestaurantService } from "./restaurant.service";
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
export class RestaurantController {
  constructor(private readonly service: RestaurantService) {}
  @Get("restaurants")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  listRestaurants(@Req() req: ApiRequest) {
    return this.service.listRestaurants(req);
  }
  @Get("restaurants/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  getRestaurant(@Req() req: ApiRequest) {
    return this.service.getRestaurant(req);
  }
  @Post("restaurants")
  @HttpCode(201)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  createRestaurant(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(restaurantSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createRestaurant(req);
  }
  @Put("restaurants/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  updateRestaurant(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(restaurantSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateRestaurant(req);
  }
  @Delete("restaurants/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  deleteRestaurant(@Req() req: ApiRequest) {
    return this.service.deleteRestaurant(req);
  }
}
