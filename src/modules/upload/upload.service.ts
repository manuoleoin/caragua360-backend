import { Injectable } from "@nestjs/common";
import { ApiRequest } from "../../common/api-request";
import { AppError } from "../../middlewares/errorMiddleware";
import { storeImage } from "../../services/uploadService";

@Injectable()
export class UploadService {
  async uploadHandler(req: ApiRequest) {
    if (!req.file)
      throw new AppError(
        400,
        "FILE_REQUIRED",
        "Selecione uma imagem para enviar.",
      );
    const folder = req.body?.folder === "perfil" ? "perfil" : "roteiros";
    const url = await storeImage(req.file, folder);
    return { url };
  }
}
