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
