-- Drop the Perspective table
DROP TABLE IF EXISTS "Perspective";

-- Recreate with correct type
CREATE TABLE "Perspective" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Perspective_pkey" PRIMARY KEY ("id")
);

-- Add constraint and index
ALTER TABLE "Perspective" ADD CONSTRAINT "Perspective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Perspective_userId_idx" ON "Perspective"("userId"); 