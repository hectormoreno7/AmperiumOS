import { useEffect, useRef, useState } from 'react'
import styles from './SignaturePad.module.css'

function SignaturePad({ label, value, onChange }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const [hasSignature, setHasSignature] = useState(Boolean(value))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.lineWidth = 2
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = '#17191d'
    context.clearRect(0, 0, width, height)

    if (value) {
      const image = new Image()
      image.onload = () => context.drawImage(image, 0, 0, width, height)
      image.src = value
    }
  }, [value])

  const getPoint = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const source = event.touches?.[0] || event
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    }
  }

  const startDrawing = (event) => {
    event.preventDefault()
    const context = canvasRef.current.getContext('2d')
    const point = getPoint(event)
    drawingRef.current = true
    context.beginPath()
    context.moveTo(point.x, point.y)
  }

  const draw = (event) => {
    if (!drawingRef.current) return
    event.preventDefault()
    const context = canvasRef.current.getContext('2d')
    const point = getPoint(event)
    context.lineTo(point.x, point.y)
    context.stroke()
    setHasSignature(true)
  }

  const finishDrawing = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onChange(dataUrl)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    setHasSignature(false)
    onChange('')
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <strong>{label}</strong>
        <button type="button" onClick={clear} disabled={!hasSignature}>Limpiar</button>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
      />
      <span>Firma con el mouse o con el dedo.</span>
    </div>
  )
}

export default SignaturePad
