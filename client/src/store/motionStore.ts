import { create } from 'zustand';
import { MotionData, RecordedMotion, CameraSource } from '../types';

interface MotionStore {
  isCapturing: boolean;
  isRecording: boolean;
  isPaused: boolean;
  recordedMotions: RecordedMotion[];
  currentMotionData: MotionData[];
  cameras: CameraSource[];
  recordingStartTime: number | null;

  setCapturing: (isCapturing: boolean) => void;
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
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
  isPaused: false,
  recordedMotions: [],
  currentMotionData: [],
  cameras: [],
  recordingStartTime: null,

  setCapturing: (isCapturing) => set({ isCapturing }),

  startRecording: () => {
    set({
      isRecording: true,
      isPaused: false,
      recordingStartTime: Date.now(),
      currentMotionData: []
    });
  },

  stopRecording: () => {
    set({
      isRecording: false,
      isPaused: false,
      recordingStartTime: null
    });
  },

  pauseRecording: () => {
    set({ isPaused: true });
  },

  resumeRecording: () => {
    set({ isPaused: false });
  },

  addMotionData: (data) => {
    const { isRecording, isPaused, currentMotionData } = get();
    if (isRecording && !isPaused) {
      set({ currentMotionData: [...currentMotionData, data] });
    }
  },

  clearMotionData: () => set({ currentMotionData: [] }),

  saveRecording: (name) => {
    const { currentMotionData, recordedMotions, recordingStartTime } = get();
    if (currentMotionData.length === 0) return;

    const duration = recordingStartTime
      ? Date.now() - recordingStartTime
      : 0;

    const newRecording: RecordedMotion = {
      id: crypto.randomUUID(),
      name,
      duration,
      frameCount: currentMotionData.length,
      data: currentMotionData,
      createdAt: new Date().toISOString(),
    };

    set({
      recordedMotions: [...recordedMotions, newRecording],
      currentMotionData: [],
      isRecording: false,
      isPaused: false,
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
