import { supabase } from '@/lib/supabase';
import { DatabaseDrawing } from '@/types/drawing';

const DRAWINGS_TABLE = 'drawings';

export class DrawingRepository {
  static async listDrawingsForUser(userId: string): Promise<DatabaseDrawing[]> {
    const { data, error } = await supabase
      .from(DRAWINGS_TABLE)
      .select('id,name,created_at,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createDrawingForUser(
    userId: string,
    drawingData: { name: string; data: any }
  ): Promise<DatabaseDrawing> {
    const { data, error } = await supabase
      .from(DRAWINGS_TABLE)
      .insert({
        user_id: userId,
        name: drawingData.name,
        data: drawingData.data,
      })
      .select('id,name,created_at,updated_at')
      .single();

    if (error) throw error;
    return data;
  }

  static async getDrawingForUser(userId: string, id: string): Promise<DatabaseDrawing | null> {
    const { data, error } = await supabase
      .from(DRAWINGS_TABLE)
      .select('id,name,data,created_at,updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async deleteDrawingForUser(userId: string, id: string): Promise<DatabaseDrawing | null> {
    const existing = await this.getDrawingForUser(userId, id);
    if (!existing) return null;

    const { error } = await supabase
      .from(DRAWINGS_TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return existing;
  }

  static async updateDrawingForUser(
    userId: string,
    id: string,
    updates: { name?: string; data?: any }
  ): Promise<DatabaseDrawing | null> {
    const cleanUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.data !== undefined) cleanUpdates.data = updates.data;

    const { data, error } = await supabase
      .from(DRAWINGS_TABLE)
      .update(cleanUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id,name,created_at,updated_at')
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
