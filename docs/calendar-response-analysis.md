# 캘린더/바텀시트 반응 속도·어색함 분석

## 1. 팝업에서 내역 눌러서 이동할 때 “어색함 + 반응 늘어 보임”

### 현재 동작
- 바텀시트에서 수입/지출 내역을 탭 → `onTransactionPress(id)` 호출
- **동시에** 두 가지가 실행됨:
  1. `navigation.navigate('EditTransaction', { id })` → 수정 화면으로 이동
  2. `setSelectedDate(null)` → 선택 날짜 초기화

### 왜 어색한가
- `setSelectedDate(null)` 때문에 `visible={!!selectedDate}`가 곧바로 `false`가 됨
- `DayDetailBottomSheet`의 `useEffect`에서 **닫기 애니메이션(150ms)** 이 바로 시작됨
- 결과: **“팝업이 아래로 내려가는 동작”**과 **“수정 화면이 올라오는 네비게이션”**이 동시에 보임  
  → 두 연출이 겹쳐서 흐름이 끊겨 보이고 어색함

### 왜 반응이 늘어 보이는가
- 내역 탭 직후:
  1. `setSelectedDate(null)` → 리렌더 1회
  2. 바텀시트 닫기 애니메이션 150ms 실행
  3. 그와 동시에 네비게이션 준비/렌더
- 사용자 관점: “탭 → (팝업이 닫히는 걸 봄) → 그다음에 화면 전환”처럼 느껴져, **실제 화면 전환까지 걸리는 시간이 더 길게** 느껴짐
- JS 스레드에서 setState + 애니메이션 + 네비게이션을 한꺼번에 처리하면서 체감 지연이 생길 여지도 있음

---

## 2. 캘린더에서 일자 눌렀을 때 반응이 느린 이유

### 현재 동작 (일자 탭 시)
1. `handleDayPress()` 실행 → `setSelectedDate(key)` + 캘린더 라이브러리 `onPress(date)`
2. 그다음 **한꺼번에** 일어나는 일:
   - **리렌더**: `CalendarSection` 전체 + `Calendar`의 `dayComponent`
   - **markedDates 재계산**: `useMemo`가 `selectedDate`에 의존
   - **바텀시트 표시**: `visible={!!selectedDate}` → `DayDetailBottomSheet` **열기 애니메이션 300ms** 시작
   - **useEffect(selectedDate)** 실행 → `setLoadingDetail(true)` → `getTransactionsByDate(selectedDate)` 호출

### 느려 보이는 주요 원인

| 원인 | 설명 |
|------|------|
| **무거운 dayComponent** | `dayComponent`가 인라인 함수 `(props) => { ... }`로 되어 있고, `selectedDate`가 바뀔 때마다 **달력 전체(35~42개 셀)** 가 다시 렌더됨. 각 셀에서 `summaryMap`, `selectedDate`, `formatCellAmount` 등에 접근하므로 렌더 비용이 큼. |
| **연쇄 setState** | `setSelectedDate` → 리렌더 → `useEffect`에서 `setLoadingDetail(true)` → 또 리렌더. 탭 한 번에 여러 번의 리렌더가 나와 체감 지연이 생김. |
| **바텀시트 열기 300ms** | 탭 직후 바텀시트가 300ms 동안 올라오므로, “눌렀더니 바로 반응했다”는 느낌이 줄어듦. |
| **DB 조회** | `getTransactionsByDate(selectedDate)`가 비동기라도 느리면 로딩 스피너가 오래 보이고, 동기적이면 JS 스레드를 잠깐이라도 막을 수 있어 반응이 무거워 보일 수 있음. |

---

## 3. 요약

- **팝업에서 내역 탭 시**:  
  “내역 탭 → 즉시 `setSelectedDate(null)` → 팝업 닫기 애니메이션(150ms) + 화면 전환”이 겹쳐서 **어색하고**, “닫히는 걸 보고 나서 전환”처럼 느껴져 **반응이 늘어 보임**.
- **캘린더 일자 탭 시**:  
  **한 번의 탭**에 **전체 달력 리렌더 + markedDates 재계산 + 바텀시트 300ms 열기 + 로딩 setState + DB 조회**가 묶여 있어, **렌더/애니메이션/데이터 로딩**이 합쳐져 반응이 느리게 느껴짐.

원하면 다음 단계로 “내역 탭 시 팝업 닫지 않고 바로 이동” / “일자 탭 시 가벼운 피드백 + 바텀시트 애니메이션 단축” 같은 구체적인 수정안도 정리해 줄 수 있음.
