// Runner mode shape drawing functions

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const time = Date.now() / 200
  const wobble = Math.sin(time) * 0.2

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1 - Math.abs(wobble) * 0.3, 1) // Coin flip effect

  // Outer gold
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
  ctx.fill()

  // Inner shine
  ctx.fillStyle = '#FFF8DC'
  ctx.beginPath()
  ctx.arc(-size * 0.1, -size * 0.1, size * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Dollar sign or star
  ctx.fillStyle = '#B8860B'
  ctx.font = `bold ${size * 0.5}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', 0, 0)

  ctx.restore()
}

export function drawGem(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const time = Date.now() / 300
  const colorIndex = Math.floor(time) % 4
  const colors = ['#FF69B4', '#9B59B6', '#3498DB', '#2ECC71']
  const color = colors[colorIndex]

  ctx.save()
  ctx.translate(x, y)

  // Gem diamond shape
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -size / 2)           // Top
  ctx.lineTo(size / 2, 0)            // Right
  ctx.lineTo(0, size / 2)            // Bottom
  ctx.lineTo(-size / 2, 0)           // Left
  ctx.closePath()
  ctx.fill()

  // Shine effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.beginPath()
  ctx.moveTo(0, -size / 2)
  ctx.lineTo(size / 4, -size / 6)
  ctx.lineTo(0, 0)
  ctx.lineTo(-size / 4, -size / 6)
  ctx.closePath()
  ctx.fill()

  // Sparkle
  const sparkleAngle = time * 2
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  for (let i = 0; i < 4; i++) {
    const angle = sparkleAngle + (Math.PI / 2) * i
    const sparkleX = Math.cos(angle) * size * 0.7
    const sparkleY = Math.sin(angle) * size * 0.7
    ctx.beginPath()
    ctx.moveTo(sparkleX - 3, sparkleY)
    ctx.lineTo(sparkleX + 3, sparkleY)
    ctx.moveTo(sparkleX, sparkleY - 3)
    ctx.lineTo(sparkleX, sparkleY + 3)
    ctx.stroke()
  }

  ctx.restore()
}

export function drawBarrier(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save()
  ctx.translate(x, y)

  // BIGGER barrier - more prominent
  const barWidth = size * 2.0
  const barHeight = size * 1.2

  // Shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(-barWidth / 2 + 4, -barHeight / 2 + 4, barWidth, barHeight)

  // Candy cane striped barrier - BRIGHT RED
  ctx.fillStyle = '#FF3333'
  ctx.fillRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight)

  // White stripes
  ctx.fillStyle = 'white'
  const stripeWidth = barWidth / 6
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-barWidth / 2 + stripeWidth * (i * 2 + 1), -barHeight / 2, stripeWidth, barHeight)
  }

  // Bold border
  ctx.strokeStyle = '#CC0000'
  ctx.lineWidth = 3
  ctx.strokeRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight)

  // Posts
  ctx.fillStyle = '#654321'
  ctx.fillRect(-barWidth / 2 - 8, -barHeight / 2 - 5, 12, barHeight + 20)
  ctx.fillRect(barWidth / 2 - 4, -barHeight / 2 - 5, 12, barHeight + 20)

  ctx.restore()
}

export function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save()
  ctx.translate(x, y)

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.beginPath()
  ctx.ellipse(4, 4, size * 0.8, size * 0.65, 0, 0, Math.PI * 2)
  ctx.fill()

  // Main rock body - BIGGER cartoon boulder
  ctx.fillStyle = '#5D6D7E'
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.8, size * 0.65, 0, 0, Math.PI * 2)
  ctx.fill()

  // Darker shading
  ctx.fillStyle = '#4A5568'
  ctx.beginPath()
  ctx.ellipse(size * 0.15, size * 0.15, size * 0.55, size * 0.45, 0, 0, Math.PI * 2)
  ctx.fill()

  // Highlight
  ctx.fillStyle = '#718096'
  ctx.beginPath()
  ctx.ellipse(-size * 0.2, -size * 0.2, size * 0.3, size * 0.2, -0.5, 0, Math.PI * 2)
  ctx.fill()

  // Bold outline
  ctx.strokeStyle = '#2D3748'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(0, 0, size * 0.8, size * 0.65, 0, 0, Math.PI * 2)
  ctx.stroke()

  // Googly eyes - BIGGER!
  const eyeSize = size * 0.2

  // Left eye white
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(-size * 0.2, -size * 0.1, eyeSize, 0, Math.PI * 2)
  ctx.fill()

  // Right eye white
  ctx.beginPath()
  ctx.arc(size * 0.15, -size * 0.15, eyeSize, 0, Math.PI * 2)
  ctx.fill()

  // Pupils (looking at player)
  ctx.fillStyle = 'black'
  ctx.beginPath()
  ctx.arc(-size * 0.18, -size * 0.08, eyeSize * 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(size * 0.17, -size * 0.13, eyeSize * 0.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

export function drawRunnerCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  isJumping: boolean
): void {
  ctx.save()
  ctx.translate(x, y)

  // Body (round)
  const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
  bodyGradient.addColorStop(0, '#FFE0B2')
  bodyGradient.addColorStop(1, '#FFCC80')
  ctx.fillStyle = bodyGradient
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2)
  ctx.fill()

  // Face
  // Eyes
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.ellipse(-size * 0.25, -size * 0.15, size * 0.2, size * 0.22, 0, 0, Math.PI * 2)
  ctx.ellipse(size * 0.25, -size * 0.15, size * 0.2, size * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()

  // Pupils
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(-size * 0.22, -size * 0.12, size * 0.1, 0, Math.PI * 2)
  ctx.arc(size * 0.28, -size * 0.12, size * 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Smile (bigger when jumping!)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (isJumping) {
    // Big open smile
    ctx.arc(0, size * 0.1, size * 0.35, 0.2, Math.PI - 0.2)
  } else {
    // Regular smile
    ctx.arc(0, size * 0.05, size * 0.25, 0.3, Math.PI - 0.3)
  }
  ctx.stroke()

  // Rosy cheeks
  ctx.fillStyle = 'rgba(255, 150, 150, 0.4)'
  ctx.beginPath()
  ctx.ellipse(-size * 0.45, size * 0.1, size * 0.12, size * 0.08, 0, 0, Math.PI * 2)
  ctx.ellipse(size * 0.45, size * 0.1, size * 0.12, size * 0.08, 0, 0, Math.PI * 2)
  ctx.fill()

  // Arms (raised when jumping)
  ctx.strokeStyle = '#FFCC80'
  ctx.lineWidth = size * 0.2
  ctx.lineCap = 'round'

  if (isJumping) {
    // Arms up!
    ctx.beginPath()
    ctx.moveTo(-size * 0.6, 0)
    ctx.lineTo(-size * 0.9, -size * 0.6)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(size * 0.6, 0)
    ctx.lineTo(size * 0.9, -size * 0.6)
    ctx.stroke()
  } else {
    // Arms down/running
    const armSwing = Math.sin(Date.now() / 100) * 0.2
    ctx.beginPath()
    ctx.moveTo(-size * 0.6, size * 0.1)
    ctx.lineTo(-size * 0.8, size * 0.4 + armSwing * size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(size * 0.6, size * 0.1)
    ctx.lineTo(size * 0.8, size * 0.4 - armSwing * size)
    ctx.stroke()
  }

  // Legs (bouncing)
  const legBounce = Math.sin(Date.now() / 80) * 0.15
  ctx.beginPath()
  ctx.moveTo(-size * 0.3, size * 0.6)
  ctx.lineTo(-size * 0.4, size + legBounce * size)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(size * 0.3, size * 0.6)
  ctx.lineTo(size * 0.4, size - legBounce * size)
  ctx.stroke()

  ctx.restore()
}
