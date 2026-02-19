# 한눈쏙 가계부

> 수입·지출을 한눈에 — 로컬 기반 개인 가계부 앱

[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)

한눈쏙 가계부는 **데이터를 기기에만 저장하는** 개인용 가계부입니다.  
수입/지출 기록, 월별 캘린더, 카테고리·결제수단별 통계, 예산 설정까지 한 앱에서 처리합니다.

---

## ✨ 주요 기능

| 기능                 | 설명                                                                |
| -------------------- | ------------------------------------------------------------------- |
| **수입/지출 기록**   | 금액, 카테고리, 결제수단, 메모 입력 · 수정 · 삭제                   |
| **홈 (캘린더/요약)** | 월별 캘린더 뷰, 일별 수입/지출 요약, FAB으로 빠른 추가              |
| **내역**             | 전체 거래 목록, 기간/탭 필터, 삭제 및 수정 진입                     |
| **통계**             | 이번 달/지난 달/선택 월, 카테고리별 파이 차트, 결제수단별 막대 차트 |
| **요약/예산**        | 월별 수입·지출·잔액, 예산 대비 지출, 예산 설정 화면 진입            |
| **설정**             | 다크 모드 토글 (AsyncStorage 유지)                                  |

- **다크 모드** 전역 지원 (테마 컨텍스트 + 동적 스타일)
- **온보딩** 최초 1회 (스와이프 슬라이드, "다시 보지 않기" 저장)
- **로컬 DB** SQLite(expo-sqlite), 서버 없음

---

## 🛠 기술 스택

- **Runtime** — Expo 54, React Native 0.81, React 19
- **언어** — TypeScript 5.9
- **DB** — expo-sqlite (로컬 SQLite)
- **네비게이션** — React Navigation 7 (Bottom Tabs + Native Stack)
- **UI** — 커스텀 테마(라이트/다크), react-native-calendars, react-native-chart-kit, Toast 메시지

---

## 📁 프로젝트 구조

BudgetBook/
├── App.tsx # 진입점, DB 초기화, ErrorBoundary, 테마, 탭/스택
├── app.json # Expo 앱 설정 (한눈쏙 가계부)
├── src/
│ ├── db/ # SQLite 스키마, init, CRUD
│ ├── theme/ # 라이트/다크 색상, Typography, ThemeContext
│ ├── navigation/ # RootStackParamList
│ ├── screens/ # 홈, 내역, 통계, 요약, 설정, 예산, 추가/수정
│ ├── components/ # 공통 UI, 캘린더, 트랜잭션 폼, FAB, 모달 등
│ ├── hooks/ # useScrollability
│ ├── types/ # 거래 타입, 카테고리, 결제수단
│ └── utils/ # formatWon, formatAmount
└── assets/ # 앱 아이콘, 스플래시 등

---

## 🚀 시작하기

### 요구 사항

- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

git clone <repository-url>
cd BudgetBook
npm install
npm start

Expo Go로 QR 스캔하거나, npm run ios / npm run android 로 시뮬레이터/에뮬레이터 실행.
빌드 (EAS)
eas.json 및 app.json 기준 EAS Build 설정 가능
iOS: com.chrys.hanunssok, Android: com.chrys.hanunssok
🎨 테마
라이트 — 흰 배경, primary 코랄/레드, 서페이스 그레이
다크 — 배경 #121212, 서페이스 #1E1E1E, 텍스트 #E8E8E8
설정 화면에서 스위치로 전환, 선택값은 AsyncStorage에 저장

📄 라이선스
© 2025 [이름]. All rights reserved. 무단 사용·배포·상업 이용 금지.
