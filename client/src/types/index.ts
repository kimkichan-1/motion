import { User } from '@supabase/supabase-js';

// Auth Types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Motion Capture Types
export interface MotionData {
  timestamp: number;
  landmarks: {
    pose?: any[];
    leftHand?: any[];
    rightHand?: any[];
    face?: any[];
  };
}

export interface RecordedMotion {
  id: string;
  name: string;
  duration: number;
  frameCount: number;
  data: MotionData[];
  createdAt: string;
}

// 3D Model Types
export interface Model3D {
  id: string;
  name: string;
  url: string;
  type: 'fbx' | 'glb' | 'gltf';
  uploadedAt: string;
}

// Camera Types
export interface CameraSource {
  id: string;
  type: 'webcam' | 'mobile';
  stream: MediaStream | null;
  position: 'front' | 'back';
  isActive: boolean;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'basic' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripePriceId: string;
}

// WebRTC Types
export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

// Store Types
export interface MotionCaptureStore {
  isCapturing: boolean;
  recordedMotions: RecordedMotion[];
  currentMotion: MotionData[];
  cameras: CameraSource[];
  startCapture: () => void;
  stopCapture: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  addMotionData: (data: MotionData) => void;
  clearMotionData: () => void;
}

export interface ModelStore {
  currentModel: Model3D | null;
  models: Model3D[];
  uploadModel: (file: File) => Promise<void>;
  loadModel: (modelId: string) => Promise<void>;
  removeModel: (modelId: string) => Promise<void>;
}
