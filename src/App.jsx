import { useEffect, useMemo, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import './App.css'

const defaultSlides = [
  {
    id: 1,
    title: 'Gesture Slides',
    body: '카메라로 손을 인식해서 발표 슬라이드를 넘기는 웹 앱이야. 오른쪽으로 스와이프하면 다음 장, 왼쪽이면 이전 장.',
    accent: 'rgba(255, 181, 143, 0.35)',
  },
  {
    id: 2,
    title: 'How it works',
    body: 'MediaPipe가 손 landmark를 추적하고, 검지 끝의 최근 이동량을 분석해 스와이프 방향을 판정해. 오작동 방지를 위해 쿨다운도 넣었어.',
    accent: 'rgba(145, 115, 255, 0.3)',
  },
  {
    id: 3,
    title: 'Presenter flow',
    body: '손바닥을 카메라에 보여준 뒤 검지 기준으로 좌우로 휘두르면 돼. 노트북 웹캠이나 휴대폰 카메라 둘 다 가능해.',
    accent: 'rgba(130, 214, 189, 0.35)',
  },
  {
    id: 4,
    title: 'Image Slides',
    body: '이제 PDF를 이미지로 뽑거나 PPT 슬라이드를 PNG/JPG로 내보내서 업로드하면, 실제 발표 자료처럼 넘길 수 있어.',
    accent: 'rgba(255, 217, 111, 0.35)',
  },
]

const FRAME_WIDTH = 420
const FRAME_HEIGHT = 260
const SWIPE_THRESHOLD = 160
const COOLDOWN_MS = 1400

function App() {
  const videoRef = useRef(null)
  const landmarkerRef = useRef(null)
  const animationRef = useRef(null)
  const positionBufferRef = useRef([])
  const lastTriggerRef = useRef(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [permissionError, setPermissionError] = useState('')
  const [slideIndex, setSlideIndex] = useState(0)
  const [pointer, setPointer] = useState({ x: FRAME_WIDTH / 2, y: FRAME_HEIGHT / 2, visible: false })
  const [gestureStatus, setGestureStatus] = useState('손을 화면에 올리고 좌우로 크게 흔들어봐.')
  const [uploadedSlides, setUploadedSlides] = useState([])

  useEffect(() => {
    let mounted = true
    const videoElement = videoRef.current

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (!mounted || !videoElement) return
        videoElement.srcObject = stream
        await videoElement.play()

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        )
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          numHands: 1,
          runningMode: 'VIDEO',
        })

        landmarkerRef.current = handLandmarker
        setCameraReady(true)
        setGestureStatus('준비 완료. 오른쪽 스와이프는 다음, 왼쪽은 이전.')
      } catch (error) {
        setPermissionError(error.message || '카메라를 사용할 수 없어.')
      }
    }

    setupCamera()

    return () => {
      mounted = false
      cancelAnimationFrame(animationRef.current)
      landmarkerRef.current?.close?.()
      const stream = videoElement?.srcObject
      stream?.getTracks?.().forEach((track) => track.stop())
    }
  }, [])

  const slides = useMemo(() => {
    if (uploadedSlides.length > 0) return uploadedSlides
    return defaultSlides
  }, [uploadedSlides])

  useEffect(() => {
    if (!cameraReady || !videoRef.current || !landmarkerRef.current) return

    const tick = () => {
      const video = videoRef.current
      const results = landmarkerRef.current.detectForVideo(video, performance.now())
      const landmarks = results?.landmarks?.[0]

      if (landmarks?.[8] && landmarks?.[5]) {
        const indexTip = landmarks[8]
        const indexBase = landmarks[5]
        const x = (1 - indexTip.x) * FRAME_WIDTH
        const y = indexTip.y * FRAME_HEIGHT
        setPointer({ x, y, visible: true })

        const now = performance.now()
        const openness = Math.abs(indexTip.y - indexBase.y)
        positionBufferRef.current.push({ x, time: now, openness })
        positionBufferRef.current = positionBufferRef.current.filter((item) => now - item.time < 500)

        if (positionBufferRef.current.length >= 3 && now - lastTriggerRef.current > COOLDOWN_MS) {
          const first = positionBufferRef.current[0]
          const last = positionBufferRef.current[positionBufferRef.current.length - 1]
          const deltaX = last.x - first.x
          const averageOpenness =
            positionBufferRef.current.reduce((sum, item) => sum + item.openness, 0) /
            positionBufferRef.current.length

          if (averageOpenness > 0.08 && deltaX > SWIPE_THRESHOLD) {
            setSlideIndex((current) => Math.min(current + 1, slides.length - 1))
            setGestureStatus('👉 다음 슬라이드')
            lastTriggerRef.current = now
            positionBufferRef.current = []
          } else if (averageOpenness > 0.08 && deltaX < -SWIPE_THRESHOLD) {
            setSlideIndex((current) => Math.max(current - 1, 0))
            setGestureStatus('👈 이전 슬라이드')
            lastTriggerRef.current = now
            positionBufferRef.current = []
          }
        }
      } else {
        setPointer((current) => ({ ...current, visible: false }))
        positionBufferRef.current = []
      }

      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationRef.current)
  }, [cameraReady, slides.length])

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    const mapped = await Promise.all(
      imageFiles.map(
        (file, index) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                id: `${file.name}-${index}`,
                title: file.name,
                image: String(reader.result),
                accent: 'rgba(255,255,255,0.88)',
              })
            }
            reader.readAsDataURL(file)
          }),
      ),
    )

    setUploadedSlides(mapped)
    setSlideIndex(0)
    setGestureStatus(`${mapped.length}장 업로드 완료. 손 스와이프로 넘겨봐.`)
  }

  const safeSlideIndex = Math.min(slideIndex, Math.max(slides.length - 1, 0))
  const currentSlide = slides[safeSlideIndex]
  const pageLabel = useMemo(() => `${safeSlideIndex + 1} / ${slides.length}`, [safeSlideIndex, slides.length])

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <span className="eyebrow">0401 Presentation Tool</span>
          <h1>Gesture Slides</h1>
          <p className="lead">
            카메라 앞에서 손을 좌우로 흔들면 슬라이드가 넘어가는 발표용 웹 앱이야.
            이제 PNG/JPG 슬라이드 이미지를 업로드해서 실제 발표 자료처럼 쓸 수 있어.
          </p>
        </div>

        <div className="meta-grid">
          <div className="meta-card accent">
            <span>현재 슬라이드</span>
            <strong>{pageLabel}</strong>
          </div>
          <div className="meta-card">
            <span>카메라 상태</span>
            <strong>{cameraReady ? '준비 완료' : '준비 중'}</strong>
          </div>
          <div className="meta-card">
            <span>제스처 상태</span>
            <strong>{gestureStatus}</strong>
          </div>
        </div>
      </section>

      {permissionError ? <div className="notice error">카메라 오류: {permissionError}</div> : null}

      <section className="upload-strip">
        <label className="upload-card">
          <span className="upload-title">슬라이드 이미지 업로드</span>
          <small>PDF/PPT를 PNG/JPG로 저장한 뒤 여러 장 한 번에 선택</small>
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
        </label>
        {uploadedSlides.length > 0 ? (
          <button type="button" className="secondary-button" onClick={() => setUploadedSlides([])}>
            기본 데모 슬라이드로 복귀
          </button>
        ) : null}
      </section>

      <section className="content-grid">
        <article className="slide-stage" style={{ '--accent': currentSlide.accent }}>
          <div className="slide-badge">Slide {pageLabel}</div>
          {currentSlide.image ? (
            <div className="image-slide">
              <img src={currentSlide.image} alt={currentSlide.title} />
            </div>
          ) : (
            <>
              <h2>{currentSlide.title}</h2>
              <p>{currentSlide.body}</p>
            </>
          )}
          <div className="slide-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === safeSlideIndex ? 'dot active' : 'dot'}
                onClick={() => setSlideIndex(index)}
                aria-label={`슬라이드 ${index + 1}로 이동`}
              />
            ))}
          </div>
        </article>

        <aside className="camera-panel">
          <div className="camera-frame" style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}>
            <video ref={videoRef} className="camera-view" playsInline muted />
            <div className="camera-overlay">
              {pointer.visible ? (
                <div className="pointer" style={{ left: pointer.x - 16, top: pointer.y - 16 }} />
              ) : null}
            </div>
          </div>

          <div className="info-card">
            <h3>조작법</h3>
            <ul>
              <li>오른쪽으로 크게 스와이프 → 다음 슬라이드</li>
              <li>왼쪽으로 크게 스와이프 → 이전 슬라이드</li>
              <li>검지를 충분히 펴고 움직이면 더 안정적이야</li>
              <li>짧은 쿨다운으로 오작동을 줄였어</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
