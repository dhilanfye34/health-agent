// src/agents/coach/index.ts
import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';

import { generateResponse }           from './generate_response';
import { POST as sendReminder }       from './api/reminder';
import { verifyRequest, getBotId }    from './lib/slack_utils';
import { handleNewAssistantMessage }  from './lib/handle_messages';
import { handleAppMention }           from './lib/handle_app_mention';

export const welcome = () => ({
  welcome:
    "Hey! I'm your personal health coach. I can log workouts, share your WHOOP recovery, and keep you moving 💪",
});

export default async function Agent(
  req : AgentRequest,
  res : AgentResponse,
  _ctx: AgentContext,
) {
  try {
    // 1. raw body
    const rawBody = await req.data.text();

    // 2. JSON-parse if possible 
    let payload: any = null;
    try { payload = JSON.parse(rawBody); } catch { /* dev-mode ping text */ }

    // 3. Slack URL-verification
    if (payload?.type === 'url_verification') {
      return res.json({ challenge: payload.challenge });
    }

    // 4. Slack Events API
    if (payload?.event) {
      // 4a. Signature verification
      const hdrs = new Headers();
      Object.entries(req.metadata.headers as Record<string, string | string[]>)
        .forEach(([k, v]) => hdrs.set(k, Array.isArray(v) ? (v[0] ?? '') : (v ?? '')));

      await verifyRequest({
        request: new Request('https://dummy', { headers: hdrs }),
        rawBody,
      });

      const evt         = payload.event;
      const botUserId   = await getBotId();
      const allowedUser = process.env.AUTHORIZED_USER_ID;

      // 4b. @-mentions (channels or DMs)
      if (evt.type === 'app_mention') {
        if (allowedUser && evt.user !== allowedUser) return res.text('ignored', 200);
        await handleAppMention(evt as any);
        return res.text('ok', 200);
      }

      // 4c. Direct messages to the bot
      if (
        evt.type === 'message' &&
        evt.channel_type === 'im' &&
        !evt.bot_id                 // ignore other bots
      ) {
        if (allowedUser && evt.user !== allowedUser) return res.text('ignored', 200);
        await handleNewAssistantMessage(evt as any, botUserId);
        return res.text('ok', 200);
      }

      return res.text('ignored', 200);
    }

    // 5. Cron pings / Dev-mode sandbox
    if (!rawBody || rawBody.includes('"cron"')) {
      const r = await sendReminder();
      return res.text(await r.text(), r.status);
    }

    // 6. Dev-mode free text, LLM
    const reply = await generateResponse([{ role: 'user', content: rawBody }]);
    return res.text(reply);

  } catch (err) {
    console.error('top-level error', err);
    return res.text('⚠️ internal error', 500);
  }
}
