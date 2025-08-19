-- CreateTable: Add background_image_url column to cards table
-- V11.0 - Phase 4.1: Database Migration for Card Background Images

ALTER TABLE "cards" ADD COLUMN "background_image_url" TEXT; 