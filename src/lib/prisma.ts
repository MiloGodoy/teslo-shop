
import { PrismaClient, type Prisma } from '@prisma/client'
import { getDatabaseUrl } from './database-url';

const prismaClientSingleton = () => {
  const url = getDatabaseUrl();
  const options: Prisma.PrismaClientOptions = url ? { datasources: { db: { url } } } : {};
  return new PrismaClient(options)
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
