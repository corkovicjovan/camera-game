# CPU/GPU Optimization Plan

## Current Performance Analysis

### Heavy Operations (ranked by CPU/GPU impact):

1. **Body Segmentation** (HIGHEST) - `BodySegmenter.ts`
   - Running MediaPipe ImageSegmenter at ~20fps (every 3rd frame)
   - Per-pixel mask processing in JavaScript
   - `getImageData()` + pixel loop + `putImageData()` every frame

2. **Pose Detection** (HIGH) - `PoseDetector.ts`
   - Running MediaPipe PoseLandmarker at ~15fps (every 4th frame)
   - GPU delegate enabled (good)

3. **Canvas Rendering** (MEDIUM) - `RunnerRenderer.ts` / `Renderer.ts`
   - Running at 60fps
   - Speed lines use `Date.now()` per frame
   - Object shape drawing with gradients

4. **Game Loop** (LOW) - `Game.ts`
   - requestAnimationFrame at 60fps
   - Simple math operations

---

## Optimization Tasks

### Priority 1: Reduce ML Processing Load

#### Task 1.1: Lower Body Segmentation FPS
**File:** `src/segmentation/BodySegmenter.ts`
**Change:** Increase `skipFrames` from 3 to 5 or 6
```typescript
private skipFrames: number = 5 // ~12fps instead of 20fps
```
**Impact:** 40% reduction in segmentation calls
**Tradeoff:** Slightly choppier body cutout (usually acceptable)

#### Task 1.2: Lower Pose Detection FPS
**File:** `src/pose/PoseDetector.ts`
**Change:** Increase `skipFrames` from 4 to 6
```typescript
private skipFrames: number = 6 // ~10fps instead of 15fps
```
**Impact:** 33% reduction in pose detection calls
**Tradeoff:** Slightly less responsive movement

#### Task 1.3: Reduce Video Resolution for ML
**File:** `src/camera/CameraManager.ts`
**Change:** Request lower resolution video specifically for ML processing
```typescript
// Currently using native resolution
// Could downscale to 320x240 or 480x360 for ML only
```
**Impact:** 4x-9x faster ML processing
**Tradeoff:** None for gameplay, ML still accurate at low res

---

### Priority 2: Optimize Pixel Processing

#### Task 2.1: Use OffscreenCanvas + Web Worker
**File:** `src/segmentation/BodySegmenter.ts`
**Change:** Move pixel processing to Web Worker
- Main thread just sends video frame
- Worker handles segmentation mask application
- Worker sends back completed ImageBitmap
**Impact:** Frees main thread completely
**Complexity:** Medium

#### Task 2.2: Skip Alpha Processing When Possible
**File:** `src/segmentation/BodySegmenter.ts`
**Change:** Track if segmentation changed significantly
```typescript
// If mask is similar to last frame, skip pixel processing
private lastMaskHash: number = 0
// Simple hash: sum every 100th pixel
```
**Impact:** Skip redundant processing when standing still

---

### Priority 3: Reduce Rendering Overhead

#### Task 3.1: Cache Static Elements
**File:** `src/renderer/RunnerRenderer.ts`
**Change:** Pre-render track to offscreen canvas, only redraw when resized
```typescript
private trackCache: OffscreenCanvas | null = null
// Draw track once, blit every frame
```
**Impact:** ~20% faster render loop

#### Task 3.2: Throttle Speed Lines
**File:** `src/renderer/RunnerRenderer.ts`
**Change:** Update speed line positions every 2-3 frames instead of every frame
```typescript
private speedLineOffset: number = 0
private speedLineCounter: number = 0
// Update offset every 3 frames
```
**Impact:** Minor but reduces calculations

#### Task 3.3: Use requestIdleCallback for Non-Critical Updates
**Change:** Defer particle cleanup, spawn interval checks to idle time
**Impact:** Smoother frame times

---

### Priority 4: Game Loop Optimizations

#### Task 4.1: Decouple Update Rate from Render Rate
**File:** `src/game/Game.ts`
**Change:** Run game logic at 30fps, render at 60fps
```typescript
private readonly LOGIC_INTERVAL = 1000 / 30
private lastLogicTime = 0

// In gameLoop:
if (currentTime - this.lastLogicTime >= this.LOGIC_INTERVAL) {
  this.updateGameLogic()
  this.lastLogicTime = currentTime
}
this.render() // Always render at 60fps
```
**Impact:** 50% reduction in game logic calls

#### Task 4.2: Object Pooling
**File:** `src/game/RunnerGameState.ts`
**Change:** Reuse RunnerObject instances instead of creating/destroying
```typescript
private objectPool: RunnerObject[] = []
// Instead of splice, mark as inactive and reuse
```
**Impact:** Reduces GC pressure

---

### Priority 5: Battery/Thermal Management

#### Task 5.1: Visibility API Integration
**File:** `src/game/Game.ts`
**Change:** Pause all processing when tab is hidden
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    this.pauseProcessing()
  } else {
    this.resumeProcessing()
  }
})
```

#### Task 5.2: Add Performance Mode Toggle
**Change:** Let user choose "Battery Saver" mode
- Lower ML fps (8-10 instead of 15-20)
- Reduce particle count
- Simpler shapes (no gradients)

---

## Quick Wins (Can Apply Now)

1. **Increase skipFrames in PoseDetector** to 5-6
2. **Increase skipFrames in BodySegmenter** to 5-6
3. **Cache track rendering** in RunnerRenderer
4. **Add visibility API** to pause when hidden

## Estimated Impact

| Optimization | CPU Savings | Complexity |
|--------------|-------------|------------|
| Lower ML FPS | 30-40% | Easy |
| Web Worker for segmentation | 20-30% | Medium |
| Cache static renders | 10-15% | Easy |
| Lower video resolution | 20-30% | Easy |
| Object pooling | 5-10% | Easy |

**Total potential savings: 50-70% CPU reduction**

---

## Debug: Press 'D' to see collision zones

Green box = your body's collision area
Yellow boxes = collectibles in collision zone
Red boxes = obstacles in collision zone
