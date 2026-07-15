"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useCadStore }  from '@/store/useCadStore';
import { getTemplates }  from '@/services/templateApi';
import { X, Search, ChevronDown, ChevronRight, LayoutTemplate, Layers, Shapes } from 'lucide-react';
import { cn }  from '@/lib/utils';
import { ShapeType }  from '@/types';
import TemplatePreview  from '@/components/TemplatePreview';

const calculateBounds = (objects: any) => {
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

export function TemplateDrawer() {
  const { isTemplateDrawerOpen, setTemplateDrawerOpen } = useCadStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<any>({});
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isTemplateDrawerOpen) {
      setLoading(true);
      getTemplates().then(res => {
        // Only show active templates in the drawer
        const activeTemplates = res.data.filter((t: any) => t.status === 'active');
        setTemplatesList(activeTemplates);
      }).catch(err => {
        console.error("Failed to fetch templates:", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isTemplateDrawerOpen]);

  const handleLoadTemplate = (template: any) => {
    const { objects, setStageScale, setStagePosition } = useCadStore.getState();
    if (objects.length > 0) {
      if (!confirm("Loading a template will clear your current drawing. Continue?")) return;
    }
    
    useCadStore.setState({
      objects: template.objects,
      layers: template.layers,
      loadedDrawingId: null,
      loadedDrawingName: template.name
    });
    useCadStore.getState().commitHistory();

    // Auto-fit calculation
    const bounds = calculateBounds(template.objects);
    if (bounds) {
      const padding = 50;
      // Approximate viewport width (subtracting left/right sidebars & drawer width)
      const viewportW = window.innerWidth - (56 + 256 + 320); 
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
      
      setStageScale(scale);
      setStagePosition({
        x: vw / 2 - centerX * scale,
        y: vh / 2 - centerY * scale
      });
    }

    setTemplateDrawerOpen(false);
  };

  const toggleCategory = (category: any) => {
    setExpandedCategories((prev: any) => ({
      ...prev,
      [category]: prev[category] !== undefined ? !prev[category] : false // toggle from default true
    }));
  };

  const filteredAndGroupedTemplates = useMemo(() => {
    let templates = templatesList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      templates = templates.filter((t: any) => 
        t.name.toLowerCase().includes(q) || 
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    const grouped: any = {};
    templates.forEach((t: any) => {
      const cat = t.category || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    });
    return grouped;
  }, [searchQuery, templatesList]);

  if (!isTemplateDrawerOpen) return null;

  return (
    <div className="absolute left-0 top-0 bottom-0 w-80 bg-[#1e1f22] border-r border-[#333] flex flex-col z-20 shadow-2xl overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#333] shrink-0 bg-[#25262b]">
        <div className="flex items-center gap-2 text-white">
          <LayoutTemplate size={18} className="text-[#4a90e2]" />
          <h2 className="font-semibold text-sm">Templates Library</h2>
        </div>
        <button 
          onClick={() => setTemplateDrawerOpen(false)}
          className="text-[#888] hover:text-white transition-colors p-1 rounded hover:bg-[#3a3b41]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#333] shrink-0 bg-[#1a1b1e]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input 
            type="text" 
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1f22] border border-[#333] rounded pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#4a90e2] transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-[#888]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4a90e2]"></div>
            <span className="text-xs font-semibold">Loading templates...</span>
          </div>
        ) : Object.keys(filteredAndGroupedTemplates).length === 0 ? (
          <div className="text-center text-[#777] text-xs mt-10">
            No templates found matching "{searchQuery}"
          </div>
        ) : (
          Object.entries(filteredAndGroupedTemplates).map(([category, items]: [string, any]) => {
            const isExpanded = expandedCategories[category] !== false; // default true
            
            return (
              <div key={category} className="mb-4">
                <button 
                  onClick={() => toggleCategory(category)}
                  className="flex items-center w-full text-left py-1.5 px-2 text-[#aaa] hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                  <span className="text-xs font-semibold uppercase tracking-wider">{category}</span>
                  <span className="ml-auto text-[10px] bg-[#333] text-[#888] px-1.5 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="mt-2 space-y-2 px-1">
                    {items.map((template: any) => (
                      <div 
                        key={template.id} 
                        className="bg-[#25262b] border border-[#333] hover:border-[#4a90e2] rounded-md p-3 transition-colors group flex flex-col gap-3"
                      >
                        <div className="w-full h-28 bg-[#141517] rounded border border-[#333] p-2 flex items-center justify-center overflow-hidden">
                          <TemplatePreview objects={template.objects} strokeColor="#4a90e2" className="w-full h-full" />
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-white text-sm font-medium">{template.name}</h4>
                            <span className="text-[10px] text-[#4a90e2] uppercase tracking-wider font-semibold">
                              {template.category || 'Uncategorized'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-[#888] text-[10px]">
                          <div className="flex items-center gap-1" title="Number of Objects">
                            <Shapes size={12} /> {template.objects?.length || 0}
                          </div>
                          <div className="flex items-center gap-1" title="Number of Layers">
                            <Layers size={12} /> {template.layers?.length || 0}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleLoadTemplate(template)}
                          className="w-full bg-[#3a3b41] hover:bg-[#4a90e2] text-white text-xs font-semibold py-1.5 rounded transition-colors"
                        >
                          Load Template
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
