import { Hono } from 'hono';
import type { Env } from '../index.js';

const eligibility = new Hono<Env>();

/**
 * POST /api/eligibility-check
 * 咲縁（SAEN）採用フォームの有効/無効判定
 *
 * 無効条件（いずれかに該当 → eligible: false）:
 *   - 年齢 35歳以上
 *   - 持病・治療中あり
 *   - 外国籍
 *   - 直近3社で1年以内に3回以上離職
 *
 * リクエスト: { age, medical, nationality, job_changes, ... }
 * レスポンス: { eligible: boolean, reason?: string }
 *
 * 認証不要（LIFFブラウザ・CF Workers両方から呼ばれる）
 */
eligibility.post('/api/eligibility-check', async (c) => {
  try {
    const body = await c.req.json<{
      age?: string | number;
      medical?: string;
      nationality?: string;
      job_changes?: string;
    }>();

    const age = parseInt(String(body.age ?? '0'), 10);
    const medical = body.medical ?? '';
    const nationality = body.nationality ?? '';
    const jobChanges = body.job_changes ?? '';

    // 無効判定
    if (age >= 35) {
      return c.json({ eligible: false, reason: '年齢条件を満たしていません' });
    }
    if (medical === 'はい（持病・治療中あり）') {
      return c.json({ eligible: false, reason: '健康状態の条件を満たしていません' });
    }
    if (nationality === '外国籍') {
      return c.json({ eligible: false, reason: '国籍条件を満たしていません' });
    }
    if (jobChanges === '3回以上あり') {
      return c.json({ eligible: false, reason: '就業履歴の条件を満たしていません' });
    }

    return c.json({ eligible: true });
  } catch (err) {
    console.error('POST /api/eligibility-check error:', err);
    return c.json({ eligible: false, reason: 'サーバーエラー' }, 500);
  }
});

export { eligibility };
