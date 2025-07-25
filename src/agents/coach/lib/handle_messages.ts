// src/agents/coach/lib/handle_messages.ts

import type { GenericMessageEvent } from '@slack/web-api';
import { client } from './slack_utils';
import { generateResponse } from '../generate_response';

export async function handleNewAssistantMessage(
  event    : GenericMessageEvent,
  botUserId: string,
) {
  const { channel, thread_ts, text, ts } = event;
  if (!text || !channel) return;

  try {
    //1. placeholder
    const thinking = await client.chat.postMessage({
      channel,
      thread_ts: thread_ts ?? ts,
      text: '🤔 Thinking…',
    });

    //2. run the LLM
    const reply = await generateResponse([{ role: 'user', content: text }]);

    //3. update the message
    await client.chat.update({
      channel,
      ts: thinking.ts!,
      text: reply,
    });
  } catch (err) {
    // any Web-API error object contains: err.data.error
    await client.chat.postMessage({
      channel,
      thread_ts: thread_ts ?? ts,
      text: `❌ Error: ${(err as any)?.data?.error ?? err}`,
    });
    throw err;
  }
}
