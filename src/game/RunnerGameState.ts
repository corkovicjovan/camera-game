import {
  type Lane,
  type RunnerGameConfig,
  type RunnerObject,
  type RunnerObjectType,
  type RunnerParticle,
  type RunnerPlayerState,
  DEFAULT_RUNNER_CONFIG
} from './types'

export type RunnerUpdateResult = {
  collected: RunnerObject[]
  crashed: RunnerObject[]
  gameOver: boolean
  leveledUp: boolean
}

export class RunnerGameState {
  score: number = 0
  player: RunnerPlayerState
  objects: RunnerObject[] = []
  particles: RunnerParticle[] = []
  config: RunnerGameConfig

  // Continuous player X position (0-1 normalized) - tracks actual body
  playerX: number = 0.5
  playerBodyWidth: number = 0.12 // Narrower collision for easier dodging

  private nextObjectId: number = 0
  private lastSpawnTime: number = 0
  private lastLevelScore: number = 0
  private readonly LEVEL_UP_SCORE = 500
  private readonly JUMP_DURATION = 700 // ms - slightly longer for visibility
  private jumpStartTime: number = 0

  constructor(canvasWidth: number, canvasHeight: number) {
    this.config = {
      ...DEFAULT_RUNNER_CONFIG,
      canvasWidth,
      canvasHeight
    }

    this.player = {
      lane: 1 as Lane,
      targetLane: 1 as Lane,
      laneProgress: 0,
      isJumping: false,
      jumpProgress: 0,
      isInvincible: false,
      invincibleUntil: 0
    }
  }

  updateDimensions(width: number, height: number): void {
    this.config.canvasWidth = width
    this.config.canvasHeight = height
  }

  // Now takes actual body position instead of mapping to lanes
  setPlayerPosition(centerX: number, _bodyWidth: number): void {
    this.playerX = centerX

    // Use a fixed narrow width for collision (easier to dodge)
    // But shrink it slightly more when near edges to make side dodges easier
    const distFromCenter = Math.abs(centerX - 0.5)
    const baseWidth = 0.10 // Narrow base collision
    const edgeShrink = distFromCenter * 0.08 // Shrink more when at edges
    this.playerBodyWidth = Math.max(0.06, baseWidth - edgeShrink)

    // Still update lane for compatibility, but collision uses continuous X
    let newLane: Lane
    if (centerX < 0.33) {
      newLane = 0
    } else if (centerX > 0.66) {
      newLane = 2
    } else {
      newLane = 1
    }
    this.player.lane = newLane
    this.player.targetLane = newLane
  }

  triggerJump(now: number): void {
    if (!this.player.isJumping) {
      this.player.isJumping = true
      this.player.jumpProgress = 0
      this.jumpStartTime = now
    }
  }

  update(_deltaTime: number, currentTime: number): RunnerUpdateResult {
    const result: RunnerUpdateResult = {
      collected: [],
      crashed: [],
      gameOver: false,
      leveledUp: false
    }

    // Update jump animation
    if (this.player.isJumping) {
      const jumpElapsed = currentTime - this.jumpStartTime
      this.player.jumpProgress = Math.min(1, jumpElapsed / this.JUMP_DURATION)

      if (this.player.jumpProgress >= 1) {
        this.player.isJumping = false
        this.player.jumpProgress = 0
      }
    }

    // Clear invincibility
    if (this.player.isInvincible && currentTime > this.player.invincibleUntil) {
      this.player.isInvincible = false
    }

    // Spawn new objects
    if (currentTime - this.lastSpawnTime > this.config.spawnInterval) {
      this.spawnObject()
      this.lastSpawnTime = currentTime
    }

    // Update objects (move toward player) - SLOWER for kids
    const speed = this.config.speed * 0.006 // Much slower movement
    // Collision zone moved up to match head/face position
    const collisionZoneStart = 0.55
    const collisionZoneEnd = 0.75

    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i]
      obj.z += speed

      // Remove if past player
      if (obj.z > 1.15) {
        this.objects.splice(i, 1)
        continue
      }

      // Check collision using CONTINUOUS X position
      if (!obj.collected && obj.z >= collisionZoneStart && obj.z <= collisionZoneEnd) {
        // Get object's X position (0-1 normalized based on lane)
        const objX = this.getLaneXNormalized(obj.lane)
        const objHalfWidth = 0.12 // Object collision width

        // Player collision bounds
        const playerLeft = this.playerX - this.playerBodyWidth / 2
        const playerRight = this.playerX + this.playerBodyWidth / 2
        const objLeft = objX - objHalfWidth
        const objRight = objX + objHalfWidth

        // Check horizontal overlap
        const horizontalOverlap = playerRight > objLeft && playerLeft < objRight

        if (horizontalOverlap) {
          if (obj.isCollectible) {
            // Collect coin/gem
            obj.collected = true
            this.score += obj.type === 'gem' ? 10 : 1
            result.collected.push(obj)
            this.spawnCollectParticles(obj)
          } else if (!this.player.isInvincible) {
            // Hit obstacle - check if jumping over it
            if (this.player.isJumping && this.player.jumpProgress > 0.15 && this.player.jumpProgress < 0.85) {
              // Successfully jumped over!
            } else {
              // Crash!
              obj.collected = true
              this.config.lives--
              this.player.isInvincible = true
              this.player.invincibleUntil = currentTime + 1500
              result.crashed.push(obj)

              if (this.config.lives <= 0) {
                result.gameOver = true
              }
            }
          }
        }
      }
    }

    // Check for level up
    if (this.score - this.lastLevelScore >= this.LEVEL_UP_SCORE) {
      this.levelUp()
      this.lastLevelScore = this.score
      result.leveledUp = true
    }

    // Update particles
    this.updateParticles()

    return result
  }

  private spawnObject(): void {
    const isObstacle = Math.random() < this.config.obstacleChance
    const lane = Math.floor(Math.random() * 3) as Lane

    let type: RunnerObjectType
    if (isObstacle) {
      type = Math.random() < 0.5 ? 'barrier' : 'rock'
    } else {
      type = Math.random() < 0.8 ? 'coin' : 'gem'
    }

    // Obstacles are bigger, but coins/gems now more visible too
    const size = isObstacle ? 100 : 70

    this.objects.push({
      id: this.nextObjectId++,
      type,
      lane,
      z: 0,
      isCollectible: !isObstacle,
      collected: false,
      size
    })
  }

  private spawnCollectParticles(obj: RunnerObject): void {
    const x = this.getLaneXNormalized(obj.lane) * this.config.canvasWidth
    const colors = obj.type === 'gem'
      ? ['#FF69B4', '#9B59B6', '#3498DB', '#2ECC71']
      : ['#FFD700', '#FFA500', '#FFFF00']

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10
      this.particles.push({
        x,
        y: this.config.canvasHeight * 0.75,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4 - 3,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8
      })
    }
  }

  // Returns normalized X (0-1) for a lane
  private getLaneXNormalized(lane: Lane): number {
    // Left lane = 0.2, Center = 0.5, Right = 0.8
    return 0.2 + lane * 0.3
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.2
      p.life -= 0.035

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  private levelUp(): void {
    this.config.level++
    this.config.speed += 0.08
    this.config.spawnInterval = Math.max(900, this.config.spawnInterval - 80)
    this.config.obstacleChance = Math.min(0.35, this.config.obstacleChance + 0.03)
  }

  reset(): void {
    this.score = 0
    this.objects = []
    this.particles = []
    this.lastSpawnTime = 0
    this.lastLevelScore = 0
    this.nextObjectId = 0
    this.playerX = 0.5
    this.playerBodyWidth = 0.2

    this.config.speed = this.config.baseSpeed
    this.config.level = 1
    this.config.lives = this.config.maxLives
    this.config.spawnInterval = 1500
    this.config.obstacleChance = 0.2

    this.player = {
      lane: 1 as Lane,
      targetLane: 1 as Lane,
      laneProgress: 0,
      isJumping: false,
      jumpProgress: 0,
      isInvincible: false,
      invincibleUntil: 0
    }
  }
}
