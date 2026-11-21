-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "identitySecret" TEXT,
ADD COLUMN     "previousIdentitySecret" TEXT,
ADD COLUMN     "previousIdentitySecretExpiresAt" TIMESTAMP(3),
ADD COLUMN     "requireSignedIdentity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signedIdentityConnectedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FeatureRequest" ADD COLUMN     "authorVerified" BOOLEAN NOT NULL DEFAULT false;

