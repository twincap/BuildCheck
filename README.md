# PC 부품 호환성 견적 빌더

React로 만든 단일 웹사이트입니다. 사용자가 PC 부품을 검색해서 고르면 견적 금액과 호환성 결과가 즉시 바뀝니다.

## 실행

```bash
npm install
npm run dev
npm run build
npm run crawl:danawa
```

로컬 주소: `http://localhost:5171`

## 핵심 기능

- CPU, 메인보드, RAM, GPU, 파워, 케이스 선택
- 각 부품 섹터별 검색
- 선택 부품 기준 총 견적/예상 소비전력 계산
- CPU 소켓, RAM 규격, RAM 슬롯, GPU VRAM, GPU 길이, 파워 용량, GPU 보조전원, 파워 장착 공간 검사
- 다나와 카테고리/검색 페이지를 Node 스크립트로 크롤링해 raw 후보 데이터 생성
- 선택한 케이스 공간과 부품 크기 기준 비율 프리뷰 표시

## 다나와 크롤링

브라우저 프론트엔드에서 다나와를 직접 크롤링하면 CORS와 봇 차단 문제가 생길 수 있습니다. 그래서 `scripts/crawl-danawa.mjs`를 따로 두고 Node에서 카테고리 목록을 가져옵니다.

```bash
npm run crawl:danawa
```

결과 파일:

```text
data/danawa-raw.generated.json
```

React 화면은 `src/constants/data.ts`의 정규화된 seed 데이터와 `src/constants/danawa-raw.generated.json`의 크롤링 후보를 함께 검색합니다. 예를 들어 `RTX5090`처럼 공백 없는 검색어도 `RTX 5090` 결과와 매칭됩니다.

다나와 카테고리 기준:

- CPU: https://prod.danawa.com/list/?cate=112747
- 메인보드: https://prod.danawa.com/list/?cate=112751
- RAM: https://prod.danawa.com/list/?cate=112752
- GPU: https://prod.danawa.com/list/?cate=112753
- 케이스: https://prod.danawa.com/list/?cate=112775
- 파워: https://prod.danawa.com/list/?cate=112777

## 폴더 구조

```text
src/
  assets/       # 시각 자료
  components/   # 재사용 UI
  constants/    # 부품 데이터, 카테고리, 호환성 계산 함수
  pages/        # 화면 조립
  styles/       # 디자인 토큰과 전역 스타일
  App.tsx
  main.tsx
scripts/
  crawl-danawa.mjs
data/
  danawa-raw.generated.json
```

`components`에는 선택 카드, 요약 패널, 호환성 리포트처럼 다시 쓸 수 있는 UI를 넣었습니다. `constants`에는 화면 코드와 데이터를 분리해서 검색/필터/호환성 로직을 설명하기 쉽게 했습니다. `styles`에는 색상, 간격, radius 같은 디자인 규칙을 모았습니다.

## 디자인 시스템

| 항목 | 규칙 |
| --- | --- |
| 메인 색상 | `#1F8A70` |
| 배경 색상 | `#F5F8F4` |
| 글자 색상 | `#10231D` |
| 카드 색상 | `#FFFFFF`, 검색 필드 `#F8FBF8` |
| 상태 색상 | 정상 `#D9F99D`, 경고 `#FFE0D8`, 정보 `#DFF3FF` |
| 버튼 스타일 | 1px 라인, 선택 시 굵은 inset border와 부품별 포인트 배경 |
| 글자 크기 | 히어로 48-92px, 카드 제목 16-18px, 보조 텍스트 12-18px |
| 간격 | 6, 10, 16, 24, 36px 토큰 |
| border-radius | 카드 8px, 컨트롤 6px |

## 아이디어 선정 이유

PC 견적을 처음 맞추는 학생은 CPU 소켓, 메인보드 RAM 규격, 그래픽카드 길이, 파워 용량을 따로 찾아보다가 실수하기 쉽습니다. 그래서 부품을 고르는 순간 바로 호환성 결과를 보여주는 방식으로 기획했습니다. 정보 비교가 중요하므로 카드형 선택 UI와 오른쪽 요약/리포트 패널을 사용했습니다.

## 핵심 코드 설명

검색은 `PartSelector`에서 각 카테고리별 `query` 상태를 관리합니다. 사용자가 검색어를 입력하면 `getSearchText(part)`로 만든 문자열에 검색어가 포함되는지 확인하고, 필터링된 배열을 `map`으로 카드에 렌더링합니다.

호환성은 `getCompatibilityReport(selection)`에서 계산합니다. 사용자가 부품 카드를 누르면 `selection` 상태가 바뀌고, 이 값으로 선택된 CPU/메인보드/RAM/GPU/파워/케이스 데이터를 찾아 소켓, RAM 규격, 장착 공간, 파워 여유, 보조전원 조건을 비교합니다.

상단 프리뷰는 `BuildPreview`가 담당합니다. 선택된 케이스의 GPU 장착 길이, 파워 장착 길이, 메인보드 폼팩터, GPU 길이, VRAM, 파워 용량을 읽어서 CSS 도형 비율을 바꿉니다.

## 브랜치 전략

요청 종류에 따라 브랜치를 선택합니다.

```text
main
design/ui-system
feature/compatibility-builder
```

- 디자인 색상, 레이아웃, 카드 스타일 요청: `design/ui-system`
- 검색, 필터, 호환성 계산, 크롤링 같은 기능 요청: `feature/compatibility-builder`
- 기본 문서/배포 설정: `main`

현재 기능 개발은 `feature/compatibility-builder`에서 진행합니다. 작업 후 해당 브랜치를 push하고 GitHub에서 `feature/compatibility-builder -> main` PR을 만듭니다.

## 배포

Vercel Root Directory는 저장소 루트입니다.

- GitHub 레포: https://github.com/twincap/BuildCheck.git
- Vercel 배포 링크: 배포 후 입력
