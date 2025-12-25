import { CameraManager } from '../camera/CameraManager'
import { PoseDetector, BodyBounds } from '../pose/PoseDetector'
import { BodySegmenter } from '../segmentation/BodySegmenter'
import { AudioManager } from '../audio/AudioManager'
import { Renderer } from '../renderer/Renderer'
import { RunnerRenderer } from '../renderer/RunnerRenderer'
import { GameState } from './GameState'
import { RunnerGameState } from './RunnerGameState'
import { PersistenceManager } from './PersistenceManager'
import type { GameMode, GamePhase } from './types'

export class Game {
  private canvas!: HTMLCanvasElement
  private video!: HTMLVideoElement

  private camera!: CameraManager
  private poseDetector!: PoseDetector
  private bodySegmenter!: BodySegmenter
  private audio!: AudioManager

  // Stars mode
  private starsRenderer!: Renderer
  private starsState!: GameState

  // Runner mode
  private runnerRenderer!: RunnerRenderer
  private runnerState!: RunnerGameState

  private gameMode: GameMode = 'stars'
  private phase: GamePhase = 'LOADING'
  private animationId: number | null = null
  private lastFrameTime: number = 0
  private lastScore: number = 0
  private milestoneTimer: number = 0

  // Runner-specific state
  private isRunnerGameOver: boolean = false
  private lastJumpState: boolean = false
  private showDebug: boolean = false

  private overlay!: HTMLDivElement
  private isPaused: boolean = false
  private persistence: PersistenceManager = new PersistenceManager()
  private isNewHighScore: boolean = false

  async init(): Promise<void> {
    // Get DOM elements
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement
    this.video = document.getElementById('camera-video') as HTMLVideoElement

    if (!this.canvas || !this.video) {
      throw new Error('Required elements not found')
    }

    // Create overlay for start screen
    this.createOverlay()

    // Initialize modules
    this.camera = new CameraManager(this.video)
    this.poseDetector = new PoseDetector()
    this.bodySegmenter = new BodySegmenter()
    this.audio = new AudioManager()

    // Initialize both renderers
    this.starsRenderer = new Renderer(this.canvas)
    this.runnerRenderer = new RunnerRenderer(this.canvas)

    // Setup resize handler
    window.addEventListener('resize', () => this.handleResize())
    this.handleResize()

    // Debug toggle with 'd' key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        this.showDebug = !this.showDebug
      }
    })

    // Visibility API - pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause()
      } else {
        this.resume()
      }
    })

    // Back button click handler for both modes
    this.canvas.addEventListener('click', (e) => {
      if (this.phase === 'PLAYING') {
        const rect = this.canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        if (this.gameMode === 'stars') {
          const bounds = this.starsRenderer.getBackButtonBounds()
          if (x >= bounds.x && x <= bounds.x + bounds.width &&
              y >= bounds.y && y <= bounds.y + bounds.height) {
            this.goToModeSelect()
          }
        } else if (!this.isRunnerGameOver) {
          const bounds = this.runnerRenderer.getBackButtonBounds()
          if (x >= bounds.x && x <= bounds.x + bounds.width &&
              y >= bounds.y && y <= bounds.y + bounds.height) {
            this.goToModeSelect()
          }
        }
      }
    })

    // Initialize both game states
    this.starsState = new GameState(this.starsRenderer.getWidth(), this.starsRenderer.getHeight())
    this.runnerState = new RunnerGameState(this.runnerRenderer.getWidth(), this.runnerRenderer.getHeight())

    // Show loading then ready state
    this.showLoading()

    try {
      // Load both models in parallel
      await Promise.all([
        this.poseDetector.init(),
        this.bodySegmenter.init()
      ])
      this.showModeSelect()
    } catch (error) {
      console.error('Init error:', error)
      this.showError('Failed to load. Please refresh and try again.')
    }
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div')
    this.overlay.className = 'overlay'
    document.getElementById('app')?.appendChild(this.overlay)
  }

  private showLoading(): void {
    this.phase = 'LOADING'
    this.overlay.innerHTML = `
      <div class="title">Loading...</div>
      <div class="loading-text">Preparing games...</div>
    `
    this.overlay.classList.remove('hidden')
  }

  private showModeSelect(): void {
    this.phase = 'READY'
    this.overlay.innerHTML = `
      <div class="title">Choose a Game!</div>
      <div class="mode-buttons">
        <button class="mode-button stars-button" data-mode="stars">
          <span class="mode-icon">&#11088;</span>
          <span class="mode-name">Catch the Stars</span>
        </button>
        <button class="mode-button runner-button" data-mode="runner">
          <span class="mode-icon">&#127939;</span>
          <span class="mode-name">Rainbow Runner</span>
        </button>
      </div>
    `
    this.overlay.classList.remove('hidden')

    // Add click handlers
    const buttons = this.overlay.querySelectorAll('.mode-button')
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode as GameMode
        this.selectMode(mode)
      })
    })

    // Add styles for mode buttons
    this.addModeSelectStyles()
  }

  private addModeSelectStyles(): void {
    if (document.getElementById('mode-select-styles')) return

    const style = document.createElement('style')
    style.id = 'mode-select-styles'
    style.textContent = `
      .mode-buttons {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-top: 30px;
      }
      .mode-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 25px 40px;
        font-size: 24px;
        font-weight: bold;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        min-width: 250px;
      }
      .mode-button:hover {
        transform: scale(1.05);
      }
      .mode-button:active {
        transform: scale(0.98);
      }
      .stars-button {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: white;
        box-shadow: 0 6px 20px rgba(255, 165, 0, 0.4);
      }
      .runner-button {
        background: linear-gradient(135deg, #FF69B4, #9B59B6);
        color: white;
        box-shadow: 0 6px 20px rgba(155, 89, 182, 0.4);
      }
      .mode-icon {
        font-size: 48px;
        margin-bottom: 10px;
      }
      .mode-name {
        font-size: 20px;
      }
      .game-over-buttons {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 30px;
      }
      .game-over-button {
        padding: 20px 40px;
        font-size: 22px;
        font-weight: bold;
        border: none;
        border-radius: 15px;
        cursor: pointer;
        transition: transform 0.2s;
      }
      .game-over-button:hover {
        transform: scale(1.05);
      }
      .play-again-button {
        background: linear-gradient(135deg, #2ECC71, #27AE60);
        color: white;
      }
      .change-game-button {
        background: linear-gradient(135deg, #3498DB, #2980B9);
        color: white;
      }
    `
    document.head.appendChild(style)
  }

  private selectMode(mode: GameMode): void {
    this.gameMode = mode
    this.startGame()
  }

  private showError(message: string): void {
    this.phase = 'ERROR'
    this.overlay.innerHTML = `
      <div class="error-message">${message}</div>
    `
    this.overlay.classList.remove('hidden')
  }

  private async startGame(): Promise<void> {
    if (this.phase !== 'READY') return

    const title = this.gameMode === 'stars' ? 'Catch the Stars' : 'Rainbow Runner'
    this.overlay.innerHTML = `
      <div class="title">${title}</div>
      <div class="loading-text">Starting camera...</div>
    `

    try {
      // Start camera
      await this.camera.start()

      // Start pose detection with body bounds callback
      this.poseDetector.start(this.video, (bounds: BodyBounds) => {
        this.handlePoseUpdate(bounds)
      })

      // Start body segmentation and connect to appropriate renderer
      this.bodySegmenter.start(this.video)
      const bodyCanvas = this.bodySegmenter.getOutputCanvas()
      this.starsRenderer.setBodyCanvas(bodyCanvas)
      this.runnerRenderer.setBodyCanvas(bodyCanvas)

      // Initialize audio (needs user interaction)
      this.audio.init()

      // Hide overlay
      this.overlay.classList.add('hidden')

      // Reset appropriate game state
      if (this.gameMode === 'stars') {
        this.starsState.reset()
      } else {
        this.runnerState.reset()
        this.isRunnerGameOver = false
      }

      // Start game loop
      this.phase = 'PLAYING'
      this.lastFrameTime = performance.now()
      this.lastScore = 0
      this.gameLoop()

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.showError(message)
    }
  }

  private handlePoseUpdate(bounds: BodyBounds): void {
    if (this.gameMode === 'stars') {
      this.starsState.setPlayerPosition(bounds.centerX, bounds.leftEdge, bounds.rightEdge, bounds.headY)
    } else {
      // Pass RAW position for collision (immediate response, no center drift)
      // Pass SMOOTHED position for rendering (smooth visual movement)
      this.runnerState.setPlayerPosition(
        bounds.rawCenterX,      // raw for collision
        bounds.rawBodyWidth,    // actual detected body width
        bounds.centerX          // smoothed for rendering
      )

      // Handle jump - trigger on rising edge
      if (bounds.isJumping && !this.lastJumpState) {
        this.runnerState.triggerJump(performance.now())
        this.audio.playJump()
      }
      this.lastJumpState = bounds.isJumping
    }
  }

  private gameLoop(): void {
    if (this.phase !== 'PLAYING') return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    if (this.gameMode === 'stars') {
      this.updateStarsMode(deltaTime, currentTime)
    } else {
      this.updateRunnerMode(deltaTime, currentTime)
    }

    // Next frame
    this.animationId = requestAnimationFrame(() => this.gameLoop())
  }

  private updateStarsMode(deltaTime: number, currentTime: number): void {
    // Update game state
    const { caught, missed, leveledUp, powerUpCollected, shieldBlocked } = this.starsState.update(deltaTime, currentTime)

    // Play sounds for events
    if (caught.length > 0) {
      this.audio.playCatch()
      // Small shake on catch
      this.starsRenderer.triggerShake(3, 100)
      // Trigger flash at each catch position
      for (const obj of caught) {
        const color = obj.type === 'star' ? '#FFD700' : '#FF69B4'
        this.starsRenderer.triggerCatchFlash(obj.x, obj.y, color)
      }

      // Check for milestone (every 10 points)
      if (this.starsState.score % 10 === 0 && this.starsState.score > this.lastScore) {
        this.audio.playMilestone()
        this.milestoneTimer = 30
        this.lastScore = this.starsState.score
        // Medium shake on milestone
        this.starsRenderer.triggerShake(8, 200)

        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100])
        }
      }
    }

    if (missed.length > 0) {
      this.audio.playBadCatch()
      // Small shake on bad catch
      this.starsRenderer.triggerShake(4, 150)
    }

    if (leveledUp) {
      this.audio.playLevelUp()
      // Medium shake on level up
      this.starsRenderer.triggerShake(6, 200)
    }

    // Power-up sounds
    if (powerUpCollected) {
      this.audio.playPowerUpCollect()
      this.starsRenderer.triggerShake(5, 150)
    }

    if (shieldBlocked) {
      this.audio.playShieldBlock()
      this.starsRenderer.triggerShake(6, 200)
    }

    // Render
    this.starsRenderer.render(
      this.starsState.config,
      this.starsState.player,
      this.starsState.objects,
      this.starsState.particles,
      this.starsState.scorePopups,
      this.starsState.score,
      this.starsState.combo,
      this.starsState.level,
      this.persistence.getHighScore('stars'),
      this.starsState.powerUpObjects,
      this.starsState.activePowerUp
    )

    if (this.milestoneTimer > 0) {
      this.starsRenderer.drawMilestoneEffect(this.starsState.score)
      this.milestoneTimer--
    }
  }

  private updateRunnerMode(deltaTime: number, currentTime: number): void {
    if (this.isRunnerGameOver) {
      // Just render the game over screen
      this.runnerRenderer.render(
        this.runnerState.config,
        this.runnerState.player,
        this.runnerState.objects,
        this.runnerState.particles,
        this.runnerState.score,
        this.runnerState.playerXSmooth,  // smoothed for rendering
        this.persistence.getHighScore('runner')
      )
      this.runnerRenderer.drawGameOver(this.runnerState.score, this.runnerState.config.level, this.isNewHighScore)
      return
    }

    // Update game state
    const result = this.runnerState.update(deltaTime, currentTime)

    // Play sounds for events
    if (result.collected.length > 0) {
      for (const obj of result.collected) {
        if (obj.type === 'gem') {
          this.audio.playGemCollect()
        } else {
          this.audio.playCoinCollect()
        }
      }
    }

    if (result.crashed.length > 0) {
      this.audio.playCrash()
      // Large shake on crash
      this.runnerRenderer.triggerShake(12, 300)
      if ('vibrate' in navigator) {
        navigator.vibrate(200)
      }
    }

    if (result.leveledUp) {
      this.audio.playLevelUp()
      // Medium shake on level up (celebratory)
      this.runnerRenderer.triggerShake(6, 200)
    }

    if (result.gameOver) {
      this.audio.playGameOver()
      this.isRunnerGameOver = true
      this.showGameOver()
    }

    // Render - pass SMOOTHED position for visual rendering (smooth movement)
    // Collision uses raw position internally (no center drift)
    this.runnerRenderer.render(
      this.runnerState.config,
      this.runnerState.player,
      this.runnerState.objects,
      this.runnerState.particles,
      this.runnerState.score,
      this.runnerState.playerXSmooth,  // smoothed for rendering
      this.persistence.getHighScore('runner')
    )

    // Debug: show collision zones (toggle with 'd' key)
    if (this.showDebug) {
      this.runnerRenderer.drawDebugCollision(
        this.runnerState.playerX,
        this.runnerState.playerBodyWidth,
        0.55, // collisionZoneStart - matches head position
        0.75, // collisionZoneEnd
        this.runnerState.objects
      )
    }
  }

  private showGameOver(): void {
    // Save score and check for new high score
    this.isNewHighScore = this.persistence.updateRunnerScore(
      this.runnerState.score,
      this.runnerState.config.level
    )

    const encouragement = this.isNewHighScore ? 'NEW HIGH SCORE!' : 'Great try!'
    const encouragementColor = this.isNewHighScore ? '#FFD700' : 'white'

    // Calculate star rating: 1 star = 100pts, 2 stars = 300pts, 3 stars = 500pts
    const score = this.runnerState.score
    const stars = score >= 500 ? 3 : score >= 300 ? 2 : score >= 100 ? 1 : 0
    const starDisplay = this.getStarDisplayHTML(stars)

    // Show overlay with game over options
    this.overlay.innerHTML = `
      <div class="title" style="color: #FF6B6B;">Game Over!</div>
      <div class="loading-text" style="font-size: 32px; color: #FFD700;">Score: ${this.runnerState.score}</div>
      <div class="loading-text" style="font-size: 20px; color: #9B59B6;">Level ${this.runnerState.config.level}</div>
      <div class="star-rating" style="font-size: 36px; margin: 10px 0;">${starDisplay}</div>
      <div class="loading-text" style="font-size: 24px; color: ${encouragementColor}; margin-top: 10px;">${encouragement}</div>
      <div class="game-over-buttons">
        <button class="game-over-button play-again-button">Play Again</button>
        <button class="game-over-button change-game-button">Change Game</button>
      </div>
    `
    this.overlay.classList.remove('hidden')

    // Add click handlers
    const playAgainBtn = this.overlay.querySelector('.play-again-button')
    playAgainBtn?.addEventListener('click', () => this.restartGame())

    const changeGameBtn = this.overlay.querySelector('.change-game-button')
    changeGameBtn?.addEventListener('click', () => this.goToModeSelect())
  }

  private getStarDisplayHTML(earnedStars: number): string {
    let html = ''
    for (let i = 0; i < 3; i++) {
      if (i < earnedStars) {
        html += '<span style="color: #FFD700; text-shadow: 0 0 10px #FFA500;">&#9733;</span>'
      } else {
        html += '<span style="color: rgba(255,255,255,0.3);">&#9733;</span>'
      }
    }
    return html
  }

  private restartGame(): void {
    this.overlay.classList.add('hidden')
    this.runnerState.reset()
    this.isRunnerGameOver = false
    this.isNewHighScore = false
    this.lastScore = 0
  }

  private goToModeSelect(): void {
    this.phase = 'READY'
    this.isRunnerGameOver = false
    this.isNewHighScore = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.showModeSelect()
  }

  private handleResize(): void {
    this.starsRenderer.resize()
    this.runnerRenderer.resize()
    this.starsState?.updateDimensions(this.starsRenderer.getWidth(), this.starsRenderer.getHeight())
    this.runnerState?.updateDimensions(this.runnerRenderer.getWidth(), this.runnerRenderer.getHeight())
  }

  private pause(): void {
    if (this.isPaused || this.phase !== 'PLAYING') return
    this.isPaused = true

    // Stop game loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    // Stop ML processing
    this.poseDetector.stop()
    this.bodySegmenter.stop()
  }

  private resume(): void {
    if (!this.isPaused || this.phase !== 'PLAYING') return
    this.isPaused = false

    // Restart ML processing
    this.poseDetector.start(this.video, (bounds: BodyBounds) => {
      this.handlePoseUpdate(bounds)
    })
    this.bodySegmenter.start(this.video)

    // Restart game loop with fresh timestamp to avoid huge deltaTime
    this.lastFrameTime = performance.now()
    this.gameLoop()
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.poseDetector.destroy()
    this.bodySegmenter.destroy()
    this.camera.stop()
  }
}
