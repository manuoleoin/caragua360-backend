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
import { SuggestionService } from "./suggestion.service";
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
export class SuggestionController {
  constructor(private readonly service: SuggestionService) {}
  @Post("suggestions")
  @HttpCode(201)
  @Access(true, ["RESIDENT", "ADMIN"])
  @UseGuards(SessionGuard)
  createSuggestion(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(suggestionSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createSuggestion(req);
  }
  @Get("suggestions/mine")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  listMySuggestions(@Req() req: ApiRequest) {
    return this.service.listMySuggestions(req);
  }
  @Get("admin/suggestions")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  listAllSuggestions(@Req() req: ApiRequest) {
    return this.service.listAllSuggestions(req);
  }
  @Patch("admin/suggestions/:id/:action")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  reviewSuggestion(@Req() req: ApiRequest) {
    return this.service.reviewSuggestion(req);
  }
}
