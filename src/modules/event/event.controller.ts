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
import { EventService } from "./event.service";
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
export class EventController {
  constructor(private readonly service: EventService) {}
  @Get("events")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  listEvents(@Req() req: ApiRequest) {
    return this.service.listEvents(req);
  }
  @Get("events/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  getEvent(@Req() req: ApiRequest) {
    return this.service.getEvent(req);
  }
  @Post("events")
  @HttpCode(201)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  createEvent(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(eventSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createEvent(req);
  }
  @Put("events/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  updateEvent(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(eventSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateEvent(req);
  }
  @Delete("events/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  deleteEvent(@Req() req: ApiRequest) {
    return this.service.deleteEvent(req);
  }
}
