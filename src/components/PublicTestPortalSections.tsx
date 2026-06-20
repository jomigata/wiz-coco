'use client';

import Link from 'next/link';

const steps = [
  {
    step: '1',
    title: '코드 입력',
    desc: '안내 받은 검사 코드와 4자리 비밀번호를 입력합니다.',
  },
  {
    step: '2',
    title: '검사 진행',
    desc: '배정된 심리검사를 순서대로 또는 선택하여 진행합니다.',
  },
  {
    step: '3',
    title: '결과 확인',
    desc: '완료 후 담당 전문가를 통해 결과를 안내받습니다.',
  },
];

const faqs = [
  {
    q: '검사 코드는 어디서 받나요?',
    a: '담당 기관·전문가에게 전달받은 코드와 비밀번호를 사용합니다.',
  },
  {
    q: '회원가입이 필요한가요?',
    a: '별도 회원가입 없이 검사 코드와 비밀번호만으로 진행할 수 있습니다.',
  },
  {
    q: '링크로 바로 들어갈 수 있나요?',
    a: '문자·이메일로 받은 링크를 누르면 검사실로 바로 이동할 수 있습니다.',
  },
];

export default function PublicTestPortalSections() {
  return (
    <>
      <section className="py-16 bg-gray-900 border-t border-white/5">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-10">검사 진행 방법</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.step}
                className="rounded-xl border border-white/10 bg-white/5 p-6 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950">
        <div className="container max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-8">자주 묻는 질문</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-lg border border-white/10 bg-white/5 p-5">
                <h3 className="font-medium text-blue-200 mb-2">{f.q}</h3>
                <p className="text-slate-400 text-sm">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8">
            <Link href="/join/" className="text-blue-400 hover:text-blue-300 font-medium">
              검사 시작하기 →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
