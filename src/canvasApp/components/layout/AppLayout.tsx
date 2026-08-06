"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCadStore } from "@/store/useCadStore";

function AppLayout({ children, left, right, top, bottom }: { children: React.ReactNode; left?: React.ReactNode; right?: React.ReactNode; top?: React.ReactNode; bottom?: React.ReactNode }) {
  const [rightOpen, setRightOpen] = useState(true);
  const { isLeftExpanded } = useCadStore();

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setRightOpen(false);
    }
  }, []);

  return <div className="flex flex-col h-full w-full overflow-hidden bg-[#1a1b1e] text-[#d1d1d1] font-sans select-none">
      {/* Top Toolbar */}
      <div className="min-h-[3rem] py-1.5 bg-[#25262b] border-b border-[#333] flex items-center px-2 md:px-4 shrink-0 z-20">
        {top}
      </div>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Toolbar */}
        <div className={`h-full min-h-0 bg-[#25262b] border-r border-[#333] flex flex-col items-center py-4 shrink-0 z-10 transition-all duration-300 ease-in-out ${
          isLeftExpanded ? "w-56" : "w-14"
        }`}>
          {left}
        </div>
        
        {/* Center Canvas Area */}
        <div className="flex-1 relative bg-[#1a1b1e] overflow-hidden cursor-crosshair">
          {children}
        </div>
        
        {/* Right Sidebar Overlay & Container */}
        {rightOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setRightOpen(false)}
          />
        )}
        <div className={`
          absolute right-0 top-0 bottom-0 z-30
          md:relative md:z-10
          bg-[#25262b] flex flex-col shrink-0 text-xs
          transition-all duration-300 ease-in-out
          ${rightOpen 
            ? "w-64 translate-x-0 md:w-64 md:opacity-100 border-l border-[#333]" 
            : "w-64 translate-x-full md:w-0 md:opacity-0 md:border-l-0 border-transparent md:pointer-events-none"
          }
        `}>
          {right}
        </div>

        {/* Desktop/Mobile Toggle Button */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className={`
            absolute top-4 z-40 bg-[#25262b] border border-[#333] p-1.5 rounded-l-md shadow-lg text-white transition-all duration-300 ease-in-out
            ${rightOpen ? "right-[256px] border-r-0" : "right-0"}
          `}
          title={rightOpen ? "Collapse Properties" : "Expand Properties"}
        >
          {rightOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      {/* Bottom Status Bar */}
      <div className="h-8 bg-[#25262b] border-t border-[#333] flex items-center px-4 text-[10px] font-mono shrink-0 z-20">
        {bottom}
      </div>
    </div>;
}
export {
  AppLayout
};
