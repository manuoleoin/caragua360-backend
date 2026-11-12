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
import { AuthService } from "./auth.service";
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
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Post("auth/register")
  @HttpCode(201)
  @Access(false, [])
  @UseGuards(SessionGuard)
  registerHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodPipe(registerSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.registerHandler(req, res);
  }
  @Post("auth/login")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  loginHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodPipe(loginSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.loginHandler(req, res);
  }
  @Post("auth/logout")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  logoutHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.logoutHandler(req, res);
  }
  @Get("auth/me")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  meHandler(@Req() req: ApiRequest, @Res({ passthrough: true }) res: Response) {
    return this.service.meHandler(req, res);
  }
  @Post("auth/forgot-password")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  forgotPasswordHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodPipe(forgotPasswordSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.forgotPasswordHandler(req, res);
  }
  @Post("auth/reset-password")
  @HttpCode(200)
  @Access(false, [])
  @UseGuards(SessionGuard)
  resetPasswordHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodPipe(resetPasswordSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.resetPasswordHandler(req, res);
  }
  @Post("auth/change-password")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  changePasswordHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodPipe(changePasswordSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.changePasswordHandler(req, res);
  }
}
