// src/agents/coach/db/ops.ts
import { db } from './connection';
import { workouts } from './schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

export async function logWorkout(
  userId: string,
  activity: string,
  minutes?: number,
  notes?: string,
) {
  await db.insert(workouts).values({
    userId,
    activity,
    duration: minutes !== undefined ? minutes.toString() : null,
    notes,
  });
}

export async function recentWorkouts(
    userId: string,
    limit = 5
  ) {
    return db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.ts))
      .limit(limit);
  }