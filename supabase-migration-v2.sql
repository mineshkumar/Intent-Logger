-- Migration: Add duration field to intents table
-- Run this in your Supabase SQL Editor if you already have the tables created

ALTER TABLE intents ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
