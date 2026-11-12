import { Injectable, Global, Module, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { env } from "./environment";
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ datasourceUrl: env.databaseUrl });
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
// Shared by the preserved domain helpers and Nest's dependency injection container.
export const prisma = new PrismaService();
export async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: prisma }],
  exports: [PrismaService],
})
export class DatabaseModule {}
