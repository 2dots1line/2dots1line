-- CreateTable
CREATE TABLE "entity_connection_summary" (
    "user_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "connection_count" INTEGER NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_connection_summary_pkey" PRIMARY KEY ("user_id","entity_id","entity_type")
);

-- CreateIndex
CREATE INDEX "entity_connection_summary_user_id_idx" ON "entity_connection_summary"("user_id");
