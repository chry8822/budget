# BudgetBook

가계부를 **가볍게 기록하고 한눈에 요약**하는 Expo 기반의 React Native 앱입니다.  
지출/수입을 빠르게 입력하고, 카테고리와 결제수단 기준으로 월간 통계를 확인할 수 있어요.

## 주요 기능
- 지출/수입 입력, 수정, 삭제
- 이번 달 요약(총 지출, 일 평균, Top 카테고리/결제수단)
- 월별 통계 차트(카테고리 비중, 결제수단 분포)
- 커스텀 월/연도 피커로 기간 이동
- 기본 카테고리 + 사용자 추가 카테고리(로컬 DB 저장)

## 기술 스택
- **Expo SDK 54**, React Native, TypeScript
- **expo-sqlite** 로컬 DB
- **react-navigation** (bottom-tabs / native-stack)
- **react-native-chart-kit**, **react-native-pie-chart**
- **react-native-keyboard-aware-scroll-view**

## 빠른 시작
```bash
npm install
npm run start
```

### 실행 옵션
```bash
npm run android
npm run ios
```

## 폴더 구조
```
src/
  components/
    common/        # 공통 UI (ScreenContainer, MonthYearPicker 등)
    transactions/  # 거래 입력 폼
  db/              # SQLite 쿼리/타입/스키마
  navigation/      # 네비게이션 타입
  screens/         # 화면(Home/Stats/Transactions/Summary 등)
  theme/           # 컬러/타이포/스페이싱 토큰
  types/           # 전역 타입 정의
```

## 데이터 구조 (SQLite)
- `transactions` 테이블: 거래 내역 저장
- `categories` 테이블: 기본/사용자 카테고리 저장  
  - 기본 카테고리는 앱 초기화 시 자동 시딩

## 디자인 시스템
`src/theme`에 **색상/타이포/간격** 토큰을 모아두고  
각 화면에서 공통 스타일로 재사용합니다.

## 개발 메모
- 월/연도 선택은 `MonthYearPicker`(커스텀 컴포넌트)로 구현
- 요약/통계 쿼리는 `src/db/database.ts`에서 관리

해당 프로젝트는 Perplexity ai와 cursor ai로 제작 되었습니다.
---

