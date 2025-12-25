import { CameraManager } from '../camera/CameraManager'
import { PoseDetector, BodyBounds } from '../pose/PoseDetector'
import { BodySegmenter } from '../segmentation/BodySegmenter'
import { AudioManager } from '../audio/AudioManager'
import { Renderer } from '../renderer/Renderer'
import { GameState } from './GameState'
import type { GamePhase } from './types'

export class Game {
  private canvas!: HTMLCanvasElement
  private video!: HTMLVideoElement

  private camera!: CameraManager
  private poseDetector!: PoseDetector
  private bodySegmenter!: BodySegmenter
  private audio!: AudioManager
  private renderer!: Renderer
  private state!: GameState

  private phase: GamePhase = 'LOADING'
  private animationId: number | null = null
  private lastFrameTime: number = 0
  private lastScore: number = 0
  private milestoneTimer: number = 0

  private overlay!: HTMLDivElement

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
    this.renderer = new Renderer(this.canvas)

    // Setup resize handler
    window.addEventListener('resize', () => this.handleResize())
    this.handleResize()

    // Initialize game state
    this.state = new GameState(this.renderer.getWidth(), this.renderer.getHeight())

    // Show loading then ready state
    this.showLoading()

    try {
      // Load both models in parallel
      await Promise.all([
        this.poseDetector.init(),
        this.bodySegmenter.init()
      ])
      this.showReady()
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
      <div class="title">Catch the Stars</div>
      <div class="loading-text">Loading...</div>
    `
    this.overlay.classList.remove('hidden')
  }

  private showReady(): void {
    this.phase = 'READY'
    this.overlay.innerHTML = `
      <div class="title">Catch the Stars</div>
      <button class="start-button">TAP TO PLAY!</button>
    `

    const button = this.overlay.querySelector('.start-button')
    button?.addEventListener('click', () => this.startGame())

    // Also allow tapping anywhere
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.startGame()
      }
    })
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

    this.overlay.innerHTML = `
      <div class="title">Catch the Stars</div>
      <div class="loading-text">Starting camera...</div>
    `

    try {
      // Start camera
      await this.camera.start()

      // Start pose detection with body bounds callback
      this.poseDetector.start(this.video, (bounds: BodyBounds) => {
        this.state.setPlayerPosition(bounds.centerX, bounds.leftEdge, bounds.rightEdge, bounds.headY)
      })

      // Start body segmentation and connect to renderer
      this.bodySegmenter.start(this.video)
      this.renderer.setBodyCanvas(this.bodySegmenter.getOutputCanvas())

      // Initialize audio (needs user interaction)
      this.audio.init()

      // Hide overlay
      this.overlay.classList.add('hidden')

      // Start game loop
      this.phase = 'PLAYING'
      this.state.reset()
      this.lastFrameTime = performance.now()
      this.gameLoop()

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.showError(message)
    }
  }

  private gameLoop(): void {
    if (this.phase !== 'PLAYING') return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    // Update game state
    const { caught, missed } = this.state.update(deltaTime, currentTime)

    // Play sounds for events
    if (caught.length > 0) {
      this.audio.playCatch()

      // Check for milestone (every 10 points)
      if (this.state.score % 10 === 0 && this.state.score > this.lastScore) {
        this.audio.playMilestone()
        this.milestoneTimer = 30 // frames to show milestone effect
        this.lastScore = this.state.score

        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100])
        }
      }
    }

    if (missed.length > 0) {
      this.audio.playBadCatch()
    }

    // Render
    this.renderer.render(
      this.state.config,
      this.state.player,
      this.state.objects,
      this.state.particles,
      this.state.scorePopups,
      this.state.score,
      this.state.combo
    )

    // Show milestone effect
    if (this.milestoneTimer > 0) {
      this.renderer.drawMilestoneEffect(this.state.score)
      this.milestoneTimer--
    }

    // Next frame
    this.animationId = requestAnimationFrame(() => this.gameLoop())
  }

  private handleResize(): void {
    this.renderer.resize()
    this.state?.updateDimensions(this.renderer.getWidth(), this.renderer.getHeight())
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
