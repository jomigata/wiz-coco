import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export interface MBTICompatibility {
  id: string;
  userId1: string;
  userId2: string;
  mbti1: string;
  mbti2: string;
  compatibilityScore: number;
  relationshipType: 'romantic' | 'friendship' | 'work' | 'family' | 'general';
  analysis: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
    communication: string;
    conflictResolution: string;
  };
  createdAt: string;
}

// MBTI 궁합 분석 생성
export async function POST(request: NextRequest) {
  try {
    const { userId1, userId2, mbti1, mbti2, relationshipType = 'general' } = await request.json();

    if (!userId1 || !userId2 || !mbti1 || !mbti2) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 중복 분석 확인
    const existingAnalysisQuery = query(
      collection(db, 'mbtiCompatibility'),
      where('userId1', 'in', [userId1, userId2]),
      where('userId2', 'in', [userId1, userId2]),
      where('mbti1', 'in', [mbti1, mbti2]),
      where('mbti2', 'in', [mbti1, mbti2])
    );
    const existingAnalysis = await getDocs(existingAnalysisQuery);
    
    if (!existingAnalysis.empty) {
      return NextResponse.json({
        success: true,
        data: existingAnalysis.docs[0].data(),
        message: '이미 분석된 궁합입니다.'
      });
    }

    // MBTI 궁합 분석 로직
    const analysis = analyzeMBTICompatibility(mbti1, mbti2, relationshipType);

    // 궁합 분석 저장
    const compatibilityData: Omit<MBTICompatibility, 'id'> = {
      userId1,
      userId2,
      mbti1,
      mbti2,
      compatibilityScore: analysis.score,
      relationshipType,
      analysis: analysis.analysis,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'mbtiCompatibility'), compatibilityData);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...compatibilityData
      }
    });

  } catch (error) {
    console.error('MBTI 궁합 분석 오류:', error);
    return NextResponse.json(
      { success: false, error: '궁합 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// MBTI 궁합 분석 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const mbti1 = searchParams.get('mbti1');
    const mbti2 = searchParams.get('mbti2');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let q;
    if (mbti1 && mbti2) {
      // 특정 MBTI 조합 조회
      q = query(
        collection(db, 'mbtiCompatibility'),
        where('userId1', 'in', [userId]),
        where('mbti1', 'in', [mbti1, mbti2]),
        where('mbti2', 'in', [mbti1, mbti2])
      );
    } else {
      // 사용자의 모든 궁합 분석 조회
      q = query(
        collection(db, 'mbtiCompatibility'),
        where('userId1', '==', userId)
      );
    }

    const querySnapshot = await getDocs(q);
    const compatibilities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: compatibilities
    });

  } catch (error) {
    console.error('MBTI 궁합 분석 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '궁합 분석 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// MBTI 궁합 분석 로직
function analyzeMBTICompatibility(mbti1: string, mbti2: string, relationshipType: string) {
  // MBTI 유형별 특성 정의
  const mbtiTraits = {
    // E vs I
    E: { energy: '외향적', social: '사교적', decision: '빠른 결정' },
    I: { energy: '내향적', social: '선택적 사교', decision: '신중한 결정' },
    
    // S vs N
    S: { perception: '현실적', detail: '구체적', time: '현재 중심' },
    N: { perception: '직관적', detail: '전체적', time: '미래 중심' },
    
    // T vs F
    T: { decision: '논리적', value: '객관적', conflict: '원칙 중심' },
    F: { decision: '감정적', value: '주관적', conflict: '관계 중심' },
    
    // J vs P
    J: { structure: '계획적', flexibility: '체계적', pressure: '마감일 준수' },
    P: { structure: '유연적', flexibility: '적응적', pressure: '마지막 순간 집중' }
  };

  // 궁합 점수 계산
  let score = 50; // 기본 점수
  const strengths: string[] = [];
  const challenges: string[] = [];
  const recommendations: string[] = [];

  // 첫 번째 글자 (E/I) 비교
  if (mbti1[0] === mbti2[0]) {
    score += 10;
    strengths.push(`${mbti1[0] === 'E' ? '외향적' : '내향적'} 에너지로 서로를 이해합니다`);
  } else {
    score -= 5;
    challenges.push(`${mbti1[0] === 'E' ? '외향적' : '내향적'}과 ${mbti2[0] === 'E' ? '외향적' : '내향적'} 에너지의 차이를 조정해야 합니다`);
    recommendations.push('서로의 에너지 충전 방식을 존중하고 이해하세요');
  }

  // 두 번째 글자 (S/N) 비교
  if (mbti1[1] === mbti2[1]) {
    score += 15;
    strengths.push(`${mbti1[1] === 'S' ? '현실적' : '직관적'} 사고방식으로 소통이 원활합니다`);
  } else {
    score -= 10;
    challenges.push(`${mbti1[1] === 'S' ? '현실적' : '직관적'}과 ${mbti2[1] === 'S' ? '현실적' : '직관적'} 사고의 차이로 오해가 생길 수 있습니다`);
    recommendations.push('서로의 사고방식을 이해하고 보완점을 인정하세요');
  }

  // 세 번째 글자 (T/F) 비교
  if (mbti1[2] === mbti2[2]) {
    score += 10;
    strengths.push(`${mbti1[2] === 'T' ? '논리적' : '감정적'} 의사결정 방식이 일치합니다`);
  } else {
    score -= 5;
    challenges.push(`${mbti1[2] === 'T' ? '논리적' : '감정적'}과 ${mbti2[2] === 'T' ? '논리적' : '감정적'} 의사결정의 차이로 갈등이 있을 수 있습니다`);
    recommendations.push('서로의 의사결정 방식을 존중하고 균형을 찾으세요');
  }

  // 네 번째 글자 (J/P) 비교
  if (mbti1[3] === mbti2[3]) {
    score += 10;
    strengths.push(`${mbti1[3] === 'J' ? '계획적' : '유연적'} 생활 방식이 잘 맞습니다`);
  } else {
    score -= 5;
    challenges.push(`${mbti1[3] === 'J' ? '계획적' : '유연적'}과 ${mbti2[3] === 'J' ? '계획적' : '유연적'} 생활 방식의 차이를 조정해야 합니다`);
    recommendations.push('서로의 생활 방식을 존중하고 중간점을 찾으세요');
  }

  // 특별한 궁합 조합들
  const specialCombinations = {
    'ENFP-INTJ': { score: 20, strength: '완벽한 보완 관계로 서로를 성장시킵니다' },
    'ENFJ-INFP': { score: 15, strength: '깊은 이해와 공감으로 강한 유대감을 형성합니다' },
    'ESTJ-INFP': { score: -10, challenge: '완전히 다른 가치관으로 갈등이 많을 수 있습니다' },
    'ISTJ-ESFP': { score: -15, challenge: '생활 방식과 가치관의 큰 차이로 어려움이 있습니다' }
  };

  const combination = specialCombinations[`${mbti1}-${mbti2}`] || specialCombinations[`${mbti2}-${mbti1}`];
  if (combination) {
    score += combination.score;
    if (combination.strength) {
      strengths.push(combination.strength);
    }
    if (combination.challenge) {
      challenges.push(combination.challenge);
    }
  }

  // 점수 범위 조정 (0-100)
  score = Math.max(0, Math.min(100, score));

  // 관계 유형별 추가 분석
  let communication = '';
  let conflictResolution = '';

  if (relationshipType === 'romantic') {
    communication = '로맨틱한 관계에서는 서로의 사랑 언어를 이해하고 표현하는 것이 중요합니다';
    conflictResolution = '갈등 시 서로의 감정을 먼저 인정하고, 문제보다는 관계를 우선시하세요';
  } else if (relationshipType === 'friendship') {
    communication = '친구 관계에서는 서로의 관심사와 가치관을 존중하며 소통하세요';
    conflictResolution = '친구와의 갈등은 솔직한 대화와 상호 이해로 해결하세요';
  } else if (relationshipType === 'work') {
    communication = '직장에서는 업무 효율성을 위해 서로의 강점을 활용하세요';
    conflictResolution = '업무 갈등은 객관적 근거와 논리적 접근으로 해결하세요';
  } else {
    communication = '일반적인 관계에서는 서로의 차이점을 인정하고 존중하세요';
    conflictResolution = '갈등 시 서로의 입장을 이해하려 노력하고 타협점을 찾으세요';
  }

  return {
    score,
    analysis: {
      strengths,
      challenges,
      recommendations,
      communication,
      conflictResolution
    }
  };
}
