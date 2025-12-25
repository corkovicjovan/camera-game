export class CameraManager {
  private video: HTMLVideoElement
  private stream: MediaStream | null = null

  constructor(videoElement: HTMLVideoElement) {
    this.video = videoElement
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      })

      this.video.srcObject = this.stream
      await this.video.play()
      this.video.classList.add('visible')
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Camera permission denied. Please allow camera access to play!')
        }
        if (error.name === 'NotFoundError') {
          throw new Error('No camera found. Please connect a camera to play!')
        }
      }
      throw new Error('Could not start camera. Please try again!')
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.video.classList.remove('visible')
  }

  getVideoElement(): HTMLVideoElement {
    return this.video
  }

  isReady(): boolean {
    return this.video.readyState >= 2
  }
}
