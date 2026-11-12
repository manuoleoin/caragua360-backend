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
import { UserService } from "./user.service";
import { AuthService } from "../auth/auth.service";
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
export class UserController {
  constructor(
    private readonly service: UserService,
    private readonly authService: AuthService,
  ) {}
  @Post("users")
  @HttpCode(201)
  @Access(false, [])
  @UseGuards(SessionGuard)
  createUserHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodPipe(registerSchema)) validated: any,
  ) {
    req.body = validated;
    return this.authService.registerHandler(req, res);
  }
  @Get("users/me")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  meHandler(@Req() req: ApiRequest, @Res({ passthrough: true }) res: Response) {
    return this.service.meHandler(req, res);
  }
  @Put("users/me")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  updateMeHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodPipe(updateProfileSchema)) validated: any,
  ) {
    req.body = validated;
    return this.service.updateMeHandler(req, res);
  }
  @Delete("users/me")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  deleteMeHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.deleteMeHandler(req, res);
  }
  @Post("users/me/photo")
  @HttpCode(200)
  @Access(true, [])
  @UseGuards(SessionGuard)
  @UseInterceptors(FileInterceptor("photo", imageOptions))
  uploadPhotoHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.uploadPhotoHandler(req, res);
  }
  @Get("users")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  listUsersHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.listUsersHandler(req, res);
  }
  @Patch("users/:id")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  updateUserAdminHandler(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
    @Body(
      new ZodPipe(
        z.object({
          role: z.enum(["ADMIN", "TOURIST", "RESIDENT"]).optional(),
          isActive: z.boolean().optional(),
        }),
      ),
    )
    validated: any,
  ) {
    req.body = validated;
    return this.service.updateUserAdminHandler(req, res);
  }
  @Get("admin/users")
  @HttpCode(200)
  @Access(true, ["ADMIN"])
  @UseGuards(SessionGuard)
  listUsersAdmin(
    @Req() req: ApiRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.listUsersHandler(req, res);
  }
}
