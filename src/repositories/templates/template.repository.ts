import { supabase } from '@/lib/supabase';
import { DatabaseTemplate } from '@/types/template';

const TEMPLATES_TABLE = 'templates';

export class TemplateRepository {
  static async listTemplates(): Promise<DatabaseTemplate[]> {
    const { data, error } = await supabase
      .from(TEMPLATES_TABLE)
      .select('id,name,category,description,status,objects,layers,created_at,updated_at')
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTemplateById(id: string): Promise<DatabaseTemplate | null> {
    const { data, error } = await supabase
      .from(TEMPLATES_TABLE)
      .select('*')
      .eq('id', id)
      .neq('status', 'deleted')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createTemplate(templateData: {
    name: string;
    category?: string | null;
    description?: string | null;
    status: 'active' | 'draft' | 'deleted' | 'hidden';
    objects: any[];
    layers: any[];
  }): Promise<DatabaseTemplate> {
    const { data, error } = await supabase
      .from(TEMPLATES_TABLE)
      .insert({
        name: templateData.name,
        category: templateData.category || null,
        description: templateData.description || null,
        status: templateData.status,
        objects: templateData.objects,
        layers: templateData.layers,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTemplate(
    id: string,
    updates: {
      name?: string;
      category?: string | null;
      description?: string | null;
      status?: 'active' | 'draft' | 'deleted' | 'hidden';
      objects?: any[];
      layers?: any[];
    }
  ): Promise<DatabaseTemplate | null> {
    const cleanUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.objects !== undefined) cleanUpdates.objects = updates.objects;
    if (updates.layers !== undefined) cleanUpdates.layers = updates.layers;

    const { data, error } = await supabase
      .from(TEMPLATES_TABLE)
      .update(cleanUpdates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async deleteTemplate(id: string): Promise<DatabaseTemplate | null> {
    const { data, error } = await supabase
      .from(TEMPLATES_TABLE)
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
