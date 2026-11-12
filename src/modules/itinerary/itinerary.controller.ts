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
import { ItineraryService } from "./itinerary.service";
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
export class ItineraryController {
  constructor(private readonly service: ItineraryService) {}
  @Get("itineraries")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  listPublicItineraries(@Req() req: ApiRequest) {
    return this.service.listPublicItineraries(req);
  }
  @Get("itineraries/mine")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  listMyItineraries(@Req() req: ApiRequest) {
    return this.service.listMyItineraries(req);
  }
  @Post("itineraries")
  @HttpCode(201)
  @Access(true, [])
  @UseGuards(SessionGuard)
  createItinerary(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(itinerarySchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createItinerary(req);
  }
  @Get("itineraries/:id")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  getItinerary(@Req() req: ApiRequest) {
    return this.service.getItinerary(req);
  }
  @Put("itineraries/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  updateItinerary(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(itinerarySchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateItinerary(req);
  }
  @Delete("itineraries/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  deleteItinerary(@Req() req: ApiRequest) {
    return this.service.deleteItinerary(req);
  }
  @Post("itineraries/:id/submit")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  submitItinerary(@Req() req: ApiRequest) {
    return this.service.submitItinerary(req);
  }
  @Post("itineraries/:id/like")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  toggleLike(@Req() req: ApiRequest) {
    return this.service.toggleLike(req);
  }
}
