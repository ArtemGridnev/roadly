-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'he');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "language" "Language";
