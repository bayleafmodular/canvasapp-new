import { DrawingRepository } from '@/repositories/drawings/drawing.repository';
import { DatabaseDrawing, PublicDrawing } from '@/types/drawing';
import { CreateDrawingInput, UpdateDrawingInput } from '@/validators/drawings/drawing.validator';

export class DrawingError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'DrawingError';
  }
}

export const toPublicDrawing = (row: DatabaseDrawing | null, { includeData = false } = {}): PublicDrawing | null => {
  if (!row) return null;

  const drawing: PublicDrawing = {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeData) {
    drawing.data = row.data;
  }

  return drawing;
};

export class DrawingService {
  static async listDrawingsForUser(userId: string): Promise<PublicDrawing[]> {
    const drawings = await DrawingRepository.listDrawingsForUser(userId);
    return drawings.map((row) => toPublicDrawing(row)).filter(Boolean) as PublicDrawing[];
  }

  static async createDrawingForUser(userId: string, input: CreateDrawingInput): Promise<PublicDrawing> {
    const drawing = await DrawingRepository.createDrawingForUser(userId, {
      name: input.name,
      data: input.data,
    });

    const formatted = toPublicDrawing(drawing);
    if (!formatted) {
      throw new DrawingError('Failed to format drawing details', 500);
    }
    return formatted;
  }

  static async getDrawingForUser(userId: string, id: string): Promise<PublicDrawing> {
    const drawing = await DrawingRepository.getDrawingForUser(userId, id);
    if (!drawing) {
      throw new DrawingError('Drawing not found', 404);
    }
    const formatted = toPublicDrawing(drawing, { includeData: true });
    if (!formatted) {
      throw new DrawingError('Failed to format drawing details', 500);
    }
    return formatted;
  }

  static async deleteDrawingForUser(userId: string, id: string): Promise<{ message: string }> {
    const drawing = await DrawingRepository.deleteDrawingForUser(userId, id);
    if (!drawing) {
      throw new DrawingError('Drawing not found', 404);
    }
    return { message: 'Drawing deleted' };
  }

  static async updateDrawingForUser(userId: string, id: string, input: UpdateDrawingInput): Promise<PublicDrawing> {
    const drawing = await DrawingRepository.updateDrawingForUser(userId, id, {
      name: input.name,
      data: input.data,
    });

    if (!drawing) {
      throw new DrawingError('Drawing not found', 404);
    }

    const formatted = toPublicDrawing(drawing);
    if (!formatted) {
      throw new DrawingError('Failed to format drawing details', 500);
    }
    return formatted;
  }
}
