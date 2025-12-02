# 업무 관리 앱 (Task Manager)

심플하고 강력한 업무 관리 웹 애플리케이션입니다.

![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)

## 주요 기능

### 업무 관리
- 업무 등록/수정/삭제
- 우선순위 설정 (높음/보통/낮음)
- 마감일 관리 및 알림
- 카테고리 및 태그 분류
- 진행 상황 기록

### 챗봇 도우미
- 자연어로 업무 등록 ("보고서 작성 내일까지 높음")
- 업무 조회 ("할 일 보여줘", "업무 요약")
- AI 질문 응답 (n8n 웹훅 연동)

### 공유 기능
- 공유 링크 생성
- 읽기 전용 모드로 업무 목록 공유

### 기타
- 다크 모드 지원
- 키보드 단축키
- 데이터 백업/복원 (JSON)
- 반응형 디자인

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 키보드 단축키

| 키 | 기능 |
|---|------|
| `N` | 새 업무 추가 |
| `D` | 다크 모드 토글 |
| `/` | 검색창 포커스 |
| `1` | 통계 탭 |
| `2` | 진행중 탭 |
| `3` | 완료됨 탭 |
| `ESC` | 폼 닫기 |

## 환경 변수

AI 챗봇 기능을 사용하려면 `.env` 파일을 생성하세요:

```env
VITE_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## 기술 스택

- **Frontend**: React 19, Vite
- **상태 관리**: React Hooks (useState, useEffect, useMemo)
- **스타일링**: CSS
- **저장소**: LocalStorage
- **AI 연동**: n8n Webhook

## 프로젝트 구조

```
src/
├── components/
│   ├── ChatBot.jsx      # 챗봇 컴포넌트
│   ├── Dashboard.jsx    # 통계 대시보드
│   ├── TaskForm.jsx     # 업무 등록 폼
│   ├── TaskItem.jsx     # 업무 아이템
│   └── TaskList.jsx     # 업무 목록
├── hooks/
│   ├── useTasks.js      # 업무 상태 관리
│   └── useDebounce.js   # 디바운스 훅
├── utils/
│   ├── storage.js       # 로컬스토리지 유틸
│   └── notifications.js # 알림 유틸
├── App.jsx
├── App.css
└── main.jsx
```

## 라이선스

MIT License
