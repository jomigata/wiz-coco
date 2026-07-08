# careAssignments 스키마 · API 스펙 (T-2-01)

Wave 2 케어 플랜의 기반 데이터 모델입니다. 포털 내담자는 Firebase Auth가 아닌 `portalToken`을 사용하므로 **모든 읽기/쓰기는 Flask API(Admin SDK)** 를 통해서만 수행합니다.

- 스키마 버전: `1` (`CARE_ASSIGNMENT_SCHEMA_VERSION`)
- TypeScript: `src/types/careAssignment.ts`
- 백엔드 검증: `backend/utils/care_assignment_schema.py`
- Firestore 컬렉션: `careAssignments`, `careProgress`

---

## 1. 컬렉션: `careAssignments`

경로: `/careAssignments/{assignmentId}`

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `schemaVersion` | number | ✅ | 현재 `1` |
| `counselorId` | string | ✅ | 상담사 Firebase UID |
| `portalId` | string | ✅ | `clientPortals` 문서 ID |
| `portalDisplayName` | string | | 목록 UI 비정규화 |
| `type` | enum | ✅ | `additional_assessment` \| `treatment_program` \| `daily_record` \| `custom_task` |
| `status` | enum | ✅ | `active` \| `completed` \| `cancelled` \| `expired` |
| `title` | string | ✅ | 내담자에게 표시할 제목 |
| `description` | string | | 부가 설명 |
| `instructions` | string | | 수행 안내 |
| `priority` | enum | ✅ | `low` \| `medium` \| `high` |
| `programId` | string | △ | `treatment_program` 시 필수 (T-2-02 카탈로그) |
| `assessmentId` | string | △ | `additional_assessment` 시 기존 검사코드 |
| `testList` | array | △ | `additional_assessment` 시 신규 미니 검사 세트 |
| `startAt` | ISO string | | 시작일 |
| `dueAt` | ISO string | | 마감일 |
| `completedAt` | ISO string | | 완료 시각 |
| `notifyOnAssign` | boolean | ✅ | 할당 시 알림 여부 |
| `notifyStatus` | enum | | `pending` \| `sent` \| `failed` \| `skipped` |
| `notifyError` | string | | 발송 실패 메시지 |
| `notifyAt` | timestamp | | 발송 시각 |
| `source` | enum | ✅ | `manual` \| `ai_recommendation` \| `assessment_result` |
| `sourceRefId` | string | | AI 리포트·결과 참조 |
| `metadata` | object | | 확장 필드 |
| `createdAt` | timestamp | ✅ | 서버 |
| `updatedAt` | timestamp | ✅ | 서버 |
| `createdBy` | string | ✅ | 생성 상담사 UID |

### `clientPortals` 확장 (선택)

할당 생성 시 `careAssignmentIds` 배열에 ID를 `ArrayUnion`으로 추가합니다 (T-2-04).

```json
{
  "careAssignmentIds": ["assignmentId1", "assignmentId2"],
  "lastCareNotifiedAt": "2026-07-08T05:00:00.000Z"
}
```

---

## 2. 컬렉션: `careProgress`

경로: `/careProgress/{progressId}`

할당 1건당 포털 1건과 **1:1** 로 생성합니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `schemaVersion` | number | ✅ | `1` |
| `assignmentId` | string | ✅ | `careAssignments` ID |
| `portalId` | string | ✅ | |
| `counselorId` | string | ✅ | |
| `assignmentType` | enum | ✅ | 할당 type 복사 |
| `status` | enum | ✅ | `not_started` \| `in_progress` \| `completed` \| `skipped` |
| `progressPercent` | number | ✅ | 0~100 |
| `entries` | array | ✅ | 진행 기록 항목 |
| `lastActivityAt` | timestamp | | |
| `completedAt` | timestamp | | |
| `createdAt` | timestamp | ✅ | |
| `updatedAt` | timestamp | ✅ | |

### `entries[]` 항목

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 클라이언트 생성 UUID 또는 ISO |
| `kind` | enum | `session` \| `journal` \| `check_in` \| `note` \| `assessment` |
| `title` | string | |
| `content` | string | journal/note 시 필수 |
| `moodScore` | number | 1~10 |
| `stressLevel` | number | |
| `energyLevel` | number | |
| `completedAt` | ISO string | |
| `metadata` | object | |

---

## 3. Firestore 보안 규칙

`careAssignments`, `careProgress` — **클라이언트 직접 접근 차단** (`allow read, write: if false`).

상담사·포털 모두 Flask API에서 권한 검증:

- 상담사: `require_counselor` + `portal.counselorId == g.counselor_uid`
- 포털: `portalToken` → `portalId` 일치 확인

---

## 4. 복합 인덱스 (권장)

| 컬렉션 | 필드 | 용도 |
|--------|------|------|
| `careAssignments` | `counselorId` ASC, `status` ASC, `createdAt` DESC | 상담사 전체 목록 |
| `careAssignments` | `portalId` ASC, `status` ASC, `createdAt` DESC | 내담자별 할당 |
| `careAssignments` | `counselorId` ASC, `portalId` ASC, `status` ASC | 상담사+내담자 필터 |
| `careProgress` | `portalId` ASC, `status` ASC, `updatedAt` DESC | 포털 대시보드 |
| `careProgress` | `counselorId` ASC, `assignmentId` ASC | 상담사 모니터링 |

`firestore.indexes.json` 참고.

---

## 5. REST API 스펙 (구현 예정)

### 5-1. 상담사 — 할당 생성 (T-2-04)

`POST /api/care-assignments`  
인증: `Authorization: Bearer {counselorFirebaseToken}`

**요청**

```json
{
  "portalIds": ["portalA", "portalB"],
  "type": "treatment_program",
  "title": "4주 호흡·이완 프로그램",
  "programId": "breathing_relaxation_v1",
  "priority": "medium",
  "dueAt": "2026-08-01",
  "notify": true,
  "source": "manual"
}
```

**응답** `201`

```json
{
  "schemaVersion": 1,
  "assigned": 2,
  "skipped": 0,
  "failed": 0,
  "notify": { "sent": 2, "failed": 0, "skipped": 0 },
  "assignments": [{ "id": "...", "portalId": "portalA", "type": "treatment_program", "status": "active" }],
  "details": [{ "portalId": "portalA", "assignmentId": "...", "status": "assigned" }]
}
```

**부수 효과**

1. `careAssignments` 문서 생성
2. `careProgress` 문서 1:1 생성
3. `clientPortals.careAssignmentIds` 업데이트
4. `notify: true` → `notificationQueue`에 `care_assignment` 타입 enqueue (T-2-08)

---

### 5-2. 상담사 — 목록 조회

`GET /api/care-assignments?portalId=&status=active&type=&q=&limit=50`

**응답**

```json
{
  "items": [
    {
      "id": "...",
      "portalId": "...",
      "title": "...",
      "type": "daily_record",
      "status": "active",
      "progress": {
        "progressId": "...",
        "status": "in_progress",
        "progressPercent": 40,
        "entryCount": 3
      }
    }
  ],
  "total": 1,
  "summary": { "active": 1, "completed": 0, "cancelled": 0, "expired": 0 }
}
```

---

### 5-3. 상담사 — 상태 변경

`PATCH /api/care-assignments/{assignmentId}`

```json
{ "status": "cancelled", "instructions": "내용 수정" }
```

---

### 5-4. 포털 — 할당 목록 (T-2-05)

`GET /api/client-portals/care-assignments`  
인증: `Authorization: Portal {portalToken}`

**응답**: `PortalCareAssignmentsResult` (active/completed 탭)

---

### 5-5. 포털 — 진행 기록 제출 (T-2-06)

`POST /api/client-portals/care-assignments/{assignmentId}/progress`

```json
{
  "entry": {
    "kind": "journal",
    "content": "오늘은 숨쉬기 연습을 했습니다.",
    "moodScore": 6
  },
  "markCompleted": false
}
```

---

## 8. 치료프로그램 카탈로그 (T-2-02)

| programId | 제목 | 주차 | 세션 |
|-----------|------|------|------|
| `breathing_relaxation_v1` | 4주 호흡·이완 | 4 | 12 |
| `progressive_muscle_relaxation_v1` | 2주 PMR | 2 | 6 |
| `cbt_thought_record_v1` | 4주 CBT 생각 기록 | 4 | 8 |
| `mood_diary_v1` | 2주 기분 일기 | 2 | 14 |
| `mindfulness_breath_v1` | 3주 마음챙김 호흡 | 3 | 9 |
| `behavioral_activation_v1` | 4주 행동 활성화 | 4 | 8 |
| `sleep_hygiene_v1` | 2주 수면 위생 | 2 | 6 |
| `gratitude_journal_v1` | 2주 감사 일기 | 2 | 14 |

- 프론트 전체 세션: `src/data/careProgramCatalog.ts`
- API: `GET /api/care-assignments/programs`, `GET /api/care-assignments/programs/{programId}`

---

## 9. 알림 큐 — `care_assignment` (T-2-08)

`notificationQueue` 항목 `type: "care_assignment"` — 워커가 이메일/SMS 발송.

```json
{
  "type": "care_assignment",
  "portalId": "...",
  "assignmentId": "...",
  "email": "...",
  "phone": "...",
  "displayName": "홍길동",
  "payload": {
    "title": "4주 호흡·이완 프로그램",
    "portalAccessCode": "CVC123"
  }
}
```

워커 처리 시 매직 링크(`/go?t=...&tab=care`)를 생성해 포털 **추가 과제·치료** 탭으로 안내합니다.

---

## 7. 후속 작업 매핑

| ID | 작업 | 이 스키마 의존 |
|----|------|----------------|
| **T-2-02** | 치료프로그램 카탈로그 | `programId` — `src/data/careProgramCatalog.ts`, `GET /api/care-assignments/programs` |
| T-2-03 | `/counselor/treatment-plans` UI | §5-1, §5-2 |
| T-2-04 | 케어 할당 API 구현 | §5-1 |
| T-2-05 | 포털 「추가 과제·치료」탭 | §5-4 |
| T-2-06 | 진행 기록 | §5-5, `careProgress` |
| T-2-07 | 상담사 치료 모니터링 | §5-2 + 실시간 |
| T-2-08 | `care_assignment` 알림 | §9 |
