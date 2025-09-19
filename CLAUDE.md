# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based 3D motion application platform for game developers. The project enables users to capture their own motions using phones/webcams, convert them to 3D motion data, and apply them to uploaded 3D models.

**Key Features:**
- 3D model management (GLB, FBX, OBJ support)
- Motion library with search/filtering
- Intelligent motion capture and application using camera/webcam
- Motion editing tools with real-time parameter adjustment
- Export functionality for various 3D formats
- User dashboard and project management

## Technology Stack

**Frontend:**
- React with TypeScript
- Three.js and React-Three-Fiber for 3D rendering
- Vite as build tool
- Tailwind CSS for styling
- Google MediaPipe Pose or TensorFlow.js for motion capture
- React Context API and React Query for state management

**Backend:**
- Spring Boot (Java)
- Spring Data JPA for database integration
- Spring Security with JWT for authentication
- Assimp-Java for 3D model parsing
- Custom motion retargeting algorithms

**Database & Storage:**
- MySQL for structured data
- AWS S3 or similar object storage for 3D files
- Cloud-based deployment (AWS/GCP)

## Architecture

The system consists of:
1. **Frontend**: React-based UI with 3D viewer
2. **Backend**: Spring Boot API server handling business logic
3. **Database**: MySQL for metadata storage
4. **Object Storage**: Cloud storage for large 3D/motion files
5. **3D Processing Module**: Handles model parsing and motion application

## Core Workflow

1. **Motion Capture**: Users record motions via webcam/phone camera
2. **Pose Estimation**: MediaPipe/TensorFlow.js analyzes joint movements
3. **3D Conversion**: Backend converts 2D pose data to 3D skeleton animation
4. **Motion Retargeting**: Maps user motion to uploaded 3D model's skeleton
5. **Real-time Preview**: 3D viewer shows applied motion results
6. **Export**: Generate downloadable 3D files with applied motions

## Key Technical Challenges

- Real-time pose estimation accuracy in web browsers
- Motion retargeting between different skeleton structures
- Large file handling and streaming in web environment
- Cross-browser WebGL compatibility for 3D rendering
- Performance optimization for complex 3D operations

## Development Status

This project is currently in the planning and initial design phase. The team is defining the technical stack and architecture for MVP implementation focusing on core features.

## API Structure

Key endpoints include:
- `/api/auth/*` - Authentication and user management
- `/api/models/*` - 3D model upload/management
- `/api/motions/*` - Motion library and application
- `/api/projects/*` - Project management
- `/api/results/*` - Export and download functionality

## Security Considerations

- JWT-based authentication
- HTTPS for all communications
- File upload validation and scanning
- User data encryption
- Role-based access control