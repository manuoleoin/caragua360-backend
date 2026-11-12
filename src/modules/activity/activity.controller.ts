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
import { ActivityService } from "./activity.service";
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
export class ActivityController {
  constructor(private readonly service: ActivityService) {}
  @Get("activities")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  listActivities(@Req() req: ApiRequest) {
    return this.service.listActivities(req);
  }
  @Get("activities/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  getActivity(@Req() req: ApiRequest) {
    return this.service.getActivity(req);
  }
  @Post("activities")
  @HttpCode(201)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  createActivity(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(activitySchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createActivity(req);
  }
  @Put("activities/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  updateActivity(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(activitySchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateActivity(req);
  }
  @Delete("activities/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  deleteActivity(@Req() req: ApiRequest) {
    return this.service.deleteActivity(req);
  }
}
