-- DropForeignKey
ALTER TABLE "FeatureRequest" DROP CONSTRAINT "FeatureRequest_authorId_fkey";

-- AlterTable
ALTER TABLE "FeatureRequest" ALTER COLUMN "authorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "FeatureRequest" ADD CONSTRAINT "FeatureRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

