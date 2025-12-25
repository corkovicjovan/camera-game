import type { FallingObject, GameConfig, ObjectType, Particle, PlayerState, ScorePopup } from './types'

export class GameState {
  score: number = 0
  combo: number = 0
  maxCombo: number = 0
  player: PlayerState = {
    x: 0.5,
    leftEdge: 0.4,
    rightEdge: 0.6,
    width: 0.2,
    headY: 0.4
  }
  objects: FallingObject[] = []
  particles: Particle[] = []
  scorePopups: ScorePopup[] = []
  config: GameConfig

  private nextObjectId: number = 0
  private lastSpawnTime: number = 0

  constructor(canvasWidth: number, canvasHeight: number) {
    this.config = {
      spawnInterval: 1200,
      fallSpeed: 3,
      objectSize: 70,
      goodObjectChance: 0.8,
      catchZoneY: canvasHeight - 200,
      catchZoneHeight: 150,
      canvasWidth,
      canvasHeight
    }
  }

  updateDimensions(width: number, height: number): void {
    this.config.canvasWidth = width
    this.config.canvasHeight = height
    this.config.catchZoneY = height - 200
    this.config.objectSize = Math.min(70, width / 6)
  }

  setPlayerPosition(x: number, leftEdge: number, rightEdge: number, headY: number): void {
    this.player.x = x
    this.player.leftEdge = leftEdge
    this.player.rightEdge = rightEdge
    this.player.width = rightEdge - leftEdge
    this.player.headY = headY
  }

  update(_deltaTime: number, currentTime: number): { caught: FallingObject[], missed: FallingObject[] } {
    const caught: FallingObject[] = []
    const missed: FallingObject[] = []

    // Spawn new objects
    if (currentTime - this.lastSpawnTime > this.config.spawnInterval) {
      this.spawnObject()
      this.lastSpawnTime = currentTime
    }

    // Update falling objects - iterate backwards for in-place removal
    const canvasWidth = this.config.canvasWidth
    const canvasHeight = this.config.canvasHeight
    const screenBottom = canvasHeight + 50
    const playerLeft = this.player.leftEdge
    const playerRight = this.player.rightEdge

    // Body collision: detect from forehead down through torso
    // headY is at top of head, so collision starts there and goes down to cover body
    const headYPixels = this.player.headY * canvasHeight
    const collisionZoneTop = headYPixels + 20 // Start at forehead level (slightly below top of head)
    const collisionZoneBottom = headYPixels + 300 // Down through chest/torso

    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i]
      obj.y += obj.speed
      obj.rotation += 0.02

      // Remove if off screen
      if (obj.y > screenBottom) {
        // Missed a good object - break combo
        if (!obj.caught && obj.isGood) {
          this.combo = 0
        }
        this.objects.splice(i, 1)
        continue
      }

      // Remove caught objects after they pass off screen
      if (obj.caught && obj.y > canvasHeight + 50) {
        this.objects.splice(i, 1)
        continue
      }

      // Check collision at head level (not after passing)
      if (!obj.caught && obj.y >= collisionZoneTop && obj.y < collisionZoneBottom) {
        // Convert object X to normalized (0-1) position
        const objNormX = obj.x / canvasWidth
        const objHalfWidth = (obj.size / 2) / canvasWidth

        // Check collision with player body (overlap check)
        const objLeft = objNormX - objHalfWidth
        const objRight = objNormX + objHalfWidth

        if (objRight > playerLeft && objLeft < playerRight) {
          obj.caught = true
          if (obj.isGood) {
            this.score++
            this.combo++
            if (this.combo > this.maxCombo) {
              this.maxCombo = this.combo
            }
            caught.push(obj)
            this.spawnCatchParticles(obj)
            this.spawnScorePopup(obj)
          } else {
            // Hit a bad object - break combo
            this.combo = 0
            missed.push(obj)
          }
        }
      }
    }

    // Update particles and popups
    this.updateParticles()
    this.updateScorePopups()

    return { caught, missed }
  }

  private spawnObject(): void {
    const isGood = Math.random() < this.config.goodObjectChance
    const goodTypes: ObjectType[] = ['star', 'heart']
    const badTypes: ObjectType[] = ['cloud', 'x']

    const type = isGood
      ? goodTypes[Math.floor(Math.random() * goodTypes.length)]
      : badTypes[Math.floor(Math.random() * badTypes.length)]

    // Spawn anywhere horizontally with some margin
    const margin = this.config.objectSize
    const x = margin + Math.random() * (this.config.canvasWidth - margin * 2)

    this.objects.push({
      id: this.nextObjectId++,
      type,
      x,
      y: -this.config.objectSize,
      speed: this.config.fallSpeed + Math.random() * 1.5,
      size: this.config.objectSize * (0.8 + Math.random() * 0.4), // Some size variation
      rotation: Math.random() * Math.PI * 2,
      isGood,
      caught: false
    })
  }

  private spawnCatchParticles(obj: FallingObject): void {
    // Rainbow colors for high combos
    const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF']
    const colors = this.combo >= 5
      ? rainbowColors
      : obj.type === 'star'
        ? ['#FFD700', '#FFA500', '#FFFF00']
        : ['#FF69B4', '#FF1493', '#FFB6C1']

    // More particles for combos
    const particleCount = 12 + Math.min(this.combo, 10) * 2

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 3 + Math.random() * 3 + (this.combo * 0.3)

      this.particles.push({
        x: obj.x,
        y: obj.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8 + (this.combo * 0.5)
      })
    }
  }

  private spawnScorePopup(obj: FallingObject): void {
    // Show combo bonus for high combos
    const value = this.combo >= 5 ? this.combo : 1
    this.scorePopups.push({
      x: obj.x,
      y: obj.y,
      value,
      life: 1,
      scale: 1
    })
  }

  private updateScorePopups(): void {
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i]
      popup.y -= 2 // Float upward
      popup.life -= 0.02
      // Bouncy scale animation
      popup.scale = 1 + Math.sin(popup.life * Math.PI * 3) * 0.2

      if (popup.life <= 0) {
        this.scorePopups.splice(i, 1)
      }
    }
  }

  private updateParticles(): void {
    // Iterate backwards for in-place removal
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.2 // gravity
      p.life -= 0.03

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  reset(): void {
    this.score = 0
    this.combo = 0
    this.maxCombo = 0
    this.objects = []
    this.particles = []
    this.scorePopups = []
    this.lastSpawnTime = 0
    this.player = {
      x: 0.5,
      leftEdge: 0.4,
      rightEdge: 0.6,
      width: 0.2,
      headY: 0.4
    }
  }
}
