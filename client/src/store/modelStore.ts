import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Model } from '../types/index';

interface ModelState {
  models: Model[];
  currentModel: Model | null;
  loading: boolean;
  fetchModels: () => Promise<void>;
  uploadModel: (file: File, name: string) => Promise<Model>;
  deleteModel: (id: string) => Promise<void>;
  setCurrentModel: (model: Model | null) => void;
  updateBoneMapping: (modelId: string, boneMapping: any) => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  currentModel: null,
  loading: false,

  fetchModels: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ models: data as Model[] });
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      set({ loading: false });
    }
  },

  uploadModel: async (file, name) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !['fbx', 'glb', 'gltf'].includes(fileExt)) {
      throw new Error('Invalid file type. Please upload FBX, GLB, or GLTF file.');
    }

    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('models')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('models')
      .getPublicUrl(filePath);

    // Create database record
    const { data, error } = await supabase
      .from('models')
      .insert({
        user_id: user.id,
        name,
        file_url: publicUrl,
        file_type: fileExt,
        file_size: file.size
      })
      .select()
      .single();

    if (error) throw error;

    // Update local state
    set(state => ({
      models: [data as Model, ...state.models]
    }));

    return data as Model;
  },

  deleteModel: async (id) => {
    const model = get().models.find(m => m.id === id);
    if (!model) return;

    // Delete from storage
    const filePath = model.file_url.split('/').slice(-2).join('/');
    await supabase.storage.from('models').remove([filePath]);

    // Delete from database
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update local state
    set(state => ({
      models: state.models.filter(m => m.id !== id),
      currentModel: state.currentModel?.id === id ? null : state.currentModel
    }));
  },

  setCurrentModel: (model) => {
    set({ currentModel: model });
  },

  updateBoneMapping: async (modelId, boneMapping) => {
    const { error } = await supabase
      .from('models')
      .update({ bone_mapping: boneMapping })
      .eq('id', modelId);

    if (error) throw error;

    // Update local state
    set(state => ({
      models: state.models.map(m =>
        m.id === modelId ? { ...m, bone_mapping: boneMapping } : m
      ),
      currentModel: state.currentModel?.id === modelId
        ? { ...state.currentModel, bone_mapping: boneMapping }
        : state.currentModel
    }));
  }
}));
