# 브랜치 / PR 전략

## 브랜치

```text
main
design/ui-system
feature/compatibility-builder
```

## 의도

- `main`: 기본 React 앱, README, 프로젝트 구조
- `design/ui-system`: 색상, 간격, 카드, 버튼, 반응형 레이아웃
- `feature/compatibility-builder`: 부품 선택 상태, 견적 합산, 호환성 계산

## PR 본문 예시

### design/ui-system -> main

```md
## 무엇을 만들었는지
- PC 견적 빌더 화면 레이아웃과 디자인 시스템 구현

## 디자인 의도
- 부품 비교가 중요하므로 카드형 선택 UI 사용
- 호환 결과는 오른쪽 리포트 패널로 고정해 빠르게 확인 가능

## 확인한 내용
- 데스크톱/모바일에서 UI 겹침 없음
- `npm run build`
```

### feature/compatibility-builder -> main

```md
## 무엇을 만들었는지
- 부품 선택 상태와 호환성 계산 기능 구현

## 핵심 기능
- 선택 상태 `selection` 변경
- CPU/메인보드 소켓 비교
- 파워 용량과 예상 소비전력 비교
- GPU 길이와 케이스 공간 비교

## 확인한 내용
- 선택 버튼 클릭 시 견적/리포트 변경
- `npm run build`
```
