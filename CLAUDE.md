# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediaPipe FBX Motion Capture System - A React web application for real-time motion capture using MediaPipe pose tracking with Three.js 3D avatar animation.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with HTTPS support
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture & Code Structure

### Main Components
- `src/components/MotionCaptureApp.tsx` - Main application component with camera controls and UI
- `src/components/Scene3D.tsx` - Three.js scene manager with camera and lighting setup
- `src/components/FBXAvatar.tsx` - 3D avatar component that applies pose data to either FBX models or fallback stick figure
- `src/hooks/useMediaPipePose.ts` - MediaPipe pose tracking hook that processes webcam input
- `src/utils/poseMapping.ts` - Core pose-to-bone mapping algorithms

### Technology Stack
- React 18 + TypeScript
- Three.js + React Three Fiber + Drei for 3D rendering
- MediaPipe Tasks Vision for pose tracking
- Vite for development and building

### Key Architectural Patterns

#### Pose Processing Pipeline
1. **Camera Input** → MediaPipe pose detection (33 landmarks)
2. **Pose Mapping** → Convert landmarks to bone rotations using direction vectors
3. **Smoothing** → 15% lerp interpolation for fluid animation
4. **Avatar Update** → Apply rotations to 3D model or stick figure

#### Fallback System
- Primary: FBX model loading from `public/models/`
- Fallback: Colorful stick figure avatar if FBX fails
- Error boundaries prevent crashes during model loading

#### Performance Considerations
- 30fps target with GPU acceleration
- Confidence-based filtering (0.5+ threshold for pose application)
- Real-time smoothing using lerp interpolation
- Efficient Three.js object management

## Important Technical Details

### MediaPipe Integration
- Requires HTTPS or localhost exception in Chrome for camera access
- Uses confidence scores to filter unreliable pose data
- 33 pose landmarks mapped to body parts (head, torso, arms, legs)

### 3D Pose Mapping Algorithm
```typescript
// Core rotation calculation from landmark pairs
const direction = new THREE.Vector3(to.x - from.x, -(to.y - from.y), to.z - from.z)
const euler = new THREE.Euler(angleX * 0.5, 0, angleZ - Math.PI / 2)
```

### Motion Recording System
- Frame-by-frame pose data storage
- Real-time recording counter
- Extensible for playback functionality

## Development Notes

- Models should be placed in `public/models/` directory
- Camera requires user permission and HTTPS context
- Stick figure uses color-coded body parts for easy debugging
- All pose processing happens in real-time without server dependency