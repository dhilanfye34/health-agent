import { tool } from 'ai';
import { z } from 'zod';
import { getWhoopFullData } from './lib/whoop_utils';
import { logWorkout } from './db/ops';

export const whoopTool = tool({
  description: 'Fetches full WHOOP data for today, including recovery, strain (cycle), and sleep.',
  parameters: z.object({}), // no input
  execute: async () => {
    const fullData = await getWhoopFullData();
    return { whoop: fullData };
  },
});

export const logWorkoutTool = tool({
  description: 'Save a workout you just completed.',
  parameters: z.object({
    activity: z.string(),
    minutes: z.number().optional(),
    notes: z.string().optional(),
  }),
  execute: async ({ activity, minutes, notes }) => {
    await logWorkout(process.env.AUTHORIZED_USER_ID!, activity, minutes, notes);
    return { ok: true };
  },
});
