// src/agents/coach/generate-response.ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { CoreMessage } from 'ai';

import { recentWorkouts }    from './db/ops';
import { whoopTool, logWorkoutTool } from './tools';

// helper function
function formatForSlack(md: string) {
  return md
    .replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>') // links
    .replace(/\*\*/g, '*');                   // bold
}

// main function
export async function generateResponse(messages: CoreMessage[]) {
  const lastMsg = messages.at(-1)?.content ?? '';
  const lastTxt = typeof lastMsg === 'string' ? lastMsg.toLowerCase() : '';

  // “recent | last | latest | yesterday … workout(s)”
  if (/\b(recent|last|latest|yesterday).*\bworkout/.test(lastTxt)) {
    const rows = await recentWorkouts(process.env.AUTHORIZED_USER_ID!, 3);

    if (!rows.length)
      return formatForSlack("I don't see any logged workouts yet.");

    const lines = rows.map(r =>
      `• ${r.activity} — ${r.duration ?? '?'} min (on ${r.ts ? new Date(r.ts).toLocaleDateString() : '?'})`
    );
    return formatForSlack(`Here are your **last 3 workouts**:\n${lines.join('\n')}`);
  }

  // everything else, let the LLM decide
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: `
You are a concise, upbeat Slack fitness assistant.

• When the user logs a workout (“Log workout: …” or similar)
  → call logWorkoutTool.

• When the user asks about recovery, strain, or sleep
  → call whoopTool first, then give training advice based on the numbers.

Respond in a friendly, practical tone.`,
    messages,
    tools: { whoopTool, logWorkoutTool },
    maxSteps: 6,
  });

  return formatForSlack(text);
}
