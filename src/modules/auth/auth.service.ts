import { Injectable } from "@nestjs/common";
import { Response } from "express";
import { ApiRequest } from "../../common/api-request";
import {
  changePassword,
  clearSessionCookie,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
  setSessionCookie,
} from "../../services/authService";
import { env } from "../../config/environment";
function origin(req: any) {
  const header = req.headers.origin;
  if (header && /^https?:\/\/[^/]+$/.test(header)) return header;
  if (env.publicSiteUrl) return env.publicSiteUrl;
  return `${req.protocol}://${req.get("host")}`;
}

@Injectable()
export class AuthService {
  async registerHandler(req: ApiRequest, res: Response) {
    const { user, token } = await register(req.body, req);
    setSessionCookie(res, token);
    return { user, token };
  }
  async loginHandler(req: ApiRequest, res: Response) {
    const { user, token } = await login(req.body.email, req.body.password, req);
    setSessionCookie(res, token);
    return { user, token };
  }
  async logoutHandler(req: ApiRequest, res: Response) {
    await logout(req.sessionId);
    clearSessionCookie(res);
    return { success: true };
  }
  async meHandler(req: ApiRequest, res: Response) {
    return { user: req.user ?? null };
  }
  async forgotPasswordHandler(req: ApiRequest, res: Response) {
    const result = await requestPasswordReset(req.body.email, origin(req));
    return result;
  }
  async resetPasswordHandler(req: ApiRequest, res: Response) {
    await resetPassword(req.body.token, req.body.password);
    clearSessionCookie(res);
    return {
      success: true,
      message: "Senha redefinida. Fa\xE7a login com a nova senha.",
    };
  }
  async changePasswordHandler(req: ApiRequest, res: Response) {
    await changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.password,
      req.sessionId,
    );
    return { success: true, message: "Senha alterada com sucesso." };
  }
}
