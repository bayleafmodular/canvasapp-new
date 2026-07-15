"use client";
import PrivateRoute from '@/components/PrivateRoute';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter as useNavigate } from 'next/navigation';

import Layout from '@/components/layout/Layout';
import CadApp from '@/canvasApp/CanvasEditor';
import { getTemplateById, createTemplate, updateTemplate } from '@/services/templateApi';
import { useCadStore } from '@/store/useCadStore';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { ShapeType } from '@/types';

const calculateBounds = (objects: any[]) => {
  if (!objects || objects.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  objects.forEach((obj: any) => {
    let ox1 = obj.x;
    let oy1 = obj.y;
    let ox2 = obj.x;
    let oy2 = obj.y;

    if (obj.type === ShapeType.RECTANGLE) {
      ox2 = obj.x + (obj.width || 0);
      oy2 = obj.y + (obj.height || 0);
    } else if (obj.type === ShapeType.CIRCLE || obj.type === ShapeType.ARC) {
      ox1 = obj.x - (obj.radius || 0);
      ox2 = obj.x + (obj.radius || 0);
      oy1 = obj.y - (obj.radius || 0);
      oy2 = obj.y + (obj.radius || 0);
    } else if (obj.points && obj.points.length > 0) {
      const px = obj.points.filter((_: any, i: number) => i % 2 === 0);
      const py = obj.points.filter((_: any, i: number) => i % 2 !== 0);
      ox1 = Math.min(...px) + obj.x;
      ox2 = Math.max(...px) + obj.x;
      oy1 = Math.min(...py) + obj.y;
      oy2 = Math.max(...py) + obj.y;
    }
    minX = Math.min(minX, ox1, ox2);
    minY = Math.min(minY, oy1, oy2);
    maxX = Math.max(maxX, ox1, ox2);
    maxY = Math.max(maxY, oy1, oy2);
  });
  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

function TemplateEditor_Inner() {
  const { id } = useParams() as { id?: string };
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Template Metadata state
  const [templateMeta, setTemplateMeta] = useState({
    name: '',
    category: 'Commercial',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    // If editing existing, fetch it
    if (id) {
      getTemplateById(id).then(res => {
        const t = res.data;
        setTemplateMeta({
          name: t.name || '',
          category: t.category || 'Commercial',
          description: t.description || '',
          status: t.status || 'active'
        });

        // Load into canvas store
        useCadStore.setState({
          objects: t.objects || [],
          layers: t.layers || [],
          loadedDrawingId: null,
          loadedDrawingName: t.name
        });
        useCadStore.getState().commitHistory();

        // Auto-fit calculation
        const bounds = calculateBounds(t.objects);
        if (bounds) {
          const padding = 50;
          // Approximate viewport width (subtracting left/right sidebars & drawer width)
          const viewportW = window.innerWidth - (56 + 256);
          const viewportH = window.innerHeight - 80;

          const vw = Math.max(viewportW, 400); // minimum fallback
          const vh = Math.max(viewportH, 400);

          const scaleX = (vw - padding * 2) / (bounds.width || 1);
          const scaleY = (vh - padding * 2) / (bounds.height || 1);
          let scale = Math.min(scaleX, scaleY);
          if (scale > 5) scale = 5;
          if (scale < 0.1) scale = 0.1;

          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;

          useCadStore.getState().setStageScale(scale);
          useCadStore.getState().setStagePosition({
            x: vw / 2 - centerX * scale,
            y: vh / 2 - centerY * scale
          });
        }

        setLoading(false);
      }).catch((err: any) => {
        toast.error('Template not found');
        navigate.push('/admin-dashboard/templates');
      });
    } else {
      // New template, clear canvas
      useCadStore.getState().clearDrawing();
      setLoading(false);
    }

    // Listen for custom event from TopToolbar
    const handleSaveIntent = () => {
      setModalOpen(true);
    };

    window.addEventListener('save-template-intent', handleSaveIntent);
    return () => {
      window.removeEventListener('save-template-intent', handleSaveIntent);
    };
  }, [id, navigate]);

  const handleSaveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateMeta.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);
    const { objects, layers } = useCadStore.getState();
    const payload = {
      ...templateMeta,
      objects,
      layers
    };

    try {
      if (id) {
        await updateTemplate(id, payload);
        toast.success('Template updated successfully');
      } else {
        await createTemplate(payload);
        toast.success('Template created successfully');
      }
      setModalOpen(false);
      navigate.push('/admin-dashboard/templates');
    } catch (err: any) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout fullScreen>
        <div className="w-full h-full flex items-center justify-center bg-[#1a1b1e] text-white">
          Loading template...
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullScreen>
      <CadApp isTemplateMode={true} onBack={() => navigate.push('/admin-dashboard/templates')} />

      {/* Save Metadata Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#1e1f22] border border-[#333] rounded-lg shadow-2xl w-[400px] max-w-[90vw] overflow-hidden flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <h3 className="text-white font-semibold">
                {id ? 'Update Template' : 'Save New Template'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#888] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfirm} className="flex flex-col flex-1">
              <div className="p-4 bg-[#141517] space-y-4">
                <div>
                  <label className="block text-xs text-[#aaa] mb-1 font-semibold uppercase tracking-wider">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={templateMeta.name}
                    onChange={(e) => setTemplateMeta({ ...templateMeta, name: e.target.value })}
                    placeholder="e.g. 2BHK Layout"
                    className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2]"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#aaa] mb-1 font-semibold uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    value={templateMeta.category}
                    onChange={(e) => setTemplateMeta({ ...templateMeta, category: e.target.value })}
                    placeholder="e.g. Residential"
                    className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2]"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#aaa] mb-1 font-semibold uppercase tracking-wider">Description</label>
                  <textarea
                    rows={2}
                    value={templateMeta.description}
                    onChange={(e) => setTemplateMeta({ ...templateMeta, description: e.target.value })}
                    placeholder="Short description..."
                    className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2] resize-none"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#aaa] mb-1 font-semibold uppercase tracking-wider">Status</label>
                  <select
                    value={templateMeta.status}
                    onChange={(e) => setTemplateMeta({ ...templateMeta, status: e.target.value })}
                    className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2]"
                    disabled={saving}
                  >
                    <option value="active">Active (Visible to users)</option>
                    <option value="hidden">Hidden (Draft/Archived)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-[#333] flex items-center justify-end gap-3 bg-[#1e1f22]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-[#ccc] hover:text-white"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-[#4a90e2] hover:bg-[#3a7fc2] text-white rounded font-bold transition-colors"
                >
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}


export default function TemplateEditor() {
  return (
    <PrivateRoute allowedRoles={['admin', 'staff']}>
      <TemplateEditor_Inner />
    </PrivateRoute>
  );
}
