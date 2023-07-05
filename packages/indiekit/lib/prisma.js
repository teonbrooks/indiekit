import { PrismaClient } from "@prisma/client";

export const getPrismaConfig = async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const database = await prisma;
    return database;
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    return false;
  }
};
