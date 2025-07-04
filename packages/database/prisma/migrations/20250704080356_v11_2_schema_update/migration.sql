/*
  Warnings:

  - Added the required column `source_type` to the `memory_units` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "memory_units" ADD COLUMN     "source_type" TEXT NOT NULL;
