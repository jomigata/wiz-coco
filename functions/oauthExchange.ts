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
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER = 'https://www.googleapis.com/oauth2/v3/userinfo';

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
    // functions:config(배포 시 주입) 우선 — GCP에 남은 stale env가 config를 덮어쓰지 않도록
    googleClientId: (
      cfg.google?.client_id ||
      process.env.GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_OAUTH_CLIENT_ID ||
      ''
    ).trim(),
    googleClientSecret: (
      cfg.google?.client_secret ||
      process.env.GOOGLE_CLIENT_SECRET ||
      process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
      ''
    ).trim(),
  };
}

/** 네이버/카카오 콘솔과 앱의 redirect_uri 끝 슬래시 불일치 허용 */
function normalizeRedirectUri(u: string): string {
  return u.trim().replace(/\/+$/, '');
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
    'https://wiz-coco.web.app/login/google-callback/',
    'https://wizcoco.com/login/kakao-callback/',
    'https://wizcoco.com/login/naver-callback/',
    'https://wizcoco.com/login/google-callback/',
    'https://www.wizcoco.com/login/kakao-callback/',
    'https://www.wizcoco.com/login/naver-callback/',
    'https://www.wizcoco.com/login/google-callback/',
    'http://localhost:3000/login/kakao-callback/',
    'http://localhost:3000/login/naver-callback/',
    'http://localhost:3000/login/google-callback/',
    'http://127.0.0.1:3000/login/kakao-callback/',
    'http://127.0.0.1:3000/login/naver-callback/',
    'http://127.0.0.1:3000/login/google-callback/',
  ];
  const allowed = [...fromEnv, ...defaults].map(normalizeRedirectUri);
  const norm = normalizeRedirectUri(uri);
  return allowed.includes(norm);
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

async function googleExchange(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
) {
  const redirectCandidates = [
    redirectUri,
    redirectUri.replace(/\/+$/, ''),
    redirectUri.replace(/\/+$/, '') + '/',
  ];
  try {
    const u = new URL(redirectUri);
    if (u.hostname === 'wizcoco.com') {
      u.hostname = 'www.wizcoco.com';
      redirectCandidates.push(u.toString(), u.toString().replace(/\/+$/, '') + '/');
    } else if (u.hostname === 'www.wizcoco.com') {
      u.hostname = 'wizcoco.com';
      redirectCandidates.push(u.toString(), u.toString().replace(/\/+$/, '') + '/');
    }
  } catch {
    // ignore
  }
  const uniqueRedirects = [...new Set(redirectCandidates)];

  let lastErrorText = '';
  for (const uri of uniqueRedirects) {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: uri,
      code,
    });
    const tokenRes = await fetch(GOOGLE_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (tokenRes.ok) {
      const tokenJson = (await tokenRes.json()) as { access_token: string };
      const meRes = await fetch(GOOGLE_USER, {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      if (!meRes.ok) {
        throw new Error('구글 사용자 정보를 가져오지 못했습니다.');
      }
      const me = (await meRes.json()) as {
        sub: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
      };
      if (!me.sub) {
        throw new Error('구글 프로필이 올바르지 않습니다.');
      }
      return {
        providerUid: me.sub,
        email: me.email,
        displayName: me.name || `구글사용자${me.sub.slice(-6)}`,
      };
    }
    lastErrorText = await tokenRes.text();
    functions.logger.warn('Google token attempt failed', tokenRes.status, uri, lastErrorText.slice(0, 120));
    const errJson = (() => {
      try {
        return JSON.parse(lastErrorText) as { error?: string };
      } catch {
        return {};
      }
    })();
    if (errJson.error === 'invalid_grant') {
      break;
    }
  }

  functions.logger.error('Google token error', lastErrorText, {
    redirectUri,
    clientId: clientId.slice(0, 12) + '…',
  });
  let detail = '';
  try {
    const errJson = JSON.parse(lastErrorText) as {
      error?: string;
      error_description?: string;
    };
    detail = errJson.error_description || errJson.error || '';
    if (errJson.error === 'invalid_grant') {
      detail =
        '인증 코드가 만료되었거나 이미 사용되었습니다. 로그인 페이지에서 다시 시도해 주세요.';
    }
  } catch {
    detail = lastErrorText.slice(0, 200);
  }
  throw new Error(
    detail
      ? `구글 토큰 교환에 실패했습니다: ${detail}`
      : '구글 토큰 교환에 실패했습니다.',
  );
}

async function getOrCreateUid(
  provider: string,
  providerUid: string,
  email: string | undefined,
  displayName: string
): Promise<string> {
  const uid = `${provider}_${providerUid}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 120);
  const syntheticDomain =
    process.env.OAUTH_SYNTHETIC_EMAIL_DOMAIN || 'wizcoco.com';
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

export const socialOAuthExchange = functions
  .runWith({ minInstances: 1 })
  .https.onRequest(async (req: Request, res: Response) => {
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
        clientId: bodyClientId,
      } = req.body as {
        provider?: string;
        code?: string;
        redirectUri?: string;
        state?: string;
        clientId?: string;
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
      } else if (provider === 'google') {
        if (!cfg.googleClientSecret) {
          res.status(500).json({ error: '구글 서버 설정이 없습니다.' });
          return;
        }
        const googleClientId = (bodyClientId?.trim() || cfg.googleClientId).trim();
        if (!googleClientId) {
          res.status(500).json({ error: '구글 클라이언트 ID가 설정되지 않았습니다.' });
          return;
        }
        if (cfg.googleClientId && googleClientId !== cfg.googleClientId) {
          functions.logger.warn('Google clientId mismatch', {
            body: googleClientId.slice(0, 20),
            config: cfg.googleClientId.slice(0, 20),
          });
        }
        const g = await googleExchange(
          code,
          redirectUri,
          googleClientId,
          cfg.googleClientSecret
        );
        providerUid = g.providerUid;
        email = g.email;
        displayName = g.displayName;
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
