-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "letter_content" TEXT,
ADD COLUMN     "letter_is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "letter_updated_at" TIMESTAMPTZ;
