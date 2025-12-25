// Pure functions to draw shapes on canvas

export function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number
): void {
  const spikes = 5
  const outerRadius = size / 2
  const innerRadius = size / 4

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (Math.PI * i) / spikes - Math.PI / 2
    const px = Math.cos(angle) * radius
    const py = Math.sin(angle) * radius

    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()

  // Gradient fill
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius)
  gradient.addColorStop(0, '#FFFF00')
  gradient.addColorStop(1, '#FFD700')
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.strokeStyle = '#FFA500'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.restore()
}

export function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.scale(size / 100, size / 100)

  ctx.beginPath()
  ctx.moveTo(0, -15)
  ctx.bezierCurveTo(-25, -45, -50, -15, -50, 10)
  ctx.bezierCurveTo(-50, 35, -25, 55, 0, 70)
  ctx.bezierCurveTo(25, 55, 50, 35, 50, 10)
  ctx.bezierCurveTo(50, -15, 25, -45, 0, -15)
  ctx.closePath()

  const gradient = ctx.createRadialGradient(-15, -15, 0, 0, 0, 60)
  gradient.addColorStop(0, '#FF69B4')
  gradient.addColorStop(1, '#FF1493')
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.strokeStyle = '#C71585'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.restore()
}

export function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  _rotation: number
): void {
  ctx.save()
  ctx.translate(x, y)

  const s = size / 80

  // Draw overlapping circles to make cloud shape
  ctx.beginPath()

  // Main body circles
  ctx.arc(-20 * s, 0, 25 * s, 0, Math.PI * 2)
  ctx.arc(20 * s, 0, 25 * s, 0, Math.PI * 2)
  ctx.arc(0, -10 * s, 30 * s, 0, Math.PI * 2)
  ctx.arc(-30 * s, 10 * s, 20 * s, 0, Math.PI * 2)
  ctx.arc(30 * s, 10 * s, 20 * s, 0, Math.PI * 2)

  ctx.fillStyle = '#90A4AE'
  ctx.fill()

  ctx.strokeStyle = '#607D8B'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.restore()
}

export function drawX(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)

  const halfSize = size / 2.5
  const thickness = size / 6

  ctx.beginPath()

  // Draw X shape
  ctx.moveTo(-halfSize, -halfSize + thickness / 2)
  ctx.lineTo(-halfSize + thickness / 2, -halfSize)
  ctx.lineTo(0, -thickness / 2)
  ctx.lineTo(halfSize - thickness / 2, -halfSize)
  ctx.lineTo(halfSize, -halfSize + thickness / 2)
  ctx.lineTo(thickness / 2, 0)
  ctx.lineTo(halfSize, halfSize - thickness / 2)
  ctx.lineTo(halfSize - thickness / 2, halfSize)
  ctx.lineTo(0, thickness / 2)
  ctx.lineTo(-halfSize + thickness / 2, halfSize)
  ctx.lineTo(-halfSize, halfSize - thickness / 2)
  ctx.lineTo(-thickness / 2, 0)
  ctx.closePath()

  ctx.fillStyle = '#EF5350'
  ctx.fill()

  ctx.strokeStyle = '#C62828'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.restore()
}

export function drawSmileyFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save()
  ctx.translate(x, y)

  // Face circle
  const gradient = ctx.createRadialGradient(-size / 5, -size / 5, 0, 0, 0, size)
  gradient.addColorStop(0, '#FFEB3B')
  gradient.addColorStop(1, '#FFC107')

  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#FF9800'
  ctx.lineWidth = 4
  ctx.stroke()

  // Eyes
  const eyeY = -size / 4
  const eyeX = size / 3
  const eyeSize = size / 5

  ctx.fillStyle = '#5D4037'
  ctx.beginPath()
  ctx.arc(-eyeX, eyeY, eyeSize, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2)
  ctx.fill()

  // Eye shine
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(-eyeX - 3, eyeY - 3, eyeSize / 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(eyeX - 3, eyeY - 3, eyeSize / 3, 0, Math.PI * 2)
  ctx.fill()

  // Smile
  ctx.strokeStyle = '#5D4037'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(0, size / 6, size / 2, 0.2 * Math.PI, 0.8 * Math.PI)
  ctx.stroke()

  ctx.restore()
}
