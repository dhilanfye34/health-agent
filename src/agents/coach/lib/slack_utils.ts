// src/agents/coach/lib/slack_utils.ts
import { createHmac, timingSafeEqual } from 'crypto';
import { WebClient, LogLevel }          from '@slack/web-api';

/* ───── BOT TOKEN (unchanged) ───── */
const botRaw   = process.env.SLACK_BOT_TOKEN ?? '';
const botToken = botRaw.replace(/^"|"$/g, '').trim();

export const client = new WebClient(botToken, { logLevel: LogLevel.DEBUG });

/* ───── NEW  –  STRIP & LOG SIGNING-SECRET ───── */
const secretRaw = process.env.SLACK_SIGNING_SECRET ?? '';
const secret    = secretRaw.replace(/^"|"$/g, '').trim();

console.info('[slack_utils] secret   len =', secretRaw.length,
             '→', secret.length,
             'prefix =', secret.slice(0,8));

/* ───── Signature verification ───── */
export async function verifyRequest(
    { request, rawBody }: { request: Request; rawBody: string },
  ) {
    // 1) Grab Slack headers
    const ts        = request.headers.get('x-slack-request-timestamp') ?? '';
    const sig       = request.headers.get('x-slack-signature')        ?? '';
  
    // 2) Log what you got
    console.info('[verifyRequest] ─── SLACK VERIFICATION ───');
    console.info('[verifyRequest] rawBody      =', rawBody);
    console.info('[verifyRequest] timestamp    =', ts);
    console.info('[verifyRequest] recv sig     =', sig);
  
    // 3) Recompute HMAC
    const base            = `v0:${ts}:${rawBody}`;
    const hmac            = createHmac('sha256', secret).update(base).digest('hex');
    const expectedSig     = `v0=${hmac}`;
  
    // 4) Log your computation
    console.info('[verifyRequest] base string  =', base);
    console.info('[verifyRequest] computed sig =', expectedSig);
  
    // 5) Compare
    if (
      sig.length  !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      throw new Error(
        `❌ Invalid Slack signature – mismatch\n` +
        `  received: ${sig}\n` +
        `  expected: ${expectedSig}`
      );
    }
  
    console.info('[verifyRequest] Slack signature verified ✅');
  }

/* ───── Cached bot-ID helper (unchanged) ───── */
let cached: string | null = null;
export async function getBotId() {
  if (cached) return cached;
  const { user_id } = await client.auth.test();
  if (!user_id) throw new Error('Could not resolve bot user ID');
  cached = user_id;
  return cached;
}
