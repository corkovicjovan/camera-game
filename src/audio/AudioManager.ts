export class AudioManager {
  private context: AudioContext | null = null
  private isMuted: boolean = false

  init(): void {
    // Lazy init - will be created on first user interaction
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext()
    }
    if (this.context.state === 'suspended') {
      this.context.resume()
    }
    return this.context
  }

  playCatch(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()

    // Happy ascending chime
    const now = ctx.currentTime

    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, now + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.08 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.35)
    })
  }

  playBadCatch(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()

    // Low gentle boop
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.25)
  }

  playMilestone(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()

    // Fanfare for milestones
    const now = ctx.currentTime

    const notes = [
      { freq: 523.25, time: 0 },
      { freq: 659.25, time: 0.1 },
      { freq: 783.99, time: 0.2 },
      { freq: 1046.50, time: 0.3 }
    ]

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(0.25, now + time + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + 0.45)
    })
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted
  }

  // ============================================
  // Runner Mode Sounds
  // ============================================

  playCoinCollect(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    // Quick bright ding
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.2)
  }

  playGemCollect(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    // Sparkly chime - multiple tones
    const frequencies = [1046.50, 1318.51, 1567.98] // C6, E6, G6
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq

      const delay = i * 0.05
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + delay)
      osc.stop(now + delay + 0.3)
    })
  }

  playJump(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    // Bouncy boing sound
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.3)
  }

  playCrash(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    // Soft bump - not scary
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.25)
  }

  playLevelUp(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    // Triumphant fanfare
    const notes = [
      { freq: 523.25, time: 0 },      // C5
      { freq: 659.25, time: 0.12 },   // E5
      { freq: 783.99, time: 0.24 },   // G5
      { freq: 1046.50, time: 0.36 },  // C6
      { freq: 1318.51, time: 0.48 }   // E6
    ]

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'square'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(0.15, now + time + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + 0.35)
    })
  }

  playGameOver(): void {
    if (this.isMuted) return
    const ctx = this.ensureContext()
    const now = ctx.currentTime

    // Gentle "aww" - descending notes, not punishing
    const notes = [
      { freq: 523.25, time: 0 },
      { freq: 440.00, time: 0.2 },
      { freq: 349.23, time: 0.4 }
    ]

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq

      gain.gain.setValueAtTime(0.2, now + time)
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + 0.35)
    })
  }
}
