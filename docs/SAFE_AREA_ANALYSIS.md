# 하단 Safe Area(시스템 네비/인디케이터) 분석

앱 전반에서 **하단이 시스템 네비게이션 바·인디케이터에 가려질 수 있는 구간**을 분석한 결과입니다.

---

## 1. 수정 완료된 구간

### 1.1 DayDetailBottomSheet (캘린더 일자 클릭 바텀시트)
- **파일:** `src/components/calendar/DayDetailBottomSheet.tsx`
- **문제:** 수입/지출 버튼이 있는 `addRow`가 하단 safe area 미반영으로 시스템 UI에 가려짐.
- **조치:** `useSafeAreaInsets()`로 `insets.bottom`을 `addRow`의 `paddingBottom`에 반영 완료.

### 1.2 MonthPickerBottomSheet (월 선택 바텀시트)
- **파일:** `src/components/summary/MonthPickerBottomSheet.tsx`
- **문제:** 하단 취소/완료 버튼이 있는 시트의 `paddingBottom`이 고정값만 사용.
- **조치:** `useSafeAreaInsets()` 도입, 시트 스타일의 `paddingBottom`에 `insets.bottom` 추가 완료.

### 1.3 OnboardingModal (온보딩 모달)
- **파일:** `src/components/common/OnboardingModal.tsx`
- **문제:** 모달 카드 하단의 액션 버튼·"다시 안보기"가 작은 화면/인디케이터 기기에서 가려질 수 있음.
- **조치:** `useSafeAreaInsets()` 도입, 컨테이너 `paddingBottom`에 `insets.bottom` 추가 완료.

---

## 2. 이미 안전한 구간 (추가 수정 불필요)

| 구간 | 파일 | 이유 |
|------|------|------|
| **TransactionForm** | `src/components/transactions/TransactionForm.tsx` | `ScreenContainer`에 `safeBottom` 사용 → SafeAreaView 하단 edge 적용됨. |
| **ExpandableFab** | `src/components/common/ExpandableFab.tsx` | 이미 `useSafeAreaInsets()`로 `bottom: theme.spacing.lg + insets.bottom` 적용됨. |
| **일반 스크린** | `ScreenContainer` 사용 화면 | Stack 화면에서 `safeBottom={true}` 쓰면 하단 safe area 적용됨. |

---

## 3. 저위험 구간 (선택 대응)

| 구간 | 파일 | 설명 |
|------|------|------|
| **MonthYearPicker** | `src/components/common/MonthYearPicker.tsx` | 화면 중앙 오버레이. `bottomOffset={0}`으로 사용 중(StatsScreen, TransactionsScreen). 카드가 중앙에 있어 대부분 기기에서는 하단 버튼이 가리지 않으나, 필요 시 호출부에서 `bottomOffset={insets.bottom}` 전달 가능. |
| **SettingsScreen 초기화 모달** | `src/screens/SettingsScreen.tsx` | 중앙 카드형 모달. 버튼이 카드 중앙 하단에 있어 일반적으로 가림 위험 낮음. |

---

## 4. 스크롤 콘텐츠만 있는 구간 (이슈 없음)

다음은 **스크롤 영역의 contentContainerStyle paddingBottom**만 사용하며, 하단에 고정 버튼이 없어 safe area 이슈 대상이 아님.

- `HomeScreen.tsx` – `contentContainerStyle={{ paddingBottom: 24 }}`
- `StatsScreen.tsx` – `contentContainerStyle={{ paddingBottom: theme.spacing.lg }}`
- `SummarySection.tsx`, `SummaryScreen.tsx` – 리스트/요약 스크롤 하단 여백
- `TransactionForm.tsx` – `clearButton`의 `bottom: 0`은 입력 필드 내부 절대 위치용으로, 화면 하단 고정 UI가 아님

---

## 5. 권장 패턴

- **바텀시트/하단 고정 버튼이 있는 모달**
  - `useSafeAreaInsets()`로 `insets.bottom`을 구한 뒤, 하단 버튼을 감싼 컨테이너의 `paddingBottom`(또는 `marginBottom`)에 `insets.bottom`을 더해 사용.
- **전체 화면 레이아웃**
  - `ScreenContainer`의 `safeBottom={true}` 사용(Stack 화면 등).
- **플로팅 버튼(FAB 등)**
  - 위치 스타일의 `bottom` 값에 `insets.bottom`을 더해 배치.

---

## 6. 검토한 키워드

- `paddingBottom` / `bottom: 0` / `position: 'absolute'` + bottom
- `BottomSheet` / `Modal` / `useSafeAreaInsets` / `SafeAreaView`
- `KeyboardAvoidingView` / `KeyboardAwareScrollView` (키보드 대응은 별도 이슈, 이번 분석은 하단 safe area만 대상)
