# PC 부품 견적 빌더

React로 만든 PC 부품 호환성 견적 웹사이트입니다. 부품을 선택하면 장착 공간, 소비 전력, RAM 규격, 소켓, 파워 조건을 즉시 비교합니다.

## 실행

```bash
npm install
npm run dev
npm run build
```

로컬 주소: `http://localhost:5171`

## 핵심 기능

- CPU, 메인보드, RAM, GPU, 파워, 케이스 선택
- 검색어 입력 시 다나와 검색 페이지를 서버에서 실시간 크롤링
- 검색 결과 클릭 시 견적/호환성/프리뷰 즉시 반영
- 케이스 장착 공간과 GPU/파워 크기 비율 프리뷰
- 프리뷰 부품 클릭 시 해당 부품 탭으로 이동
- 2D/3D 프리뷰 모드 전환

## 다나와 실시간 검색

브라우저에서 다나와를 직접 fetch하면 CORS 문제가 생깁니다. 그래서 검색은 `/api/danawa-search` 서버 라우트가 처리합니다.

```text
/api/danawa-search?category=gpu&q=RTX5090&pages=4&limit=160
```

로컬 개발에서는 `vite.config.ts` middleware가 같은 API를 제공합니다. Vercel 배포에서는 `api/danawa-search.js`가 같은 역할을 합니다.

## 폴더 구조

```text
api/                  # Vercel API
server/               # 다나와 검색/파싱 공용 로직
src/
  components/         # UI 컴포넌트
  constants/          # 기본 부품 데이터, 호환성 계산
  pages/              # 화면 조립
  styles/             # 디자인 토큰/전역 스타일
```

## 핵심 코드 설명

`PartSelector`는 사용자가 검색어를 입력하면 debounce 후 `/api/danawa-search`를 호출합니다. 응답으로 받은 Danawa 부품은 `registerLiveParts()`로 임시 등록하고, 사용자가 카드를 누르면 `selection`에 해당 id가 저장됩니다.

`getCompatibilityReport(selection)`은 선택된 부품을 찾아 CPU 소켓, RAM 규격, GPU 길이, 케이스 공간, 파워 용량, 보조전원 조건을 비교합니다.

`BuildPreview`는 선택된 케이스의 장착 공간과 선택 부품 크기를 읽어 2D/3D 프리뷰 비율을 바꿉니다.

## 브랜치 전략

- 디자인 요청: `design/ui-system`
- 검색, 크롤링, 호환성 기능 요청: `feature/compatibility-builder`
- 기본 문서/배포 설정: `main`
