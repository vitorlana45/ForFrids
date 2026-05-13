-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('editor', 'viewer');

-- CreateTable
CREATE TABLE "pet_collaborators" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'editor',
    "invited_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_pet_collaborators_pet_id" ON "pet_collaborators"("pet_id");

-- CreateIndex
CREATE INDEX "idx_pet_collaborators_profile_id" ON "pet_collaborators"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "pet_collaborators_unique" ON "pet_collaborators"("pet_id", "profile_id");

-- AddForeignKey
ALTER TABLE "pet_collaborators" ADD CONSTRAINT "pet_collaborators_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_collaborators" ADD CONSTRAINT "pet_collaborators_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
