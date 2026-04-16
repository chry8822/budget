# EAS 빌드·스토어 배포 가이드

Expo Application Services(EAS)를 쓰는 이 프로젝트에서, **클라우드 빌드**와 **스토어 업로드·심사**가 어떻게 분리되는지 정리합니다.

---

## 1. 한 줄 요약

| 구분 | 이 저장소 상태 |
|------|----------------|
| Git 푸시 시 자동 CI 빌드·배포 | **없음** (`.github/workflows` 등 미구성) |
| EAS 클라우드 빌드 | **구성됨** — `eas.json`, `app.json`의 `projectId`, `npm run release` |
| 빌드 직후 Play/App Store 자동 제출 | **기본 아님** — `release` 스크립트에 **`--auto-submit`**을 줄 때만 |

로컬의 `npm run android` / `npm run ios`는 **개발용 네이티브 실행**(`expo run:…`)이며, 스토어 자동 배포와는 무관합니다.

---

## 2. 관련 파일

| 파일 | 역할 |
|------|------|
| `eas.json` | EAS 빌드 프로필(`development`, `preview`, `production` 등), `submit.production` |
| `app.json` | `expo.extra.eas.projectId`, 번들 ID·패키지명 |
| `scripts/release.js` | 버전 범프, `RELEASE_NOTES.md` 갱신, `eas build` 실행 |
| `RELEASE_NOTES.md` | 스토어용 출시 노트(한국어) 누적 |

---

## 3. 릴리즈 스크립트 동작 (`scripts/release.js`)

실행 예:

```bash
npm run release -- patch all
npm run release -- minor android
npm run release -- patch ios --auto-submit
```

인자:

1. **`patch` | `minor` | `major`** — `app.json` / `package.json` 버전 범프
2. **`android` | `ios` | `all`** (생략 시 `all`) — `eas build --platform`에 그대로 전달
3. **`--auto-submit`** (선택) — 있으면 `eas build`에 `--auto-submit`을 붙여, 빌드 성공 후 EAS가 스토어 제출까지 진행

**기본(세 번째 인자 없음)** 은 `eas build`만 실행하므로, **아티팩트는 EAS에서 생성되고 스토어로는 자동으로 올라가지 않습니다.**

---

## 4. `eas.json` 빌드 프로필 요약

- **`development`** — 개발 클라이언트, 내부 배포
- **`preview`** — 내부 배포용 프리뷰
- **`production`** — 스토어용 프로덕션 빌드, `autoIncrement`로 빌드 번호 증가
- **`production-apk`** — Android APK 타입(문서·테스트용으로 `SAFE_AREA_ANALYSIS.md` 등에서 언급)

`submit.production`은 빈 객체(`{}`)로 두었으며, 자동 제출 시 EAS 기본·계정에 연결된 자격 증명을 사용합니다. 서비스 계정·ASC API 키 등은 [Expo Submit 문서](https://docs.expo.dev/submit/introduction/)에 맞춰 EAS/로컬에 설정합니다.

---

## 5. 원하는 워크플로: “빌드만 자동, 제출·심사는 사람이”

다음 순서가 **빌드와 스토어 심사를 분리**하는 일반적인 형태입니다.

1. **`--auto-submit` 없이** 릴리즈 실행  
   예: `npm run release -- patch all`
2. [expo.dev](https://expo.dev)에서 해당 프로젝트 → 빌드가 완료될 때까지 대기
3. 필요 시 **Expo 대시보드에서 Submit** 하거나, 터미널에서  
   `eas submit --platform android` / `eas submit --platform ios`  
   (프로필·자격 증명은 EAS 문서 및 대화형 설정에 따름)
4. **Google Play Console** / **App Store Connect**에서 트랙·출시 노트·메타데이터 확인 후 **심사 제출**

### 왜 스토어 콘솔을 거쳐야 하나

- **Expo / `eas submit`**: 주로 **바이너리 업로드**와 EAS가 지원하는 범위의 자동화
- **Play Console / App Store Connect**: 프로덕션(또는 단계별) 트랙, 정책·스크린샷·일부 출시 설정, **“심사에 제출”** 버튼 등은 플랫폼 정책상 개발자가 콘솔에서 처리하는 경우가 많음

즉, “Expo 대시보드만 들어가면 끝”이 아니라, **바이너리 준비는 EAS**, **최종 심사·출시 흐름은 각 스토어**에서 이어지는 것이 보통입니다.

---

## 6. 자동 제출을 켜고 싶을 때

명시적으로 다음처럼 실행합니다.

```bash
npm run release -- patch all --auto-submit
```

빌드가 성공한 뒤 EAS가 연결된 스토어에 제출을 시도합니다. 자격 증명·트랙·앱 상태 오류 시 CLI/대시보드 로그를 확인해야 합니다.

---

## 7. Git 푸시만으로 EAS 빌드를 돌리고 싶다면

현재 저장소에는 **GitHub Actions 등 CI 설정이 없습니다.**  
푸시 시 자동으로 `eas build`를 돌리려면 별도로 **CI 워크플로**(예: GitHub Actions + `expo-github-action` / EAS CLI + 시크릿)를 추가하는 작업이 필요합니다. 이 문서는 그 구성을 포함하지 않습니다.

---

## 8. 참고 링크

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
