/*
  Warnings:

  - Added the required column `interactionId` to the `Thought` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Thought" ADD COLUMN     "interactionId" UUID NOT NULL,
ADD COLUMN     "subjectName" TEXT,
ADD COLUMN     "subjectType" TEXT;

-- AddForeignKey
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("interaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;
