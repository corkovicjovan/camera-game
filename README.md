# Camera Games

A collection of fun, camera-based games for kids that use body tracking and pose detection. Move your body to play - no controllers needed!

**100% Free & Private** - No ads, no payments, no tracking. All processing happens locally in your browser.

## Games

### Catch the Stars
Move your body to catch falling stars and hearts while avoiding the X marks. Features combos, power-ups, and level progression.

### Rainbow Runner
An endless runner where you dodge obstacles and collect coins by moving left/right. Raise both hands to jump over barriers!

## Features

- **Body Tracking** - Uses MediaPipe pose detection to track your movement
- **Body Silhouette** - See yourself in the game with real-time body segmentation
- **Kid-Friendly** - Large collision zones, forgiving jump timing, fun celebrations
- **Offline Support** - Works as a PWA, install it on your device
- **No Data Collection** - Everything runs locally, camera feed never leaves your device

## Quick Start

```bash
# Clone the repository
git clone https://github.com/corkovicjovan/camera-game.git
cd camera-game

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser and allow camera access.

## Controls

| Action | How to Do It |
|--------|-------------|
| Move left/right | Move your body left or right |
| Jump (Runner) | Raise both hands above your shoulders |
| Debug mode | Press `D` to see collision boxes |

## Project Structure

```
src/
├── audio/          # Sound effects and audio management
├── camera/         # Camera access and video handling
├── game/           # Game logic and state management
│   ├── Game.ts           # Main game controller
│   ├── GameState.ts      # Stars mode state
│   └── RunnerGameState.ts # Runner mode state
├── pose/           # MediaPipe pose detection
├── renderer/       # Canvas rendering for both games
├── segmentation/   # Body silhouette extraction
├── main.ts         # Entry point
└── styles.css      # Styling
```

## Tech Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **MediaPipe** - Pose detection and body segmentation
- **PWA** - Offline support with vite-plugin-pwa

## Browser Support

Works best in modern browsers with WebGL support:
- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 14.5+)

Camera access requires HTTPS in production.

## Deployment

### Netlify (Recommended)

1. Push to GitHub
2. Connect repo to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

### Manual

```bash
npm run build
# Deploy the 'dist' folder to any static host
```

## License

MIT License - feel free to use, modify, and share!

## Related Projects

- [Puzzle Game](https://github.com/corkovicjovan/puzzle-game) - Kid-friendly puzzle game with custom images
