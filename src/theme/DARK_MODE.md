# 다크모드 도입 가이드 (디자인 시스템 기반)

## 현재 상태

- **colors**: `background`, `surface`, `primary`, `onPrimary`, `text`, `textMuted`, `border`, `tabBarBackground`, `chartOther` 등이 **단일 팔레트**로 정의되어 있음.
- **spacing / typography**: 색상과 무관하게 라이트/다크 공통 사용 가능.
- 대부분의 화면·컴포넌트가 `theme.colors.xxx`, `theme.spacing.xxx`, `theme.typography.xxx`만 사용하도록 정리되어 있음.

→ **색상이 모두 theme을 통해 주입되고 있으므로, theme만 바꿔 주면 다크모드를 최소 작업으로 적용할 수 있음.**

---

## 권장 방식: Theme Context + light/dark 팔레트

### 1. 구조

- **`theme/colorsLight.ts`**  
  현재 `colors.ts` 내용을 그대로 옮김 (라이트 팔레트).
- **`theme/colorsDark.ts`**  
  같은 키를 유지한 채 다크용 값만 정의.

  예시:

  ```ts
  // colorsDark.ts
  const colorsDark = {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#FF6B6B',        // 포인트 컬러는 유지 가능
    primarySoft: '#3D2A2A',
    onPrimary: '#FFFFFF',
    secondary: '#4ECDC4',
    text: '#E8E8E8',
    textMuted: '#9E9E9E',
    border: '#2C2C2C',
    tabBarBackground: '#1E1E1E',
    danger: '#FF4D4F',
    success: '#4ECDC4',
    income: '#64B5F6',
    chartOther: '#555555',
  };
  ```

- **`theme/index.ts`**  
  - 기존처럼 `theme` 객체를 만들되, **색상만** Context에서 받은 `isDark`에 따라 `colorsLight` / `colorsDark` 중 하나를 넣어서 사용.
  - 또는 **ThemeContext**에서 `theme` 객체 전체(colors + spacing + typography)를 제공.

- **`ThemeContext`**  
  - `isDark` (또는 `colorScheme: 'light' | 'dark'`) state.
  - 설정/시스템 설정에 따라 `isDark` 변경.
  - `theme` = `{ colors: isDark ? colorsDark : colorsLight, spacing, typography }` 형태로 제공.

- **App 루트**  
  - `ThemeProvider`로 앱을 감.
  - 기존에 `import theme from '../theme'` 하던 곳은 **`useTheme()`** 훅으로 대체 (또는 Context에서 theme 주입).

### 2. 컴포넌트/화면 수정 범위

- **이미 `theme.colors`만 쓰는 파일**  
  - import를 `const theme = useTheme()` (또는 props/context로 theme 받기)로 바꾸기만 하면 됨.
  - 스타일 코드는 그대로 두어도 됨.

- **하드코딩 색상**  
  - `#fff`, `#000`, `rgba(0,0,0,0.5)` 등이 남아 있으면, 다크모드에서 어울리지 않을 수 있음.  
  - 가능한 곳은 `theme.colors.xxx` 또는 theme 기반 스타일로 교체하는 것이 좋음 (이번 정리에서 대부분 제거됨).

- **차트/외부 라이브러리**  
  - `chartConfig`, `backgroundColor` 등에 theme 색을 넘기도록 한두 군데만 수정하면 됨.

### 3. 새 페이지/컴포넌트 추가 시

- **항상 `theme`(Context/useTheme)만 사용**  
  - 색: `theme.colors.xxx`  
  - 간격: `theme.spacing.xxx`  
  - 글자: `theme.typography.xxx`  
- 그러면 **새 화면을 추가할 때마다 다크모드를 따로 손댈 필요 없음.**  
  - theme만 light/dark로 바뀌면 자동으로 반영됨.

---

## 구현 체크리스트 (요약)

| 단계 | 내용 |
|------|------|
| 1 | `colorsLight.ts` / `colorsDark.ts` 분리 (기존 `colors.ts` 참고) |
| 2 | `ThemeContext` + `ThemeProvider` 추가, `theme` 객체를 context로 제공 |
| 3 | App 루트를 `ThemeProvider`로 감싸기 |
| 4 | 각 화면/컴포넌트에서 `import theme` → `useTheme()` (또는 context 소비)로 변경 |
| 5 | 설정 화면 또는 시스템 설정 연동으로 `isDark` 전환 |
| 6 | (선택) `app.json` / StatusBar 등에서 다크 테마 메타 반영 |

---

## 결론

- **디자인 시스템(theme)을 이미 쓰고 있으므로, 다크모드는 “theme 소스만 light/dark로 바꾸고, theme을 Context로 주입하는 것”으로 간단히 가능함.**
- **앞으로 새로 만드는 페이지/컴포넌트는 처음부터 theme만 사용하면, 추가 작업 없이 다크모드를 지원할 수 있음.**
