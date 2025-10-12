import { create } from 'zustand';
import { Model3D } from '../types';
import { supabase } from '../lib/supabase';

interface ModelStore {
  currentModel: Model3D | null;
  models: Model3D[];
  isLoading: boolean;
  error: string | null;

  setCurrentModel: (model: Model3D | null) => void;
  uploadModel: (file: File) => Promise<Model3D>;
  loadModels: () => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  currentModel: null,
  models: [],
  isLoading: false,
  error: null,

  setCurrentModel: (model) => set({ currentModel: model }),

  uploadModel: async (file) => {
    set({ isLoading: true, error: null });

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('models')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('models')
        .getPublicUrl(fileName);

      // Save model metadata to database
      const modelData = {
        user_id: user.id,
        name: file.name,
        url: publicUrl,
        type: fileExt as 'fbx' | 'glb' | 'gltf',
      };

      const { data: model, error: dbError } = await supabase
        .from('models')
        .insert(modelData)
        .select()
        .single();

      if (dbError) throw dbError;

      const newModel: Model3D = {
        id: model.id,
        name: model.name,
        url: model.url,
        type: model.type,
        uploadedAt: model.created_at,
      };

      set({
        models: [...get().models, newModel],
        isLoading: false,
      });

      return newModel;
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },

  loadModels: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const models: Model3D[] = data.map((m) => ({
        id: m.id,
        name: m.name,
        url: m.url,
        type: m.type,
        uploadedAt: m.created_at,
      }));

      set({ models, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  deleteModel: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const model = get().models.find((m) => m.id === id);
      if (!model) throw new Error('Model not found');

      // Delete from database
      const { error: dbError } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Delete from storage
      const fileName = model.url.split('/').slice(-2).join('/');
      const { error: storageError } = await supabase.storage
        .from('models')
        .remove([fileName]);

      if (storageError) throw storageError;

      set({
        models: get().models.filter((m) => m.id !== id),
        currentModel: get().currentModel?.id === id ? null : get().currentModel,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },
}));
