-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "billing_emails" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_billing_emails_profile_type" ON "billing_emails"("profile_id", "type", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "billing_emails_type_dedupe_unique" ON "billing_emails"("type", "dedupe_key");

-- AddForeignKey
ALTER TABLE "billing_emails" ADD CONSTRAINT "billing_emails_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
