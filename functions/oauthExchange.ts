/**
 * 카카오/네이버 OAuth authorization_code → Firebase Custom Token
 * 클라이언트 시크릿은 이 함수에서만 사용합니다.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

const KAKAO_TOKEN = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER = 'https://kapi.kakao.com/v2/user/me';
const NAVER_TOKEN = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE = 'https://openapi.naver.com/v1/nid/me';

function setCors(res: Response, origin?: string) {
  const allow =
    origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ? origin
      : '*';
  res.set('Access-Control-Allow-Origin', allow);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function getConfig() {
  const cfg = functions.config();
  return {
    kakaoClientId:
      process.env.KAKAO_CLIENT_ID ||
      process.env.KAKAO_REST_API_KEY ||
      cfg.kakao?.client_id,
    kakaoClientSecret:
      process.env.KAKAO_CLIENT_SECRET || cfg.kakao?.client_secret,
    naverClientId: process.env.NAVER_CLIENT_ID || cfg.naver?.client_id,
    naverClientSecret:
      process.env.NAVER_CLIENT_SECRET || cfg.naver?.client_secret,
  };
}

function isAllowedRedirectUri(uri: string): boolean {
  const envList = process.env.OAUTH_REDIRECT_URI_ALLOWLIST || '';
  const fromEnv = envList
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    'https://wiz-coco.web.app/login/kakao-callback/',
    'https://wiz-coco.web.app/login/naver-callback/',
    'https://wizcoco.com/login/kakao-callback/',
    'https://wizcoco.com/login/naver-callback/',
    'https://www.wizcoco.com/login/kakao-callback/',
    'https://www.wizcoco.com/login/naver-callback/',
    'http://localhost:3000/login/kakao-callback/',
    'http://localhost:3000/login/naver-callback/',
    'http://127.0.0.1:3000/login/kakao-callback/',
    'http://127.0.0.1:3000/login/naver-callback/',
  ];
  const allowed = [...fromEnv, ...defaults];
  return allowed.some((prefix) => uri === prefix || uri.startsWith(prefix));
}

async function kakaoExchange(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    client_secret: clientSecret,
  });
  const tokenRes = await fetch(KAKAO_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    functions.logger.error('Kakao token error', tokenRes.status, t);
    throw new Error('카카오 토큰 교환에 실패했습니다.');
  }
  const tokenJson = (await tokenRes.json()) as { access_token: string };
  const meRes = await fetch(KAKAO_USER, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!meRes.ok) {
    throw new Error('카카오 사용자 정보를 가져오지 못했습니다.');
  }
  const me = (await meRes.json()) as {
    id: number;
    kakao_account?: { email?: string; name?: string };
  };
  const email = me.kakao_account?.email;
  const name = me.kakao_account?.name || `카카오사용자${me.id}`;
  return {
    providerUid: String(me.id),
    email: email || undefined,
    displayName: name,
  };
}

async function naverExchange(
  code: string,
  state: string,
  clientId: string,
  clientSecret: string
) {
  const qs = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    state,
  });
  const tokenRes = await fetch(`${NAVER_TOKEN}?${qs.toString()}`, {
    method: 'GET',
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    functions.logger.error('Naver token error', tokenRes.status, t);
    throw new Error('네이버 토큰 교환에 실패했습니다.');
  }
  const tokenJson = (await tokenRes.json()) as { access_token: string };
  const meRes = await fetch(NAVER_PROFILE, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!meRes.ok) {
    throw new Error('네이버 사용자 정보를 가져오지 못했습니다.');
  }
  const me = (await meRes.json()) as {
    response?: { id?: string; email?: string; name?: string; nickname?: string };
  };
  const r = me.response;
  if (!r?.id) {
    throw new Error('네이버 프로필이 올바르지 않습니다.');
  }
  return {
    providerUid: r.id,
    email: r.email,
    displayName: r.name || r.nickname || `네이버${r.id}`,
  };
}

async function getOrCreateUid(
  provider: string,
  providerUid: string,
  email: string | undefined,
  displayName: string
): Promise<string> {
  const uid = `${provider}_${providerUid}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 120);
  const syntheticDomain =
    process.env.OAUTH_SYNTHETIC_EMAIL_DOMAIN || 'wiz-coco.web.app';
  const safeEmail =
    email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? email
      : `wizcoco+${provider}.${providerUid}@${syntheticDomain}`;

  try {
    await admin.auth().getUser(uid);
    if (email) {
      try {
        await admin.auth().updateUser(uid, {
          email,
          displayName: displayName || undefined,
        });
      } catch (e) {
        functions.logger.warn('updateUser skipped', e);
      }
    }
    return uid;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code !== 'auth/user-not-found') {
      throw e;
    }
  }

  try {
    await admin.auth().createUser({
      uid,
      email: safeEmail,
      displayName: displayName || undefined,
      emailVerified: !!email,
    });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === 'auth/email-already-exists') {
      await admin.auth().createUser({
        uid,
        displayName: displayName || undefined,
      });
    } else {
      throw e;
    }
  }
  return uid;
}

export const socialOAuthExchange = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCors(res, req.get('origin'));

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const {
        provider,
        code,
        redirectUri,
        state,
      } = req.body as {
        provider?: string;
        code?: string;
        redirectUri?: string;
        state?: string;
      };

      if (!provider || !code || !redirectUri) {
        res.status(400).json({ error: 'provider, code, redirectUri가 필요합니다.' });
        return;
      }

      if (!isAllowedRedirectUri(redirectUri)) {
        res.status(400).json({ error: '허용되지 않은 redirect URI입니다.' });
        return;
      }

      const cfg = getConfig();
      let providerUid: string;
      let email: string | undefined;
      let displayName: string;

      if (provider === 'kakao') {
        if (!cfg.kakaoClientId || !cfg.kakaoClientSecret) {
          res.status(500).json({ error: '카카오 서버 설정이 없습니다.' });
          return;
        }
        const k = await kakaoExchange(
          code,
          redirectUri,
          cfg.kakaoClientId,
          cfg.kakaoClientSecret
        );
        providerUid = k.providerUid;
        email = k.email;
        displayName = k.displayName;
      } else if (provider === 'naver') {
        if (!state) {
          res.status(400).json({ error: '네이버는 state가 필요합니다.' });
          return;
        }
        if (!cfg.naverClientId || !cfg.naverClientSecret) {
          res.status(500).json({ error: '네이버 서버 설정이 없습니다.' });
          return;
        }
        const n = await naverExchange(
          code,
          state,
          cfg.naverClientId,
          cfg.naverClientSecret
        );
        providerUid = n.providerUid;
        email = n.email;
        displayName = n.displayName;
      } else {
        res.status(400).json({ error: '지원하지 않는 provider입니다.' });
        return;
      }

      const uid = await getOrCreateUid(
        provider,
        providerUid,
        email,
        displayName
      );
      const customToken = await admin.auth().createCustomToken(uid, {
        provider,
      });

      res.status(200).json({ customToken, uid });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth 처리 오류';
      functions.logger.error('socialOAuthExchange', err);
      res.status(500).json({ error: msg });
    }
  }
);
