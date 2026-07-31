"use client";
import { useCadStore }  from '@/store/useCadStore';
import { Tool }  from '@/types';
import {
  MousePointer2,
  Hand,
  Minus,
  Square,
  Circle,
  Pencil,
  Trash2,
  LayoutTemplate,
  MessageSquare
} from "lucide-react";
import { cn }  from '@/lib/utils';
import { PolylineIcon, ArcIcon, WallIcon, BeamIcon, LintelIcon } from "./Icons";
function LeftToolbar() {
  const { activeTool, setTool, deleteSelected, isTemplateDrawerOpen, setTemplateDrawerOpen } = useCadStore();
  const toolButtons = [
    { tool: Tool.SELECT, icon: MousePointer2, label: "Select & Move (V)" },
    { tool: Tool.HAND, icon: Hand, label: "Pan Canvas (H)" },
    { divider: true },
    { tool: Tool.LINE, icon: Minus, label: "Line (L)" },
    { tool: Tool.POLYLINE, icon: PolylineIcon, label: "Polyline (P)" },
    { tool: Tool.WALL, icon: WallIcon, label: "Wall (W)" },
    { tool: Tool.BEAM, icon: BeamIcon, label: "Beam (B)" },
    { tool: Tool.LINTEL, icon: LintelIcon, label: "Lintel (U)" },
    { tool: Tool.RECTANGLE, icon: Square, label: "Rectangle (R)" },
    { tool: Tool.CIRCLE, icon: Circle, label: "Circle (C)" },
    { tool: Tool.ARC, icon: ArcIcon, label: "Arc (A)" },
    { tool: Tool.FREE_DRAW, icon: Pencil, label: "Free Draw (F)" },
    { tool: Tool.ANNOTATION, icon: MessageSquare, label: "Annotation (T)" }
    /* { tool: Tool.ERASER, icon: Eraser, label: 'Eraser (E)' }, */
  ];
  return <div
    className="flex flex-col gap-2 w-full px-2 overflow-y-auto flex-1 pb-4"
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    <style>{`
      .overflow-y-auto::-webkit-scrollbar {
        display: none;
      }
    `}</style>

    <button
      title="Templates Library"
      className={cn(
        "w-10 h-10 rounded text-[#999] flex items-center justify-center transition-colors border shrink-0",
        isTemplateDrawerOpen ? "bg-[#3a3b41] text-[#4a90e2] border-[#4a90e2]" : "border-transparent hover:bg-[#3a3b41] hover:text-white"
      )}
      onClick={() => setTemplateDrawerOpen(!isTemplateDrawerOpen)}
    >
      <LayoutTemplate size={20} strokeWidth={isTemplateDrawerOpen ? 2 : 1.5} />
    </button>

    <div className="h-px bg-[#333] w-full my-1 shrink-0" />

    {toolButtons.map((tb: any, idx) => {
      if (tb.divider) {
        return <div key={`divider-${idx}`} className="h-px bg-[#333] w-full my-1" />;
      }
      const Icon = tb.icon;
      const isActive = activeTool === tb.tool;
      return <button
        key={tb.tool}
        title={tb.label}
        className={cn(
          "w-10 h-10 rounded text-[#999] flex items-center justify-center transition-colors border",
          isActive ? "bg-[#3a3b41] text-[#4a90e2] border-[#4a90e2]" : "border-transparent hover:bg-[#3a3b41] hover:text-white"
        )}
        onClick={() => setTool(tb.tool)}
      >
        <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
      </button>;
    })}

    <div className="h-px bg-[#333] w-full my-1" />

    <button
      title="Delete Selected (Del)"
      className="w-10 h-10 rounded text-[#999] flex items-center justify-center border border-transparent hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 transition-colors"
      onClick={deleteSelected}
    >
      <Trash2 size={20} strokeWidth={1.5} />
    </button>
  </div>;
}
export {
  LeftToolbar
};
