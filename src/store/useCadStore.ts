"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Tool, ShapeType }  from '@/types';

const DEFAULT_LAYER_ID = "layer-1";
const DEFAULT_PANEL_ID = "panel-1";

const calculateObjectsBounds = (objects: any[]) => {
  if (!objects || objects.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  objects.forEach((obj: any) => {
    const ox = obj.x || 0;
    const oy = obj.y || 0;
    let ox1 = ox;
    let oy1 = oy;
    let ox2 = ox;
    let oy2 = oy;

    if (obj.type === ShapeType.RECTANGLE || obj.type === "rectangle") {
      ox2 = ox + (obj.width || 0);
      oy2 = oy + (obj.height || 0);
    } else if (obj.type === ShapeType.CIRCLE || obj.type === "circle" || obj.type === ShapeType.ARC || obj.type === "arc") {
      ox1 = ox - (obj.radius || 0);
      ox2 = ox + (obj.radius || 0);
      oy1 = oy - (obj.radius || 0);
      oy2 = oy + (obj.radius || 0);
    } else if (obj.points && obj.points.length > 0) {
      const px = obj.points.filter((_: any, i: number) => i % 2 === 0);
      const py = obj.points.filter((_: any, i: number) => i % 2 !== 0);
      if (px.length > 0 && py.length > 0) {
        ox1 = Math.min(...px) + ox;
        ox2 = Math.max(...px) + ox;
        oy1 = Math.min(...py) + oy;
        oy2 = Math.max(...py) + oy;
      }
    } else if (obj.type === ShapeType.ANNOTATION || obj.type === "annotation") {
      const sp = obj.startPoint || { x: ox, y: oy };
      const tp = obj.textPos || { x: ox + 60, y: oy - 30 };
      const ep = obj.elbowPoint;
      const pts = [sp, tp];
      if (ep) pts.push(ep);
      ox1 = Math.min(...pts.map((p) => p.x));
      ox2 = Math.max(...pts.map((p) => p.x));
      oy1 = Math.min(...pts.map((p) => p.y));
      oy2 = Math.max(...pts.map((p) => p.y));
    }

    minX = Math.min(minX, ox1, ox2);
    minY = Math.min(minY, oy1, oy2);
    maxX = Math.max(maxX, ox1, ox2);
    maxY = Math.max(maxY, oy1, oy2);
  });

  if (minX === Infinity || isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

interface CadPanel {
  id: string;
  name: string;
  objects: any[];
  layers: any[];
  activeLayerId: string;
}

interface CadState {
  objects: any[];
  layers: any[];
  activeLayerId: string;
  selectedIds: string[];
  activeTool: Tool;
  stageScale: number;
  stagePosition: { x: number; y: number };
  gridEnabled: boolean;
  snapEnabled: boolean;
  orthoEnabled: boolean;
  showMeasurements: boolean;
  activeColor: string;
  clipboard: any[];
  history: any[][];
  historyStep: number;
  loadedDrawingId: string | null;
  loadedDrawingName: string | null;
  isTemplateDrawerOpen: boolean;
  panels: CadPanel[];
  activePanelId: string;
  canvasTheme: 'dark' | 'light';
  isLeftExpanded: boolean;

  copyObjects: () => void;
  pasteObjects: () => void;
  cutObjects: () => void;
  duplicateObjects: () => void;
  setTool: (tool: Tool) => void;
  setLoadedDrawing: (id: string | null, name: string | null) => void;
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleOrtho: () => void;
  toggleMeasurements: () => void;
  toggleCanvasTheme: () => void;
  setActiveColor: (color: string) => void;
  addObject: (obj: any) => string;
  updateObject: (id: string, updates: any) => void;
  deleteSelected: () => void;
  deleteObject: (id: string) => void;
  selectObjects: (ids: string[]) => void;
  setActiveLayer: (id: string) => void;
  addLayer: (name: string) => void;
  toggleLayerVisibility: (id: string) => void;
  deleteLayer: (id: string) => void;
  addPanel: (name: string) => void;
  switchPanel: (id: string) => void;
  renamePanel: (id: string, name: string) => void;
  deletePanel: (id: string) => void;
  undo: () => void;
  redo: () => void;
  commitHistory: () => void;
  clearDrawing: () => void;
  setTemplateDrawerOpen: (isOpen: boolean) => void;
  toggleLeftSidebar: () => void;
  zoomToFit: () => void;
}

const useCadStore = create<CadState>()(
  persist(
    (set, get) => ({
      objects: [],
      layers: [
        { id: DEFAULT_LAYER_ID, name: "0", visible: true, locked: false, color: "#FFFFFF" }
      ],
      activeLayerId: DEFAULT_LAYER_ID,
      selectedIds: [],
      activeTool: Tool.SELECT,
      stageScale: 1,
      stagePosition: { x: 0, y: 0 },
      gridEnabled: true,
      snapEnabled: true,
      orthoEnabled: false,
      showMeasurements: true,
      activeColor: "#FFFFFF",
      clipboard: [],
      history: [[]],
      historyStep: 0,
      loadedDrawingId: null,
      loadedDrawingName: null,
      isTemplateDrawerOpen: false,
      panels: [
        {
          id: DEFAULT_PANEL_ID,
          name: "Main Design",
          objects: [],
          layers: [{ id: DEFAULT_LAYER_ID, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
          activeLayerId: DEFAULT_LAYER_ID
        }
      ],
      activePanelId: DEFAULT_PANEL_ID,
      canvasTheme: 'dark',
      isLeftExpanded: true,

      copyObjects: () => set((state) => {
        const selectedObjects = state.objects.filter((obj) => state.selectedIds.includes(obj.id));
        return { clipboard: selectedObjects };
      }),
      pasteObjects: () => {
        const { clipboard, objects, panels, activePanelId } = useCadStore.getState();
        if (clipboard.length === 0) return;
        const newObjects = clipboard.map((obj) => {
          const newId = uuidv4();
          if (obj.type === "annotation" || obj.type === ShapeType.ANNOTATION) {
            return {
              ...obj,
              id: newId,
              x: 0,
              y: 0,
              startPoint: obj.startPoint ? { x: obj.startPoint.x + 20, y: obj.startPoint.y + 20 } : { x: obj.x + 20, y: obj.y + 20 },
              textPos: obj.textPos ? { x: obj.textPos.x + 20, y: obj.textPos.y + 20 } : { x: obj.x + 80, y: obj.y - 10 },
              elbowPoint: obj.elbowPoint ? { x: obj.elbowPoint.x + 20, y: obj.elbowPoint.y + 20 } : undefined
            };
          }
          return {
            ...obj,
            id: newId,
            x: obj.x + 20,
            y: obj.y + 20
          };
        });
        const updatedObjects = [...objects, ...newObjects];
        const updatedPanels = panels.map((p) =>
          p.id === activePanelId ? { ...p, objects: updatedObjects } : p
        );
        useCadStore.setState({
          objects: updatedObjects,
          panels: updatedPanels,
          selectedIds: newObjects.map((obj) => obj.id)
        });
        useCadStore.getState().commitHistory();
      },
      cutObjects: () => {
        useCadStore.getState().copyObjects();
        useCadStore.getState().deleteSelected();
      },
      duplicateObjects: () => {
        useCadStore.getState().copyObjects();
        useCadStore.getState().pasteObjects();
      },
      setTool: (tool) => set({ activeTool: tool, selectedIds: [] }),
      setLoadedDrawing: (id, name) => set({ loadedDrawingId: id, loadedDrawingName: name }),
      setStageScale: (scale) => set({ stageScale: scale }),
      setStagePosition: (pos) => set({ stagePosition: pos }),
      zoomToFit: () => {
        const { objects } = get();
        const bounds = calculateObjectsBounds(objects);

        if (typeof window === "undefined") return;

        if (!bounds || bounds.width < 0.1 || bounds.height < 0.1) {
          set({
            stageScale: 1,
            stagePosition: { x: (window.innerWidth - 300) / 2, y: (window.innerHeight - 80) / 2 }
          });
          return;
        }

        const padding = 60;
        const viewportW = Math.max(window.innerWidth - 320, 400);
        const viewportH = Math.max(window.innerHeight - 100, 400);

        const scaleX = (viewportW - padding * 2) / (bounds.width || 1);
        const scaleY = (viewportH - padding * 2) / (bounds.height || 1);
        let scale = Math.min(scaleX, scaleY);

        if (scale > 10) scale = 10;
        if (scale < 0.05) scale = 0.05;

        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;

        set({
          stageScale: scale,
          stagePosition: {
            x: viewportW / 2 - centerX * scale,
            y: viewportH / 2 - centerY * scale
          }
        });
      },
      toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
      toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
      toggleOrtho: () => set((state) => ({ orthoEnabled: !state.orthoEnabled })),
      toggleMeasurements: () => set((state) => ({ showMeasurements: !state.showMeasurements })),
      toggleCanvasTheme: () => set((state) => ({ canvasTheme: state.canvasTheme === 'dark' ? 'light' : 'dark' })),
      setActiveColor: (color) => set({ activeColor: color }),
      addObject: (obj) => {
        const id = uuidv4();
        const newObj = { ...obj, id };
        set((state) => {
          const newObjects = [...state.objects, newObj];
          const newPanels = state.panels.map((p) =>
            p.id === state.activePanelId ? { ...p, objects: newObjects } : p
          );
          return { objects: newObjects, panels: newPanels };
        });
        return id;
      },
      updateObject: (id, updates) => {
        set((state) => {
          const newObjects = state.objects.map(
            (obj) => obj.id === id ? { ...obj, ...updates } : obj
          );
          const newPanels = state.panels.map((p) =>
            p.id === state.activePanelId ? { ...p, objects: newObjects } : p
          );
          return { objects: newObjects, panels: newPanels };
        });
      },
      deleteSelected: () => {
        set((state) => {
          const newObjects = state.objects.filter((obj) => !state.selectedIds.includes(obj.id));
          const newPanels = state.panels.map((p) =>
            p.id === state.activePanelId ? { ...p, objects: newObjects } : p
          );
          return { objects: newObjects, selectedIds: [], panels: newPanels };
        });
        get().commitHistory();
      },
      deleteObject: (id) => {
        set((state) => {
          const newObjects = state.objects.filter((obj) => obj.id !== id);
          const newSelectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
          const newPanels = state.panels.map((p) =>
            p.id === state.activePanelId ? { ...p, objects: newObjects } : p
          );
          return { objects: newObjects, selectedIds: newSelectedIds, panels: newPanels };
        });
        get().commitHistory();
      },
      selectObjects: (ids) => set({ selectedIds: ids }),
      setActiveLayer: (id) => set((state) => {
        const newPanels = state.panels.map((p) =>
          p.id === state.activePanelId ? { ...p, activeLayerId: id } : p
        );
        return { activeLayerId: id, panels: newPanels };
      }),
      addLayer: (name) => set((state) => {
        const newLayer = {
          id: uuidv4(),
          name,
          visible: true,
          locked: false,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padEnd(6, "0")}`
        };
        const newLayers = [...state.layers, newLayer];
        const newPanels = state.panels.map((p) =>
          p.id === state.activePanelId ? { ...p, layers: newLayers } : p
        );
        return { layers: newLayers, panels: newPanels };
      }),
      toggleLayerVisibility: (id) => set((state) => {
        const newLayers = state.layers.map(
          (layer) => layer.id === id ? { ...layer, visible: !layer.visible } : layer
        );
        const newPanels = state.panels.map((p) =>
          p.id === state.activePanelId ? { ...p, layers: newLayers } : p
        );
        return { layers: newLayers, panels: newPanels };
      }),
      deleteLayer: (id) => set((state) => {
        if (state.layers.length <= 1) return state;
        const newLayers = state.layers.filter((layer) => layer.id !== id);
        let newActiveId = state.activeLayerId;
        if (newActiveId === id) {
          newActiveId = newLayers[0].id;
        }
        const newObjects = state.objects.filter((obj) => obj.layerId !== id);
        const newPanels = state.panels.map((p) =>
          p.id === state.activePanelId ? { ...p, layers: newLayers, activeLayerId: newActiveId, objects: newObjects } : p
        );
        return { layers: newLayers, activeLayerId: newActiveId, objects: newObjects, panels: newPanels };
      }),
      addPanel: (name) => set((state) => {
        const newPanelId = uuidv4();
        const newLayerId = "layer-1";
        const newPanel = {
          id: newPanelId,
          name,
          objects: [],
          layers: [{ id: newLayerId, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
          activeLayerId: newLayerId
        };
        const updatedPanels = [...state.panels, newPanel];
        return {
          panels: updatedPanels,
          activePanelId: newPanelId,
          objects: [],
          layers: [{ id: newLayerId, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
          activeLayerId: newLayerId,
          selectedIds: [],
          history: [[]],
          historyStep: 0
        };
      }),
      switchPanel: (id) => set((state) => {
        const targetPanel = state.panels.find((p) => p.id === id);
        if (!targetPanel) return state;
        return {
          activePanelId: id,
          objects: targetPanel.objects,
          layers: targetPanel.layers,
          activeLayerId: targetPanel.activeLayerId,
          selectedIds: [],
          history: [targetPanel.objects],
          historyStep: 0
        };
      }),
      renamePanel: (id, name) => set((state) => {
        const updatedPanels = state.panels.map((p) =>
          p.id === id ? { ...p, name } : p
        );
        return { panels: updatedPanels };
      }),
      deletePanel: (id) => set((state) => {
        if (state.panels.length <= 1) return state;
        const updatedPanels = state.panels.filter((p) => p.id !== id);
        let nextActiveId = state.activePanelId;
        if (nextActiveId === id) {
          nextActiveId = updatedPanels[0].id;
        }
        const targetPanel = updatedPanels.find((p) => p.id === nextActiveId)!;
        return {
          panels: updatedPanels,
          activePanelId: nextActiveId,
          objects: targetPanel.objects,
          layers: targetPanel.layers,
          activeLayerId: targetPanel.activeLayerId,
          selectedIds: [],
          history: [targetPanel.objects],
          historyStep: 0
        };
      }),
      undo: () => {
        set((state) => {
          if (state.historyStep > 0) {
            const step = state.historyStep - 1;
            const newObjects = state.history[step];
            const newPanels = state.panels.map((p) =>
              p.id === state.activePanelId ? { ...p, objects: newObjects } : p
            );
            return {
              historyStep: step,
              objects: newObjects,
              selectedIds: [],
              panels: newPanels
            };
          }
          return state;
        });
      },
      redo: () => {
        set((state) => {
          if (state.historyStep < state.history.length - 1) {
            const step = state.historyStep + 1;
            const newObjects = state.history[step];
            const newPanels = state.panels.map((p) =>
              p.id === state.activePanelId ? { ...p, objects: newObjects } : p
            );
            return {
              historyStep: step,
              objects: newObjects,
              selectedIds: [],
              panels: newPanels
            };
          }
          return state;
        });
      },
      commitHistory: () => {
        set((state) => {
          const currentHistory = state.history.slice(0, state.historyStep + 1);
          return {
            history: [...currentHistory, state.objects],
            historyStep: currentHistory.length
          };
        });
      },
      clearDrawing: () => {
        set((state) => {
          const updatedPanels = state.panels.map((p) =>
            p.id === state.activePanelId
              ? {
                  ...p,
                  objects: [],
                  layers: [{ id: DEFAULT_LAYER_ID, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
                  activeLayerId: DEFAULT_LAYER_ID
                }
              : p
          );
          return {
            objects: [],
            history: [[]],
            historyStep: 0,
            selectedIds: [],
            layers: [{ id: DEFAULT_LAYER_ID, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
            activeLayerId: DEFAULT_LAYER_ID,
            stageScale: 1,
            stagePosition: { x: 0, y: 0 },
            panels: updatedPanels,
            loadedDrawingId: null,
            loadedDrawingName: null
          };
        });
      },
      setTemplateDrawerOpen: (isOpen) => set({ isTemplateDrawerOpen: isOpen }),
      toggleLeftSidebar: () => set((state) => ({ isLeftExpanded: !state.isLeftExpanded }))
    }),
    {
      name: "precision-cad-storage",
      partialize: (state) => ({
        objects: state.objects,
        layers: state.layers,
        activeLayerId: state.activeLayerId,
        activeColor: state.activeColor,
        gridEnabled: state.gridEnabled,
        snapEnabled: state.snapEnabled,
        orthoEnabled: state.orthoEnabled,
        showMeasurements: state.showMeasurements,
        canvasTheme: state.canvasTheme,
        stageScale: state.stageScale,
        stagePosition: state.stagePosition,
        loadedDrawingId: state.loadedDrawingId,
        loadedDrawingName: state.loadedDrawingName,
        panels: state.panels,
        activePanelId: state.activePanelId,
        isLeftExpanded: state.isLeftExpanded
      } as any),
      onRehydrateStorage: () => (state, error) => {
        if (state && !error) {
          state.history = [state.objects || []];
          state.historyStep = 0;
          
          if (state.stageScale < 0.05 || state.stageScale > 50 || isNaN(state.stageScale)) {
            state.stageScale = 1;
            state.stagePosition = { x: 0, y: 0 };
          }

          if (!state.panels || state.panels.length === 0) {
            const defaultLayerId = state.activeLayerId || "layer-1";
            state.panels = [
              {
                id: "panel-1",
                name: "Main Design",
                objects: state.objects || [],
                layers: state.layers || [{ id: defaultLayerId, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
                activeLayerId: defaultLayerId
              }
            ];
            state.activePanelId = "panel-1";
          }
        }
      },
    }
  )
);

export {
  useCadStore
};

