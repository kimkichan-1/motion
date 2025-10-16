# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time motion capture web platform using MediaPipe for pose detection, Three.js for 3D rendering, and Supabase for backend services. The application enables users to upload 3D models (FBX/GLB/GLTF), capture body motion via webcam, and apply motion data to their models in real-time.

**Current Branch**: `kim` (main development branch)
**Main Branch**: `main`

## Development Commands

### Client (Frontend)
```bash
cd client
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # TypeScript compile + Vite build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Server (Backend)
```bash
cd server
npm install          # Install dependencies
npm run dev          # Start with nodemon + ts-node (http://localhost:3001)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled production build
```

### Root (Both)
```bash
npm run install-all  # Install all dependencies (client + server)
npm run dev          # Run both client and server concurrently
npm run build        # Build both client and server
```

## Architecture Overview

### Core Technology Stack

**Frontend**:
- React 18 + TypeScript + Vite
- Three.js + React Three Fiber (@react-three/fiber, @react-three/drei) for 3D rendering
- MediaPipe Pose (@mediapipe/pose, @mediapipe/tasks-vision) for body tracking
- Zustand for state management
- TailwindCSS for styling
- Socket.io Client for real-time communication

**Backend**:
- Express + TypeScript
- Socket.io for WebRTC signaling and multi-camera synchronization
- Supabase client for database operations

**Database & Auth**:
- Supabase (PostgreSQL with RLS enabled)
- Supabase Storage for file uploads (models, recordings, thumbnails)
- Supabase Auth for user authentication

### State Management Architecture

The application uses Zustand stores located in `client/src/store/`:

1. **authStore.ts**: User authentication, profile management, and session handling
   - Automatically initializes auth state on app load
   - Listens for Supabase auth changes
   - Methods: `signUp`, `signIn`, `signOut`, `fetchProfile`, `updateProfile`

2. **modelStore.ts**: 3D model upload, storage, and selection
   - Manages uploaded models and currently selected model
   - Handles file uploads to Supabase Storage

3. **motionStore.ts**: Motion capture state and recording management
   - Tracks recording state, captured frames, and playback

### Motion Capture System

The motion capture system is the core feature with three critical components:

#### 1. Pose Detection (`client/src/hooks/useMediaPipe.ts`)
- Uses MediaPipe Pose to extract 33 body landmarks from webcam feed
- Returns both 2D screen coordinates and 3D world coordinates
- Key landmarks indexed by constants (e.g., LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12)

#### 2. Bone Mapping & Calibration
The biggest challenge is mapping MediaPipe coordinates to 3D model skeletons due to coordinate system differences. Three solutions are implemented:

**a) Automatic T-Pose Calibration** (`client/src/utils/calibration.ts`) - **RECOMMENDED**
- User performs T-pose (arms horizontal, legs straight)
- `isValidTPose()`: Validates pose by checking joint visibility and arm angles
- `calibrateFromTPose()`: Tests all 8 axis flip combinations (X/Y/Z) for each bone
- Finds best configuration by calculating dot product with expected T-pose directions
- Returns `MappingConfig` with optimal settings for all bones

**b) Manual Bone Mapping Controls** (`client/src/components/viewer/BoneMappingControls.tsx`)
- UI for fine-tuning individual bones after calibration
- Each bone has 6 parameters: flipX, flipY, flipZ, defaultDirX, defaultDirY, defaultDirZ
- Use for edge cases where auto-calibration needs adjustment

**c) Direct Mapping** (`client/src/utils/poseMapping.ts`)
- `applyPoseDirectMapping()`: Applies MappingConfig to skeleton
- Uses quaternion rotation with SLERP smoothing (0.5 factor)
- Handles coordinate transformations per bone configuration

#### 3. Bone Detection (`client/src/utils/motionRetargeting.ts`)
- `COMMON_BONE_NAMES`: Maps standard bone names across different 3D model formats
- Auto-detects bone naming conventions (Mixamo, Blender, generic)
- Creates bone map for applying motion data

### Multi-Camera Synchronization

**Socket.io Room System** (`server/src/socket/index.ts`):
- Users join rooms with role: 'desktop' or 'mobile'
- Events:
  - `join-room`: Join a sync session
  - `pose-data`: Broadcast pose from camera
  - `pose-update`: Receive pose from other cameras
  - WebRTC signaling: `offer`, `answer`, `ice-candidate`
- State tracking: `rooms` Map and `userRoles` Map

### Database Schema

Key tables (`supabase_schema.sql`):

- **profiles**: User accounts with subscription tiers (free/pro/enterprise)
- **models**: Uploaded 3D models with `bone_mapping` JSONB column for storing calibration
- **recordings**: Motion capture recordings with `pose_data` JSONB
- **sessions**: Multi-camera session metadata
- **usage_stats**: Track user actions for quota management
- **payments**: Stripe payment records

**Storage Buckets**:
- `models`: Private, user-scoped (FBX/GLB/GLTF files)
- `recordings`: Private, user-scoped (exported motion data)
- `thumbnails`: Public (preview images)

All tables use Row Level Security (RLS) with policies restricting access to own resources. Admins have special view-all policies.

### File Upload Flow

1. User selects file in UI
2. Upload to Supabase Storage at path: `{bucket}/{user_id}/{filename}`
3. Get public/signed URL from Storage
4. Create metadata record in corresponding table (models/recordings)
5. RLS policies verify `auth.uid()` matches folder structure

## Important Implementation Notes

### MediaPipe Coordinate System
- MediaPipe uses **world coordinates** (3D) where Y-axis points UP
- Values are normalized around body center
- Always use `poseData.worldLandmarks` for 3D motion, not `landmarks` (2D screen coords)

### T-Pose Calibration Workflow
1. User navigates to Capture page
2. Uploads and selects 3D model
3. Performs T-pose in front of camera
4. UI shows real-time validation feedback (green = ready)
5. Clicks "Calibrate" button
6. System auto-generates optimal `MappingConfig`
7. Config applied immediately; optionally save to `models.bone_mapping` column

### Bone Naming Detection
When loading a 3D model, the system:
1. Iterates through all bones in skeleton
2. Matches against `COMMON_BONE_NAMES` patterns
3. Logs detected bones to console (useful for debugging)
4. If bone names don't match, add new patterns to `COMMON_BONE_NAMES`

### React Three Fiber Scene Structure
```
<Canvas>
  <ModelViewer model={selectedModel} poseData={currentPose} config={mappingConfig} />
    - Loads FBX/GLB using Three.js loaders
    - Applies pose using applyPoseDirectMapping()
    - Renders with lights and controls
</Canvas>
```

## Common Development Patterns

### Adding New Bone Mapping
1. Add bone name pattern to `COMMON_BONE_NAMES` in `motionRetargeting.ts`
2. Add corresponding entry to `MappingConfig` type in `BoneMappingControls.tsx`
3. Update `calibrateFromTPose()` to include new bone with expected direction
4. Add UI controls in `BoneMappingControls.tsx` if needed

### Implementing New Motion Features
1. Capture pose in `useMediaPipe` hook
2. Store frames in `motionStore`
3. Process frames with bone mapping utils
4. Apply to 3D model via `applyPoseDirectMapping`
5. Optionally save to Supabase `recordings` table

### Testing Motion Capture
- Enable webcam permissions
- Ensure good lighting and full body visibility
- Check browser console for bone detection logs
- Verify `poseData.worldLandmarks` contains 33 points with visibility > 0.5

## Environment Variables

**Client** (`client/.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SERVER_URL=http://localhost:3001
```

**Server** (`server/.env`):
```
PORT=3001
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_test_... (optional)
```

## Deployment

**Backend (Render.com)**:
- Build command: `npm run build`
- Start command: `npm start`
- Set environment variables in Render dashboard

**Frontend (Vercel/Netlify)**:
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables must include VITE_ prefix

## Known Issues & Solutions

### Storage 400 Error
- Ensure file path format: `{user_id}/{filename}` (no leading slash)
- Verify RLS policies allow INSERT for authenticated user
- Check bucket exists with correct public/private setting

### MediaPipe Not Loading
- Verify @mediapipe packages are installed
- Check WASM files are accessible (Vite may need config)
- Import from `@mediapipe/tasks-vision` for newer API

### Bone Mapping Issues
- Run T-pose calibration first before troubleshooting
- Check console for bone detection logs
- Verify model has standard skeleton structure
- Use manual controls for fine-tuning specific bones

### TypeScript Errors
- Run `npm run build` in both client and server to check
- Ensure all type imports use `import type { ... }`
- Check `client/src/types/index.ts` for shared types
