# Tech-Spec: Catch the Stars - Gesture-Controlled Kids Game

**Created:** 2025-12-25
**Status:** Ready for Development

## Overview

### Problem Statement

Kids love interactive games where they can use their bodies to play, like those seen in playground arcade machines. Current solutions require expensive hardware or specialized equipment. We need a simple browser-based game that uses the device's camera to track a child's movement and translate it into game controls.

### Solution

Build "Catch the Stars" - a simple falling-object catching game controlled by body movement. The game uses MediaPipe Pose detection to track the player's horizontal position and moves an on-screen character accordingly. Designed for 4-year-olds: bright colors, simple mechanics, forgiving gameplay, no reading required.

### Scope

**In Scope:**
- Vite-based project with TypeScript
- PWA support (installable, works offline)
- Camera-based body position tracking (left/center/right)
- Falling objects to catch (stars, hearts) and avoid (clouds, X's)
- All visuals generated with Canvas (no external assets)
- Sound effects generated with Web Audio API
- Works on laptop and mobile browsers
- Score display with big, friendly numbers
- No fail state (endless play, just for fun)

**Out of Scope:**
- Multiple game modes
- Leaderboards or persistent storage
- User accounts
- Complex gestures (jumping, ducking)
- Multiplayer

## Context for Development

### Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Build Tool | Vite | Fast dev server, optimized builds, great TS support |
| Language | TypeScript | Type safety, better DX, catches errors early |
| Pose Detection | @mediapipe/tasks-vision | Latest MediaPipe API, npm package, tree-shakeable |
| Game Rendering | HTML5 Canvas | No dependencies, full control, performant |
| Audio | Web Audio API | Generate sounds without audio files |
| PWA | vite-plugin-pwa | Auto-generates service worker and manifest |

### Key Technical Decisions

1. **Vite over plain HTML**: Enables TypeScript, proper module bundling, PWA plugin, and hot reload during development. Production build is optimized and cache-friendly.

2. **TypeScript**: Better code organization, type safety for game state, autocomplete for MediaPipe APIs.

3. **MediaPipe Tasks Vision API**: The newer `@mediapipe/tasks-vision` package (not the legacy CDN version). Cleaner API, better tree-shaking, proper npm package.

4. **vite-plugin-pwa**: Handles service worker generation, web manifest, and caching strategies automatically. Enables "Add to Home Screen" on mobile.

5. **No game framework (no Phaser/PixiJS)**: Game is simple enough that vanilla Canvas is sufficient. Reduces bundle size and complexity.

6. **Generated assets only**: No external images or sounds. Everything drawn with Canvas primitives and sounds synthesized with Web Audio.

7. **60fps game loop with requestAnimationFrame**: Standard approach for smooth animation.

8. **Responsive canvas**: Scales to fit screen while maintaining aspect ratio. Works on mobile and desktop.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        main.ts                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Camera    │  │  MediaPipe  │  │   Game State    │  │
│  │   Module    │→ │   Pose      │→ │   Manager       │  │
│  │             │  │   Detection │  │                 │  │
│  └─────────────┘  └─────────────┘  └────────┬────────┘  │
│                                              │          │
│  ┌─────────────┐  ┌─────────────┐  ┌────────▼────────┐  │
│  │   Audio     │  │  Renderer   │← │   Game Loop     │  │
│  │   Manager   │  │  (Canvas)   │  │ (60fps update)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                   Service Worker (PWA)                  │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
camera-game-solo/
├── index.html              # Entry HTML
├── vite.config.ts          # Vite + PWA config
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
├── public/
│   └── icons/              # PWA icons (generated)
├── src/
│   ├── main.ts             # Entry point
│   ├── game/
│   │   ├── Game.ts         # Main game class
│   │   ├── GameState.ts    # State management
│   │   └── types.ts        # Type definitions
│   ├── camera/
│   │   └── CameraManager.ts
│   ├── pose/
│   │   └── PoseDetector.ts # MediaPipe wrapper
│   ├── renderer/
│   │   ├── Renderer.ts     # Canvas rendering
│   │   └── shapes.ts       # Draw stars, hearts, etc.
│   ├── audio/
│   │   └── AudioManager.ts # Web Audio sounds
│   └── styles.css          # Minimal styles
└── _bmad-output/           # BMAD artifacts (ignore)
```

## Implementation Plan

### Tasks

- [ ] **Task 1: Vite Project Setup**
  - Initialize Vite with TypeScript template
  - Install dependencies: `@mediapipe/tasks-vision`, `vite-plugin-pwa`
  - Configure `vite.config.ts` with PWA plugin
  - Setup `tsconfig.json` for strict mode
  - Create basic `index.html` with viewport meta and canvas
  - Create folder structure: `src/game`, `src/camera`, `src/pose`, `src/renderer`, `src/audio`
  - Add basic CSS for fullscreen canvas

- [ ] **Task 2: PWA Configuration**
  - Configure `vite-plugin-pwa` with manifest settings
  - Set app name, theme color, icons config
  - Configure service worker for offline caching
  - Generate PWA icons (simple colored squares for now, can be replaced later)
  - Test "Add to Home Screen" prompt

- [ ] **Task 3: Camera Module**
  - Create `CameraManager.ts` class
  - Request camera permission with user-friendly error handling
  - Initialize video stream (prefer front camera on mobile via `facingMode`)
  - Handle permission denied gracefully (show friendly message)
  - Mirror the video feed (so left/right feels natural)
  - Expose video element for MediaPipe

- [ ] **Task 4: Pose Detection Integration**
  - Create `PoseDetector.ts` class
  - Initialize MediaPipe PoseLandmarker from `@mediapipe/tasks-vision`
  - Configure for performance (lite model, GPU delegate if available)
  - Extract body center X position from pose landmarks (use shoulder midpoint)
  - Map X position to 3 zones: LEFT, CENTER, RIGHT
  - Implement input smoothing (exponential moving average) to avoid jitter

- [ ] **Task 5: Game State Manager**
  - Create `types.ts` with interfaces: `FallingObject`, `GameState`, `PlayerPosition`
  - Create `GameState.ts` class
  - Track: score, player zone (LEFT/CENTER/RIGHT), falling objects array
  - Object spawner: randomly create falling objects at configurable intervals
  - Object types: GOOD (star, heart) and BAD (cloud, X)
  - Collision detection: check if object Y crosses catch zone AND matches player X zone
  - Score logic: +1 for good catch, no penalty for bad (just sound)

- [ ] **Task 6: Renderer (Canvas Drawing)**
  - Create `Renderer.ts` class with canvas setup
  - Create `shapes.ts` with pure functions to draw each shape
  - Draw background gradient (light blue to white)
  - Draw player character (large circle with smiley face) in current zone
  - Draw falling objects:
    - Stars: yellow 5-point star shape
    - Hearts: pink/red heart shape
    - Clouds: gray fluffy cloud (overlapping circles)
    - X marks: red X
  - Draw score (big, bold, top-center)
  - Add particle burst effect on successful catch

- [ ] **Task 7: Audio Manager**
  - Create `AudioManager.ts` class
  - Initialize Web Audio context (lazy, on first user interaction)
  - Generate "catch" sound (ascending chime using oscillators)
  - Generate "bad catch" sound (low gentle boop)
  - Generate milestone celebration sound (fanfare for every 10 points)
  - Add mute toggle

- [ ] **Task 8: Game Class & Main Loop**
  - Create `Game.ts` as the orchestrator class
  - Wire up: Camera → PoseDetector → GameState → Renderer
  - Implement `requestAnimationFrame` game loop
  - Update falling object positions each frame
  - Run pose detection at reduced frequency (10-15 fps) for performance
  - Check collisions and trigger sounds
  - Spawn new objects at intervals
  - Create `main.ts` entry point that initializes everything

- [ ] **Task 9: Start Screen & UX Flow**
  - Create start screen with big "TAP TO PLAY" button
  - Show camera permission instructions with friendly graphics
  - Add small camera preview in corner so kids can see themselves
  - Show loading state while MediaPipe model downloads
  - Implement game states: LOADING → READY → PLAYING

- [ ] **Task 10: Mobile Optimization & Polish**
  - Test on mobile browsers (Chrome Android, Safari iOS)
  - Ensure camera works on iOS (requires user gesture + HTTPS)
  - Tune detection sensitivity for kids (wider zones, more forgiving)
  - Performance tuning: throttle pose detection if FPS drops
  - Add haptic feedback on mobile (navigator.vibrate) for catches
  - Celebratory screen effects for milestone scores

### Acceptance Criteria

- [ ] **AC1:** `npm run dev` starts dev server, `npm run build` creates production build
- [ ] **AC2:** Game is installable as PWA on mobile (shows "Add to Home Screen")
- [ ] **AC3:** Game works offline after first load (service worker caches assets)
- [ ] **AC4:** Camera permission is requested and handled gracefully with friendly UI
- [ ] **AC5:** Player character moves left/center/right based on child's body position
- [ ] **AC6:** Falling objects (stars, hearts, clouds) spawn and fall at reasonable speed
- [ ] **AC7:** Catching a star/heart increases score and plays a happy sound
- [ ] **AC8:** Score is displayed large and readable
- [ ] **AC9:** Game runs at stable 30+ FPS on mid-range mobile device
- [ ] **AC10:** No external image/sound assets required - all generated with code
- [ ] **AC11:** Kids can see themselves in small camera preview while playing

## Additional Context

### Dependencies (npm)

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0"
  },
  "dependencies": {
    "@mediapipe/tasks-vision": "^0.10.0"
  }
}
```

### Testing Strategy

- **Manual testing**: Primary method. Test with actual kids if possible.
- **Devices to test**:
  - Laptop with webcam (Chrome, Firefox)
  - iPhone Safari
  - Android Chrome
- **Key test scenarios**:
  - Camera permission flow
  - Pose detection accuracy at different distances
  - Performance on lower-end devices
  - Game responsiveness when moving quickly

### Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome (Desktop) | Full |
| Chrome (Android) | Full |
| Safari (macOS) | Full |
| Safari (iOS) | Full (requires HTTPS or localhost) |
| Firefox | Full |
| Edge | Full |

**Note:** iOS Safari requires the page to be served over HTTPS (or localhost) for camera access.

### Potential Enhancements (Post-MVP)

1. Add jump gesture (raise both hands)
2. Multiple difficulty levels (faster falling)
3. Different game modes (time attack, survival)
4. Character customization (pick color)
5. Parent mode (adjust settings)
6. Add duck/crouch gesture
7. Multiple mini-games (endless runner, rhythm game)
8. Multiplayer via split screen

### Notes

- Keep the detection zone forgiving - 4-year-olds won't be precise
- Prefer "always winning" feel - lots of catchable objects, slow speed
- Sound is important for feedback but should have mute option
- Consider adding a small camera preview so kids can see themselves
