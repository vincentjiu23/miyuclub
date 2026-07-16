import { PrismaClient } from '../generated/client'

declare const globalThis: {
  prismaGlobal: PrismaClient | undefined;
} & typeof global;

function getPrismaClient(): PrismaClient {
  if (!globalThis.prismaGlobal) {
    globalThis.prismaGlobal = new PrismaClient();
  }
  return globalThis.prismaGlobal;
}

// Use a Proxy to lazily initialize PrismaClient only when a property is accessed
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  }
});

export default prisma;
