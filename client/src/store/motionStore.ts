import { create } from 'zustand';
import { MotionData, RecordedMotion, CameraSource } from '../types';

interface MotionStore {
  isCapturing: boolean;
  isRecording: boolean;
  recordedMotions: RecordedMotion[];
  currentMotion: MotionData[];
  cameras: CameraSource[];
  recordingStartTime: number | null;

  setCapturing: (isCapturing: boolean) => void;
  setRecording: (isRecording: boolean) => void;
  addMotionData: (data: MotionData) => void;
  clearMotionData: () => void;
  saveRecording: (name: string) => void;
  deleteRecording: (id: string) => void;
  addCamera: (camera: CameraSource) => void;
  removeCamera: (id: string) => void;
  updateCameraStream: (id: string, stream: MediaStream) => void;
  toggleCameraActive: (id: string) => void;
}

export const useMotionStore = create<MotionStore>((set, get) => ({
  isCapturing: false,
  isRecording: false,
  recordedMotions: [],
  currentMotion: [],
  cameras: [],
  recordingStartTime: null,

  setCapturing: (isCapturing) => set({ isCapturing }),

  setRecording: (isRecording) => {
    if (isRecording) {
      set({
        isRecording,
        recordingStartTime: Date.now(),
        currentMotion: []
      });
    } else {
      set({ isRecording, recordingStartTime: null });
    }
  },

  addMotionData: (data) => {
    const { isRecording, currentMotion } = get();
    if (isRecording) {
      set({ currentMotion: [...currentMotion, data] });
    }
  },

  clearMotionData: () => set({ currentMotion: [] }),

  saveRecording: (name) => {
    const { currentMotion, recordedMotions, recordingStartTime } = get();
    if (currentMotion.length === 0) return;

    const duration = recordingStartTime
      ? Date.now() - recordingStartTime
      : 0;

    const newRecording: RecordedMotion = {
      id: crypto.randomUUID(),
      name,
      duration,
      frameCount: currentMotion.length,
      data: currentMotion,
      createdAt: new Date().toISOString(),
    };

    set({
      recordedMotions: [...recordedMotions, newRecording],
      currentMotion: [],
      isRecording: false,
      recordingStartTime: null,
    });
  },

  deleteRecording: (id) => {
    const { recordedMotions } = get();
    set({
      recordedMotions: recordedMotions.filter((r) => r.id !== id),
    });
  },

  addCamera: (camera) => {
    const { cameras } = get();
    set({ cameras: [...cameras, camera] });
  },

  removeCamera: (id) => {
    const { cameras } = get();
    const camera = cameras.find((c) => c.id === id);
    if (camera?.stream) {
      camera.stream.getTracks().forEach((track) => track.stop());
    }
    set({ cameras: cameras.filter((c) => c.id !== id) });
  },

  updateCameraStream: (id, stream) => {
    const { cameras } = get();
    set({
      cameras: cameras.map((c) =>
        c.id === id ? { ...c, stream } : c
      ),
    });
  },

  toggleCameraActive: (id) => {
    const { cameras } = get();
    set({
      cameras: cameras.map((c) =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ),
    });
  },
}));
