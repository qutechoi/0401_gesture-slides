# Gesture Slides

카메라로 손을 인식해서 슬라이드를 넘기는 발표용 웹 앱입니다. MediaPipe 손 인식을 사용해 검지 끝의 이동을 추적하고, 오른쪽 스와이프/왼쪽 스와이프로 다음/이전 슬라이드를 넘깁니다.

## 기능

- 브라우저 카메라 사용
- MediaPipe 기반 손 인식
- 손 스와이프 제스처 판정
- 다음 / 이전 슬라이드 이동
- **PNG/JPG 슬라이드 이미지 업로드 지원**
- 모바일 브라우저에서도 실행 가능
- 발표용 데모 슬라이드 포함
- GitHub Pages 자동 배포 지원

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
- 검지를 충분히 펴고 크게 움직일수록 더 안정적입니다.
- 오작동 방지를 위한 쿨다운이 있습니다.

## 이미지 슬라이드 사용법

1. PowerPoint 또는 PDF 슬라이드를 **PNG/JPG 이미지**로 저장합니다.
2. 앱에서 여러 장을 한 번에 업로드합니다.
3. 업로드한 이미지가 슬라이드처럼 순서대로 표시됩니다.
4. 손 스와이프로 발표를 진행합니다.

## GitHub Pages 자동 배포 설정

1. **Settings → Pages**
2. **Source = GitHub Actions** 선택
3. `main` 브랜치에 push 하면 자동 배포

예상 주소:

```text
https://qutechoi.github.io/0401_gesture-slides/
```

## 기술 스택

- React
- Vite
- MediaPipe Tasks Vision
- GitHub Actions
- GitHub Pages
