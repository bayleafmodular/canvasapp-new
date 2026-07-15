"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AppLayout } from "./components/layout/AppLayout";
import { LeftToolbar } from "./components/toolbars/LeftToolbar";
import { TopToolbar } from "./components/toolbars/TopToolbar";
import { RightSidebar } from "./components/sidebars/RightSidebar";
import { StatusBar } from "./components/StatusBar";
import dynamic from 'next/dynamic';
const CadCanvas = dynamic(() => import('./components/CadCanvas').then(m => m.CadCanvas), { ssr: false });
import { TemplateDrawer } from "./components/sidebars/TemplateDrawer";
import { useEffect } from "react";
import { useCadStore } from "@/store/useCadStore";
import { Tool } from "@/types";
interface AppProps {
  isTemplateMode?: boolean;
  onBack?: () => void;
}

function App({ isTemplateMode = false, onBack = () => { } }: AppProps) {
  const { setTool, undo, redo, deleteSelected } = useCadStore();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          undo();
        } else if (e.key === "y" || e.shiftKey && e.key === "Z") {
          e.preventDefault();
          redo();
        }
      } else {
        if (e.target instanceof HTMLInputElement) return;
        const key = e.key.toLowerCase();
        switch (key) {
          case "v":
            setTool(Tool.SELECT);
            break;
          case "h":
            setTool(Tool.HAND);
            break;
          case "l":
            setTool(Tool.LINE);
            break;
          case "p":
            setTool(Tool.POLYLINE);
            break;
          case "w":
            setTool(Tool.WALL);
            break;
          case "b":
            setTool(Tool.BEAM);
            break;
          case "u":
            setTool(Tool.LINTEL);
            break;
          case "r":
            setTool(Tool.RECTANGLE);
            break;
          case "c":
            setTool(Tool.CIRCLE);
            break;
          case "a":
            setTool(Tool.ARC);
            break;
          case "f":
            setTool(Tool.FREE_DRAW);
            break;
          case "delete":
          case "backspace":
            deleteSelected();
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTool, undo, redo, deleteSelected]);
  return <AppLayout
    top={<TopToolbar isTemplateMode={isTemplateMode} onBack={onBack} />}
    left={<LeftToolbar />}
    right={<RightSidebar />}
    bottom={<StatusBar />}
  >
    <TemplateDrawer />
    <CadCanvas />
  </AppLayout>;
}
export {
  App as default
};
