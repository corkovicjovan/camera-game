import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'

export class BodySegmenter {
  private segmenter: ImageSegmenter | null = null
  private outputCanvas: HTMLCanvasElement
  private outputCtx: CanvasRenderingContext2D
  private isRunning: boolean = false
  private animationId: number | null = null
  private frameCounter: number = 0
  private skipFrames: number = 3 // Process every 3rd frame (~20fps at 60fps)

  // Cached ImageData to avoid allocation every frame
  private cachedImageData: ImageData | null = null
  private cachedWidth: number = 0
  private cachedHeight: number = 0

  constructor() {
    // Create offscreen canvas for segmentation output
    this.outputCanvas = document.createElement('canvas')
    const ctx = this.outputCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Could not get 2D context for segmentation')
    this.outputCtx = ctx
  }

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )

    this.segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      outputCategoryMask: true,
      outputConfidenceMasks: false
    })
  }

  start(video: HTMLVideoElement): void {
    this.isRunning = true
    this.outputCanvas.width = video.videoWidth || 640
    this.outputCanvas.height = video.videoHeight || 480
    this.segmentLoop(video)
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private segmentLoop(video: HTMLVideoElement): void {
    if (!this.isRunning || !this.segmenter) return

    const process = () => {
      if (!this.isRunning || !this.segmenter) return

      // Only process every Nth frame for performance (~20fps at 60fps)
      if (++this.frameCounter % this.skipFrames === 0 && video.readyState >= 2) {
        // Update canvas size if video size changed
        if (this.outputCanvas.width !== video.videoWidth) {
          this.outputCanvas.width = video.videoWidth
          this.outputCanvas.height = video.videoHeight
        }

        const result = this.segmenter.segmentForVideo(video, performance.now())

        if (result.categoryMask) {
          this.applySegmentation(video, result.categoryMask)
          result.categoryMask.close()
        }
      }

      this.animationId = requestAnimationFrame(process)
    }

    process()
  }

  private applySegmentation(video: HTMLVideoElement, mask: any): void {
    const width = this.outputCanvas.width
    const height = this.outputCanvas.height

    // Draw the video frame
    this.outputCtx.drawImage(video, 0, 0, width, height)

    // Get the mask data
    const maskData = mask.getAsUint8Array()

    // Reuse cached ImageData if dimensions match, otherwise create new
    if (!this.cachedImageData || this.cachedWidth !== width || this.cachedHeight !== height) {
      this.cachedImageData = this.outputCtx.createImageData(width, height)
      this.cachedWidth = width
      this.cachedHeight = height
    }

    // Get fresh pixel data into cached ImageData
    const sourceData = this.outputCtx.getImageData(0, 0, width, height)
    const pixels = this.cachedImageData.data

    // Copy source pixels and apply mask in single pass
    // Using Uint32Array view for faster 4-byte operations
    const src32 = new Uint32Array(sourceData.data.buffer)
    const dst32 = new Uint32Array(pixels.buffer)
    const len = maskData.length

    for (let i = 0; i < len; i++) {
      // Copy pixel (all 4 bytes at once)
      dst32[i] = src32[i]
      // If background, set alpha to 0 (clear the alpha byte)
      // Selfie segmenter: 0 = person, 255 = background
      if (maskData[i] > 128) {
        // Clear alpha byte (depends on endianness, but works for transparency)
        pixels[i * 4 + 3] = 0
      }
    }

    this.outputCtx.putImageData(this.cachedImageData, 0, 0)
  }

  getOutputCanvas(): HTMLCanvasElement {
    return this.outputCanvas
  }

  isReady(): boolean {
    return this.segmenter !== null
  }

  destroy(): void {
    this.stop()
    if (this.segmenter) {
      this.segmenter.close()
      this.segmenter = null
    }
  }
}
