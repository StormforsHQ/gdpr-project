-- Add internal_note column to check_results for private audit notes
ALTER TABLE "check_results" ADD COLUMN "internal_note" TEXT NOT NULL DEFAULT '';
