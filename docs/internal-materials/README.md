# 위즈코코 내부 자료

상담·검사 원본을 구현 코드와 분리해 두는 보관소다. 앱 화면이나 공개 문서로 쓰지 않는다.

## 올리는 순서

1. 새 파일을 읽고, 이미 있는 자료와 주제·문항·기준치를 비교한다.
2. 같은 내용이면 더 완전한 쪽을 기준본으로 두고, 나머지는 무엇을 대체했는지 적는다.
3. 새 내용이면 해당 주제 폴더에 추가한다.
4. 문장이 서로 다르거나, 번호·채점·기준치가 맞물리지 않으면 [확인요청.md](./확인요청.md)에 적는다.
5. 확인요청 파일에 미확인 항목이 있으면, 정리 결과를 전할 때 그 항목을 함께 알린다.

## 상태 표시

| 상태 | 뜻 |
|---|---|
| `canonical` | 지금 기준으로 쓰는 본 |
| `kept-separate` | 비슷해 보이지만 다른 자료라 합치지 않음 |
| `superseded` | 더 나중 본이 있어 참고만 함 |
| `needs-confirmation` | 확인 전에는 구현·판정에 쓰지 않음 |
| `reference` | 참조만 한다. 채점 수치로 쓰지 않음 |

## 폴더

| 경로 | 내용 |
|---|---|
| [catalog.md](./catalog.md) | 지금까지 반영한 원본 목록 |
| [확인요청.md](./확인요청.md) | 사람이 확인해 줄 항목 |
| [time-structuring/](./time-structuring/) | 시간 구조화. 기준은 60문항 |
| [ego-ok/](./ego-ok/) | 이고그램·오케이그램. 기준은 90문항. 243 문장·형태 이름 추가 |
| [egogram-manual/](./egogram-manual/) | 이고그램 5칸 1–50문항. 1994년 표는 참고 |
| [online-exam-2020/](./online-exam-2020/) | 2020년 온라인 검사 상담사용 설명 |
| [life-position-graph/](./life-position-graph/) | 인생태도 그래프. 참조만. 수치는 없음 |
| [life-position-checklist/](./life-position-checklist/) | 오케이그램 4칸 40문항. CP, NP, FC, AC |
| [stroke/](./stroke/) | 스트로크 체크리스트 25문항. 축은 I→U, I←U, NO STROKE |
| [gestalt/](./gestalt/) | 게슈탈트 치료 강의 노트. 채점 자료 아님 |
| [self-analysis-report/](./self-analysis-report/) | 2011년 자기분석 사례. 이름 익명. 참조만 |
| [counseling-menu/](./counseling-menu/) | 상담 프로그램 메뉴. 네 시트를 합친 목록 |
| [ta-overview/](./ta-overview/) | 교류분석 이론 요약. 채점 기준은 바꾸지 않음 |
| [ta-theory-practice/](./ta-theory-practice/) | 1999년 훈련 매뉴얼. 검사 수치는 무시. 설명·원인·대책만 사용 |
| [relationship-aesthetics/](./relationship-aesthetics/) | 2010년 『관계의 미학, TA』. 설명만. 채점 없음 |
| [ta-today/](./ta-today/) | 2010년 『현대의 교류분석』. 설명만. 채점 없음 |
| [mind-development/](./mind-development/) | 2002년 제7판 『심성개발을 위한 교류분석』. 설명만. 채점 없음 |
| [counseling-elements/](./counseling-elements/) | 2003년 『상담의 디딤돌』 제4판. 상담 원리 색인. 채점 없음 |
| [im-ok-youre-ok/](./im-ok-youre-ok/) | 2008년 『마음의 해부학』. 설명만. 채점 없음 |
| [ta-cases/](./ta-cases/) | 구조 분석·교류 패턴 일부 스캔. 설명만. 사례 본문 없음 |
| [developing-ta-counselling/](./developing-ta-counselling/) | 2009년 『교류분석 상담의 적용』. 30단계 설명만. 채점 없음 |
| [ktaa-ego-okgram-guide/](./ktaa-ego-okgram-guide/) | 협회 이고-오케이그램 안내서. 그래프 읽기만. 채점은 90문항·2020 컷 |
| [counseling-forms/](./counseling-forms/) | 상담 빈 서식. 기록 칸과 자격 과제만. 척도 문항은 없음 |
| [presentation-notes/](./presentation-notes/) | 발표용 요점과 그림. 기존 책·243과 겹치면 다시 두지 않음 |
| [parent-education/](./parent-education/) | 부모교육 강의. 설명만. 50문항 셀프테스트는 채점 아님 |
| [psych-tests/](./psych-tests/) | 발표용 심리검사. 이름과 형식만. 48문항 시간표는 채점 아님 |
| [expert-course/](./expert-course/) | 전문가과정 발표. 설명만. 강의의 문항·눈금·시간 순서는 채점 아님 |
| [legacy-spec/](./legacy-spec/) | 예전 검사 사이트 제작 요구 |
