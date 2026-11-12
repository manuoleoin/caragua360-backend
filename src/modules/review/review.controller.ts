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
import { ReviewService } from "./review.service";
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
export class ReviewController {
  constructor(private readonly service: ReviewService) {}
  @Get("reviews")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  listReviews(@Req() req: ApiRequest) {
    return this.service.listReviews(req);
  }
  @Post("reviews")
  @HttpCode(201)
  @Access(true, [])
  @UseGuards(SessionGuard)
  createReview(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(reviewSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createReview(req);
  }
  @Put("reviews/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  updateReview(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(reviewUpdateSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateReview(req);
  }
  @Delete("reviews/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  deleteReview(@Req() req: ApiRequest) {
    return this.service.deleteReview(req);
  }
  @Get("comments")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  listComments(@Req() req: ApiRequest) {
    return this.service.listComments(req);
  }
  @Post("comments")
  @HttpCode(201)
  @Access(true, [])
  @UseGuards(SessionGuard)
  createComment(
    @Req() req: ApiRequest,
    @Body(new ZodPipe(commentSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.createComment(req);
  }
  @Delete("comments/:id")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  deleteComment(@Req() req: ApiRequest) {
    return this.service.deleteComment(req);
  }
}
