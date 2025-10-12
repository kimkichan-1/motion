-- Motion Capture Platform Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table is managed by Supabase Auth
-- We'll create a profiles table to extend user data

-- Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subscriptions Table
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'pro')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')) DEFAULT 'trial',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3D Models Table
CREATE TABLE models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fbx', 'glb', 'gltf')),
  file_size BIGINT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Motion Recordings Table
CREATE TABLE motion_recordings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in milliseconds
  frame_count INTEGER NOT NULL,
  file_url TEXT, -- URL to stored motion data file
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Usage Tracking Table (for analytics and limits)
CREATE TABLE usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upload_model', 'record_motion', 'export_motion', 'stream_session')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_models_user_id ON models(user_id);
CREATE INDEX idx_motion_recordings_user_id ON motion_recordings(user_id);
CREATE INDEX idx_motion_recordings_model_id ON motion_recordings(model_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions Policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Models Policies
CREATE POLICY "Users can view own models" ON models
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own models" ON models
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own models" ON models
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own models" ON models
  FOR DELETE USING (auth.uid() = user_id);

-- Motion Recordings Policies
CREATE POLICY "Users can view own recordings" ON motion_recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings" ON motion_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON motion_recordings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings" ON motion_recordings
  FOR DELETE USING (auth.uid() = user_id);

-- Usage Logs Policies
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON usage_logs
  FOR INSERT WITH CHECK (true);

-- Functions and Triggers

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create default free subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'trial');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motion_recordings_updated_at BEFORE UPDATE ON motion_recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage Buckets (run in Supabase Dashboard -> Storage)
-- Create two buckets:
-- 1. models (private) - for 3D model files
-- 2. motions (private) - for motion recording data files

-- Storage Policies (apply in Supabase Dashboard after creating buckets)
-- Models bucket policies:
-- SELECT: authenticated users can read their own files
-- INSERT: authenticated users can upload files
-- UPDATE: authenticated users can update their own files
-- DELETE: authenticated users can delete their own files

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
