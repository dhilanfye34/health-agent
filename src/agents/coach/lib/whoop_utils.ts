// src/agents/coach/lib/whoop_utils.ts

const BASE = 'https://api.prod.whoop.com/developer/v1';
const TOKEN = process.env.WHOOP_ACCESS_TOKEN!;

// Fetch helper
async function whoopFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok) throw new Error(`WHOOP ${res.status}: ${await res.text()}`);
  if (!ct.includes('application/json')) throw new Error('WHOOP non-JSON');
  return res.json() as Promise<any>;
}

// Recovery — pulls ALL fields
export async function getRecovery() {
  const j = await whoopFetch('/recovery?limit=1');
  const r = j.records?.[0];
  if (!r || !r.score) return 'No recovery data found.';

  return {
    cycle_id: r.cycle_id,
    sleep_id: r.sleep_id,
    user_id: r.user_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    score_state: r.score_state,
    score: {
      recovery_score: r.score.recovery_score,
      resting_heart_rate: r.score.resting_heart_rate,
      hrv_rmssd_milli: r.score.hrv_rmssd_milli,
      spo2_percentage: r.score.spo2_percentage,
      skin_temp_celsius: r.score.skin_temp_celsius,
      user_calibrating: r.score.user_calibrating,
    },
  };
}

// Sleep — pulls ALL fields
export async function getSleep() {
  const j = await whoopFetch('/activity/sleep?limit=1');
  const s = j.records?.[0];
  if (!s || !s.score) return 'No sleep data found.';

  return {
    id: s.id,
    user_id: s.user_id,
    start: s.start,
    end: s.end,
    timezone_offset: s.timezone_offset,
    nap: s.nap,
    score_state: s.score_state,
    created_at: s.created_at,
    updated_at: s.updated_at,
    score: {
      sleep_performance_percentage: s.score.sleep_performance_percentage,
      sleep_consistency_percentage: s.score.sleep_consistency_percentage,
      sleep_efficiency_percentage: s.score.sleep_efficiency_percentage,
      respiratory_rate: s.score.respiratory_rate,
      stage_summary: s.score.stage_summary ?? {},
      sleep_needed: s.score.sleep_needed ?? {},
    },
  };
}

// Cycle (Strain + Heart Rate etc) — pulls ALL fields
export async function getCycle() {
  const j = await whoopFetch('/cycle?limit=1');
  const c = j.records?.[0];
  if (!c || !c.score) return 'No cycle data found.';

  return {
    id: c.id,
    user_id: c.user_id,
    start: c.start,
    end: c.end,
    timezone_offset: c.timezone_offset,
    score_state: c.score_state,
    created_at: c.created_at,
    updated_at: c.updated_at,
    score: {
      strain: c.score.strain,
      kilojoule: c.score.kilojoule,
      average_heart_rate: c.score.average_heart_rate,
      max_heart_rate: c.score.max_heart_rate,
    },
  };
}

// Aggregator with full data
export async function getWhoopFullData() {
  const [recovery, sleep, cycle] = await Promise.all([
    getRecovery(),
    getSleep(),
    getCycle(),
  ]);

  return {
    recovery,
    sleep,
    cycle,
  };
}
