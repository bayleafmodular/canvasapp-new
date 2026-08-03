import { TemplateRepository } from '@/repositories/templates/template.repository';
import { DatabaseTemplate, PublicTemplate } from '@/types/template';
import { CreateTemplateInput, UpdateTemplateInput } from '@/validators/templates/template.validator';

export class TemplateError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'TemplateError';
  }
}

export const toPublicTemplate = (row: DatabaseTemplate | null): PublicTemplate | null => {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    status: row.status,
    objects: row.objects,
    layers: row.layers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export class TemplateService {
  static async listTemplates(options: { page?: number; limit?: number; search?: string; status?: string; category?: string } = {}): Promise<{ data: PublicTemplate[]; total: number; categories: string[] }> {
    const result = await TemplateRepository.listTemplates(options);
    const formatted = result.data.map((row) => toPublicTemplate(row)).filter(Boolean) as PublicTemplate[];
    return {
      data: formatted,
      total: result.total,
      categories: result.categories
    };
  }

  static async getTemplateById(id: string): Promise<PublicTemplate> {
    const template = await TemplateRepository.getTemplateById(id);
    if (!template) {
      throw new TemplateError('Template not found', 404);
    }
    const formatted = toPublicTemplate(template);
    if (!formatted) {
      throw new TemplateError('Failed to format template details', 500);
    }
    return formatted;
  }

  static async createTemplate(input: CreateTemplateInput): Promise<PublicTemplate> {
    const template = await TemplateRepository.createTemplate({
      name: input.name,
      category: input.category,
      description: input.description,
      status: input.status || 'active',
      objects: input.objects || [],
      layers: input.layers || [],
    });

    const formatted = toPublicTemplate(template);
    if (!formatted) {
      throw new TemplateError('Failed to format template details', 500);
    }
    return formatted;
  }

  static async updateTemplate(id: string, input: UpdateTemplateInput): Promise<PublicTemplate> {
    const template = await TemplateRepository.updateTemplate(id, {
      name: input.name,
      category: input.category,
      description: input.description,
      status: input.status,
      objects: input.objects,
      layers: input.layers,
    });

    if (!template) {
      throw new TemplateError('Template not found', 404);
    }

    const formatted = toPublicTemplate(template);
    if (!formatted) {
      throw new TemplateError('Failed to format template details', 500);
    }
    return formatted;
  }

  static async deleteTemplate(id: string): Promise<{ message: string }> {
    const template = await TemplateRepository.deleteTemplate(id);
    if (!template) {
      throw new TemplateError('Template not found', 404);
    }
    return { message: 'Template deleted' };
  }
}
