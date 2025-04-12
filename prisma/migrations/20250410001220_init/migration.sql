-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "wechat_id" TEXT,
    "password_hash" TEXT NOT NULL,
    "signup_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscription_plan" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "city" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "interaction_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "raw_data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "processed_flag" BOOLEAN NOT NULL DEFAULT false,
    "processing_notes" TEXT,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("interaction_id")
);

-- CreateTable
CREATE TABLE "Card" (
    "card_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "input_sources" UUID[],
    "template_used" TEXT,
    "card_type" TEXT NOT NULL,
    "card_content" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_reaction" TEXT,
    "related_card_ids" UUID[],
    "needs_refresh" BOOLEAN NOT NULL DEFAULT false,
    "display_context" JSONB,
    "user_labels" TEXT[],
    "deck_ids" UUID[],

    CONSTRAINT "Card_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "Deck" (
    "deck_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT,
    "card_ids" UUID[],
    "tree_structure" JSONB NOT NULL,
    "ai_summary" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("deck_id")
);

-- CreateTable
CREATE TABLE "CardDeckMap" (
    "card_id" UUID NOT NULL,
    "deck_id" UUID NOT NULL,
    "added_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" TEXT,
    "node_position" TEXT,

    CONSTRAINT "CardDeckMap_pkey" PRIMARY KEY ("card_id","deck_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardDeckMap" ADD CONSTRAINT "CardDeckMap_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "Card"("card_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardDeckMap" ADD CONSTRAINT "CardDeckMap_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "Deck"("deck_id") ON DELETE RESTRICT ON UPDATE CASCADE;
