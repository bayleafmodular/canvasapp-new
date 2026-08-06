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
  MessageSquare,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { cn }  from '@/lib/utils';
import { PolylineIcon, ArcIcon, WallIcon, BeamIcon, LintelIcon } from "./Icons";

function LeftToolbar() {
  const {
    activeTool,
    setTool,
    deleteSelected,
    isTemplateDrawerOpen,
    setTemplateDrawerOpen,
    isLeftExpanded,
    toggleLeftSidebar
  } = useCadStore();

  const toolButtons = [
    { tool: Tool.SELECT, icon: MousePointer2, label: "Select & Move (V)" },
    { tool: Tool.HAND, icon: Hand, label: "Pan Canvas (H)" },
    { divider: true },
    { tool: Tool.LINE, icon: Minus, label: "Line (L)" },
    { tool: Tool.BEAM, icon: BeamIcon, label: "Beam (B)" },
    { tool: Tool.WALL, icon: WallIcon, label: "Wall (W)" },
    { tool: Tool.LINTEL, icon: LintelIcon, label: "Lintel (U)" },
    { tool: Tool.POLYLINE, icon: PolylineIcon, label: "Polyline (P)" },
    { tool: Tool.RECTANGLE, icon: Square, label: "Rectangle (R)" },
    { tool: Tool.CIRCLE, icon: Circle, label: "Circle (C)" },
    { tool: Tool.ARC, icon: ArcIcon, label: "Arc (A)" },
    { tool: Tool.FREE_DRAW, icon: Pencil, label: "Free Draw (F)" },
    { tool: Tool.ANNOTATION, icon: MessageSquare, label: "Annotation (T)" }
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

    {/* Collapse/Expand Toggle Button */}
    <button
      onClick={toggleLeftSidebar}
      title={isLeftExpanded ? "Collapse Sidebar (<<)" : "Expand Sidebar (>>)"}
      className={cn(
        "h-10 rounded text-[#999] flex items-center justify-center hover:bg-[#3a3b41] hover:text-white transition-colors border border-transparent shrink-0 mb-1",
        isLeftExpanded ? "w-full justify-between px-3" : "w-10"
      )}
    >
      {isLeftExpanded ? (
        <>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Editor Tools</span>
          <ChevronsLeft size={16} />
        </>
      ) : (
        <ChevronsRight size={16} />
      )}
    </button>

    <div className="h-px bg-[#333] w-full my-1 shrink-0" />

    <button
      title="Templates Library"
      className={cn(
        "h-10 rounded text-[#999] flex items-center transition-colors border shrink-0",
        isLeftExpanded ? "w-full justify-start gap-3 px-3" : "w-10 justify-center",
        isTemplateDrawerOpen ? "bg-[#3a3b41] text-[#4a90e2] border-[#4a90e2]" : "border-transparent hover:bg-[#3a3b41] hover:text-white"
      )}
      onClick={() => setTemplateDrawerOpen(!isTemplateDrawerOpen)}
    >
      <LayoutTemplate size={20} strokeWidth={isTemplateDrawerOpen ? 2 : 1.5} className="shrink-0" />
      {isLeftExpanded && <span className="text-xs font-semibold">Templates Library</span>}
    </button>

    <div className="h-px bg-[#333] w-full my-1 shrink-0" />

    {toolButtons.map((tb: any, idx) => {
      if (tb.divider) {
        return <div key={`divider-${idx}`} className="h-px bg-[#333] w-full my-1 shrink-0" />;
      }
      const Icon = tb.icon;
      const isActive = activeTool === tb.tool;
      return <button
        key={tb.tool}
        title={tb.label}
        className={cn(
          "h-10 rounded text-[#999] flex items-center transition-colors border shrink-0",
          isLeftExpanded ? "w-full justify-start gap-3 px-3" : "w-10 justify-center",
          isActive ? "bg-[#3a3b41] text-[#4a90e2] border-[#4a90e2]" : "border-transparent hover:bg-[#3a3b41] hover:text-white"
        )}
        onClick={() => setTool(tb.tool)}
      >
        <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
        {isLeftExpanded && <span className="text-xs font-semibold">{tb.label.split(" (")[0]}</span>}
      </button>;
    })}

    <div className="h-px bg-[#333] w-full my-1 shrink-0" />

    <button
      title="Delete Selected (Del)"
      className={cn(
        "h-10 rounded text-[#999] flex items-center border border-transparent hover:bg-red-900/40 hover:text-red-400 hover:border-red-500/50 transition-colors shrink-0",
        isLeftExpanded ? "w-full justify-start gap-3 px-3" : "w-10 justify-center"
      )}
      onClick={deleteSelected}
    >
      <Trash2 size={20} strokeWidth={1.5} className="shrink-0" />
      {isLeftExpanded && <span className="text-xs font-semibold">Delete Selected</span>}
    </button>
  </div>;
}
export {
  LeftToolbar
};
