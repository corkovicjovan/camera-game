import type { BackgroundCloud, FallingObject, GameConfig, Particle, PlayerState, ScorePopup } from '../game/types'
import { drawCloud, drawHeart, drawSmileyFace, drawStar, drawX } from './shapes'

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private bodyCanvas: HTMLCanvasElement | null = null

  // Cached dimensions to avoid getBoundingClientRect calls every frame
  private cachedWidth: number = 0
  private cachedHeight: number = 0

  // Cached gradients to avoid recreation every frame
  private skyGradient: CanvasGradient | null = null
  private lastSkyHeight: number = 0

  // Cached font strings
  private static readonly SCORE_FONT = 'bold 64px system-ui, -apple-system, sans-serif'
  private static readonly MILESTONE_FONT = 'bold 120px system-ui, -apple-system, sans-serif'
  private static readonly POPUP_FONT = 'bold 32px system-ui, -apple-system, sans-serif'
  private static readonly COMBO_FONT = 'bold 48px system-ui, -apple-system, sans-serif'

  // Background clouds
  private clouds: BackgroundCloud[] = []
  private cloudsInitialized: boolean = false

  // Rainbow colors for combo effects
  private static readonly RAINBOW = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF']

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

    // Cache dimensions
    this.cachedWidth = rect.width
    this.cachedHeight = rect.height

    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr

    this.ctx.scale(dpr, dpr)

    // Invalidate cached gradients on resize
    this.skyGradient = null
  }

  getWidth(): number {
    return this.cachedWidth
  }

  getHeight(): number {
    return this.cachedHeight
  }

  clear(): void {
    const width = this.cachedWidth
    const height = this.cachedHeight

    // Cache sky gradient, recreate only when height changes
    if (!this.skyGradient || this.lastSkyHeight !== height) {
      this.skyGradient = this.ctx.createLinearGradient(0, 0, 0, height)
      this.skyGradient.addColorStop(0, '#4FC3F7')
      this.skyGradient.addColorStop(0.7, '#B3E5FC')
      this.skyGradient.addColorStop(1, '#E3F2FD')
      this.lastSkyHeight = height
    }

    this.ctx.fillStyle = this.skyGradient
    this.ctx.fillRect(0, 0, width, height)

    // Initialize and draw background clouds
    this.updateAndDrawClouds()
  }

  private initClouds(): void {
    const width = this.cachedWidth
    const height = this.cachedHeight

    // Create 5-8 clouds at random positions
    const cloudCount = 5 + Math.floor(Math.random() * 4)
    this.clouds = []

    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.6, // Top 60% of screen
        size: 40 + Math.random() * 60,
        speed: 0.2 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.3
      })
    }
    this.cloudsInitialized = true
  }

  private updateAndDrawClouds(): void {
    if (!this.cloudsInitialized) {
      this.initClouds()
    }

    const width = this.cachedWidth

    for (const cloud of this.clouds) {
      // Move cloud
      cloud.x += cloud.speed

      // Wrap around
      if (cloud.x > width + cloud.size) {
        cloud.x = -cloud.size * 2
        cloud.y = Math.random() * this.cachedHeight * 0.5
      }

      // Draw fluffy cloud
      this.ctx.globalAlpha = cloud.opacity
      this.ctx.fillStyle = 'white'

      // Draw cloud as overlapping circles
      const cx = cloud.x
      const cy = cloud.y
      const s = cloud.size

      this.ctx.beginPath()
      this.ctx.arc(cx, cy, s * 0.4, 0, Math.PI * 2)
      this.ctx.arc(cx + s * 0.3, cy - s * 0.1, s * 0.35, 0, Math.PI * 2)
      this.ctx.arc(cx + s * 0.6, cy, s * 0.3, 0, Math.PI * 2)
      this.ctx.arc(cx + s * 0.3, cy + s * 0.15, s * 0.3, 0, Math.PI * 2)
      this.ctx.fill()
    }

    this.ctx.globalAlpha = 1
  }

  drawCatchZone(_config: GameConfig, _player: PlayerState): void {
    // Collision zone is now invisible - detection happens in GameState
  }

  drawPlayer(config: GameConfig, player: PlayerState): void {
    const { canvasHeight, canvasWidth } = config
    const centerX = player.x * canvasWidth
    const headYPixels = player.headY * canvasHeight

    // If we have a body canvas, draw the cutout
    if (this.bodyCanvas && this.bodyCanvas.width > 0) {
      const bodyHeight = canvasHeight * 0.55 // Body takes up 55% of screen height
      const bodyWidth = (this.bodyCanvas.width / this.bodyCanvas.height) * bodyHeight

      // Position: body with head at headY position
      const x = centerX - bodyWidth / 2
      const y = headYPixels - bodyHeight * 0.15 // Head is about 15% down from top of body

      this.ctx.save()

      // Mirror the body horizontally so movement feels natural
      this.ctx.translate(centerX, 0)
      this.ctx.scale(-1, 1)
      this.ctx.translate(-centerX, 0)

      // Draw the segmented body
      this.ctx.drawImage(
        this.bodyCanvas,
        x, y,
        bodyWidth, bodyHeight
      )

      this.ctx.restore()
    } else {
      // Fallback to smiley face if no body segmentation
      const size = 60
      drawSmileyFace(this.ctx, centerX, headYPixels + 50, size)
    }
  }

  drawObjects(objects: FallingObject[]): void {
    for (const obj of objects) {
      // Draw sparkle trail for good objects (before the object itself)
      if (obj.isGood && !obj.caught) {
        this.drawTrail(obj)
      }

      // Fade out caught objects
      if (obj.caught) {
        this.ctx.globalAlpha = 0.3
      }

      switch (obj.type) {
        case 'star':
          drawStar(this.ctx, obj.x, obj.y, obj.size, obj.rotation)
          break
        case 'heart':
          drawHeart(this.ctx, obj.x, obj.y, obj.size, obj.rotation)
          break
        case 'cloud':
          drawCloud(this.ctx, obj.x, obj.y, obj.size, obj.rotation)
          break
        case 'x':
          drawX(this.ctx, obj.x, obj.y, obj.size, obj.rotation)
          break
      }

      this.ctx.globalAlpha = 1
    }
  }

  private drawTrail(obj: FallingObject): void {
    const colors = obj.type === 'star'
      ? ['#FFD700', '#FFA500', '#FFFF00']
      : ['#FF69B4', '#FF1493', '#FFB6C1']

    // Draw 5 trailing sparkles
    for (let i = 1; i <= 5; i++) {
      const trailY = obj.y - i * 15
      const trailSize = obj.size * 0.15 * (1 - i * 0.15)
      const alpha = 0.6 - i * 0.1

      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = colors[i % colors.length]

      // Small sparkle/star shape
      this.ctx.beginPath()
      const offsetX = Math.sin(obj.rotation + i) * 8
      this.ctx.arc(obj.x + offsetX, trailY, trailSize, 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
  }

  drawParticles(particles: Particle[]): void {
    for (const p of particles) {
      this.ctx.globalAlpha = p.life
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
  }

  drawScore(score: number): void {
    const halfWidth = this.cachedWidth / 2

    this.ctx.font = Renderer.SCORE_FONT
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    this.ctx.fillText(score.toString(), halfWidth + 3, 23)

    // Main text
    this.ctx.fillStyle = 'white'
    this.ctx.fillText(score.toString(), halfWidth, 20)

    // Star icon next to score
    drawStar(this.ctx, halfWidth - 60, 50, 40, 0)
  }

  drawScorePopups(popups: ScorePopup[]): void {
    this.ctx.font = Renderer.POPUP_FONT
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    for (const popup of popups) {
      this.ctx.globalAlpha = popup.life

      // Scale effect
      this.ctx.save()
      this.ctx.translate(popup.x, popup.y)
      this.ctx.scale(popup.scale, popup.scale)

      // Rainbow color for combo popups
      if (popup.value >= 5) {
        const colorIndex = Math.floor(Date.now() / 100) % Renderer.RAINBOW.length
        this.ctx.fillStyle = Renderer.RAINBOW[colorIndex]
        this.ctx.strokeStyle = 'white'
        this.ctx.lineWidth = 3
        this.ctx.strokeText(`+${popup.value}`, 0, 0)
      } else {
        this.ctx.fillStyle = '#FFD700'
        this.ctx.strokeStyle = '#FF8C00'
        this.ctx.lineWidth = 2
        this.ctx.strokeText(`+${popup.value}`, 0, 0)
      }
      this.ctx.fillText(`+${popup.value}`, 0, 0)

      this.ctx.restore()
    }
    this.ctx.globalAlpha = 1
  }

  drawCombo(combo: number): void {
    if (combo < 2) return // Only show combo at 2+

    const width = this.cachedWidth

    this.ctx.font = Renderer.COMBO_FONT
    this.ctx.textAlign = 'right'
    this.ctx.textBaseline = 'top'

    // Rainbow effect for high combos
    if (combo >= 5) {
      const colorIndex = Math.floor(Date.now() / 100) % Renderer.RAINBOW.length
      this.ctx.fillStyle = Renderer.RAINBOW[colorIndex]
    } else {
      this.ctx.fillStyle = '#FF6B6B'
    }

    // Bouncy scale effect
    const scale = 1 + Math.sin(Date.now() / 100) * 0.1
    const text = `${combo}x COMBO!`

    this.ctx.save()
    this.ctx.translate(width - 20, 90)
    this.ctx.scale(scale, scale)
    this.ctx.strokeStyle = 'white'
    this.ctx.lineWidth = 3
    this.ctx.strokeText(text, 0, 0)
    this.ctx.fillText(text, 0, 0)
    this.ctx.restore()
  }

  drawMilestoneEffect(score: number): void {
    const width = this.cachedWidth
    const height = this.cachedHeight
    const centerX = width / 2
    const centerY = height / 2

    // Flash effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.fillRect(0, 0, width, height)

    // Big score text
    this.ctx.font = Renderer.MILESTONE_FONT
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillStyle = '#FFD700'
    this.ctx.strokeStyle = '#FF8C00'
    this.ctx.lineWidth = 6
    this.ctx.strokeText(score.toString(), centerX, centerY)
    this.ctx.fillText(score.toString(), centerX, centerY)
  }

  render(
    config: GameConfig,
    player: PlayerState,
    objects: FallingObject[],
    particles: Particle[],
    scorePopups: ScorePopup[],
    score: number,
    combo: number
  ): void {
    this.clear()
    this.drawCatchZone(config, player)
    this.drawObjects(objects)
    this.drawParticles(particles)
    this.drawScorePopups(scorePopups)
    this.drawPlayer(config, player)
    this.drawScore(score)
    this.drawCombo(combo)
  }
}
