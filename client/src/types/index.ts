export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'trial';
  trial_ends_at?: string;
  subscription_ends_at?: string;
  stripe_customer_id?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_type: 'fbx' | 'glb' | 'gltf';
  thumbnail_url?: string;
  file_size?: number;
  bone_mapping?: BoneMapping;
  created_at: string;
  updated_at: string;
}

export interface BoneMapping {
  [key: string]: string; // Maps MediaPipe landmarks to model bones
}

export interface Recording {
  id: string;
  user_id: string;
  model_id?: string;
  name: string;
  duration?: number;
  pose_data?: PoseFrame[];
  file_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PoseFrame {
  timestamp: number;
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface Session {
  id: string;
  user_id: string;
  room_id: string;
  model_id?: string;
  is_active: boolean;
  created_at: string;
  ended_at?: string;
}

export interface UsageStats {
  id: string;
  user_id: string;
  action_type: 'recording' | 'export' | 'upload';
  duration?: number;
  file_size?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  stripe_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}
