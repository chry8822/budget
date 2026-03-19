# 한눈쏙 가계부

> 수입·지출을 한눈에 — 로컬 기반 개인 가계부 앱

한눈쏙 가계부는 **데이터를 기기에만 저장하는** 개인용 가계부 앱입니다.  
서버 없이 SQLite로 동작하며, 수입/지출 기록부터 월별 통계·예산 관리까지 한 앱에서 처리합니다.

---

## ✨ 주요 기능

| 기능                 | 설명                                                                |
| -------------------- | ------------------------------------------------------------------- |
| **수입/지출 기록**   | 금액, 카테고리, 결제수단, 메모 입력·수정·삭제                       |
| **홈 (캘린더/요약)** | 월별 캘린더, 일별 수입/지출 요약, FAB 빠른 추가                     |
| **내역**             | 전체 거래 목록, 기간/탭 필터, 수정·삭제                             |
| **통계**             | 이번 달/지난 달/선택 월, 카테고리별 파이 차트, 결제수단별 막대 차트 |
| **요약/예산**        | 월별 수입·지출·잔액, 예산 대비 지출률, 예산 설정                    |
| **알림**             | 매일 지출 기록 리마인더 알림 (시간 설정 가능)                       |
| **설정**             | 다크 모드 토글, 알림 설정                                           |

- **다크 모드** 전역 지원 (테마 컨텍스트 + 동적 스타일)
- **온보딩** 최초 1회 (스와이프 슬라이드, "다시 보지 않기" 저장)
- **햅틱 피드백** 주요 버튼 터치 시 진동 반응
- **로컬 DB** — expo-sqlite, 서버 없음, 인터넷 연결 불필요

---

## 🛠 기술 스택

- **Runtime** — Expo 54, React Native 0.81, React 19
- **언어** — TypeScript 5.9
- **DB** — expo-sqlite (로컬 SQLite)
- **네비게이션** — React Navigation 7 (Bottom Tabs + Native Stack)
- **알림** — expo-notifications (로컬 푸시)
- **UI** — 커스텀 테마(라이트/다크), react-native-calendars, react-native-chart-kit, react-native-toast-message
- **기타** — expo-haptics, AsyncStorage, KeyboardAwareScrollView

---

## 📁 프로젝트 구조

```
BudgetBook/
├── App.tsx                    # 진입점, DB 초기화, ErrorBoundary, 테마, 탭/스택
├── app.json                   # Expo 앱 설정
├── src/
│   ├── db/                    # SQLite 스키마, init, CRUD
│   ├── theme/                 # 라이트/다크 색상, Typography, ThemeContext
│   ├── navigation/            # RootStackParamList
│   ├── screens/               # 홈, 내역, 통계, 요약, 설정, 예산, 추가/수정
│   │   ├── HomeScreen.tsx
│   │   ├── CalendarSection.tsx
│   │   ├── SummarySection.tsx
│   │   ├── SummaryScreen.tsx
│   │   ├── TransactionsScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── BudgetSettingScreen.tsx
│   │   ├── AddTransactionScreen.tsx
│   │   └── EditTransactionScreen.tsx
│   ├── components/
│   │   ├── common/            # HapticPressable, ErrorBoundary, FAB, 온보딩 등
│   │   ├── calendar/          # DayDetailBottomSheet
│   │   ├── summary/           # MonthPickerBottomSheet
│   │   └── transactions/      # TransactionForm
│   ├── hooks/                 # useScrollability
│   ├── types/                 # 거래 타입, 카테고리, 결제수단
│   └── utils/                 # formatWon, formatChartAmount, notifications
└── assets/                    # 앱 아이콘, 스플래시
```

---

## 🚀 로컬 실행

### 요구 사항

- Node.js 18+
- npm
- Expo Go 앱 (iOS / Android)

### 설치 및 실행

```bash
git clone <repository-url>
cd BudgetBook
npm install
npm start
```

Expo Go로 QR 스캔하거나 `npm run android` / `npm run ios`로 에뮬레이터 실행.

> **주의**: 알림(`expo-notifications`) 기능은 Expo Go에서 제한적으로 동작합니다. 완전한 테스트는 네이티브 빌드가 필요합니다.

---

## 🎨 디자인 시스템

### 메인·서브 컬러

| 역할          | 컬러      | HEX       | 용도                     |
| ------------- | --------- | --------- | ------------------------ |
| **Primary**   | 코랄 레드 | `#FF6B6B` | 지출·CTA·FAB·강조 버튼   |
| **Secondary** | 틸/민트   | `#4ECDC4` | 수입·성공·보조 강조·차트 |

### 컬러 팔레트 (라이트 / 다크)

| 토큰         | 라이트    | 다크      | 용도                |
| ------------ | --------- | --------- | ------------------- |
| `background` | `#FFFFFF` | `#121212` | 화면 배경           |
| `surface`    | `#F2F2F2` | `#2C2C2C` | 카드·시트·입력 영역 |
| `text`       | `#222222` | `#E8E8E8` | 본문 텍스트         |
| `textMuted`  | `#666666` | `#9E9E9E` | 부가 문구, 캡션     |
| `border`     | `#E5E5E5` | `#404040` | 구분선, 테두리      |
| `income`     | `#1e88e5` | `#64B5F6` | 수입 금액·아이콘    |
| `danger`     | `#FF4D4F` | `#FF4D4F` | 삭제·경고·초과      |

### 간격 (Spacing)

| 토큰 | 값   | 용도                     |
| ---- | ---- | ------------------------ |
| `xs` | 4px  | 요소 간 최소 간격        |
| `sm` | 8px  | 작은 패딩, 아이콘–텍스트 |
| `md` | 16px | 기본 패딩, 카드 내부     |
| `lg` | 24px | 섹션 간격, 여백          |
| `xl` | 32px | 큰 블록 간격             |

### 타이포그래피

| 스케일    | 크기 | 용도               |
| --------- | ---- | ------------------ |
| `xs`      | 13px | 캡션, 보조 정보    |
| `sm`      | 14px | 보조 본문          |
| `md`      | 16px | 본문               |
| `lg`      | 18px | 소제목             |
| `xl`      | 24px | 제목               |
| `xxl`     | 30px | 큰 제목            |
| `display` | 34px | 대형 숫자·헤드라인 |

### 테마 전환

- **라이트 / 다크** 전환은 설정 화면 스위치로 가능
- 선택값은 **AsyncStorage**에 저장되어 앱 재실행 후에도 유지
- 컬러·간격·타이포는 `src/theme/`에서 관리

---

## 📄 라이선스

© 2025 chrys. All rights reserved.  
**본 소스코드의 무단 사용·복제·배포·상업적 이용을 금지합니다.**
