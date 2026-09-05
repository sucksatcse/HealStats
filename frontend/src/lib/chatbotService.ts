/**
 * chatbotService.ts
 * Grounded intent engine for the HealthStats Assistant (Task 17), localized via
 * i18next (Task 18).
 *
 * Every factual answer about patients, clinics, outbreaks or sync status is derived
 * from a real Supabase query (reusing adminService). The assistant NEVER fabricates
 * counts, names or medical facts: unknown answers, empty results and errors are
 * reported honestly. Data-backed answers require an authenticated session; on the
 * public landing page the assistant only explains how the platform works.
 *
 * User-facing reply text comes from the `chatbot`/`urgency` i18n namespaces so the
 * assistant answers in the active language. Dynamic values (names, IDs, counts,
 * clinic/zone names) are passed through interpolation and never translated.
 */
import {
  fetchAdminStats,
  fetchClinicMapData,
  fetchHighRiskPatients,
  fetchOutbreakAnalysis,
  fetchPatients,
} from './adminService';
import { shortId, urgencyFromScore } from './types';
import { supabase } from './supabase';
import i18n from '../i18n';

export interface ChatContext {
  authenticated: boolean;
  role: 'worker' | 'admin' | null;
  clinicId: string | null;
}

export interface ChatAnswer {
  /** The assistant's reply text (already localized). */
  text: string;
  /** True when the reply was derived from a live database query. */
  grounded: boolean;
}

/** Localized chatbot string. */
function t(key: string, opts?: Record<string, unknown>): string {
  return i18n.t(`chatbot:${key}`, opts ?? {}) as string;
}

/** Localized urgency label from the canonical level (business logic unchanged). */
function urgencyLabel(score: number | null | undefined): string {
  return i18n.t(`urgency:${urgencyFromScore(score)}`) as string;
}

function has(q: string, ...words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

// ── Platform how-to answers (describe real, existing app capabilities) ─────────
function platformAnswer(q: string): string | null {
  if (has(q, 'offline', 'sync', 'reconnect', 'connectivity', 'internet')) return t('howtoOfflineSync');
  if (has(q, 'ocr', 'scan', 'digiti', 'paper')) return t('howtoOcr');
  if (has(q, 'triage', 'urgency', 'severity', 'priority')) return t('howtoTriage');
  if (has(q, 'emergency', 'disaster', 'crisis', 'flood', 'cyclone')) return t('howtoEmergency');
  if (has(q, 'language', 'bangla', 'bengali', 'translate')) return t('howtoLanguage');
  if (has(q, 'dark mode', 'theme', 'night')) return t('howtoDarkMode');
  return null;
}

function capabilities(ctx: ChatContext): string {
  return ctx.authenticated ? t('capabilitiesAuthed') : t('capabilitiesPublic');
}

// ── Intent: look up a patient by name ──────────────────────────────────────────
function extractPatientName(q: string): string {
  return q
    .replace(/[?.!]/g, ' ')
    .replace(
      /\b(find|search|look ?up|lookup|show|get|fetch|patient|patients|record|records|for|named|name|called|a|an|the|me)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

async function findPatient(q: string, ctx: ChatContext): Promise<ChatAnswer> {
  if (!ctx.authenticated) return { text: t('loginRequired'), grounded: false };
  const name = extractPatientName(q);
  if (!name) return { text: t('findNeedName'), grounded: false };

  const res = await fetchPatients({
    clinicId: ctx.clinicId,
    query: name,
    urgencyFilter: 'All',
    page: 1,
    pageSize: 5,
  });
  if (res.error) return { text: t('dbError'), grounded: false };
  if (res.count === 0) {
    return {
      text: ctx.role === 'worker' ? t('findNoneClinic', { name }) : t('findNone', { name }),
      grounded: true,
    };
  }
  const lines = res.data.map((p) => {
    const score = p.latest_visit?.urgency_score ?? null;
    const urgency = score !== null ? `, ${t('urgencyWord')} ${score} (${urgencyLabel(score)})` : '';
    const village = p.village ? `, ${p.village}` : '';
    return `• ${p.name} (${t('idLabel')} ${shortId(p.id)}${village}${urgency})`;
  });
  const more = res.count > res.data.length ? `\n${t('findMore', { count: res.count - res.data.length })}` : '';
  return {
    text: `${t('findFound', { count: res.count, name })}\n${lines.join('\n')}${more}`,
    grounded: true,
  };
}

// ── Intent: high-risk patient list ─────────────────────────────────────────────
async function highRiskList(ctx: ChatContext): Promise<ChatAnswer> {
  if (!ctx.authenticated) return { text: t('loginRequired'), grounded: false };
  const res = await fetchHighRiskPatients(ctx.clinicId);
  if (res.error) return { text: t('dbError'), grounded: false };
  if (res.data.length === 0) return { text: t('highRiskNone'), grounded: true };

  const top = res.data.slice(0, 5).map((p) => {
    const score = p.latest_visit?.urgency_score ?? null;
    const clinic = p.clinics?.name ? `, ${p.clinics.name}` : '';
    return `• ${p.name} — ${t('highRiskUrgencyWord')} ${score ?? '—'} (${urgencyLabel(score)})${clinic}`;
  });
  const more = res.data.length > 5 ? `\n${t('findMore', { count: res.data.length - 5 })}` : '';
  return {
    text: `${t('highRiskHeader', { count: res.data.length })}\n${top.join('\n')}${more}`,
    grounded: true,
  };
}

// ── Intent: outbreak status ────────────────────────────────────────────────────
async function outbreakStatus(ctx: ChatContext): Promise<ChatAnswer> {
  if (!ctx.authenticated) return { text: t('loginRequired'), grounded: false };
  const res = await fetchOutbreakAnalysis({ clinicId: ctx.clinicId ?? undefined });
  if (res.error || !res.data) return { text: t('dbError'), grounded: false };
  const { clusters, highestRiskLevel, totalVisitsAnalyzed, timeframeHours } = res.data;
  if (clusters.length === 0) {
    return { text: t('outbreakNone', { hours: timeframeHours, count: totalVisitsAnalyzed }), grounded: true };
  }
  const top = clusters[0];
  return {
    text: t('outbreakSummary', {
      level: highestRiskLevel.toUpperCase(),
      clusters: clusters.length,
      visits: totalVisitsAnalyzed,
      hours: timeframeHours,
      syndrome: top.syndromeName,
      zone: top.zone,
      cases: top.caseCount,
      maxUrgency: top.urgencyMax,
    }),
    grounded: true,
  };
}

// ── Intent: clinic activity / map ──────────────────────────────────────────────
async function clinicActivity(ctx: ChatContext): Promise<ChatAnswer> {
  if (!ctx.authenticated) return { text: t('loginRequired'), grounded: false };
  const res = await fetchClinicMapData();
  if (res.error) return { text: t('dbError'), grounded: false };
  const { clinics, totals } = res;
  if (clinics.length === 0) return { text: t('clinicNone'), grounded: true };

  const active = clinics.filter((c) => c.activity === 'active').length;
  const recent = clinics.filter((c) => c.activity === 'recent').length;
  const quiet = clinics.filter((c) => c.activity === 'quiet').length;
  const pending = totals.pendingSync > 0 ? t('clinicPending', { count: totals.pendingSync }) : '';
  return {
    text: t('clinicSummary', {
      clinics: totals.clinics,
      active,
      recent,
      quiet,
      visits: totals.visitsLast7d,
      pending,
    }),
    grounded: true,
  };
}

// ── Intent: single headline stats + overview ───────────────────────────────────
async function statsAnswer(q: string, ctx: ChatContext): Promise<ChatAnswer> {
  if (!ctx.authenticated) return { text: t('loginRequired'), grounded: false };
  const s = await fetchAdminStats(ctx.clinicId);
  const scope = ctx.role === 'worker' ? t('scopeClinic') : '';

  const wantsToday = has(q, 'today', 'records today', "today's");
  const wantsPending = has(q, 'pending', 'unsynced', 'queue', 'queued', 'not synced', 'to sync');
  const wantsHigh = has(q, 'high-risk', 'high risk', 'flagged', 'critical', 'urgent');
  const wantsTotal = has(q, 'how many patient', 'total patient', 'number of patient', 'patient count', 'registered');
  const wantsOverview = has(q, 'overview', 'summary', 'status', 'how are things', 'dashboard', 'snapshot');

  if (wantsToday && !wantsOverview) {
    if (s.errors.recordsToday) return { text: t('dbError'), grounded: false };
    return { text: t('statsToday', { count: s.recordsToday ?? 0, scope }), grounded: true };
  }
  if (wantsPending && !wantsOverview) {
    if (s.errors.pendingSync) return { text: t('dbError'), grounded: false };
    const n = s.pendingSync ?? 0;
    return {
      text: n === 0 ? t('statsPendingZero', { scope }) : t('statsPending', { count: n, scope }),
      grounded: true,
    };
  }
  if (wantsHigh && !wantsOverview) {
    if (s.errors.highRiskFlagged) return { text: t('dbError'), grounded: false };
    return { text: t('statsHigh', { count: s.highRiskFlagged ?? 0, scope }), grounded: true };
  }
  if (wantsTotal && !wantsOverview) {
    if (s.errors.totalPatients) return { text: t('dbError'), grounded: false };
    return { text: t('statsTotal', { count: s.totalPatients ?? 0, scope }), grounded: true };
  }

  // Overview / fallback summary
  const parts: string[] = [];
  parts.push(
    s.errors.totalPatients
      ? t('partUnavailable', { label: t('labelPatients') })
      : t('partPatients', { count: s.totalPatients ?? 0 }),
  );
  parts.push(
    s.errors.recordsToday
      ? t('partUnavailable', { label: t('labelToday') })
      : t('partToday', { count: s.recordsToday ?? 0 }),
  );
  parts.push(
    s.errors.highRiskFlagged
      ? t('partUnavailable', { label: t('labelHighRisk') })
      : t('partHighRisk', { count: s.highRiskFlagged ?? 0 }),
  );
  parts.push(
    s.errors.pendingSync
      ? t('partUnavailable', { label: t('labelSync') })
      : t('partPending', { count: s.pendingSync ?? 0 }),
  );
  return { text: t('snapshot', { scope, parts: parts.join(' · ') }), grounded: true };
}

/**
 * Ask the server-side Groq proxy (Supabase Edge Function `groq-chat`). The API
 * key lives only on the server; the function fetches grounded, clinic-scoped
 * Supabase context and answers from it. Returns null on any failure so the
 * caller can fall back to the local grounded engine (offline / not deployed).
 */
async function answerViaGroq(question: string, ctx: ChatContext): Promise<ChatAnswer | null> {
  if (!ctx.authenticated) return null;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  try {
    const { data, error } = await supabase.functions.invoke('groq-chat', {
      body: { question, clinicId: ctx.clinicId, role: ctx.role },
    });
    if (error) return null;
    const text = (data as { text?: string } | null)?.text?.trim();
    if (!text) return null;
    return { text, grounded: true };
  } catch {
    return null;
  }
}

/**
 * Route a free-text question to the appropriate grounded handler.
 * When signed in and online, the server-side Groq proxy answers from live,
 * clinic-scoped Supabase context; if it is unavailable the local grounded intent
 * engine below answers instead (also used offline and for the public page).
 * Most-specific local intents are checked first.
 */
export async function answerQuery(question: string, ctx: ChatContext): Promise<ChatAnswer> {
  const q = question.toLowerCase().trim();
  if (!q) return { text: capabilities(ctx), grounded: false };

  const viaGroq = await answerViaGroq(question, ctx);
  if (viaGroq) return viaGroq;

  try {
    if (
      (has(q, 'find', 'search', 'look up', 'lookup') && has(q, 'patient', 'record')) ||
      has(q, 'patient named', 'patient called')
    ) {
      return await findPatient(q, ctx);
    }

    if (has(q, 'list high', 'high-risk', 'high risk', 'flagged', 'who is critical', 'sickest')) {
      if (has(q, 'list', 'who', 'name', 'which')) return await highRiskList(ctx);
      return await statsAnswer(q, ctx);
    }

    if (has(q, 'outbreak', 'cluster', 'surveillance', 'epidemic', 'symptom cluster')) {
      return await outbreakStatus(ctx);
    }

    if (has(q, 'clinic', 'ops map', 'coverage', 'map', 'active clinic', 'quiet clinic')) {
      return await clinicActivity(ctx);
    }

    if (
      has(
        q,
        'how many patient', 'total patient', 'patient count', 'number of patient', 'registered',
        'today', 'pending', 'unsynced', 'queue', 'queued',
        'overview', 'summary', 'status', 'snapshot', 'high risk', 'high-risk', 'flagged',
      )
    ) {
      return await statsAnswer(q, ctx);
    }

    const howto = platformAnswer(q);
    if (howto) return { text: howto, grounded: false };

    return { text: capabilities(ctx), grounded: false };
  } catch (err) {
    console.error('[chatbotService] answerQuery error:', err);
    return { text: t('dbError'), grounded: false };
  }
}
