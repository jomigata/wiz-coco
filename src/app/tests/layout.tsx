'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>('');
  const [pageTitle, setPageTitle] = useState<string>('심리검사 대시보드');

  // AI CoCo 심리검사 메뉴 카테고리 정의 (v6.0)
  const testMenuCategories = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      href: '/tests',
      subItems: []
    },
    {
      id: 'growth-potential',
      label: 'AI 성장 잠재력 분석',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      subItems: [
        { id: 'self-analysis', label: 'AI 자아 심층 분석', href: '/tests/self-analysis', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'capability-coaching', label: 'AI 역량 개발 코칭', href: '/tests/capability-coaching', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' }
      ]
    },
    {
      id: 'relationship-solutions',
      label: 'AI 관계 개선 솔루션',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      subItems: [
        { id: 'relationship-diagnosis', label: 'AI 관계 갈등 진단', href: '/tests/relationship-diagnosis', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { id: 'social-skills', label: 'AI 소셜 스킬 강화', href: '/tests/social-skills', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
      ]
    },
    {
      id: 'psychological-care',
      label: 'AI 심리·정서 케어',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      subItems: [
        { id: 'emotion-stress', label: 'AI 감정·스트레스 관리', href: '/tests/emotion-stress', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        { id: 'crisis-recovery', label: 'AI 심리 위기 극복', href: '/tests/crisis-recovery', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { id: 'environment-adaptation', label: 'AI 환경 부적응 진단', href: '/tests/environment-adaptation', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
      ]
    },
    {
      id: 'life-meaning',
      label: 'AI 삶의 의미·목적 탐색',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      subItems: [
        { id: 'existential-growth', label: 'AI 실존적 성장 가이드', href: '/tests/existential-growth', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' }
      ]
    },
    {
      id: 'ethical-dilemma',
      label: 'AI 윤리적 딜레마 분석',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      subItems: [
        { id: 'value-conflict', label: 'AI 가치관 충돌 분석', href: '/tests/value-conflict', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }
      ]
    },
    {
      id: 'health-psychology',
      label: 'AI 신체·건강 심리 분석',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      subItems: [
        { id: 'body-image', label: 'AI 신체 이미지 진단', href: '/tests/body-image', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'disease-stress', label: 'AI 질병 스트레스 관리', href: '/tests/disease-stress', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
      ]
    },
    {
      id: 'financial-life',
      label: 'AI 재정·생활 관리',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      subItems: [
        { id: 'financial-psychology', label: 'AI 재정 심리 진단', href: '/tests/financial-psychology', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'lifestyle-design', label: 'AI 생활 습관 디자인', href: '/tests/lifestyle-design', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4' }
      ]
    },
    {
      id: 'reality-solutions',
      label: 'AI 현실 문제 해결',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      subItems: [
        { id: 'career-solutions', label: 'AI 직장·커리어 솔루션', href: '/tests/career-solutions', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0V4a2 2 0 00-2-2H10a2 2 0 00-2 2v2' },
        { id: 'economic-stress', label: 'AI 경제적 스트레스 분석', href: '/tests/economic-stress', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'living-environment', label: 'AI 주거·일상 환경 최적화', href: '/tests/living-environment', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'social-system', label: 'AI 사회 시스템 적응 지원', href: '/tests/social-system', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }
      ]
    },
    {
      id: 'digital-psychology',
      label: 'AI 디지털 심리 분석',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      subItems: [
        { id: 'online-identity', label: 'AI 온라인 자아 분석', href: '/tests/online-identity', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'digital-relationships', label: 'AI 디지털 관계 진단', href: '/tests/digital-relationships', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { id: 'digital-life-coaching', label: 'AI 디지털 라이프 코칭', href: '/tests/digital-life-coaching', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' }
      ]
    },
    {
      id: 'lifecycle-development',
      label: 'AI 생애주기 발달 분석',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      subItems: [
        { id: 'child-adolescent', label: 'AI 아동·청소년 성장 분석', href: '/tests/child-adolescent', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'young-adult', label: 'AI 청년기 과업 분석', href: '/tests/young-adult', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'midlife-crisis', label: 'AI 중년기 위기 진단', href: '/tests/midlife-crisis', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
        { id: 'elderly-integration', label: 'AI 노년기 통합 분석', href: '/tests/elderly-integration', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
      ]
    },
    {
      id: 'multicultural-adaptation',
      label: 'AI 다문화 적응 솔루션',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      subItems: [
        { id: 'initial-settlement', label: 'AI 초기 정착 지원', href: '/tests/initial-settlement', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'social-cultural', label: 'AI 사회·문화 관계 분석', href: '/tests/social-cultural', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'multicultural-family', label: 'AI 다문화 가족 진단', href: '/tests/multicultural-family', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { id: 'identity-integration', label: 'AI 다문화 정체성 통합', href: '/tests/identity-integration', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
      ]
    }
  ];

  // 활성 섹션 결정 함수 (AI CoCo v6.0)
  const getActiveSection = (path: string): string => {
    if (path === '/tests') return 'dashboard';
    
    // AI 성장 잠재력 분석
    if (path.startsWith('/tests/self-analysis')) return 'self-analysis';
    if (path.startsWith('/tests/capability-coaching')) return 'capability-coaching';
    
    // AI 관계 개선 솔루션
    if (path.startsWith('/tests/relationship-diagnosis')) return 'relationship-diagnosis';
    if (path.startsWith('/tests/social-skills')) return 'social-skills';
    
    // AI 심리·정서 케어
    if (path.startsWith('/tests/emotion-stress')) return 'emotion-stress';
    if (path.startsWith('/tests/crisis-recovery')) return 'crisis-recovery';
    if (path.startsWith('/tests/environment-adaptation')) return 'environment-adaptation';
    
    // AI 삶의 의미·목적 탐색
    if (path.startsWith('/tests/existential-growth')) return 'existential-growth';
    
    // AI 윤리적 딜레마 분석
    if (path.startsWith('/tests/value-conflict')) return 'value-conflict';
    
    // AI 신체·건강 심리 분석
    if (path.startsWith('/tests/body-image')) return 'body-image';
    if (path.startsWith('/tests/disease-stress')) return 'disease-stress';
    
    // AI 재정·생활 관리
    if (path.startsWith('/tests/financial-psychology')) return 'financial-psychology';
    if (path.startsWith('/tests/lifestyle-design')) return 'lifestyle-design';
    
    // AI 현실 문제 해결
    if (path.startsWith('/tests/career-solutions')) return 'career-solutions';
    if (path.startsWith('/tests/economic-stress')) return 'economic-stress';
    if (path.startsWith('/tests/living-environment')) return 'living-environment';
    if (path.startsWith('/tests/social-system')) return 'social-system';
    
    // AI 디지털 심리 분석
    if (path.startsWith('/tests/online-identity')) return 'online-identity';
    if (path.startsWith('/tests/digital-relationships')) return 'digital-relationships';
    if (path.startsWith('/tests/digital-life-coaching')) return 'digital-life-coaching';
    
    // AI 생애주기 발달 분석
    if (path.startsWith('/tests/child-adolescent')) return 'child-adolescent';
    if (path.startsWith('/tests/young-adult')) return 'young-adult';
    if (path.startsWith('/tests/midlife-crisis')) return 'midlife-crisis';
    if (path.startsWith('/tests/elderly-integration')) return 'elderly-integration';
    
    // AI 다문화 적응 솔루션
    if (path.startsWith('/tests/initial-settlement')) return 'initial-settlement';
    if (path.startsWith('/tests/social-cultural')) return 'social-cultural';
    if (path.startsWith('/tests/multicultural-family')) return 'multicultural-family';
    if (path.startsWith('/tests/identity-integration')) return 'identity-integration';
    
    return 'dashboard';
  };

  // 페이지 제목 결정 함수 (AI CoCo v6.0)
  const getPageTitle = (path: string): string => {
    const titleMap: { [key: string]: string } = {
      '/tests': 'AI CoCo 심리검사 대시보드',
      
      // AI 성장 잠재력 분석
      '/tests/self-analysis': 'AI 자아 심층 분석',
      '/tests/capability-coaching': 'AI 역량 개발 코칭',
      
      // AI 관계 개선 솔루션
      '/tests/relationship-diagnosis': 'AI 관계 갈등 진단',
      '/tests/social-skills': 'AI 소셜 스킬 강화',
      
      // AI 심리·정서 케어
      '/tests/emotion-stress': 'AI 감정·스트레스 관리',
      '/tests/crisis-recovery': 'AI 심리 위기 극복',
      '/tests/environment-adaptation': 'AI 환경 부적응 진단',
      
      // AI 삶의 의미·목적 탐색
      '/tests/existential-growth': 'AI 실존적 성장 가이드',
      
      // AI 윤리적 딜레마 분석
      '/tests/value-conflict': 'AI 가치관 충돌 분석',
      
      // AI 신체·건강 심리 분석
      '/tests/body-image': 'AI 신체 이미지 진단',
      '/tests/disease-stress': 'AI 질병 스트레스 관리',
      
      // AI 재정·생활 관리
      '/tests/financial-psychology': 'AI 재정 심리 진단',
      '/tests/lifestyle-design': 'AI 생활 습관 디자인',
      
      // AI 현실 문제 해결
      '/tests/career-solutions': 'AI 직장·커리어 솔루션',
      '/tests/economic-stress': 'AI 경제적 스트레스 분석',
      '/tests/living-environment': 'AI 주거·일상 환경 최적화',
      '/tests/social-system': 'AI 사회 시스템 적응 지원',
      
      // AI 디지털 심리 분석
      '/tests/online-identity': 'AI 온라인 자아 분석',
      '/tests/digital-relationships': 'AI 디지털 관계 진단',
      '/tests/digital-life-coaching': 'AI 디지털 라이프 코칭',
      
      // AI 생애주기 발달 분석
      '/tests/child-adolescent': 'AI 아동·청소년 성장 분석',
      '/tests/young-adult': 'AI 청년기 과업 분석',
      '/tests/midlife-crisis': 'AI 중년기 위기 진단',
      '/tests/elderly-integration': 'AI 노년기 통합 분석',
      
      // AI 다문화 적응 솔루션
      '/tests/initial-settlement': 'AI 초기 정착 지원',
      '/tests/social-cultural': 'AI 사회·문화 관계 분석',
      '/tests/multicultural-family': 'AI 다문화 가족 진단',
      '/tests/identity-integration': 'AI 다문화 정체성 통합'
    };
    return titleMap[path] || 'AI CoCo 심리검사 대시보드';
  };

  // 메뉴 클릭 핸들러
  const handleMenuClick = (sectionId: string, href: string) => {
    setActiveSection(sectionId);
    setPageTitle(getPageTitle(href));
    router.push(href);
  };

  // 경로 변경 시 활성 섹션 업데이트
  useEffect(() => {
    const currentSection = getActiveSection(pathname);
    const currentTitle = getPageTitle(pathname);
    setActiveSection(currentSection);
    setPageTitle(currentTitle);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex pt-16">
        {/* 사이드바 */}
        <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
          <div className="p-6">
            {/* 로고 및 제목 */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI CoCo 메뉴</h1>
              <p className="text-sm text-gray-400">AI 심리분석 솔루션</p>
            </div>
            </div>

            {/* 메뉴 네비게이션 */}
            <nav className="space-y-2" role="navigation" aria-labelledby="test-menu-title">
              {testMenuCategories.map((category, index) => (
                <div key={category.id} className="space-y-1">
                  {/* 중분류 메뉴 - 대시보드는 클릭 가능, 나머지는 단순 표시 */}
                  {category.id === 'dashboard' ? (
                    <button
                      onClick={() => handleMenuClick('dashboard', category.href || '/tests')}
                      className={`w-full px-4 py-3 text-base font-medium border-b border-gray-600/30 bg-gray-800/20 hover:bg-gray-700/30 transition-all duration-300 rounded-lg group ${
                        activeSection === 'dashboard' 
                          ? 'text-cyan-300 bg-slate-700/30' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg 
                          className={`mr-3 h-6 w-6 flex-shrink-0 ${
                            activeSection === 'dashboard' ? 'text-cyan-300' : 'text-gray-400 group-hover:text-cyan-300'
                          }`}
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                        </svg>
                        <span className="truncate font-semibold">{category.label}</span>
                      </div>
                    </button>
                  ) : (
                    <div className="px-4 py-3 text-base font-medium text-gray-400 border-b border-gray-600/30 bg-gray-800/20">
                      <div className="flex items-center">
                        <svg 
                          className="mr-3 h-6 w-6 flex-shrink-0" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={category.icon} />
                        </svg>
                        <span className="truncate font-semibold">{category.label}</span>
                      </div>
                    </div>
                  )}

                  {/* 소분류 메뉴 - 항상 펼쳐진 상태, 고급스러운 선택 효과 */}
                  {category.subItems.length > 0 && (
                    <div className="space-y-1 pb-2">
                      {category.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleMenuClick(subItem.id, subItem.href)}
                          className={`w-full flex items-center px-6 py-3 text-base transition-all duration-300 rounded-lg ml-4 transform hover:scale-[1.02] relative group ${
                            activeSection === subItem.id 
                              ? 'bg-gradient-to-r from-slate-800/90 to-slate-700/90 text-white shadow-lg shadow-slate-500/20 font-semibold border-l-4 border-cyan-400' 
                              : 'text-gray-300 hover:bg-slate-700/30 hover:text-white hover:shadow-md'
                          }`}
                          aria-current={activeSection === subItem.id ? 'page' : undefined}
                        >
                          {/* 좌우측 밝은 선 효과 (마우스 오버시) */}
                          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <svg 
                            className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-300 ${
                              activeSection === subItem.id ? 'text-cyan-300' : 'text-gray-400 group-hover:text-cyan-300'
                            }`}
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={subItem.icon} />
                          </svg>
                          <span className="truncate">{subItem.label}</span>

                          {/* 활성 상태일 때 우측 화살표 */}
                          {activeSection === subItem.id && (
                            <svg 
                              className="ml-auto h-4 w-4 text-cyan-300 animate-pulse" 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {/* 페이지 헤더 */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{pageTitle}</h2>
                <p className="text-slate-400 mt-1">AI 기반 심리분석 솔루션으로 내담자를 지원하세요</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 shadow-lg">
                  새 검사 시작
                </button>
              </div>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
