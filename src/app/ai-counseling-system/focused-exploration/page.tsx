'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Users, 
  Heart, 
  Briefcase, 
  Globe, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Target,
  TrendingUp,
  ArrowLeft
} from 'lucide-react'

interface SubCategory {
  id: string
  name: string
  description: string
  questions: Question[]
}

interface Question {
  id: string
  text: string
  type: 'single' | 'multiple' | 'scale'
  options?: string[]
  scaleLabels?: { min: string; max: string }
}

interface Category {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
  subCategories: SubCategory[]
}

const categories: Category[] = [
  {
    id: 'personal-psychology',
    name: '개인 심리 및 성장',
    description: '성격, 자아정체감, 잠재력, 삶의 의미',
    icon: Brain,
    color: 'bg-indigo-500',
    subCategories: [
      {
        id: 'personality-temperament',
        name: '성격 및 기질 탐색',
        description: '성격 유형, 기질적 특성, 내면 탐색, 부정적 사고 습관',
        questions: [
          {
            id: 'pt1',
            text: '나는 나의 강점과 약점을 잘 알고 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'pt2',
            text: '내 성격이 대인관계에 미치는 영향을 이해한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'pt3',
            text: '나는 내면의 목소리를 경청하는 시간을 갖는다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'pt4',
            text: '완벽주의로 인한 압박감을 느낀다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'identity-values',
        name: '자아정체감 및 가치관',
        description: '자아 정체성, 핵심 가치관, 자존감, 자기 리더십',
        questions: [
          {
            id: 'iv1',
            text: '나는 나 자신이 누구인지 명확히 알고 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'iv2',
            text: '내 핵심 가치관이 무엇인지 알고 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'iv3',
            text: '나는 나 자신을 사랑하고 존중한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'iv4',
            text: '나는 스스로의 삶을 주도적으로 이끌어간다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'potential-development',
        name: '잠재력 및 역량 개발',
        description: '목표 설정, 창의성, 학습 능력, 회복 탄력성',
        questions: [
          {
            id: 'pd1',
            text: '나는 구체적이고 실현 가능한 목표를 설정한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'pd2',
            text: '창의적으로 문제를 해결하는 능력이 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'pd3',
            text: '새로운 것을 배우는 것을 즐긴다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'pd4',
            text: '어려운 상황에서도 다시 일어서는 힘이 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'life-meaning',
        name: '삶의 의미 및 실존적 문제',
        description: '삶의 목적, 죽음과 상실, 영적 성장, 실존적 고독',
        questions: [
          {
            id: 'lm1',
            text: '내 삶에 의미와 목적을 느낀다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'lm2',
            text: '죽음과 상실에 대해 건강하게 대처한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'lm3',
            text: '영적 성장과 내면의 평화를 추구한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'lm4',
            text: '타인과의 깊이 있는 연결감을 느낀다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      }
    ]
  },
  {
    id: 'interpersonal-relations',
    name: '대인관계 및 사회적응',
    description: '가족, 연인, 친구, 사회적 기술',
    icon: Users,
    color: 'bg-pink-500',
    subCategories: [
      {
        id: 'family-relations',
        name: '가족 관계',
        description: '부모-자녀 갈등, 형제자매 관계, 가족 내 소통, 특수 가족 문제',
        questions: [
          {
            id: 'fr1',
            text: '가족과의 관계에서 만족감을 느낀다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'fr2',
            text: '가족 내 갈등을 잘 해결한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'fr3',
            text: '가족과 솔직한 소통을 한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'fr4',
            text: '가족 내 역할과 경계를 명확히 한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'romantic-relations',
        name: '연인 및 부부 관계',
        description: '관계 갈등, 이별 및 회복, 결혼 준비, 친밀감 및 신뢰',
        questions: [
          {
            id: 'rr1',
            text: '파트너와의 갈등을 건설적으로 해결한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'rr2',
            text: '파트너와 효과적으로 소통한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'rr3',
            text: '파트너와의 친밀감에 만족한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'rr4',
            text: '파트너를 신뢰하고 신뢰받는다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'friend-colleague',
        name: '친구 및 동료 관계',
        description: '직장 내 관계, 친구 관계, 사회적 고립, 집단 내 적응',
        questions: [
          {
            id: 'fc1',
            text: '직장에서 동료들과 원만한 관계를 유지한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'fc2',
            text: '친구들과 깊이 있는 관계를 맺는다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'fc3',
            text: '새로운 사람들과 쉽게 친해진다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'fc4',
            text: '집단 활동에서 적절한 역할을 수행한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'social-communication',
        name: '사회적 기술 및 소통',
        description: '의사소통 기술, 공감 능력, 자기표현, 네트워크 형성',
        questions: [
          {
            id: 'sc1',
            text: '상대방의 감정을 잘 이해하고 공감한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'sc2',
            text: '내 의견을 명확하고 자신 있게 표현한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'sc3',
            text: '갈등 상황에서 중재 역할을 잘 한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'sc4',
            text: '다양한 사람들과 긍정적 관계를 맺는다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      }
    ]
  },
  {
    id: 'emotional-mental-health',
    name: '정서 문제 및 정신 건강',
    description: '우울, 불안, 외상, 중독 문제',
    icon: Heart,
    color: 'bg-red-500',
    subCategories: [
      {
        id: 'depression-mood',
        name: '우울 및 기분 문제',
        description: '우울감, 기분 조절, 특정 상황 우울, 상실 및 애도',
        questions: [
          {
            id: 'dm1',
            text: '최근 우울하거나 무기력한 기분이 자주 든다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'dm2',
            text: '감정 기복을 잘 조절한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'dm3',
            text: '특정 계절이나 상황에서 우울감을 느낀다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'dm4',
            text: '상실 경험을 건강하게 극복한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'anxiety-stress',
        name: '불안 및 스트레스',
        description: '만성적 불안, 사회적 불안, 스트레스 관리, 강박적 사고',
        questions: [
          {
            id: 'as1',
            text: '일상생활에서 불안하거나 걱정이 많다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'as2',
            text: '사회적 상황에서 불안감을 느낀다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'as3',
            text: '스트레스를 효과적으로 관리한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'as4',
            text: '반복적인 생각이나 행동으로 고통받는다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'trauma-crisis',
        name: '외상 및 위기 개입',
        description: '급성 위기, PTSD, 폭력 피해, 복합 트라우마',
        questions: [
          {
            id: 'tc1',
            text: '예상치 못한 사고나 재난을 경험한 적이 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'tc2',
            text: '과거의 어려운 경험이 현재에도 영향을 미친다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'tc3',
            text: '폭력이나 학대를 경험한 적이 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'tc4',
            text: '안전감을 느끼고 일상생활에 집중할 수 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'addiction-impulse',
        name: '중독 및 충동 조절 문제',
        description: '물질 중독, 디지털 중독, 섭식 문제, 충동적 행동',
        questions: [
          {
            id: 'ai1',
            text: '알코올이나 담배 등 물질 사용에 문제가 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'ai2',
            text: '스마트폰이나 인터넷 사용을 조절하기 어렵다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'ai3',
            text: '음식에 대한 강박적 생각이나 행동이 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'ai4',
            text: '충동적인 행동을 잘 통제한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      }
    ]
  },
  {
    id: 'reality-life-management',
    name: '현실 문제 및 생활 관리',
    description: '진로, 경제, 건강, 일상생활',
    icon: Briefcase,
    color: 'bg-yellow-500',
    subCategories: [
      {
        id: 'career-work',
        name: '진로 및 직업 문제',
        description: '진로 탐색, 직무 만족, 직장 스트레스, 실업 및 전환',
        questions: [
          {
            id: 'cw1',
            text: '현재 직업이나 진로에 만족한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'cw2',
            text: '직장에서 스트레스를 잘 관리한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'cw3',
            text: '일과 삶의 균형을 잘 맞춘다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'cw4',
            text: '경력 개발에 적극적으로 참여한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'economic-finance',
        name: '경제 및 재정 문제',
        description: '재정 스트레스, 소비 습관, 재정 목표, 돈에 대한 신념',
        questions: [
          {
            id: 'ef1',
            text: '경제적으로 안정감을 느낀다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'ef2',
            text: '소비 습관을 잘 관리한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'ef3',
            text: '재정 목표를 설정하고 실행한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'ef4',
            text: '돈에 대한 건강한 태도를 가지고 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'health-body',
        name: '건강 및 신체 문제',
        description: '만성 질환, 신체 이미지, 생활 습관, 노화',
        questions: [
          {
            id: 'hb1',
            text: '전반적인 건강 상태가 양호하다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'hb2',
            text: '내 신체에 대해 긍정적으로 생각한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'hb3',
            text: '건강한 생활 습관을 실천한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'hb4',
            text: '신체 변화에 적응하고 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'daily-management',
        name: '일상생활 및 자기 관리',
        description: '시간 관리, 주거 환경, 생활 루틴, 수면 관리',
        questions: [
          {
            id: 'dm1',
            text: '시간을 효율적으로 관리한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'dm2',
            text: '정돈된 생활 공간을 유지한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'dm3',
            text: '규칙적인 생활 루틴을 가지고 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'dm4',
            text: '충분하고 질 좋은 수면을 취한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      }
    ]
  },
  {
    id: 'cultural-environmental',
    name: '문화 및 환경 적응',
    description: '다문화, 디지털 환경, 생애주기별 적응, 사회적 문제',
    icon: Globe,
    color: 'bg-teal-500',
    subCategories: [
      {
        id: 'multicultural',
        name: '다문화 적응',
        description: '이주 및 문화 충격, 다문화 가정, 해외 생활, 문화적 차별',
        questions: [
          {
            id: 'mc1',
            text: '새로운 문화에 잘 적응한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'mc2',
            text: '다양한 문화를 이해하고 수용한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'mc3',
            text: '문화적 차이로 인한 갈등을 잘 해결한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'mc4',
            text: '문화적 정체성을 건강하게 유지한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'digital-adaptation',
        name: '디지털 환경 적응',
        description: '디지털 피로감, 온라인 관계, AI 적응, 가상 세계',
        questions: [
          {
            id: 'da1',
            text: '디지털 기기 사용으로 인한 피로감을 느낀다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'da2',
            text: '온라인에서의 소통을 잘 관리한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'da3',
            text: 'AI와 기술 변화에 잘 적응한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'da4',
            text: '가상 세계와 현실의 균형을 잘 맞춘다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'lifecycle-adaptation',
        name: '생애주기별 적응',
        description: '청소년기, 청년기, 중년기, 노년기',
        questions: [
          {
            id: 'la1',
            text: '현재 생애 단계에 적절히 적응하고 있다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'la2',
            text: '생애 전환기를 잘 극복한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'la3',
            text: '나이에 따른 역할 변화에 적응한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'la4',
            text: '미래에 대한 계획을 세우고 준비한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      },
      {
        id: 'social-environment',
        name: '특정 사회·환경 문제',
        description: '사회적 변화, 불평등, 환경 문제, 비전통적 삶',
        questions: [
          {
            id: 'se1',
            text: '사회적 변화에 잘 적응한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'se2',
            text: '사회적 불평등에 대해 건강한 태도를 가진다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'se3',
            text: '환경 문제에 관심을 가지고 실천한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          },
          {
            id: 'se4',
            text: '다양한 삶의 방식을 존중한다.',
            type: 'scale',
            scaleLabels: { min: '전혀 아니다', max: '매우 그렇다' }
          }
        ]
      }
    ]
  }
]

export default function FocusedExplorationPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const currentQuestion = selectedSubCategory?.questions[currentQuestionIndex]
  const progress = selectedSubCategory ? ((currentQuestionIndex + 1) / selectedSubCategory.questions.length) * 100 : 0

  const handleAnswer = (value: number) => {
    if (!currentQuestion) return
    
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (currentQuestionIndex < selectedSubCategory!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setIsCompleted(true)
      setShowResults(true)
    }
  }

  const calculateSubCategoryScore = () => {
    if (!selectedSubCategory) return 0
    
    const totalScore = selectedSubCategory.questions.reduce((sum, question) => {
      return sum + (answers[question.id] || 0)
    }, 0)
    
    const maxScore = selectedSubCategory.questions.length * 5
    return Math.round((totalScore / maxScore) * 100)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '양호'
    if (score >= 60) return '보통'
    return '주의 필요'
  }

  if (showResults) {
    const score = calculateSubCategoryScore()
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 결과 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              집중 탐색 결과
            </h1>
            <p className="text-lg text-gray-600">
              {selectedSubCategory?.name} 영역 분석 결과
            </p>
          </motion.div>

          {/* 결과 카드 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-8 mb-8"
          >
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold mb-4 ${
                score >= 80 ? 'bg-green-100 text-green-800' :
                score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {getScoreLabel(score)}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedSubCategory?.name}
              </h2>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">종합 점수</span>
                  <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {score}점
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      score >= 80 ? 'bg-green-500' :
                      score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                {selectedSubCategory?.description}
              </p>
            </div>
          </motion.div>

          {/* 상세 분석 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-8 mb-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              상세 분석
            </h3>
            
            <div className="space-y-4">
              {selectedSubCategory?.questions.map((question, index) => {
                const answer = answers[question.id] || 0
                const answerText = answer === 1 ? '전혀 아니다' : 
                                 answer === 2 ? '아니다' : 
                                 answer === 3 ? '보통이다' : 
                                 answer === 4 ? '그렇다' : '매우 그렇다'
                
                return (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-gray-900 font-medium">
                        {question.text}
                      </p>
                      <span className={`text-sm font-semibold ${getScoreColor(answer * 20)}`}>
                        {answerText}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          answer >= 4 ? 'bg-green-500' :
                          answer >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(answer / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* 다음 단계 안내 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">
              다음 단계: 강점 및 자원 탐색
            </h2>
            <p className="text-green-100 mb-6">
              집중 탐색을 완료하셨습니다. 이제 어려움에 초점을 맞추는 것을 넘어서, 
              내담자님의 강점과 자원을 발견하는 단계로 넘어가겠습니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => window.location.href = '/ai-counseling-system/strength-discovery'}
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center"
              >
                강점 탐색 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setShowResults(false)
                  setSelectedCategory(null)
                  setSelectedSubCategory(null)
                  setCurrentQuestionIndex(0)
                  setAnswers({})
                  setIsCompleted(false)
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                다른 영역 탐색하기
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              집중 탐색 모듈
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              가장 관심 있는 영역을 선택하여 심층 분석을 진행하세요
            </p>
            <div className="flex items-center justify-center mb-8">
              <ArrowLeft 
                className="h-5 w-5 text-gray-400 mr-2 cursor-pointer"
                onClick={() => window.location.href = '/ai-counseling-system'}
              />
              <span className="text-sm text-gray-500">
                통합 자기 점검에서 가장 낮은 점수를 받은 영역을 우선적으로 추천합니다
              </span>
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const IconComponent = category.icon
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 border-gray-200 hover:border-blue-300"
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {category.subCategories.length}개 소분류
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                      탐색하기
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (!selectedSubCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <ArrowLeft 
                className="h-5 w-5 text-gray-400 mr-2 cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              />
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedCategory.name}
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              탐색하고 싶은 소분류를 선택하세요
            </p>
          </div>

          {/* 소분류 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedCategory.subCategories.map((subCategory, index) => (
              <motion.div
                key={subCategory.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 border-gray-200 hover:border-blue-300"
                onClick={() => setSelectedSubCategory(subCategory)}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {subCategory.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {subCategory.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {subCategory.questions.length}개 문항
                    </span>
                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                      시작하기
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ArrowLeft 
              className="h-5 w-5 text-gray-400 mr-2 cursor-pointer"
              onClick={() => setSelectedSubCategory(null)}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedSubCategory.name}
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            {selectedSubCategory.description}
          </p>
          
          {/* 진행률 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <motion.div
              className="bg-blue-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {currentQuestionIndex + 1} / {selectedSubCategory.questions.length} 문항
          </p>
        </div>

        {/* 질문 카드 */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion?.text}
            </h2>
            
            {/* 답변 옵션 */}
            <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="text-2xl font-bold text-gray-700 mb-1">
                    {value}
                  </div>
                  <div className="text-xs text-gray-500">
                    {value === 1 ? '전혀 아니다' : 
                     value === 2 ? '아니다' : 
                     value === 3 ? '보통이다' : 
                     value === 4 ? '그렇다' : '매우 그렇다'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 안내 문구 */}
        <div className="text-center text-sm text-gray-600">
          <p>
            솔직하게 답변해주세요. 정확한 분석을 위해 성의 있게 응답해주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}
