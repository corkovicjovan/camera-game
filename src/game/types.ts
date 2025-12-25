export type ObjectType = 'star' | 'heart' | 'cloud' | 'x'

export interface FallingObject {
  id: number
  type: ObjectType
  x: number          // Continuous X position (0-1 normalized, or pixels)
  y: number
  speed: number
  size: number
  rotation: number
  isGood: boolean
  caught?: boolean   // Track if already caught to avoid double-counting
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface ScorePopup {
  x: number
  y: number
  value: number
  life: number
  scale: number
}

export interface BackgroundCloud {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

export type GamePhase = 'LOADING' | 'READY' | 'PLAYING' | 'ERROR'

// Player state with continuous position and bounds
export interface PlayerState {
  x: number           // Center X position (0-1 normalized)
  leftEdge: number    // Left edge of body (0-1)
  rightEdge: number   // Right edge of body (0-1)
  width: number       // Body width (0-1)
  headY: number       // Head Y position (0-1 normalized, 0=top)
}

export interface GameConfig {
  spawnInterval: number      // ms between spawns
  fallSpeed: number          // base pixels per frame
  objectSize: number         // base size in pixels
  goodObjectChance: number   // 0-1 probability of good objects
  catchZoneY: number         // Y position where objects are caught
  catchZoneHeight: number    // Height of catch zone
  canvasWidth: number
  canvasHeight: number
}

export const DEFAULT_CONFIG: Omit<GameConfig, 'catchZoneY' | 'catchZoneHeight' | 'canvasWidth' | 'canvasHeight'> = {
  spawnInterval: 1200,       // Slightly faster spawning
  fallSpeed: 3,
  objectSize: 70,            // Slightly smaller objects
  goodObjectChance: 0.8      // More good objects for fun
}

// ============================================
// Runner Mode Types
// ============================================

export type GameMode = 'stars' | 'runner'

export type Lane = 0 | 1 | 2

export type RunnerObjectType = 'coin' | 'gem' | 'barrier' | 'rock'

export interface RunnerObject {
  id: number
  type: RunnerObjectType
  lane: Lane
  z: number              // Depth 0-1 (0 = far/top, 1 = near/bottom)
  isCollectible: boolean
  collected: boolean
  size: number
}

export interface RunnerPlayerState {
  lane: Lane
  targetLane: Lane       // For smooth lane transitions
  laneProgress: number   // 0-1 interpolation between lanes
  isJumping: boolean
  jumpProgress: number   // 0-1 for jump animation
  isInvincible: boolean
  invincibleUntil: number
}

export interface RunnerGameConfig {
  speed: number          // Current speed multiplier
  baseSpeed: number      // Starting speed
  spawnInterval: number  // ms between spawns
  lives: number
  maxLives: number
  level: number
  obstacleChance: number // 0-1 probability of obstacle vs collectible
  canvasWidth: number
  canvasHeight: number
}

export interface RunnerParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export const DEFAULT_RUNNER_CONFIG: Omit<RunnerGameConfig, 'canvasWidth' | 'canvasHeight'> = {
  speed: 1.0,
  baseSpeed: 1.0,
  spawnInterval: 1500,
  lives: 3,
  maxLives: 3,
  level: 1,
  obstacleChance: 0.2
}
