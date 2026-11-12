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
import { AccommodationService } from "./accommodation.service";
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
export class AccommodationController {
  constructor(private readonly service: AccommodationService) {}
  @Get("accommodations")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  listAccommodations(@Req() req: ApiRequest) {
    return this.service.listAccommodations(req);
  }
  @Get("accommodations/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  getAccommodation(@Req() req: ApiRequest) {
    return this.service.getAccommodation(req);
  }
  @Post("accommodations")
  @HttpCode(201)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  createAccommodation(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(accommodationSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createAccommodation(req);
  }
  @Put("accommodations/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  updateAccommodation(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(accommodationSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateAccommodation(req);
  }
  @Delete("accommodations/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  deleteAccommodation(@Req() req: ApiRequest) {
    return this.service.deleteAccommodation(req);
  }
}
