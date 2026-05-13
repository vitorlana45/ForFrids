-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('free', 'premium', 'lifetime');

-- CreateEnum
CREATE TYPE "TributeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "UploadScope" AS ENUM ('profile_avatar', 'pet_avatar', 'pet_timeline', 'chronicle_cover');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "image" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "guardian_title" TEXT DEFAULT 'Tutor e guardiao de memorias',
    "bio" TEXT,
    "plan_id" "PlanId" NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ,
    "refresh_token_expires_at" TIMESTAMPTZ,
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "birth_date" DATE,
    "death_date" DATE,
    "avatar_url" TEXT,
    "memorial_slug" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "tribute_text" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tributes" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "author_user_id" UUID,
    "author_name" TEXT NOT NULL,
    "author_relation" TEXT,
    "message" TEXT NOT NULL,
    "status" "TributeStatus" NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_capsules" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Capsula do tempo',
    "message" TEXT NOT NULL,
    "open_at" TIMESTAMPTZ NOT NULL,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_capsules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_entries" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronicles" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "cover_url" TEXT,
    "event_date" DATE,
    "life_phase" TEXT,
    "mood" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "reading_minutes" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "chronicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memorial_reactions" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reaction_type" TEXT NOT NULL DEFAULT 'heart',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memorial_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "provider_checkout_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "plan_id" "PlanId" NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "current_period_end" TIMESTAMPTZ,
    "canceled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scope" "UploadScope" NOT NULL,
    "object_key" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "pets_memorial_slug_key" ON "pets"("memorial_slug");

-- CreateIndex
CREATE INDEX "pets_owner_id_idx" ON "pets"("owner_id");

-- CreateIndex
CREATE INDEX "idx_tributes_pet_id" ON "tributes"("pet_id");

-- CreateIndex
CREATE INDEX "idx_tributes_created_at" ON "tributes"("created_at");

-- CreateIndex
CREATE INDEX "idx_tributes_status" ON "tributes"("status");

-- CreateIndex
CREATE INDEX "idx_tributes_author_user_id" ON "tributes"("author_user_id");

-- CreateIndex
CREATE INDEX "time_capsules_pet_id_idx" ON "time_capsules"("pet_id");

-- CreateIndex
CREATE INDEX "timeline_entries_pet_id_idx" ON "timeline_entries"("pet_id");

-- CreateIndex
CREATE INDEX "idx_chronicles_pet_id" ON "chronicles"("pet_id");

-- CreateIndex
CREATE INDEX "idx_chronicles_event_date" ON "chronicles"("event_date");

-- CreateIndex
CREATE INDEX "idx_chronicles_published" ON "chronicles"("is_published");

-- CreateIndex
CREATE INDEX "idx_memorial_reactions_pet_id" ON "memorial_reactions"("pet_id");

-- CreateIndex
CREATE INDEX "idx_memorial_reactions_user_id" ON "memorial_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memorial_reactions_unique" ON "memorial_reactions"("pet_id", "user_id", "reaction_type");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_profile_id" ON "subscriptions"("profile_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_customer_id" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_provider_customer_id" ON "subscriptions"("provider", "provider_customer_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_provider_profile_id" ON "subscriptions"("provider", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_subscriptions_provider_subscription_id" ON "subscriptions"("provider", "provider_subscription_id");

-- CreateIndex
CREATE INDEX "idx_upload_events_user_created" ON "upload_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_upload_events_scope_created" ON "upload_events"("scope", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributes" ADD CONSTRAINT "tributes_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tributes" ADD CONSTRAINT "tributes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_capsules" ADD CONSTRAINT "time_capsules_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicles" ADD CONSTRAINT "chronicles_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorial_reactions" ADD CONSTRAINT "memorial_reactions_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memorial_reactions" ADD CONSTRAINT "memorial_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_events" ADD CONSTRAINT "upload_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
