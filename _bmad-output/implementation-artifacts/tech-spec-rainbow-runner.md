# Tech-Spec: Rainbow Runner - Endless Runner Game Mode

**Created:** 2025-12-25
**Status:** Ready for Development

## Overview

### Problem Statement

The existing "Catch the Stars" game has one mode. Kids want variety - a different style of game that still uses the body tracking camera controls. Subway Surfers-style endless runners are hugely popular with kids: simple concept, satisfying progression, instant feedback.

### Solution

Add "Rainbow Runner" - a 3-lane endless runner where the kid's body movement controls lane switching (left/center/right) and raising hands triggers a jump. Collect coins/gems, dodge obstacles, progress through levels with increasing difficulty. Fail after X hits, then restart.

### Scope

**In Scope:**
- New game mode: Rainbow Runner (endless runner)
- 3-lane track with body-controlled lane switching
- Jump gesture detection (raise hands above shoulders)
- Collectibles: coins, gems, power-ups
- Obstacles: barriers, rocks, gaps (jump over)
- Level progression: speed increases, more obstacles
- Lives system: 3 hits = game over
- Game mode selector UI (pick Stars or Runner)
- Kid-friendly candy/rainbow theme
- Reuse existing: Camera, PoseDetector (extended), AudioManager, PWA

**Out of Scope:**
- Slide/duck gesture (too complex for 4-year-olds)
- Power-ups with complex mechanics
- Persistent high scores / leaderboards
- Character customization
- Multiple characters / skins

## Context for Development

### Existing Codebase Patterns

| File | Pattern | Reuse Strategy |
|------|---------|----------------|
| `src/game/Game.ts` | Orchestrator class with phases | Extend with mode selection, create mode-specific game loops |
| `src/game/GameState.ts` | State manager with update loop | Create `RunnerGameState.ts` following same patterns |
| `src/game/types.ts` | TypeScript interfaces | Add runner-specific types |
| `src/pose/PoseDetector.ts` | MediaPipe wrapper with smoothing | Add `isJumping` detection (wrists above shoulders) |
| `src/renderer/Renderer.ts` | Canvas drawing with caching | Create `RunnerRenderer.ts` for 3D perspective track |
| `src/audio/AudioManager.ts` | Web Audio synthesis | Add runner sounds (coin, crash, jump) |

### Files to Modify

- `src/pose/PoseDetector.ts` - Add jump detection
- `src/game/Game.ts` - Add mode selection, route to correct game mode
- `src/game/types.ts` - Add runner types
- `src/audio/AudioManager.ts` - Add runner sounds

### Files to Create

- `src/game/RunnerGameState.ts` - Runner mode state management
- `src/renderer/RunnerRenderer.ts` - 3-lane track rendering
- `src/renderer/runnerShapes.ts` - Draw coins, obstacles, track

### Technical Decisions

1. **Extend PoseDetector for jump**: Add `isJumping: boolean` to `BodyBounds`. Detect when both wrists (landmarks 15, 16) are above both shoulders (landmarks 11, 12). Add debounce to prevent rapid re-triggering.

2. **Lane-based collision**: Player is always in one of 3 lanes (0, 1, 2). Map body centerX to lane: <0.33 = left, 0.33-0.66 = center, >0.66 = right. Objects spawn in specific lanes, collision = same lane + same Y zone.

3. **Perspective track rendering**: Draw track with vanishing point illusion - lanes converge toward top of screen. Objects spawn small at top, grow as they "approach" the player at bottom.

4. **Speed-based difficulty**: Start at speed 1.0, increase by 0.1 every 500 points. Spawn rate and obstacle frequency also increase.

5. **Lives not health bar**: 3 hearts displayed. Lose one on obstacle hit. Zero = game over screen with "Play Again" button.

6. **Forgiving collision for kids**: Make player hitbox smaller than visual, obstacles larger visually but smaller for collision. Jump window is generous (300ms before and after obstacle).

7. **Mode selection in Game.ts**: Add `GameMode` type ('stars' | 'runner'). Show mode picker on start screen. Store selected mode, instantiate correct state/renderer.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Game.ts                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Mode Selection Screen                   │    │
│  │         [Catch Stars]    [Rainbow Runner]           │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│            ┌───────────────┴───────────────┐                │
│            ▼                               ▼                │
│  ┌─────────────────┐             ┌─────────────────┐        │
│  │   GameState     │             │ RunnerGameState │        │
│  │   (existing)    │             │    (new)        │        │
│  └────────┬────────┘             └────────┬────────┘        │
│           │                               │                 │
│  ┌────────▼────────┐             ┌────────▼────────┐        │
│  │    Renderer     │             │ RunnerRenderer  │        │
│  │   (existing)    │             │     (new)       │        │
│  └─────────────────┘             └─────────────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Shared: CameraManager, PoseDetector*, AudioManager* │   │
│  │  (* = extended with new capabilities)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Tasks

- [ ] **Task 1: Add Jump Detection to PoseDetector**
  - Add `isJumping: boolean` to `BodyBounds` interface
  - Track wrist landmarks (15 = left wrist, 16 = right wrist)
  - Detect jump: both wrists Y < both shoulders Y (above shoulders)
  - Add jump cooldown (500ms) to prevent rapid re-triggering
  - Add `jumpStartTime` for jump duration tracking
  - Test with console.log before integrating

- [ ] **Task 2: Add Runner Types**
  - Add to `types.ts`:
    - `GameMode = 'stars' | 'runner'`
    - `Lane = 0 | 1 | 2`
    - `RunnerObjectType = 'coin' | 'gem' | 'barrier' | 'rock' | 'gap'`
    - `RunnerObject { id, type, lane, z (depth 0-1), isCollectible, collected }`
    - `RunnerGameConfig { speed, spawnRate, lives, level }`
    - `RunnerPlayerState { lane, isJumping, jumpProgress }`

- [ ] **Task 3: Create RunnerGameState**
  - New file `src/game/RunnerGameState.ts`
  - Properties: score, lives (start 3), level, speed, player lane, objects array
  - `update(deltaTime)`: Move objects toward player (increase z), spawn new objects, check collisions
  - Lane collision: object.lane === player.lane && object.z > 0.85
  - Jump collision avoidance: if player.isJumping, ignore ground obstacles
  - Collectible pickup: increment score, play sound
  - Obstacle hit: decrement lives, flash effect, brief invincibility
  - Level up: every 500 points, increase speed by 10%
  - Game over: when lives = 0, return game over state

- [ ] **Task 4: Create RunnerRenderer**
  - New file `src/renderer/RunnerRenderer.ts`
  - Draw 3-lane track with perspective (vanishing point at top center)
  - Lane dividers as dashed lines converging upward
  - Rainbow/candy theme: pastel gradient background, colorful lane markers
  - Draw objects with size based on z-depth (small at top, large at bottom)
  - Draw player character at bottom in current lane
  - Jump animation: player rises up when jumping
  - Speed lines on sides for motion feeling
  - Draw HUD: score (top center), lives as hearts (top left), level (top right)

- [ ] **Task 5: Create Runner Shape Functions**
  - New file `src/renderer/runnerShapes.ts`
  - `drawCoin(ctx, x, y, size)` - Golden spinning coin
  - `drawGem(ctx, x, y, size, color)` - Sparkling gem shape
  - `drawBarrier(ctx, x, y, size)` - Colorful barrier/fence
  - `drawRock(ctx, x, y, size)` - Cartoon boulder
  - `drawGap(ctx, x, y, width)` - Hole in track (player must jump)
  - `drawRunnerCharacter(ctx, x, y, size, jumping)` - Kid-friendly character

- [ ] **Task 6: Add Runner Sounds to AudioManager**
  - `playCoinCollect()` - Quick bright ding
  - `playGemCollect()` - Sparkly chime (higher value feel)
  - `playJump()` - Bouncy boing sound
  - `playCrash()` - Soft bump (not scary)
  - `playLevelUp()` - Triumphant fanfare
  - `playGameOver()` - Gentle "aww" sound (not punishing)

- [ ] **Task 7: Add Mode Selection UI**
  - Modify `Game.ts` `showReady()` to show mode picker
  - Two big buttons with icons: "Catch Stars" (star icon) + "Rainbow Runner" (running figure)
  - Store selected mode in `this.gameMode`
  - Style buttons: large, colorful, touch-friendly (min 80px height)

- [ ] **Task 8: Integrate Runner Mode in Game.ts**
  - Add `gameMode: GameMode` property
  - Create `RunnerGameState` and `RunnerRenderer` instances
  - Modify `startGame()` to initialize correct mode
  - Modify `gameLoop()` to call correct update/render based on mode
  - Pass `isJumping` from PoseDetector to RunnerGameState
  - Handle game over: show overlay with score + "Play Again" button
  - "Play Again" resets to mode selection OR restarts same mode

- [ ] **Task 9: Game Over & Restart Flow**
  - Create `showGameOver(score, level)` in Game.ts
  - Display: "Game Over!", final score, level reached
  - Big "Play Again" button
  - Optional: "Change Game" button to go back to mode select
  - Reset RunnerGameState on restart

- [ ] **Task 10: Polish & Tuning**
  - Tune lane switching sensitivity (smooth but responsive)
  - Tune jump detection threshold (easy for kids to trigger)
  - Tune collision forgiveness (generous hitboxes)
  - Tune speed progression (gradual, not frustrating)
  - Add screen shake on crash
  - Add particle burst on coin collect
  - Test on mobile, adjust touch targets
  - Verify PWA still works with new mode

### Acceptance Criteria

- [ ] **AC1:** Mode selection screen shows two game options on app start
- [ ] **AC2:** Selecting "Rainbow Runner" starts the endless runner mode
- [ ] **AC3:** Player character moves between 3 lanes based on body position (left/center/right)
- [ ] **AC4:** Raising both hands above shoulders triggers a jump
- [ ] **AC5:** Coins/gems spawn and can be collected by being in the same lane
- [ ] **AC6:** Obstacles spawn and cause damage if player is in same lane (unless jumping for gaps)
- [ ] **AC7:** Player has 3 lives, displayed as hearts
- [ ] **AC8:** Hitting an obstacle removes one life with visual/audio feedback
- [ ] **AC9:** Game over screen appears when lives reach 0, showing final score
- [ ] **AC10:** "Play Again" button restarts the runner game
- [ ] **AC11:** Difficulty increases over time (speed, spawn rate)
- [ ] **AC12:** Score displayed prominently during gameplay
- [ ] **AC13:** Can switch back to "Catch Stars" mode from mode selection
- [ ] **AC14:** All sounds work (collect, jump, crash, level up, game over)
- [ ] **AC15:** Game runs at stable 30+ FPS on mobile

## Additional Context

### Game Balance Guidelines

| Parameter | Starting Value | Scaling |
|-----------|---------------|---------|
| Speed | 1.0 | +0.1 per 500 points |
| Spawn interval | 1500ms | -100ms per level (min 800ms) |
| Obstacle ratio | 20% obstacles | +5% per level (max 40%) |
| Jump duration | 600ms | Fixed |
| Invincibility after hit | 1500ms | Fixed |
| Lane switch smoothing | 0.3 | Fixed |

### Visual Theme: Rainbow Candy Land

- **Track**: Pastel rainbow gradient (pink → yellow → cyan)
- **Lane dividers**: White dashed lines with subtle glow
- **Coins**: Golden with sparkle animation
- **Gems**: Rotate through colors (red, blue, green, purple)
- **Barriers**: Colorful striped poles (like candy canes)
- **Rocks**: Cartoon boulders with googly eyes
- **Character**: Simple round character with happy face, bounces when running
- **Background**: Light gradient sky with floating clouds (reuse existing)

### Testing Strategy

- **Jump detection**: Test with various arm positions, ensure reliable trigger
- **Lane switching**: Test at different distances from camera
- **Collision**: Verify objects only collide in correct lane
- **Game over**: Verify 3 hits triggers game over
- **Restart**: Verify clean reset of all state
- **Mode switch**: Verify can switch between Stars and Runner without issues
- **Performance**: Profile on mobile, ensure 30+ FPS
- **Audio**: Verify all sounds play and don't overlap badly

### Notes

- Keep jump gesture forgiving - kids might not raise hands perfectly straight
- Lane switching should feel snappy but not twitchy - some smoothing needed
- Consider adding "warm up" period at start where no obstacles spawn (first 3 seconds)
- Coins should be plentiful and easy to collect - maximize dopamine hits
- Obstacles should be visually distinct from collectibles (different colors, shapes)
- Game over should feel gentle, not punishing - "Great try!" messaging
