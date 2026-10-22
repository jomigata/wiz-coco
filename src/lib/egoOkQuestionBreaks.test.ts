import {
  applyBalancedTwoLineBreak,
  applyCommaBreakForTwoLines,
  countCommaSpaces,
} from '@/lib/egoOkQuestionBreaks';

describe('egoOkQuestionBreaks', () => {
  it('breaks only when exactly one comma+space', () => {
    const one = '앞부분이 길 때, 뒷부분 문장입니다.';
    expect(applyCommaBreakForTwoLines(one)).toBe('앞부분이 길 때,\n뒷부분 문장입니다.');
    const two = '첫 구절, 둘째 구절, 셋째입니다.';
    expect(applyCommaBreakForTwoLines(two)).toBeNull();
    expect(countCommaSpaces(two)).toBe(2);
  });

  it('balances two lines at word boundary', () => {
    const text = '주변 사람들이 보통 해내는 일 정도는 나도 잘 해낼 수 있다고 생각한다.';
    const out = applyBalancedTwoLineBreak(text, 22);
    expect(out).toContain('\n');
    expect(out!.split('\n')).toHaveLength(2);
  });
});
