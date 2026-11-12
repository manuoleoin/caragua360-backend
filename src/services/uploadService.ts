import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/environment";
import { AppError } from "../middlewares/errorMiddleware";

const EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function storeImage(file: any, folder: any) {
  const ext = EXT[file.mimetype];
  if (!ext)
    throw new AppError(
      415,
      "UNSUPPORTED_MEDIA",
      "Formato de imagem nao suportado.",
    );
  const safeFolder =
    String(folder)
      .replace(/[^a-z0-9_-]/gi, "")
      .toLowerCase() || "geral";
  const key = `${safeFolder}/${Date.now()}-${randomUUID()}.${ext}`;
  const absolutePath = path.join(env.uploadDir, key);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);
  return `/uploads/${key}`;
}

export { storeImage };
