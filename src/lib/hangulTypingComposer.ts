/**
 * 두벌식 한글 조합기 — 브라우저는 OS 입력기(IME) 언어를 바꿀 수 없으므로,
 * 영문 자판 입력을 받아 직접 한글 음절로 조합한다.
 */

const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const JUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];

const JONG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

const KEY_TO_JAMO: Record<string, string> = {
  q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ',
  y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ',
  h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ',
  b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
  Q: 'ㅃ', W: 'ㅉ', E: 'ㄸ', R: 'ㄲ', T: 'ㅆ', O: 'ㅒ', P: 'ㅖ',
};

const JUNG_COMPOUND: Record<string, string> = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ',
};

const JONG_COMPOUND: Record<string, string> = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ',
  'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ',
};

const SPLIT_PAIRS = (source: Record<string, string>): Record<string, [string, string]> => {
  const out: Record<string, [string, string]> = {};
  for (const [pair, merged] of Object.entries(source)) {
    out[merged] = [pair[0], pair[1]];
  }
  return out;
};

const JUNG_SPLIT = SPLIT_PAIRS(JUNG_COMPOUND);
const JONG_SPLIT = SPLIT_PAIRS(JONG_COMPOUND);

export type HangulComposerState = {
  /** 조합이 끝난 앞부분 */
  committed: string;
  cho: string | null;
  jung: string | null;
  jong: string | null;
};

export function createHangulComposerState(text = ''): HangulComposerState {
  return { committed: text, cho: null, jung: null, jong: null };
}

function currentGlyph(state: HangulComposerState): string {
  const { cho, jung, jong } = state;
  if (cho && jung) {
    const choIndex = CHO.indexOf(cho);
    const jungIndex = JUNG.indexOf(jung);
    const jongIndex = jong ? JONG.indexOf(jong) : 0;
    if (choIndex >= 0 && jungIndex >= 0 && jongIndex >= 0) {
      return String.fromCharCode(0xac00 + (choIndex * 21 + jungIndex) * 28 + jongIndex);
    }
  }
  return cho || jung || '';
}

export function hangulComposerText(state: HangulComposerState): string {
  return state.committed + currentGlyph(state);
}

function flushed(state: HangulComposerState): string {
  return state.committed + currentGlyph(state);
}

const isVowel = (jamo: string) => JUNG.includes(jamo);
const canBeJong = (jamo: string) => JONG.includes(jamo);

/** 매핑된 자판 키를 조합기에 입력. 매핑되지 않은 키는 null 반환. */
export function pushHangulKey(
  state: HangulComposerState,
  key: string,
): HangulComposerState | null {
  const jamo = KEY_TO_JAMO[key] ?? KEY_TO_JAMO[key.toLowerCase()];
  if (!jamo) return null;

  const { cho, jung, jong } = state;

  if (isVowel(jamo)) {
    if (cho && jung && jong) {
      const split = JONG_SPLIT[jong];
      if (split) {
        const carried = { ...state, jong: split[0] };
        return { committed: flushed(carried), cho: split[1], jung: jamo, jong: null };
      }
      const carried = { ...state, jong: null };
      return { committed: flushed(carried), cho: jong, jung: jamo, jong: null };
    }
    if (jung) {
      const merged = JUNG_COMPOUND[jung + jamo];
      if (merged) return { ...state, jung: merged };
      return { committed: flushed(state), cho: null, jung: jamo, jong: null };
    }
    if (cho) return { ...state, jung: jamo };
    return { committed: flushed(state), cho: null, jung: jamo, jong: null };
  }

  if (cho && jung) {
    if (!jong) {
      if (canBeJong(jamo)) return { ...state, jong: jamo };
      return { committed: flushed(state), cho: jamo, jung: null, jong: null };
    }
    const merged = JONG_COMPOUND[jong + jamo];
    if (merged) return { ...state, jong: merged };
    return { committed: flushed(state), cho: jamo, jung: null, jong: null };
  }

  if (cho || jung) {
    return { committed: flushed(state), cho: jamo, jung: null, jong: null };
  }
  return { ...state, cho: jamo };
}

/** 조합 중인 자모를 한 단계 되돌린다. 조합 중이 아니면 null 반환. */
export function backspaceHangul(state: HangulComposerState): HangulComposerState | null {
  if (state.jong) {
    const split = JONG_SPLIT[state.jong];
    return { ...state, jong: split ? split[0] : null };
  }
  if (state.jung) {
    const split = JUNG_SPLIT[state.jung];
    return { ...state, jung: split ? split[0] : null };
  }
  if (state.cho) {
    return { ...state, cho: null };
  }
  return null;
}
