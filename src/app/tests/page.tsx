'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PsychologyTestsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('personal-growth');

  // AI CoCo v7.0 상담사 중심 소분류 데이터
  const subcategoryData = {
    'personal-growth': {
      title: '개인 심리 및 성장',
      description: '내담자의 성격, 정체성, 잠재력 등 개인 내적 요인을 심층적으로 탐색하고, 삶의 의미와 방향성을 찾아 통합적인 성장을 지원하는 영역입니다.',
      icon: '🌱',
      color: 'from-blue-500 to-cyan-500',
      subcategories: [
        {
          id: 'personality-temperament',
          title: '성격 및 기질 탐색',
          description: '개인의 성격 특성과 타고난 기질을 파악하여 자기 이해를 돕습니다.',
          theories: '성격 유형론(Type Theory), 특질 이론(Trait Theory), 정신분석 이론',
          relatedTests: 'MBTI, NEO-PI-R(Big Five), TCI, DISC, EPPS, SCT(문장완성검사)',
          items: [
            { 
              name: '성격 유형과 강점 분석', 
              desc: 'MBTI, 에니어그램 등 다각적 성격 분석', 
              time: '20분', 
              difficulty: '보통', 
              icon: '🎭',
              worryExamples: ['저는 어떤 사람인가요?', '제 성격의 장단점이 궁금해요', '왜 저는 늘 이런 식으로 행동할까요?', '다른 사람들은 저를 어떻게 볼까요?', '제 성격 때문에 힘든 부분이 있어요']
            },
            { 
              name: '타고난 기질과 행동 패턴 분석', 
              desc: '생물학적 기질과 행동 패턴 심층 분석', 
              time: '25분', 
              difficulty: '보통', 
              icon: '⚡',
              worryExamples: ['저는 왜 이렇게 예민할까요?', '새로운 도전을 두려워해요', '자꾸 충동적으로 결정해요', '끈기가 부족해서 고민이에요', '사람들 앞에서 말이 잘 안 나와요']
            }
          ]
        },
        {
          id: 'identity-values',
          title: '자아정체감 및 가치관',
          description: '자아 정체성과 개인의 가치관 체계를 탐색하여 일관된 자아상을 형성하도록 돕습니다.',
          theories: '발달 심리학(Erikson의 심리사회적 발달단계), 사회 정체성 이론, 인본주의 심리학',
          relatedTests: '자아정체감 검사, 자존감 척도(Rosenberg), SCT, TCI, 가치관 검사(Values Scale)',
          items: [
            { 
              name: '자아 정체성 확립과 자기 통합', 
              desc: '진정한 자아 발견과 일관된 정체성 형성', 
              time: '30분', 
              difficulty: '어려움', 
              icon: '🗺️',
              worryExamples: ['저는 누구인지 혼란스러워요', '다른 사람 눈치를 너무 많이 봐요', '진정한 제 모습이 뭘까요?', '앞으로 어떻게 살아가야 할지 모르겠어요', '제가 가진 잠재력을 발견하고 싶어요']
            },
            { 
              name: '가치관 및 삶의 동기 탐색', 
              desc: '개인의 핵심 가치관과 삶의 동력 발견', 
              time: '25분', 
              difficulty: '보통', 
              icon: '💎',
              worryExamples: ['무엇을 위해 사는지 모르겠어요', '제가 정말 원하는 게 뭘까요?', '일에 쉽게 흥미를 잃어요', '열심히 하는데 보람이 없어요', '어떤 가치를 중요하게 생각해야 할지 모르겠어요']
            }
          ]
        },
        {
          id: 'potential-development',
          title: '잠재력 및 역량 개발',
          description: '개인의 숨겨진 잠재력을 발굴하고 역량을 체계적으로 개발할 수 있는 방향을 제시합니다.',
          theories: '인지 심리학, 다중지능 이론, 정보처리 이론, 긍정 심리학',
          relatedTests: '웩슬러 지능검사(WAIS/WISC), STRONG 직업흥미검사, 다중지능검사, 창의성 검사(TTCT)',
          items: [
            { 
              name: '인지 능력과 학습 전략 최적화', 
              desc: '개인 맞춤형 학습 방법과 인지 능력 향상', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🧠',
              worryExamples: ['공부하는 게 너무 힘들어요', '아무리 해도 성적이 안 올라요', '집중력이 너무 부족해요', '어떻게 하면 더 효율적으로 공부할 수 있을까요?', '암기가 너무 어려워요']
            },
            { 
              name: '적성 및 재능 발굴', 
              desc: '숨겨진 재능과 적성 영역 탐색', 
              time: '30분', 
              difficulty: '보통', 
              icon: '💫',
              worryExamples: ['제가 잘하는 게 뭔지 모르겠어요', '어떤 분야에 재능이 있을까요?', '새로운 것을 배우고 싶은데 뭘 해야 할지…', '제 잠재력을 최대한 발휘하고 싶어요', '현재 일이 적성에 안 맞는 것 같아요']
            },
            { 
              name: '리더십 및 의사결정 역량 강화', 
              desc: '리더십 스타일 분석과 의사결정 능력 향상', 
              time: '35분', 
              difficulty: '어려움', 
              icon: '👑',
              worryExamples: ['리더 역할을 잘하고 싶어요', '결정하는 게 너무 어려워요', '다른 사람을 설득하는 게 힘들어요', '책임감이 부담스러워요', '팀을 효과적으로 이끌고 싶어요']
            }
          ]
        },
        {
          id: 'life-meaning',
          title: '삶의 의미 및 실존적 문제',
          description: '삶의 근본적인 의미를 탐색하고 실존적 고민을 해결하여 충만한 삶을 살아갈 수 있도록 지원합니다.',
          theories: '실존주의 심리학, 인본주의 심리학, 의미치료(Logotherapy), 초개인 심리학',
          relatedTests: '삶의 의미 척도(PIL), 삶의 만족도 척도, 영성 척도, 도덕 판단력 검사(DIT)',
          items: [
            { 
              name: '존재론적 고민과 삶의 의미 탐색', 
              desc: '삶의 궁극적 의미와 존재 이유 탐색', 
              time: '40분', 
              difficulty: '어려움', 
              icon: '🌟',
              worryExamples: ['사는 게 무슨 의미가 있는지 모르겠어요', '인생의 목표가 사라졌어요', '모든 것이 무의미하게 느껴져요', '나는 왜 존재할까?', '삶의 궁극적인 의미를 찾고 싶어요']
            },
            { 
              name: '죽음 불안과 상실 애도', 
              desc: '죽음에 대한 불안과 상실 경험의 치유', 
              time: '35분', 
              difficulty: '어려움', 
              icon: '🕊️',
              worryExamples: ['죽음이 너무 두려워요', '내 삶이 곧 끝날 것 같아요', '사랑하는 사람의 죽음을 받아들이기 힘들어요', '사후 세계에 대해 궁금해요', '존엄한 죽음을 맞이하고 싶어요']
            },
            { 
              name: '영적 성장과 내면 탐색', 
              desc: '내면의 평화와 영적 성숙을 위한 탐색', 
              time: '30분', 
              difficulty: '보통', 
              icon: '🧘',
              worryExamples: ['내면의 평화를 얻고 싶어요', '영적인 경험을 해보고 싶어요', '종교에 대한 회의감이 들어요', '명상이나 수련을 통해 자신을 돌아보고 싶어요', '삶의 초월적인 면을 이해하고 싶어요']
            },
            { 
              name: '윤리적 딜레마와 도덕적 갈등', 
              desc: '도덕적 가치관 정립과 윤리적 의사결정', 
              time: '30분', 
              difficulty: '어려움', 
              icon: '⚖️',
              worryExamples: ['옳다고 생각하는 것과 현실이 달라 갈등해요', '윤리적으로 올바른 선택이 무엇인지 모르겠어요', '내 결정이 타인에게 미칠 영향이 두려워요', '양심에 어긋나는 일을 해야 할 상황이에요', '도덕적 신념을 지키기가 너무 힘들어요']
            }
          ]
        }
      ]
    },
    'relationships-social': {
      title: '대인관계 및 사회적응',
      description: '가족, 연인, 친구, 동료 등 다양한 관계에서의 갈등을 해결하고, 건강한 소통과 사회적 기술을 통해 긍정적인 관계를 형성하도록 지원하는 영역입니다.',
      icon: '🤝',
      color: 'from-green-500 to-emerald-500',
      subcategories: [
        {
          id: 'family-relations',
          title: '가족 관계',
          description: '원가족 문제부터 현재 가족 관계까지 다양한 가족 갈등을 해결합니다.',
          theories: '가족 체계 이론(Bowen, Minuchin), 애착 이론, 발달 심리학',
          relatedTests: '가족화(KFD), 가계도(Genogram), 부모양육태도검사(PAT), 결혼만족도척도(K-MSI)',
          items: [
            { 
              name: '원가족 문제와 가족 갈등 해결', 
              desc: '부모, 형제자매와의 관계 개선 및 갈등 해결', 
              time: '30분', 
              difficulty: '보통', 
              icon: '👨‍👩‍👧‍👦',
              worryExamples: ['부모님과 대화가 안 통해요', '형제자매와 자주 다퉈요', '시댁/처가 갈등이 너무 심해요', '가족과의 관계가 너무 힘들어요', '가족이 저를 이해해주지 않아요', '부모님의 지나친 간섭이 힘들어요']
            }
          ]
        },
        {
          id: 'romantic-relations',
          title: '연인 및 부부 관계',
          description: '연애 관계의 갈등부터 결혼 생활의 어려움까지 친밀한 관계의 문제를 다룹니다.',
          theories: '애착 이론(Bowlby, Ainsworth), 사랑의 삼각형 이론(Sternberg), 투자 모델',
          relatedTests: '성인애착유형 검사(ECR-R), 결혼만족도척도(ENRICH, MSI), 성격유형검사(MBTI, NEO)',
          items: [
            { 
              name: '연인 관계 갈등과 애착 문제', 
              desc: '연애 갈등 해결과 건강한 애착 관계 형성', 
              time: '25분', 
              difficulty: '보통', 
              icon: '💕',
              worryExamples: ['연인과 계속 싸워요', '사랑받고 있는지 모르겠어요', '애인에게 너무 집착해요', '자꾸 상처 주는 말을 해요', '헤어진 후유증이 너무 커요', '연애가 너무 피곤하게 느껴져요']
            },
            { 
              name: '이성 관계와 데이팅 전략', 
              desc: '건강한 이성 관계 시작과 발전 전략', 
              time: '20분', 
              difficulty: '쉬움', 
              icon: '💘',
              worryExamples: ['이성을 어떻게 만나야 할지 모르겠어요', '소개팅이 너무 힘들어요', '썸 단계에서 항상 끝나요', '고백할 용기가 없어요', '이성에게 인기가 없어요']
            }
          ]
        },
        {
          id: 'friend-colleague',
          title: '친구 및 동료 관계',
          description: '친구, 직장 동료와의 관계에서 발생하는 갈등과 소통 문제를 해결합니다.',
          theories: '사회교환 이론, 공정성 이론, 애착 이론',
          relatedTests: '대인관계문제 검사(KIIP), 사회성숙도 검사(SMS), 의사소통유형 검사',
          items: [
            { 
              name: '친구·동료 관계 갈등과 대처', 
              desc: '친구, 동료와의 갈등 해결 및 관계 개선', 
              time: '25분', 
              difficulty: '보통', 
              icon: '👥',
              worryExamples: ['친구들과 자주 싸워요', '새로운 친구 사귀기가 어려워요', '직장 동료와 관계가 불편해요', '왕따를 당하는 것 같아요', '사람들이 저를 싫어하는 것 같아요']
            }
          ]
        },
        {
          id: 'social-communication',
          title: '사회적 기술 및 소통',
          description: '효과적인 의사소통과 사회적 기술 향상으로 원만한 인간관계를 형성합니다.',
          theories: '의사소통 이론, 인지행동 이론, 사회기술훈련(SST), 조직 심리학',
          relatedTests: '의사소통 능력 검사, 자기표현 척도(Assertiveness Scale), 갈등해결방식 검사',
          items: [
            { 
              name: '사회성 및 의사소통 기술 향상', 
              desc: '효과적인 소통 능력과 사회적 기술 개발', 
              time: '20분', 
              difficulty: '쉬움', 
              icon: '💬',
              worryExamples: ['낯선 사람들과 대화하기 힘들어요', '제 의견을 잘 표현 못 해요', '상대방 말을 잘 이해 못 하는 것 같아요', '어색한 분위기를 못 견뎌요', '발표하는 게 너무 두려워요']
            },
            { 
              name: '조직 내 소통과 팀워크 증진', 
              desc: '직장 내 갈등 해결과 효과적인 협업 능력', 
              time: '30분', 
              difficulty: '보통', 
              icon: '⚡',
              worryExamples: ['직장 내 갈등이 너무 힘들어요', '팀원들과 소통이 잘 안 돼요', '리더와 관계가 어려워요', '불합리한 대우를 받는 것 같아요', '팀원 간 협력이 안 돼요']
            }
          ]
        }
      ]
    },
    'emotional-mental': {
      title: '정서 문제 및 정신 건강',
      description: '우울, 불안, 스트레스, 트라우마 등 다양한 심리적 어려움을 전문적으로 진단하고, 건강한 정서 조절과 마음의 안정을 되찾도록 지원하는 영역입니다.',
      icon: '💚',
      color: 'from-purple-500 to-pink-500',
      subcategories: [
        {
          id: 'depression-mood',
          title: '우울 및 기분 문제',
          description: '우울감, 무기력감, 분노 조절 등 기분과 관련된 문제를 다룹니다.',
          theories: '인지행동 이론(CBT - Beck의 인지삼제), 행동 활성화, 정신분석 이론',
          relatedTests: 'BDI(벡 우울 척도), CES-D, SCL-90-R(우울 척도), 상태-특성 분노 표현 척도(STAXI)',
          items: [
            { 
              name: '우울감 및 무기력감 극복', 
              desc: 'PHQ-9 기반 우울 증상 모니터링 및 회복', 
              time: '20분', 
              difficulty: '쉬움', 
              icon: '😔',
              worryExamples: ['만사가 귀찮고 의욕이 없어요', '계속 우울하고 슬퍼요', '아무것도 하고 싶지 않아요', '삶의 의미를 못 찾겠어요', '불면증 때문에 힘들어요', '아침에 일어나는 것 자체가 고통스러워요']
            },
            { 
              name: '분노 조절 및 충동성 관리', 
              desc: '분노와 충동적 행동 패턴 조절 훈련', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🔥',
              worryExamples: ['쉽게 화를 내고 후회해요', '욱하는 성격 때문에 힘들어요', '분노를 조절하기 어려워요', '충동적으로 행동해서 손해를 봐요', '화를 참는 게 너무 힘들어요']
            }
          ]
        },
        {
          id: 'anxiety-stress',
          title: '불안 및 스트레스',
          description: '불안 장애, 공황 증상, 스트레스 관리 등 불안과 관련된 문제를 해결합니다.',
          theories: '인지행동 이론(CBT), 노출 치료, 스트레스-대처 이론(Lazarus & Folkman)',
          relatedTests: 'BAI(벡 불안 척도), STAI(상태-특성 불안 척도), 스트레스 척도(PSS), 회복탄력성 지수(KRQ-53)',
          items: [
            { 
              name: '불안, 걱정, 공황 증상 완화', 
              desc: 'GAD-7 기반 불안 관리 솔루션', 
              time: '20분', 
              difficulty: '보통', 
              icon: '😰',
              worryExamples: ['늘 불안하고 초조해요', '사소한 일에도 걱정이 많아요', '가슴이 답답하고 숨쉬기 힘들어요', '갑자기 공황 발작이 와요', '시험이나 발표 때 너무 긴장해요']
            },
            { 
              name: '스트레스 관리와 회복탄력성 증진', 
              desc: '스트레스 대처 능력 강화 프로그램', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🛡️',
              worryExamples: ['스트레스를 너무 많이 받아요', '스트레스 해소법을 모르겠어요', '작은 일에도 쉽게 무너져요', '번아웃이 온 것 같아요', '스트레스 때문에 몸이 아파요']
            }
          ]
        },
        {
          id: 'trauma-crisis',
          title: '외상 및 위기 개입',
          description: 'PTSD, 트라우마, 위기 상황에 대한 전문적인 개입과 치유를 제공합니다.',
          theories: '외상 이론, 인지처리치료(CPT), 안구운동 민감소실 및 재처리 요법(EMDR)',
          relatedTests: '외상후 스트레스 장애 척도(PCL-5), SCL-90-R, 로르샤흐 검사',
          items: [
            { 
              name: '트라우마와 외상 후 스트레스(PTSD) 치유', 
              desc: 'PTSD 증상 관리와 회복 프로그램', 
              time: '40분', 
              difficulty: '어려움', 
              icon: '🆘',
              worryExamples: ['끔찍한 기억이 계속 떠올라요', '사고 후 잠을 잘 수가 없어요', '특정 장소나 상황을 피하게 돼요', '외상 후 감정 조절이 안 돼요', '세상이 안전하지 않다고 느껴져요']
            }
          ]
        },
        {
          id: 'addiction-impulse',
          title: '중독 및 충동 조절 문제',
          description: '물질 및 행위 중독, 성인 ADHD 등 충동 조절의 어려움을 해결합니다.',
          theories: '중독의 뇌과학(보상회로), 행동주의 심리학, 12단계 프로그램, 신경발달장애 이론',
          relatedTests: '중독 선별 검사(AUDIT-K, DAST), 성인 ADHD 자가보고 척도(K-ASRS), 종합주의력검사(CAT)',
          items: [
            { 
              name: '물질 및 행위 중독 문제 해결', 
              desc: '알코올, 게임, 쇼핑 등 다양한 중독 문제 해결', 
              time: '30분', 
              difficulty: '어려움', 
              icon: '🔗',
              worryExamples: ['술(담배)을 끊고 싶은데 안 돼요', '인터넷/게임에 너무 중독됐어요', '도박에서 헤어나올 수 없어요', '특정 행동에 대한 통제가 안 돼요', '음식에 대한 강한 욕구가 힘들어요']
            },
            { 
              name: '성인 ADHD 및 집중력 문제', 
              desc: 'ADHD 증상 평가와 관리 방안', 
              time: '30분', 
              difficulty: '보통', 
              icon: '🎯',
              worryExamples: ['집중을 잘 못하고 산만해요', '자꾸 중요한 걸 잊어버려요', '일을 시작하기가 너무 힘들어요', '한 가지 일을 끝까지 못해요', '쉽게 지루해하고 다른 일을 찾아요']
            }
          ]
        },
        {
          id: 'self-esteem',
          title: '자존감 및 자기 문제',
          description: '낮은 자존감, 자기 비난, 완벽주의 등 자기 자신과 관련된 문제를 다룹니다.',
          theories: '인본주의 심리학(Rogers), 인지행동 이론(CBT), 자기 자비(Self-Compassion) 이론',
          relatedTests: '자존감 척도(Rosenberg), 자기효능감 척도, 역기능적 태도 척도(DAS)',
          items: [
            { 
              name: '낮은 자존감과 자기 비난 극복', 
              desc: '건강한 자아상 형성 지원', 
              time: '30분', 
              difficulty: '보통', 
              icon: '💪',
              worryExamples: ['제가 너무 한심하게 느껴져요', '남들과 비교해서 열등감이 심해요', '제 자신을 사랑할 수가 없어요', '계속 자책하고 후회해요', '저는 실패작이라고 생각해요']
            }
          ]
        }
      ]
    },
    'reality-life': {
      title: '현실 문제 및 생활 관리',
      description: '진로, 직업, 경제, 건강, 법률 등 내담자의 실질적인 삶의 문제를 해결하고, 건강한 생활 습관과 관리 능력을 향상시키도록 지원하는 영역입니다.',
      icon: '🔧',
      color: 'from-orange-500 to-red-500',
      subcategories: [
        {
          id: 'career-work',
          title: '진로 및 직업 문제',
          description: '진로 선택부터 직장 생활의 어려움까지 직업과 관련된 모든 문제를 다룹니다.',
          theories: '직업 발달 이론(Super, Holland), 사회인지 진로 이론(SCCT), 직무요구-자원 모델(JD-R Model)',
          relatedTests: 'STRONG, Holland, 진로준비도 검사, 소진척도(MBI), 직무 스트레스 검사(KOSS)',
          items: [
            { 
              name: '진로 탐색과 직업 선택', 
              desc: '적성과 흥미에 맞는 진로 방향 탐색', 
              time: '30분', 
              difficulty: '보통', 
              icon: '🧭',
              worryExamples: ['어떤 직업을 선택해야 할지 모르겠어요', '제게 맞는 진로가 있을까요?', '진로를 결정했는데 확신이 없어요', '취업 준비가 너무 막막해요', '이직을 고민 중인데 어떻게 해야 할까요?']
            },
            { 
              name: '직무 스트레스와 번아웃', 
              desc: '직장 번아웃 위험도 측정과 예방', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🔥',
              worryExamples: ['업무량이 너무 많아 소진 상태예요', '감정 노동으로 인해 정신적으로 지쳤어요', '성과 압박 때문에 매일이 살얼음판 같아요', '직장에서의 역할이 너무 모호해서 스트레스 받아요']
            },
            { 
              name: '창업 스트레스와 실패 두려움', 
              desc: '창업 과정의 심리적 부담 관리', 
              time: '30분', 
              difficulty: '어려움', 
              icon: '🏢',
              worryExamples: ['사업 실패에 대한 두려움으로 잠을 못 자요', '모든 책임을 혼자 져야 한다는 압박감이 커요', '직원 관리 문제가 가장 힘들어요', '자금 압박 때문에 극심한 스트레스를 받아요']
            }
          ]
        },
        {
          id: 'economic-finance',
          title: '경제 및 재정 문제',
          description: '재정 스트레스, 부채 문제, 소비 패턴 등 경제적 어려움을 심리적 관점에서 해결합니다.',
          theories: '행동 경제학, 사회비교 이론, 스트레스 이론, 학습된 무기력 이론',
          relatedTests: '재정 스트레스 척도, 소비성향 검사, 투자자 성향 분석, 충동성 척도',
          items: [
            { 
              name: '재정 스트레스와 부채 문제', 
              desc: '경제적 부담이 정신건강에 미치는 영향 관리', 
              time: '25분', 
              difficulty: '보통', 
              icon: '💳',
              worryExamples: ['학자금 대출 상환 압박감 때문에 미래가 안 보여요', '카드값 돌려막기로 하루하루를 버티고 있어요', '주택 대출 이자가 너무 부담스러워요', '가족/친구에게 빌린 돈 때문에 관계가 멀어졌어요']
            },
            { 
              name: '소비·투자 심리와 돈 습관', 
              desc: '소비 패턴과 투자 성향 분석', 
              time: '25분', 
              difficulty: '보통', 
              icon: '💰',
              worryExamples: ['스트레스를 받으면 충동구매를 해요', '주식/코인 투자 실패로 무기력감에 빠졌어요', '남들에게 잘 보이기 위해 무리해서 소비해요', '돈에 대한 강박 때문에 구두쇠 소리를 들어요']
            },
            { 
              name: '미래 불안과 경제적 안정', 
              desc: '경제적 미래에 대한 불안 수준 평가', 
              time: '20분', 
              difficulty: '쉬움', 
              icon: '📈',
              worryExamples: ['월급이 너무 적어서 미래가 불안해요', '프리랜서라 수입이 너무 불안정해요', '결혼/출산을 경제적인 이유로 포기하고 싶어요', '노후 준비가 전혀 되어있지 않아 두려워요']
            }
          ]
        },
        {
          id: 'health-body',
          title: '건강 및 신체 문제',
          description: '신체 이미지, 건강 불안, 만성 질환 등 건강과 관련된 심리적 문제를 다룹니다.',
          theories: '인지행동 이론(CBT), 건강 심리학, 스트레스-대처 이론, 건강 신념 모델',
          relatedTests: '신체상 척도, 건강염려증 척도, 건강관련 삶의 질 척도(HRQoL), 섭식태도 검사(EAT-26)',
          items: [
            { 
              name: '신체 이미지와 외모 불만', 
              desc: '외모에 대한 극심한 불만 해결', 
              time: '20분', 
              difficulty: '쉬움', 
              icon: '💄',
              worryExamples: ['제 외모에 대한 극심한 불만이 있어요', '노화로 인한 외모 변화를 받아들이기 힘들어요', '다이어트 요요 현상 때문에 자괴감이 들어요', 'SNS 속 보정된 이미지와 제 몸을 비교하게 돼요']
            },
            { 
              name: '섭식 문제와 건강한 식습관', 
              desc: '폭식/거식 경향 및 다이어트 강박 해결', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🍎',
              worryExamples: ['폭식/거식 경향이 있어요', '다이어트 강박 때문에 힘들어요', '건강한 음식에 대한 강박이 있어요', '스트레스를 받으면 폭식하게 돼요']
            },
            { 
              name: '만성 질환과 심리적 적응', 
              desc: '만성 질환으로 인한 심리적 어려움 지원', 
              time: '30분', 
              difficulty: '어려움', 
              icon: '🏥',
              worryExamples: ['만성 질환으로 인해 우울해요', '가족이 희귀병 진단을 받았어요', '장기적인 치료 과정에 지쳤어요', '겉으로 티 나지 않는 질병이라 꾀병으로 오해받아요']
            },
            { 
              name: '건강염려증과 의료 불안', 
              desc: '사소한 건강 문제에 대한 과도한 불안 완화', 
              time: '20분', 
              difficulty: '보통', 
              icon: '🩺',
              worryExamples: ['사소한 건강 문제에도 죽을 것 같은 불안감을 느껴요', '병원 방문이나 치료에 대한 공포가 있어요', '만성 통증 때문에 삶의 질이 너무 떨어졌어요', '유전병에 대한 막연한 두려움이 커요']
            }
          ]
        }
      ]
    },
    'culture-environment': {
      title: '문화 및 환경 적응',
      description: '다문화, 디지털 환경, 생애주기 등 개인이 속한 특별한 문화적, 환경적 맥락에서의 적응 문제를 진단하고, 건강한 정체성 통합과 적응을 지원하는 영역입니다.',
      icon: '🌍',
      color: 'from-indigo-500 to-purple-500',
      subcategories: [
        {
          id: 'multicultural',
          title: '다문화 적응',
          description: '다문화 가정, 이민자, 유학생 등의 문화 적응 문제를 전문적으로 지원합니다.',
          theories: '문화 충격 이론(Oberg의 U-Curve Model), 문화변용 스트레스 모델, 소수자 스트레스 모델',
          relatedTests: '문화적응 스트레스 척도(SACC), 다문화 청소년 정체성 척도(MEIM), 외상 척도',
          items: [
            { 
              name: '초기 정착과 문화 충격', 
              desc: '한국 문화 적응과 언어 소통 문제 해결', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🌏',
              worryExamples: ['한국어가 서툴러 오해를 자주 받아요', '한국의 빨리빨리 문화에 적응하기 힘들어요', '회식, 명절 등 한국의 집단주의 문화가 낯설고 불편해요', '본국의 가치관과 한국의 가치관 사이에서 혼란스러워요']
            },
            { 
              name: '사회적 편견과 차별 경험', 
              desc: '차별 경험으로 인한 심리적 상처 치유', 
              time: '30분', 
              difficulty: '어려움', 
              icon: '🩹',
              worryExamples: ['단지 외국인이라는 이유만으로 무시당하는 기분이에요', '출신 국가에 대한 편견 어린 시선 때문에 힘들어요', '취업 과정에서 보이지 않는 차별을 겪었어요', '너희 나라로 돌아가라는 말을 들었어요']
            },
            { 
              name: '다문화 가족 관계와 갈등', 
              desc: '국제부부 문화 갈등 진단 및 해결', 
              time: '30분', 
              difficulty: '보통', 
              icon: '👨‍👩‍👧‍👦',
              worryExamples: ['배우자와의 가치관 차이로 자주 싸워요', '시댁/처가에서 제 문화를 존중해주지 않아요', '배우자가 제 모국어를 배우려는 노력을 하지 않아 서운해요', '가정 폭력을 당하고 있지만 신고하면 추방될까 봐 두려워요']
            },
            { 
              name: '이중문화 정체성과 소속감', 
              desc: '이중문화 정체성 맵핑과 통합', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🎭',
              worryExamples: ['한국에서도, 부모님 나라에서도 저는 이방인 같아요', '저는 어느 나라 사람일까요? 정체성이 혼란스러워요', '두 문화 사이에서 균형을 잡기가 힘들어요', '어디에도 온전히 속하지 못하는 느낌이에요']
            }
          ]
        },
        {
          id: 'digital-adaptation',
          title: '디지털 환경 적응',
          description: '디지털 시대의 새로운 심리적 문제들을 분석하고 해결책을 제시합니다.',
          theories: '사회비교 이론, 중독의 뇌과학, 사회 심리학, 불확실성 감소 이론',
          relatedTests: 'SNS 중독 경향성 척도, 스마트폰 중독 척도, 사회비교 경향성 척도',
          items: [
            { 
              name: '온라인 자아와 정체성 혼란', 
              desc: 'SNS 비교·자존감 분석 및 디지털 정체성 맵핑', 
              time: '20분', 
              difficulty: '쉬움', 
              icon: '📱',
              worryExamples: ['다른 사람의 SNS를 보면 제 삶이 초라하게 느껴져요', '좋아요 수에 집착하게 돼요', '현실의 나와 온라인의 내가 너무 달라 혼란스러워요', '익명성에 기대어 평소와 다른 행동을 하게 돼요']
            },
            { 
              name: '사이버불링과 디지털 관계 문제', 
              desc: '사이버 폭력 트라우마 분석 및 회복', 
              time: '30분', 
              difficulty: '보통', 
              icon: '🛡️',
              worryExamples: ['악플 때문에 우울증이 생겼어요', '단톡방에서 은밀하게 따돌림을 당하고 있어요', '수많은 단톡방과 알림에 지쳤어요', '데이팅 앱에서 가벼운 만남만 반복하게 돼요']
            },
            { 
              name: '디지털 과의존과 정보 과부하', 
              desc: '디지털 과의존도 분석 및 정보 분별력 진단', 
              time: '15분', 
              difficulty: '쉬움', 
              icon: '📱',
              worryExamples: ['스마트폰이 없으면 불안해요(노모포비아)', '유튜브, 숏폼 콘텐츠를 보다가 밤을 새워요', '수많은 정보 때문에 무엇을 믿어야 할지 모르겠어요', '가짜뉴스에 쉽게 선동되는 것 같아요']
            }
          ]
        },
        {
          id: 'lifecycle-adaptation',
          title: '생애주기별 적응',
          description: '아동기부터 노년기까지 각 생애주기별 발달과업과 위기를 지원합니다.',
          theories: '발달 심리학(Piaget, Erikson), 애착 이론, 가족 생활주기 이론, 노년학',
          relatedTests: '애착유형검사, 대학생활적응 척도, 중년기 위기 척도, 노인 우울 척도(GDS)',
          items: [
            { 
              name: '아동·청소년기 발달과업과 위기', 
              desc: '아동·청소년 성장 분석 및 학교 적응', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🧒',
              worryExamples: ['아이가 저와 안정적인 애착을 형성했는지 궁금해요', '아이가 학교에서 따돌림을 당하는 것 같아요', '자녀가 장래 희망이 없어서 걱정이에요', '성적 압박감 때문에 너무 힘들어요']
            },
            { 
              name: '청년기 발달과업과 위기', 
              desc: '대학 적응, 사회초년생 스트레스, 결혼 준비', 
              time: '25분', 
              difficulty: '보통', 
              icon: '👨‍🎓',
              worryExamples: ['전공이 저와 맞지 않는 것 같아요', '첫 직장생활에 적응하기 너무 힘들어요', '결혼 생활에 대한 막연한 두려움이 있어요', '산후우울증을 겪고 있어요']
            },
            { 
              name: '중년기 발달과업과 위기', 
              desc: '중년기 위기 진단 및 역할 재정립', 
              time: '30분', 
              difficulty: '어려움', 
              icon: '👨‍💼',
              worryExamples: ['샌드위치 세대로서의 역할 부담이 너무 커요', '갱년기 증상으로 감정 조절이 힘들어요', '자녀가 독립한 후 극심한 허무함과 외로움을 느껴요(빈 둥지 증후군)']
            },
            { 
              name: '노년기 발달과업과 위기', 
              desc: '은퇴 적응, 건강 불안, 죽음 준비', 
              time: '25분', 
              difficulty: '보통', 
              icon: '👴',
              worryExamples: ['은퇴 후 역할 상실감으로 무기력해요', '건강 악화와 죽음에 대한 두려움이 커요', '황혼 이혼을 고민하고 있어요', '존엄한 삶의 마무리를 준비하고 싶어요']
            }
          ]
        },
        {
          id: 'social-environment',
          title: '특정 사회·환경 문제',
          description: '학교 부적응, 사회적 소수자, 환경 불안 등 특별한 사회적 맥락의 문제를 다룹니다.',
          theories: '교육 심리학, 소수자 스트레스 모델, 환경 심리학, 젠더 이론',
          relatedTests: '학교생활적응 척도, 자아정체감 검사, 생태 불안 척도(Eco-Anxiety Scale)',
          items: [
            { 
              name: '학교 및 교육 시스템 부적응', 
              desc: '학교폭력, 학업 스트레스, 교육 부적응 해결', 
              time: '25분', 
              difficulty: '보통', 
              icon: '🏫',
              worryExamples: ['학교폭력 피해로 등교를 거부하고 있어요', '시험 기간만 되면 몸이 아파요', '사교육에 대한 압박감이 너무 심해요', '자퇴를 고민 중인데 막막해요', '성적 지상주의 교육에 회의감을 느껴요']
            },
            { 
              name: '사회적 소수자로서의 어려움', 
              desc: '성소수자 정체성 지원 및 사회적 편견 극복', 
              time: '30분', 
              difficulty: '어려움', 
              icon: '🏳️‍🌈',
              worryExamples: ['성 정체성 때문에 고민이에요', '커밍아웃이 두려워요', '사람들의 시선이 힘들어요', '성소수자로서의 삶에 대한 조언이 필요해요', '전환(transition) 과정에서 심리적 어려움을 겪고 있어요']
            },
            { 
              name: '기후변화와 환경 불안', 
              desc: '환경 문제로 인한 미래 불안과 생태 우울 완화', 
              time: '20분', 
              difficulty: '쉬움', 
              icon: '🌍',
              worryExamples: ['기후 위기 뉴스를 보면 미래에 대한 희망이 사라져요', '미세먼지, 오염 때문에 건강이 나빠질까 봐 걱정돼요', '자연재해에 대한 불안감이 커요', '환경을 파괴하는 소비 생활에 죄책감을 느껴요']
            }
          ]
        }
      ]
    }
  };

  const currentData = subcategoryData[selectedCategory as keyof typeof subcategoryData];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* 카테고리 선택 탭 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {Object.entries(subcategoryData).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === key
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className="text-xl">{data.icon}</span>
                <span>{data.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 선택된 카테고리 내용 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          {/* 카테고리 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${currentData.color} flex items-center justify-center text-3xl`}>
                {currentData.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{currentData.title}</h1>
                <p className="text-gray-300 text-lg mt-2">{currentData.description}</p>
              </div>
            </div>
          </div>

          {/* 중분류 섹션들 */}
          <div className="space-y-8">
            {currentData.subcategories.map((subcategory) => (
              <div key={subcategory.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-white mb-2">{subcategory.title}</h2>
                  <p className="text-gray-300 mb-3">{subcategory.description}</p>
                  
                  {/* 심리 이론 및 연관 검사 정보 */}
                  <div className="bg-black/30 rounded-lg p-4 mb-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-cyan-400 mb-2">🧠 기본 심리 이론</h4>
                        <p className="text-xs text-gray-300">{subcategory.theories}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-2">📋 연관 기존 검사</h4>
                        <p className="text-xs text-gray-300">{subcategory.relatedTests}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 소분류 아이템들 */}
                <div className="grid grid-cols-1 gap-4">
                  {subcategory.items.map((item, index) => (
                    <div
                      key={index}
                      className="group bg-black/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:bg-black/90 hover:border-gray-600/50 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-3">{item.desc}</p>
                          
                          {/* 고민 예시 */}
                          <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                            <h5 className="text-xs font-semibold text-yellow-400 mb-2">💭 실제 내담자 고민 예시</h5>
                            <div className="flex flex-wrap gap-1">
                              {item.worryExamples.slice(0, 5).map((worry, idx) => (
                                <span key={idx} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">
                                  "{worry}"
                                </span>
                              ))}
                              {item.worryExamples.length > 5 && (
                                <span className="text-xs text-gray-400">...외 {item.worryExamples.length - 5}개</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.difficulty === '쉬움' ? 'bg-green-500/20 text-green-400' :
                            item.difficulty === '보통' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {item.difficulty}
                          </span>
                          <span className="text-gray-400 text-sm">{item.time}</span>
                        </div>
                        <Link
                          href={`/tests/${subcategory.id}/${item.name.toLowerCase().replace(/[·\s]/g, '-')}`}
                          className="flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors"
                        >
                          <span className="text-sm font-medium">시작하기</span>
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}