# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a 3D motion capture application that uses MediaPipe for pose detection and Three.js for 3D visualization. The project consists of:

1. **Root directory** - Contains basic package.json with minimal dependencies
2. **motion-capture-3d/** - Main React application created with Create React App

## Development Commands

Navigate to the `motion-capture-3d/` directory for all development tasks:

```bash
cd motion-capture-3d
npm start          # Start development server (localhost:3000)
npm test           # Run tests in watch mode
npm run build      # Build for production
```

## Architecture

### Component Structure
- **App.tsx** - Main application with state management for 3-step workflow:
  1. File upload (`FileUploader`)
  2. Landmark mapping (`LandmarkMapper`)
  3. Motion capture (`MotionCapture`)

### Key Components
- **FileUploader** - Handles FBX model file uploads
- **LandmarkMapper** - Maps MediaPipe pose landmarks to 3D model joints
- **MotionCapture** - Real-time pose detection and 3D model animation using webcam
- **ModelViewer** - Three.js-based 3D model rendering

### Technology Stack
- **Frontend**: React 19.1.1 with TypeScript
- **3D Graphics**: Three.js with FBX loader
- **Pose Detection**: MediaPipe Tasks Vision (@mediapipe/tasks-vision)
- **Testing**: Jest with React Testing Library

### File Structure
```
motion-capture-3d/src/
├── App.tsx                    # Main app with workflow state
├── components/
│   ├── FileUploader.tsx       # FBX file upload
│   ├── LandmarkMapper.tsx     # Pose landmark mapping
│   ├── MotionCapture.tsx      # Real-time pose capture
│   └── ModelViewer.tsx        # 3D model display
└── [CSS files for styling]
```

## Development Notes

- The app uses a sequential workflow: upload → mapping → capture
- MediaPipe integration requires proper WASM file loading
- Three.js scenes are managed with refs for performance
- FBX models require proper loading and bone structure mapping