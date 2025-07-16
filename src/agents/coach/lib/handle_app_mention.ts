// src/agents/coach/lib/handle_app_mention.ts

import type { AppMentionEvent } from '@slack/web-api';
import { client } from './slack_utils';
import { generateResponse } from '../generate_response';

export async function handleAppMention(event: AppMentionEvent) {
  const { channel, thread_ts, text, ts } = event;

  try {
    //1. placeholder
    const holder = await client.chat.postMessage({
      channel,
      thread_ts: thread_ts ?? ts,
      text: '🤔 Processing…',
    });

    //2. LLM
    const reply = await generateResponse([
      { role: 'user', content: text ?? '' },
    ]);

    //3. update
    await client.chat.update({
      channel,
      ts: holder.ts!,
      text: reply,
    });
  } catch (err) {
    console.error('Slack API error:', err);
    throw err;
  }
}
