import type { Lane, RunnerGameConfig, RunnerObject, RunnerParticle, RunnerPlayerState } from '../game/types'
import { drawCoin, drawGem, drawBarrier, drawRock, drawRunnerCharacter } from './runnerShapes'

export class RunnerRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private bodyCanvas: HTMLCanvasElement | null = null

  private cachedWidth: number = 0
  private cachedHeight: number = 0

  private trackGradient: CanvasGradient | null = null
  private lastTrackHeight: number = 0

  private static readonly SCORE_FONT = 'bold 48px system-ui, -apple-system, sans-serif'
  private static readonly LEVEL_FONT = 'bold 24px system-ui, -apple-system, sans-serif'
  private static readonly GAME_OVER_FONT = 'bold 72px system-ui, -apple-system, sans-serif'

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx
  }

  setBodyCanvas(canvas: HTMLCanvasElement): void {
    this.bodyCanvas = canvas
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()

    this.cachedWidth = rect.width
    this.cachedHeight = rect.height

    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr

    this.ctx.scale(dpr, dpr)
    this.trackGradient = null
  }

  getWidth(): number {
    return this.cachedWidth
  }

  getHeight(): number {
    return this.cachedHeight
  }

  private clear(): void {
    const width = this.cachedWidth
    const height = this.cachedHeight

    // Sky gradient - pastel rainbow candy theme
    if (!this.trackGradient || this.lastTrackHeight !== height) {
      this.trackGradient = this.ctx.createLinearGradient(0, 0, 0, height)
      this.trackGradient.addColorStop(0, '#E8F5E9')    // Light green top
      this.trackGradient.addColorStop(0.3, '#FFF3E0') // Light orange
      this.trackGradient.addColorStop(0.6, '#FCE4EC') // Light pink
      this.trackGradient.addColorStop(1, '#E1BEE7')   // Light purple bottom
      this.lastTrackHeight = height
    }

    this.ctx.fillStyle = this.trackGradient
    this.ctx.fillRect(0, 0, width, height)
  }

  private drawTrack(): void {
    const width = this.cachedWidth
    const height = this.cachedHeight

    // Vanishing point at top center
    const vanishX = width / 2
    const vanishY = height * 0.15

    // Track edges at bottom
    const trackMargin = width * 0.05
    const bottomLeft = trackMargin
    const bottomRight = width - trackMargin

    // Track surface with perspective
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    this.ctx.beginPath()
    this.ctx.moveTo(vanishX - 20, vanishY)
    this.ctx.lineTo(vanishX + 20, vanishY)
    this.ctx.lineTo(bottomRight, height)
    this.ctx.lineTo(bottomLeft, height)
    this.ctx.closePath()
    this.ctx.fill()

    // Lane dividers
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    this.ctx.lineWidth = 3
    this.ctx.setLineDash([20, 15])

    // Left lane divider
    const lane1X = (bottomRight - bottomLeft) / 3 + bottomLeft
    this.ctx.beginPath()
    this.ctx.moveTo(vanishX, vanishY)
    this.ctx.lineTo(lane1X, height)
    this.ctx.stroke()

    // Right lane divider
    const lane2X = ((bottomRight - bottomLeft) * 2) / 3 + bottomLeft
    this.ctx.beginPath()
    this.ctx.moveTo(vanishX, vanishY)
    this.ctx.lineTo(lane2X, height)
    this.ctx.stroke()

    this.ctx.setLineDash([])

    // Speed lines on sides
    this.drawSpeedLines()
  }

  private drawSpeedLines(): void {
    const width = this.cachedWidth
    const height = this.cachedHeight
    const time = Date.now() / 50

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 2

    // Left side speed lines
    for (let i = 0; i < 5; i++) {
      const y = ((time + i * 100) % height)
      const x = width * 0.02
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(x, y + 30)
      this.ctx.stroke()
    }

    // Right side speed lines
    for (let i = 0; i < 5; i++) {
      const y = ((time + i * 100 + 50) % height)
      const x = width * 0.98
      this.ctx.beginPath()
      this.ctx.moveTo(x, y)
      this.ctx.lineTo(x, y + 30)
      this.ctx.stroke()
    }
  }

  private getLaneX(lane: Lane, z: number): number {
    const width = this.cachedWidth
    const vanishX = width / 2
    const trackMargin = width * 0.05
    const bottomLeft = trackMargin
    const bottomRight = width - trackMargin
    const trackWidth = bottomRight - bottomLeft

    // Interpolate lane position based on depth
    const laneWidth = trackWidth / 3
    const bottomX = bottomLeft + laneWidth * lane + laneWidth / 2

    // Lerp toward vanishing point as z approaches 0
    return vanishX + (bottomX - vanishX) * z
  }

  getYFromZ(z: number): number {
    const height = this.cachedHeight
    const vanishY = height * 0.15
    return vanishY + (height - vanishY) * z
  }

  private getSizeFromZ(baseSize: number, z: number): number {
    return baseSize * (0.3 + z * 0.7)
  }

  drawObjects(objects: RunnerObject[]): void {
    // Sort by z so far objects render first
    const sorted = [...objects].sort((a, b) => a.z - b.z)

    for (const obj of sorted) {
      if (obj.collected) continue

      const x = this.getLaneX(obj.lane, obj.z)
      const y = this.getYFromZ(obj.z)
      const size = this.getSizeFromZ(obj.size, obj.z)

      switch (obj.type) {
        case 'coin':
          drawCoin(this.ctx, x, y, size)
          break
        case 'gem':
          drawGem(this.ctx, x, y, size)
          break
        case 'barrier':
          drawBarrier(this.ctx, x, y, size)
          break
        case 'rock':
          drawRock(this.ctx, x, y, size)
          break
      }
    }
  }

  drawPlayer(_config: RunnerGameConfig, player: RunnerPlayerState, playerX?: number): void {
    const width = this.cachedWidth
    const height = this.cachedHeight

    // Use actual body position if provided, otherwise calculate from lane
    let x: number
    if (playerX !== undefined) {
      // Direct body position - most natural!
      x = playerX * width
    } else {
      // Fallback to lane-based
      let currentLane = player.lane
      if (player.laneProgress > 0) {
        currentLane = player.lane + (player.targetLane - player.lane) * player.laneProgress as Lane
      }
      const centerX = width / 2
      const laneOffset = width * 0.15
      x = centerX + (currentLane - 1) * laneOffset
    }

    let y = height * 0.78

    // Jump animation - arc up and down
    if (player.isJumping) {
      const jumpHeight = 100
      const jumpArc = Math.sin(player.jumpProgress * Math.PI)
      y -= jumpHeight * jumpArc
    }

    // Invincibility blink
    if (player.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.5
    }

    // Draw player using body segmentation if available
    if (this.bodyCanvas && this.bodyCanvas.width > 0) {
      const bodyHeight = height * 0.35
      const bodyWidth = (this.bodyCanvas.width / this.bodyCanvas.height) * bodyHeight

      this.ctx.save()
      this.ctx.translate(x, 0)
      this.ctx.scale(-1, 1)
      this.ctx.translate(-x, 0)

      this.ctx.drawImage(
        this.bodyCanvas,
        x - bodyWidth / 2,
        y - bodyHeight * 0.7,
        bodyWidth,
        bodyHeight
      )
      this.ctx.restore()
    } else {
      // Fallback character
      drawRunnerCharacter(this.ctx, x, y, 50, player.isJumping)
    }

    this.ctx.globalAlpha = 1
  }

  drawParticles(particles: RunnerParticle[]): void {
    for (const p of particles) {
      this.ctx.globalAlpha = p.life
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
  }

  // Debug: visualize collision zones
  drawDebugCollision(
    playerX: number,
    playerBodyWidth: number,
    collisionZoneStart: number,
    collisionZoneEnd: number,
    objects: { lane: Lane; z: number; isCollectible: boolean; collected: boolean }[]
  ): void {
    const width = this.cachedWidth
    const height = this.cachedHeight

    // Player collision box (green) - uses actual collision zone from Z values
    const playerLeft = (playerX - playerBodyWidth / 2) * width
    const playerRight = (playerX + playerBodyWidth / 2) * width
    const boxTop = this.getYFromZ(collisionZoneStart)
    const boxBottom = this.getYFromZ(collisionZoneEnd)

    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'
    this.ctx.lineWidth = 3
    this.ctx.setLineDash([5, 5])
    this.ctx.strokeRect(playerLeft, boxTop, playerRight - playerLeft, boxBottom - boxTop)
    this.ctx.setLineDash([])

    // Draw object collision boxes
    const objHalfWidth = 0.12
    for (const obj of objects) {
      if (obj.collected) continue
      if (obj.z >= collisionZoneStart && obj.z <= collisionZoneEnd) {
        // Object is in collision zone - highlight it
        const objX = this.getLaneXNormalized(obj.lane)
        const objLeft = (objX - objHalfWidth) * width
        const objRight = (objX + objHalfWidth) * width
        const objY = this.getYFromZ(obj.z)

        this.ctx.strokeStyle = obj.isCollectible ? 'rgba(255, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)'
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(objLeft, objY - 30, objRight - objLeft, 60)
      }
    }

    // Label
    this.ctx.font = '14px monospace'
    this.ctx.fillStyle = 'lime'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`Player X: ${playerX.toFixed(2)}`, 10, height - 60)
    this.ctx.fillText(`Width: ${playerBodyWidth.toFixed(2)}`, 10, height - 40)
    this.ctx.fillText(`Zone: ${collisionZoneStart}-${collisionZoneEnd}`, 10, height - 20)
  }

  // Expose lane X calculation for debug
  private getLaneXNormalized(lane: Lane): number {
    return 0.2 + lane * 0.3
  }

  // Back button dimensions for hit testing
  getBackButtonBounds(): { x: number; y: number; width: number; height: number } {
    return { x: 15, y: 70, width: 100, height: 40 } // Below lives
  }

  drawBackButton(): void {
    const { x, y, width, height } = this.getBackButtonBounds()

    // Button background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    this.ctx.beginPath()
    this.ctx.roundRect(x, y, width, height, 10)
    this.ctx.fill()

    // Button border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    // Arrow and text
    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('← Back', x + width / 2, y + height / 2)
  }

  drawHUD(score: number, lives: number, level: number): void {
    const width = this.cachedWidth

    // Score (top center)
    this.ctx.font = RunnerRenderer.SCORE_FONT
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    this.ctx.fillText(score.toString(), width / 2 + 2, 22)
    this.ctx.fillStyle = '#FFD700'
    this.ctx.strokeStyle = '#FF8C00'
    this.ctx.lineWidth = 2
    this.ctx.strokeText(score.toString(), width / 2, 20)
    this.ctx.fillText(score.toString(), width / 2, 20)

    // Lives (top left) - draw hearts
    for (let i = 0; i < 3; i++) {
      const heartX = 30 + i * 40
      const heartY = 30
      if (i < lives) {
        this.drawHeart(heartX, heartY, 15, '#FF6B6B')
      } else {
        this.drawHeart(heartX, heartY, 15, '#ccc')
      }
    }

    // Level (top right)
    this.ctx.font = RunnerRenderer.LEVEL_FONT
    this.ctx.textAlign = 'right'
    this.ctx.fillStyle = '#9B59B6'
    this.ctx.fillText(`Level ${level}`, width - 20, 25)
  }

  private drawHeart(x: number, y: number, size: number, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    const topY = y - size * 0.4
    this.ctx.moveTo(x, y + size * 0.3)
    this.ctx.bezierCurveTo(x - size, y - size * 0.3, x - size * 0.5, topY - size * 0.3, x, topY + size * 0.2)
    this.ctx.bezierCurveTo(x + size * 0.5, topY - size * 0.3, x + size, y - size * 0.3, x, y + size * 0.3)
    this.ctx.fill()
  }

  drawGameOver(score: number, level: number): void {
    const width = this.cachedWidth
    const height = this.cachedHeight

    // Dim overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(0, 0, width, height)

    // Game Over text
    this.ctx.font = RunnerRenderer.GAME_OVER_FONT
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.strokeStyle = 'white'
    this.ctx.lineWidth = 4
    this.ctx.strokeText('Game Over!', width / 2, height * 0.35)
    this.ctx.fillText('Game Over!', width / 2, height * 0.35)

    // Score
    this.ctx.font = 'bold 36px system-ui'
    this.ctx.fillStyle = '#FFD700'
    this.ctx.fillText(`Score: ${score}`, width / 2, height * 0.5)

    // Level
    this.ctx.font = 'bold 24px system-ui'
    this.ctx.fillStyle = '#9B59B6'
    this.ctx.fillText(`Level ${level}`, width / 2, height * 0.58)

    // Encouragement
    this.ctx.font = 'bold 28px system-ui'
    this.ctx.fillStyle = 'white'
    this.ctx.fillText('Great try!', width / 2, height * 0.7)
  }

  render(
    config: RunnerGameConfig,
    player: RunnerPlayerState,
    objects: RunnerObject[],
    particles: RunnerParticle[],
    score: number,
    playerX?: number
  ): void {
    this.clear()
    this.drawTrack()
    this.drawObjects(objects)
    this.drawParticles(particles)
    this.drawPlayer(config, player, playerX)
    this.drawHUD(score, config.lives, config.level)
    this.drawBackButton()
  }
}
