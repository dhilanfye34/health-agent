// src/agents/coach/db/schema.ts
import {
    pgTable, serial, text, timestamp, numeric,
  } from 'drizzle-orm/pg-core';
  
  export const workouts = pgTable('workouts', {
    id:       serial('id').primaryKey(),
    userId:   text('user_id').notNull(),
    ts:       timestamp('ts').defaultNow(),
    activity: text('activity').notNull(),
    duration: numeric('duration_min'),
    notes:    text('notes'),
  });
  