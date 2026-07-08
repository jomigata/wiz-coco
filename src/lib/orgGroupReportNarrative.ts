export type GroupNarrative = {
  summary: string;
  insights: string[];
  recommendations: string[];
};

export type GroupReportStats = {
  cohortName: string;
  participantCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionRatePercent: number;
  byTest: { testId: string; name: string; completedCount: number }[];
};

/** T-4-04 — 익명 그룹 통계 기반 자동 분석 요약 (개인 식별 정보 없음) */
export function buildAnonymousGroupNarrative(report: GroupReportStats): GroupNarrative {
  const total = report.participantCount;
  const completed = report.completedCount;
  const inProgress = report.inProgressCount;
  const notStarted = report.notStartedCount;
  const rate = report.completionRatePercent;

  const insights: string[] = [
    `참여 ${total}명 중 완료 ${completed}명(완료율 ${rate}%), 진행 중 ${inProgress}명, 미시작 ${notStarted}명입니다.`,
  ];

  if (total === 0) {
    return {
      summary: '아직 참여자 데이터가 없어 그룹 분석을 생성할 수 없습니다.',
      insights: ['cohort에 등록된 포털이 없습니다.'],
      recommendations: ['일괄 발송 후 1주일 뒤 다시 확인하세요.'],
    };
  }

  if (rate >= 80) {
    insights.push('완료율이 높아 프로그램 참여가 안정적으로 마무리되고 있습니다.');
  } else if (rate >= 50) {
    insights.push('절반 이상이 완료했으나, 미완료·진행 중 인원에 대한 후속 안내가 필요합니다.');
  } else {
    insights.push('완료율이 낮습니다. 일정·접근성·리마인더 채널을 점검할 시점입니다.');
  }

  if (inProgress > 0 && inProgress >= completed * 0.3) {
    insights.push(`진행 중 ${inProgress}명이 상당수입니다. 마감일 전 독려 메시지를 권장합니다.`);
  }

  if (notStarted > 0 && notStarted >= total * 0.25) {
    insights.push(
      `미시작 ${notStarted}명(약 ${Math.round((notStarted / total) * 100)}%) — 최초 안내·재발송을 검토하세요.`,
    );
  }

  const topTest = [...report.byTest].sort((a, b) => b.completedCount - a.completedCount)[0];
  if (topTest && topTest.completedCount > 0) {
    insights.push(
      `검사별로는 「${topTest.name}」 완료가 가장 많습니다(${topTest.completedCount}건).`,
    );
  }

  const lowTests = report.byTest.filter(
    (t) => t.completedCount < completed && completed > 0,
  );
  if (lowTests.length > 0) {
    const names = lowTests.map((t) => t.name).join(', ');
    insights.push(`상대적으로 완료가 적은 검사: ${names}. 필수 검사 안내를 강화하세요.`);
  }

  const recommendations: string[] = [];
  if (rate < 70) {
    recommendations.push('미완료·미시작 대상에게 SMS/이메일 리마인더를 1회 이상 발송하세요.');
  }
  if (inProgress > 0) {
    recommendations.push('진행 중 참여자에게 마감일과 검사실 접속 방법을 다시 안내하세요.');
  }
  recommendations.push('본 요약은 익명 집계 기반이며 개인 진단·치료를 대체하지 않습니다.');
  recommendations.push('고위험 징후가 의심되는 경우 담당 상담사·전문기관 연계를 별도로 운영하세요.');

  const summary =
    rate >= 80
      ? `${report.cohortName} cohort는 높은 완료율(${rate}%)을 보이고 있습니다.`
      : rate >= 50
        ? `${report.cohortName} cohort는 진행 중이나, 완료율(${rate}%) 향상을 위한 후속 조치가 필요합니다.`
        : `${report.cohortName} cohort의 완료율(${rate}%)이 낮아 참여 독려·일정 조정을 권장합니다.`;

  return { summary, insights, recommendations };
}
