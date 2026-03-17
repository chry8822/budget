# 프로덕션 대비 Safe Area 및 Modal 이슈 정리

앱 전반에서 **프로덕션(스토어) 빌드**에서만 발생할 수 있는 이슈를 정리한 문서입니다.  
Expo Go / 개발 빌드에서는 재현되지 않을 수 있으므로 **EAS 프로덕션 빌드 APK를 실기기에 설치해 반드시 확인**하는 것을 권장합니다.

---

## 1. 근본 원인: Modal = 별도 창

- **React Native `Modal`**은 프로덕션에서 **별도 네이티브 창**에 그려집니다.
- 그 창에는 **SafeAreaProvider** 기준 insets가 적용되지 않아 **`useSafeAreaInsets()`가 `0`**을 반환할 수 있습니다.
- 따라서 **모든 Modal**은 같은 문제 가능성이 있고, 하단 버튼이 시스템 네비에 가려질 수 있습니다.

**근본 해결:** Modal을 쓰지 않고 **같은 창에서 View 오버레이**로 띄우면 insets가 정상 동작합니다.

---

## 2. 같은 창 오버레이로 전환 완료 (권장 방식)

| 구간 | 파일 | 조치 |
|------|------|------|
| **DayDetailBottomSheet** (캘린더 일자 클릭) | `DayDetailBottomSheet.tsx` | **Modal 제거** → `View` 오버레이(`position: absolute`, `zIndex: 1000`)로 변경. HomeScreen에서 ScrollView와 형제로 렌더 → **같은 창**이라 `useSafeAreaInsets()` 정상 동작. 시트 하단에 `paddingBottom: insets.bottom` 적용. |

---

## 3. 아직 Modal 사용 중 (별도 창 → 프로덕션에서 insets 0 가능)

아래는 여전히 **RN `Modal`**을 쓰므로 **별도 창**에서 뜹니다. 프로덕션에서 하단이 시스템 네비에 가릴 수 있어, **CSS 폴백**(`Math.max(insets.bottom, MIN_BOTTOM_INSET)` 또는 컨테이너 `paddingBottom`)으로 우회한 상태입니다.

| 구간 | 파일 | 현재 조치 | 동일 창 전환 가능 여부 |
|------|------|-----------|------------------------|
| **MonthPickerBottomSheet** (월 선택) | `MonthPickerBottomSheet.tsx` | 시트 `paddingBottom`에 insets + MIN_BOTTOM_INSET 폴백 | 가능 (SummaryScreen/CalendarSection에서 오버레이로 렌더) |
| **OnboardingModal** | `OnboardingModal.tsx` | 컨테이너 `paddingBottom` + 폴백, onRequestClose | 가능 |
| **SettingsScreen 초기화 Modal** | `SettingsScreen.tsx` | modalCard에 insets + MIN_BOTTOM_INSET | 가능 (중앙 확인용이라 우선순위 낮음) |
| **TransactionForm 대분류 Modal** | `TransactionForm.tsx` | modalCard에 insets + 폴백, onRequestClose | 가능 |

---

## 4. Android 백버튼 (onRequestClose)

Modal을 쓰는 컴포넌트는 **`onRequestClose`** 필수입니다.

| 컴포넌트 | onRequestClose |
|----------|----------------|
| DayDetailBottomSheet | (같은 창 오버레이 → BackHandler로 처리) |
| MonthPickerBottomSheet | ✅ onClose |
| OnboardingModal | ✅ onClose |
| SettingsScreen 초기화 Modal | ✅ handleResetCancel |
| TransactionForm 대분류 Modal | ✅ closeCategoryModal |

---

## 5. 기타

- **ExpandableFab**: 메인 창에서 렌더되므로 insets 정상. 프로덕션 대비 폴백만 적용.
- **MonthYearPicker**: View 오버레이(Modal 아님). 카드 중앙 배치.
- **TransactionForm 본문**: `ScreenContainer` `safeBottom` 사용.

---

## 6. 테스트 권장 (스토어 배포 전)

1. `npx eas-cli build --platform android --profile production-apk` 로 APK 빌드
2. 실기기에 APK 설치 후 확인:
   - 캘린더 → 일자 클릭 → 바텀시트 하단 수입/지출 버튼 (같은 창 적용 구간)
   - 월 선택 바텀시트, 설정 초기화 모달, 대분류 추가 모달, 온보딩, FAB
3. 이상 없을 때만 스토어 제출.
