import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

export interface BodyBounds {
  // Smoothed values (for visual rendering - no jitter)
  centerX: number    // 0-1 normalized, smoothed
  leftEdge: number   // 0-1 normalized, smoothed
  rightEdge: number  // 0-1 normalized, smoothed
  headY: number      // 0-1 normalized (top of head position), smoothed

  // Raw values (for collision - immediate response, no center drift)
  rawCenterX: number   // 0-1 normalized, unsmoothed
  rawLeftEdge: number  // 0-1 normalized, unsmoothed
  rawRightEdge: number // 0-1 normalized, unsmoothed
  rawBodyWidth: number // actual detected body width (0-1)

  isJumping: boolean // true when both hands raised above shoulders
}

export class PoseDetector {
  private poseLandmarker: PoseLandmarker | null = null
  private lastBounds: BodyBounds = {
    centerX: 0.5, leftEdge: 0.4, rightEdge: 0.6, headY: 0.4,
    rawCenterX: 0.5, rawLeftEdge: 0.4, rawRightEdge: 0.6, rawBodyWidth: 0.2,
    isJumping: false
  }
  private jumpCooldown: number = 0
  private readonly JUMP_COOLDOWN_MS: number = 500
  private smoothingFactor: number = 0.7
  private isRunning: boolean = false
  private animationId: number | null = null
  private onPositionUpdate: ((bounds: BodyBounds) => void) | null = null
  private frameCounter: number = 0
  private skipFrames: number = 6 // Process every 6th frame (~10fps at 60fps)

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )

    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1
    })
  }

  start(video: HTMLVideoElement, callback: (bounds: BodyBounds) => void): void {
    this.onPositionUpdate = callback
    this.isRunning = true
    this.detectLoop(video)
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private detectLoop(video: HTMLVideoElement): void {
    if (!this.isRunning || !this.poseLandmarker) return

    const detect = () => {
      if (!this.isRunning || !this.poseLandmarker) return

      // Only process every Nth frame for performance (~15fps at 60fps)
      if (++this.frameCounter % this.skipFrames === 0 && video.readyState >= 2) {
        const result = this.poseLandmarker.detectForVideo(video, performance.now())

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0]

          // Get body bounds from multiple landmarks
          // Head: 0 (nose), used for head Y position
          // Shoulders: 11 (left), 12 (right)
          // Hips: 23 (left), 24 (right)
          // Elbows: 13 (left), 14 (right) - for wider reach
          const nose = landmarks[0]
          const leftShoulder = landmarks[11]
          const rightShoulder = landmarks[12]
          const leftWrist = landmarks[15]
          const rightWrist = landmarks[16]

          if (leftShoulder && rightShoulder && nose) {
            // Calculate center from shoulders and mirror for natural movement
            const rawCenterX = 1 - (leftShoulder.x + rightShoulder.x) / 2

            // Body width based on shoulders - shrink by 30% total for tighter bounds
            const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
            const halfWidth = shoulderWidth * 0.35 // 70% of shoulder width (30% shrink)

            // Calculate edges from mirrored center
            const rawLeft = rawCenterX - halfWidth
            const rawRight = rawCenterX + halfWidth

            // Get head Y position (use nose, offset up a bit for top of head)
            const rawHeadY = nose.y - 0.05 // Slightly above nose for head top

            // Apply smoothing
            const keepFactor = 1 - this.smoothingFactor
            const smoothedCenter = this.lastBounds.centerX * keepFactor +
                                   rawCenterX * this.smoothingFactor
            const smoothedLeft = this.lastBounds.leftEdge * keepFactor +
                                 rawLeft * this.smoothingFactor
            const smoothedRight = this.lastBounds.rightEdge * keepFactor +
                                  rawRight * this.smoothingFactor
            const smoothedHeadY = this.lastBounds.headY * keepFactor +
                                  rawHeadY * this.smoothingFactor

            // Detect jump: both wrists above both shoulders
            // Use a threshold to make it easier for kids (wrists just need to be near shoulder height)
            const now = performance.now()
            let isJumping = false

            if (leftWrist && rightWrist) {
              const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
              const jumpThreshold = 0.05 // Wrists can be slightly below shoulders and still count
              const bothHandsUp = leftWrist.y < (shoulderY + jumpThreshold) &&
                                  rightWrist.y < (shoulderY + jumpThreshold)

              if (bothHandsUp && now > this.jumpCooldown) {
                isJumping = true
                this.jumpCooldown = now + this.JUMP_COOLDOWN_MS
              }
            }

            // Calculate raw body width from shoulder detection
            const rawBodyWidth = Math.abs(rawRight - rawLeft)

            this.lastBounds = {
              // Smoothed values for visual rendering
              centerX: smoothedCenter,
              leftEdge: Math.max(0, smoothedLeft),
              rightEdge: Math.min(1, smoothedRight),
              headY: Math.max(0.1, Math.min(0.8, smoothedHeadY)),

              // Raw values for collision (no smoothing = immediate response)
              rawCenterX: Math.max(0, Math.min(1, rawCenterX)),
              rawLeftEdge: Math.max(0, rawLeft),
              rawRightEdge: Math.min(1, rawRight),
              rawBodyWidth: rawBodyWidth,

              isJumping
            }

            if (this.onPositionUpdate) {
              this.onPositionUpdate(this.lastBounds)
            }
          }
        }
      }

      this.animationId = requestAnimationFrame(detect)
    }

    detect()
  }

  destroy(): void {
    this.stop()
    if (this.poseLandmarker) {
      this.poseLandmarker.close()
      this.poseLandmarker = null
    }
  }
}
