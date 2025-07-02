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
    /* ───────── 1. raw body ───────── */
    const rawBody = await req.data.text();
    console.info('[rawBody]', rawBody.slice(0, 200) + (rawBody.length > 200 ? '…' : ''));

    /* ───────── 2. JSON-parse if possible ───────── */
    let payload: any = null;
    try { payload = JSON.parse(rawBody); } catch { /* dev-mode ping text */ }
    console.info('[payload keys]', Object.keys(payload || {}));

    /* ───────── 3. Slack URL-verification ───────── */
    if (payload?.type === 'url_verification') {
      console.info('[flow] URL-verification');
      return res.json({ challenge: payload.challenge });
    }

    /* ───────── 4. Slack Events API ───────── */
    if (payload?.event) {
      console.info('[flow] entered event handler');

      /* 4-A. Signature verification (flatten arrays → string) */
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

      console.info('[evt]', {
        type: evt.type,
        channel_type: evt.channel_type,
        user: evt.user,
        bot_id: evt.bot_id,
      });

      /* 4-B. @-mentions (channels or DMs) */
      if (evt.type === 'app_mention') {
        console.info('[flow] app_mention branch');
        if (allowedUser && evt.user !== allowedUser) return res.text('ignored', 200);
        await handleAppMention(evt as any);
        return res.text('ok', 200);
      }

      /* 4-C. Direct messages to the bot */
      if (
        evt.type === 'message' &&
        evt.channel_type === 'im' &&
        !evt.bot_id                 // ignore other bots
      ) {
        console.info('[flow] DM branch');
        if (allowedUser && evt.user !== allowedUser) return res.text('ignored', 200);
        await handleNewAssistantMessage(evt as any, botUserId);
        return res.text('ok', 200);
      }

      console.info('[flow] event fell through → ignored');
      return res.text('ignored', 200);
    }

    /* ───────── 5. Cron pings / Dev-mode sandbox ───────── */
    if (!rawBody || rawBody.includes('"cron"')) {
      console.info('[flow] cron/dev ping');
      const r = await sendReminder();
      return res.text(await r.text(), r.status);
    }

    // 6. Dev-mode free text → LLM
    console.info('[flow] dev free-text');
    const reply = await generateResponse([{ role: 'user', content: rawBody }]);
    return res.text(reply);

  } catch (err) {
    console.error('[index] top-level error', err);
    return res.text('⚠️ internal error', 500);
  }
}
