# Gesture Slides

카메라로 손을 인식해서 슬라이드를 넘기는 발표용 웹 앱입니다. MediaPipe 손 인식을 사용해 검지 끝의 이동을 추적하고, 오른쪽 스와이프/왼쪽 스와이프로 다음/이전 슬라이드를 넘깁니다.

## 기능

- 브라우저 카메라 사용
- MediaPipe 기반 손 인식
- 손 스와이프 제스처 판정
- 다음 / 이전 슬라이드 이동
- 모바일 브라우저에서도 실행 가능
- 발표용 데모 슬라이드 포함

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
npm run preview
```

## 조작법

- 손을 카메라에 보이게 둡니다.
- 오른쪽으로 크게 스와이프 → 다음 슬라이드
- 왼쪽으로 크게 스와이프 → 이전 슬라이드
- 오작동 방지를 위한 짧은 쿨다운이 있습니다.

## 기술 스택

- React
- Vite
- MediaPipe Tasks Vision
