# PC 부품 호환성 견적 빌더

React로 만든 단일 웹사이트다. 기획서 주제인 **PC 부품 호환성 확인과 견적 구성**을 중심으로 개발한다.

## 실행

```bash
npm install
npm run dev
npm run build
```

로컬 주소: `http://localhost:5171`

## 핵심 기능 목표

- CPU, 메인보드, GPU, 파워, 케이스 선택
- 선택한 부품 기준 총 견적 금액 계산
- 소켓, 소비전력, 케이스 공간 호환성 확인

## 폴더 구조

```text
src/
  assets/       # 시각 자료
  components/   # 재사용 UI
  constants/    # 부품 데이터와 계산 함수
  pages/        # 화면 조립
  styles/       # 디자인 토큰과 전역 스타일
  App.tsx
  main.tsx
```

초기 `main` 브랜치에는 React/Vite 기본 구조만 둔다. 디자인과 기능은 별도 브랜치에서 나눠 작업한다.

## 디자인 시스템

| 항목 | 규칙 |
| --- | --- |
| 메인 색상 | `#1F8A70` |
| 배경 색상 | `#F5F8F4` |
| 글자 색상 | `#10231D` |
| 카드 색상 | `#FFFFFF` |
| 버튼 스타일 | 1px 라인, 선택 시 굵은 내부 테두리 |
| 글자 크기 | 히어로 48-92px, 카드 제목 18px, 본문 13-18px |
| 간격 | 6, 10, 16, 24, 36px 토큰 |
| border-radius | 카드 8px, 컨트롤 6px |

## 아이디어 선정 이유

PC 견적을 처음 짜는 학생은 CPU 소켓, 메인보드, 그래픽카드 길이, 파워 용량을 따로 확인해야 해서 실수하기 쉽다. 그래서 선택과 동시에 호환성 결과가 보이는 화면을 만들었다. 사용자는 부품을 고르면서 “이 조합으로 조립 가능한가”와 “총액이 얼마인가”를 빠르게 확인할 수 있다.

## 핵심 코드 설명

사용자가 부품 버튼을 누르면 `selection` 상태가 바뀐다. `getCompatibilityReport(selection)`은 선택된 CPU, 메인보드, GPU, 파워, 케이스 데이터를 찾고 소켓, 소비전력, 장착 길이를 비교한다. 계산 결과 배열은 `CompatibilityReport` 컴포넌트에서 `map`으로 렌더링된다.

## GitHub 브랜치 전략

이 프로젝트는 단일 레포에서 아래 흐름으로 작업한다.

```text
main
design/ui-system
feature/compatibility-builder
```

1. `main`에 기본 React 프로젝트와 문서를 둔다.
2. `design/ui-system`에서 색상, 레이아웃, 카드/버튼 디자인을 작업한다.
3. `feature/compatibility-builder`에서 부품 선택 상태와 호환성 계산 기능을 작업한다.
4. 두 브랜치를 각각 push한다.
5. GitHub에서 `design/ui-system -> main`, `feature/compatibility-builder -> main` PR을 만든다.
6. PR 설명에는 작업 내용, 디자인 의도, 핵심 기능, 확인한 내용을 적는다.

## 배포

Vercel Root Directory는 저장소 루트로 둔다.

- GitHub 레포 링크: 생성 후 입력
- Vercel 배포 링크: 생성 후 입력
