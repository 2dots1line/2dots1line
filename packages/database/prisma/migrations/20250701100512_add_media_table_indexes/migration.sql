-- CreateIndex
CREATE INDEX "media_items_user_id_idx" ON "media_items"("user_id");

-- CreateIndex
CREATE INDEX "media_items_user_id_type_idx" ON "media_items"("user_id", "type");

-- CreateIndex
CREATE INDEX "media_items_user_id_created_at_idx" ON "media_items"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "media_items_processing_status_idx" ON "media_items"("processing_status");
