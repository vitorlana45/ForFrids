-- CreateEnum
CREATE TYPE "SupportTicketType" AS ENUM ('support', 'suggestion', 'bug', 'donation_intent');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "type" "SupportTicketType" NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT,
    "impact" TEXT,
    "steps" TEXT,
    "expected_result" TEXT,
    "actual_result" TEXT,
    "contact_email" TEXT,
    "page_url" TEXT,
    "user_agent" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_support_tickets_status_created" ON "support_tickets"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_support_tickets_type_created" ON "support_tickets"("type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_support_tickets_user_id" ON "support_tickets"("user_id");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
