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

  private nextObjectId: number = 0
  private lastSpawnTime: number = 0
  private lastLevelScore: number = 0
  private readonly LEVEL_UP_SCORE = 500
  private readonly JUMP_DURATION = 600 // ms
  private jumpStartTime: number = 0

  constructor(canvasWidth: number, canvasHeight: number) {
    this.config = {
      ...DEFAULT_RUNNER_CONFIG,
      canvasWidth,
      canvasHeight
    }

    this.player = {
      lane: 1 as Lane, // Start in center
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

  setPlayerLane(centerX: number): void {
    // Map body center position to lane
    // Left: 0-0.33, Center: 0.33-0.66, Right: 0.66-1
    let newLane: Lane
    if (centerX < 0.33) {
      newLane = 0
    } else if (centerX > 0.66) {
      newLane = 2
    } else {
      newLane = 1
    }

    if (newLane !== this.player.targetLane) {
      this.player.targetLane = newLane
    }

    // Smooth lane transition
    if (this.player.lane !== this.player.targetLane) {
      this.player.laneProgress += 0.15
      if (this.player.laneProgress >= 1) {
        this.player.lane = this.player.targetLane
        this.player.laneProgress = 0
      }
    }
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

    // Update objects (move toward player)
    const speed = this.config.speed * 0.015 // Base movement per frame
    const collisionZone = 0.85 // Where player is (near bottom)

    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i]
      obj.z += speed

      // Remove if past player
      if (obj.z > 1.1) {
        this.objects.splice(i, 1)
        continue
      }

      // Check collision
      if (!obj.collected && obj.z >= collisionZone - 0.1 && obj.z <= collisionZone + 0.05) {
        const sameOrNearLane = obj.lane === this.player.lane ||
          (this.player.laneProgress > 0.5 && obj.lane === this.player.targetLane)

        if (sameOrNearLane) {
          if (obj.isCollectible) {
            // Collect coin/gem
            obj.collected = true
            this.score += obj.type === 'gem' ? 10 : 1
            result.collected.push(obj)
            this.spawnCollectParticles(obj)
          } else if (!this.player.isInvincible) {
            // Hit obstacle - check if jumping
            if (this.player.isJumping && this.player.jumpProgress > 0.1 && this.player.jumpProgress < 0.9) {
              // Successfully jumped over!
            } else {
              // Crash!
              obj.collected = true // Mark as handled
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

    this.objects.push({
      id: this.nextObjectId++,
      type,
      lane,
      z: 0, // Start at far end
      isCollectible: !isObstacle,
      collected: false,
      size: 40
    })
  }

  private spawnCollectParticles(obj: RunnerObject): void {
    const laneX = this.getLaneX(obj.lane)
    const colors = obj.type === 'gem'
      ? ['#FF69B4', '#9B59B6', '#3498DB', '#2ECC71']
      : ['#FFD700', '#FFA500', '#FFFF00']

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      this.particles.push({
        x: laneX,
        y: this.config.canvasHeight * 0.75,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3 - 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6
      })
    }
  }

  private getLaneX(lane: Lane): number {
    const laneWidth = this.config.canvasWidth / 3
    return laneWidth * lane + laneWidth / 2
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.life -= 0.04

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  private levelUp(): void {
    this.config.level++
    this.config.speed += 0.1
    this.config.spawnInterval = Math.max(800, this.config.spawnInterval - 100)
    this.config.obstacleChance = Math.min(0.4, this.config.obstacleChance + 0.05)
  }

  reset(): void {
    this.score = 0
    this.objects = []
    this.particles = []
    this.lastSpawnTime = 0
    this.lastLevelScore = 0
    this.nextObjectId = 0

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
