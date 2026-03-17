# 한눈쏙 가계부

> 수입·지출을 한눈에 — 로컬 기반 개인 가계부 앱


한눈쏙 가계부는 **데이터를 기기에만 저장하는** 개인용 가계부입니다.  
수입/지출 기록, 월별 캘린더, 카테고리·결제수단별 통계, 예산 설정까지 한 앱에서 처리합니다.

***

## ✨ 주요 기능

| 기능                 | 설명                                                                |
|----------------------|---------------------------------------------------------------------|
| **수입/지출 기록**   | 금액, 카테고리, 결제수단, 메모 입력 · 수정 · 삭제                   |
| **홈 (캘린더/요약)** | 월별 캘린더 뷰, 일별 수입/지출 요약, FAB으로 빠른 추가              |
| **내역**             | 전체 거래 목록, 기간/탭 필터, 삭제 및 수정 진입                     |
| **통계**             | 이번 달/지난 달/선택 월, 카테고리별 파이 차트, 결제수단별 막대 차트 |
| **요약/예산**        | 월별 수입·지출·잔액, 예산 대비 지출, 예산 설정 화면 진입            |
| **설정**             | 다크 모드 토글 (AsyncStorage 유지)                                  |

- **다크 모드** 전역 지원 (테마 컨텍스트 + 동적 스타일)
- **온보딩** 최초 1회 (스와이프 슬라이드, "다시 보지 않기" 저장)
- **로컬 DB** SQLite(expo-sqlite), 서버 없음

***

## 🛠 기술 스택

- **Runtime** — Expo 54, React Native 0.81, React 19
- **언어** — TypeScript 5.9
- **DB** — expo-sqlite (로컬 SQLite)
- **네비게이션** — React Navigation 7 (Bottom Tabs + Native Stack)
- **UI** — 커스텀 테마(라이트/다크), react-native-calendars, react-native-chart-kit, Toast 메시지

***

## 📁 프로젝트 구조

```
BudgetBook/
├── App.tsx                    # 진입점, DB 초기화, ErrorBoundary, 테마, 탭/스택
├── app.json                   # Expo 앱 설정 (한눈쏙 가계부)
├── src/
│   ├── db/                    # SQLite 스키마, init, CRUD
│   ├── theme/                 # 라이트/다크 색상, Typography, ThemeContext
│   ├── navigation/            # RootStackParamList
│   ├── screens/               # 홈, 내역, 통계, 요약, 설정, 예산, 추가/수정
│   ├── components/            # 공통 UI, 캘린더, 트랜잭션 폼, FAB, 모달 등
│   ├── hooks/                 # useScrollability
│   ├── types/                 # 거래 타입, 카테고리, 결제수단
│   └── utils/                 # formatWon, formatAmount
└── assets/                    # 앱 아이콘, 스플래시 등
```

***

## 🚀 시작하기

### 요구 사항
- Node.js 18+
- npm 또는 yarn

### 설치 및 실행
```bash
git clone <repository-url>
cd BudgetBook
npm install
npm start
```

**Expo Go**로 QR 스캔하거나, `npm run ios` / `npm run android`로 시뮬레이터/에뮬레이터 실행.

### 빌드 (EAS)
`eas.json` 및 `app.json` 기준 EAS Build 설정 가능  
**iOS**: com.chrys.hanunssok  
**Android**: com.chrys.hanunssok

### 프로덕션 버전 만들기 (비공개 테스트 후)

1. **사전 확인**
   - **버전 자동 올리면서 빌드**: `npm run release:patch` (또는 `release:minor` / `release:major`)를 쓰면 `app.json` + `package.json` 버전을 올린 뒤 EAS 프로덕션 빌드를 실행함. (수동으로 버전 올릴 필요 없음)
   - 수동으로만 맞추려면: `app.json` → `expo.version` (예: `1.0.2`)을 스토어에 올릴 값으로 수정.

2. **프로덕션 빌드**
   - **`eas` 인식 안 될 때 (Windows 등)**: `npx eas-cli` 사용.  
     예: `npx eas-cli build --platform android --profile production`
   - 전역 설치 후 `eas` 사용: `npm install -g eas-cli` (한 번만)
   - 로그인: `eas login` 또는 `npx eas-cli login`
   - **Android 프로덕션**:  
     `npx eas-cli build --platform android --profile production`
   - **iOS 프로덕션**:  
     `eas build --platform ios --profile production`
   - **둘 다 한 번에**:  
     `eas build --platform all --profile production`

3. **빌드 결과**
   - [expo.dev](https://expo.dev) 대시보드 → 해당 프로젝트 → Builds에서 진행 상황 확인.
   - 끝나면 **Android**는 `.aab`(또는 .apk) 다운로드, **iOS**는 `.ipa` 다운로드 가능.

4. **스토어 제출 (선택)**
   - **Android (Play Store)**:  
     `eas submit --platform android --latest --profile production`  
     (최근 빌드 기준 제출. Google Play Console에서 내부 테스트 → 프로덕션 등 단계 설정.)
   - **iOS (App Store)**:  
     `eas submit --platform ios --latest --profile production`  
     (Apple Developer 계정·App Store Connect 앱 등록이 선행되어 있어야 함.)

5. **참고**
   - `eas.json`의 `production` 프로필에 `autoIncrement: true`가 있으면 빌드할 때마다 **Android versionCode** / **iOS buildNumber**가 자동으로 올라갑니다.
   - 스토어 심사 전에 스크린샷·개인정보 처리방침 URL 등 메타데이터는 각 스토어 콘솔에서 채워야 합니다.

***

## 🎨 디자인 시스템

### 메인·서브 컬러

| 역할 | 컬러 | HEX | 용도 |
|------|------|-----|------|
| **메인 (Primary)** | 코랄 레드 | `#FF6B6B` | 지출·CTA·강조, FAB, 버튼, 포커스 |
| **서브 (Secondary)** | 틸/민트 | `#4ECDC4` | 수입·성공·보조 강조, 차트·링크 |

- **Primary Soft**: Primary의 연한 배경 (라이트 `#FFE5E5` / 다크 `#3D2A2A`)
- **On Primary**: Primary 위 텍스트/아이콘 — `#FFFFFF`

### 컬러 팔레트 (라이트 / 다크)

| 토큰 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| `background` | `#FFFFFF` | `#121212` | 화면 배경 |
| `surface` | `#F2F2F2` | `#2C2C2C` | 카드·시트·입력 영역 |
| `text` | `#222222` | `#E8E8E8` | 본문 텍스트 |
| `textMuted` | `#666666` | `#9E9E9E` | 부가 문구, 캡션 |
| `border` | `#E5E5E5` | `#404040` | 구분선, 테두리 |
| `income` | `#1e88e5` | `#64B5F6` | 수입 금액·아이콘 |
| `danger` | `#FF4D4F` | `#FF4D4F` | 삭제·경고·초과 |
| `success` | `#4ECDC4` | `#4ECDC4` | 성공·완료 (Secondary와 동일) |

### 간격 (Spacing)

| 토큰 | 값 | 용도 |
|------|----|------|
| `xs` | 4px | 요소 간 최소 간격 |
| `sm` | 8px | 작은 패딩, 아이콘–텍스트 |
| `md` | 16px | 기본 패딩, 카드 내부 |
| `lg` | 24px | 섹션 간격, 여백 |
| `xl` | 32px | 큰 블록 간격 |

### 타이포그래피

| 스케일 | 크기 | 용도 |
|--------|------|------|
| `xs` | 13px | 캡션, 보조 정보 |
| `sm` | 14px | 보조 본문 |
| `md` | 16px | 본문 |
| `lg` | 18px | 소제목 |
| `xl` | 24px | 제목 |
| `xxl` | 30px | 큰 제목 |
| `display` | 34px | 대형 숫자·헤드라인 |

- **title**: 24px, bold  
- **subtitle**: 18px, textMuted  
- **body**: 16px, text  
- **caption**: 13px, textMuted  

### 테마 전환

- **라이트 / 다크** 전환은 설정 화면 스위치로 가능
- 선택값은 **AsyncStorage**에 저장되어 앱 재실행 후에도 유지
- 컬러·간격·타이포는 `src/theme/` (colorsLight, colorsDark, spacing, typography, ThemeContext)에서 관리

***

## 📄 라이선스
© 2025 [이름]. All rights reserved.  
**무단 사용·배포·상업 이용 금지.**
