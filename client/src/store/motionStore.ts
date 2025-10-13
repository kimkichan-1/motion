import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Recording, PoseFrame } from '../types';

interface MotionState {
  recordings: Recording[];
  currentRecording: Recording | null;
  isRecording: boolean;
  recordedFrames: PoseFrame[];
  loading: boolean;

  startRecording: () => void;
  stopRecording: (name: string, modelId?: string) => Promise<Recording>;
  addFrame: (frame: PoseFrame) => void;
  fetchRecordings: () => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
  exportRecording: (recordingId: string, format: 'json' | 'fbx' | 'bvh') => Promise<void>;
}

export const useMotionStore = create<MotionState>((set, get) => ({
  recordings: [],
  currentRecording: null,
  isRecording: false,
  recordedFrames: [],
  loading: false,

  startRecording: () => {
    set({ isRecording: true, recordedFrames: [] });
  },

  stopRecording: async (name, modelId) => {
    const { recordedFrames } = get();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const duration = recordedFrames.length > 0
      ? (recordedFrames[recordedFrames.length - 1].timestamp - recordedFrames[0].timestamp) / 1000
      : 0;

    // Save recording to database
    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        model_id: modelId,
        name,
        duration,
        pose_data: recordedFrames
      })
      .select()
      .single();

    if (error) throw error;

    // Track usage
    await supabase.from('usage_stats').insert({
      user_id: user.id,
      action_type: 'recording',
      duration
    });

    set(state => ({
      recordings: [data as Recording, ...state.recordings],
      isRecording: false,
      recordedFrames: [],
      currentRecording: data as Recording
    }));

    return data as Recording;
  },

  addFrame: (frame) => {
    const { isRecording } = get();
    if (!isRecording) return;

    set(state => ({
      recordedFrames: [...state.recordedFrames, frame]
    }));
  },

  fetchRecordings: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ recordings: data as Recording[] });
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      set({ loading: false });
    }
  },

  deleteRecording: async (id) => {
    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    set(state => ({
      recordings: state.recordings.filter(r => r.id !== id),
      currentRecording: state.currentRecording?.id === id ? null : state.currentRecording
    }));
  },

  exportRecording: async (recordingId, format) => {
    const recording = get().recordings.find(r => r.id === recordingId);
    if (!recording || !recording.pose_data) {
      throw new Error('Recording not found or has no data');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let exportData: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'json') {
      exportData = JSON.stringify(recording.pose_data, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      // For FBX/BVH, you would need a conversion library
      // This is a placeholder - actual implementation would require
      // libraries like three.js exporters or custom converters
      throw new Error(`Export to ${format} not yet implemented`);
    }

    // Create and download file
    const blob = new Blob([exportData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.name}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track usage
    await supabase.from('usage_stats').insert({
      user_id: user.id,
      action_type: 'export',
      file_size: blob.size
    });
  }
}));
