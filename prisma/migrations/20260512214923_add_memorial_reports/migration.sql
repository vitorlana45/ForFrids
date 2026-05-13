-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('active', 'flagged', 'hidden', 'blocked');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('sexual_content', 'child_safety', 'animal_cruelty', 'hate_speech', 'spam', 'fake_memorial', 'copyright', 'harassment', 'personal_info', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'under_review', 'resolved_valid', 'resolved_invalid', 'duplicate');

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "blocked_at" TIMESTAMPTZ,
ADD COLUMN     "blocked_by" UUID,
ADD COLUMN     "blocked_reason" TEXT,
ADD COLUMN     "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "memorial_reports" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "reporter_user_id" UUID,
    "reporter_email" TEXT,
    "reporter_ip" TEXT,
    "category" "ReportCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "memorial_url" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ,
    "resolution_note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memorial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_memorial_reports_pet_id" ON "memorial_reports"("pet_id");

-- CreateIndex
CREATE INDEX "idx_memorial_reports_status_created" ON "memorial_reports"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_memorial_reports_reporter_user" ON "memorial_reports"("reporter_user_id");

-- CreateIndex
CREATE INDEX "idx_pets_moderation_status" ON "pets"("moderation_status");

-- AddForeignKey
ALTER TABLE "memorial_reports" ADD CONSTRAINT "memorial_reports_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorial_reports" ADD CONSTRAINT "memorial_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
