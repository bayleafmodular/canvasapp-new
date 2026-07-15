"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Tool }  from '@/types';

const DEFAULT_LAYER_ID = "layer-1";

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
  undo: () => void;
  redo: () => void;
  commitHistory: () => void;
  clearDrawing: () => void;
  setTemplateDrawerOpen: (isOpen: boolean) => void;
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

      copyObjects: () => set((state) => {
        const selectedObjects = state.objects.filter((obj) => state.selectedIds.includes(obj.id));
        return { clipboard: selectedObjects };
      }),
      pasteObjects: () => {
        const { clipboard, objects } = useCadStore.getState();
        if (clipboard.length === 0) return;
        const newObjects = clipboard.map((obj) => ({
          ...obj,
          id: uuidv4(),
          x: obj.x + 20,
          y: obj.y + 20
        }));
        useCadStore.setState({
          objects: [...objects, ...newObjects],
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
      toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
      toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
      toggleOrtho: () => set((state) => ({ orthoEnabled: !state.orthoEnabled })),
      toggleMeasurements: () => set((state) => ({ showMeasurements: !state.showMeasurements })),
      setActiveColor: (color) => set({ activeColor: color }),
      addObject: (obj) => {
        const id = uuidv4();
        const newObj = { ...obj, id };
        set((state) => {
          const newObjects = [...state.objects, newObj];
          return { objects: newObjects };
        });
        return id;
      },
      updateObject: (id, updates) => {
        set((state) => {
          const newObjects = state.objects.map(
            (obj) => obj.id === id ? { ...obj, ...updates } : obj
          );
          return { objects: newObjects };
        });
      },
      deleteSelected: () => {
        set((state) => {
          const newObjects = state.objects.filter((obj) => !state.selectedIds.includes(obj.id));
          return { objects: newObjects, selectedIds: [] };
        });
        get().commitHistory();
      },
      deleteObject: (id) => {
        set((state) => {
          const newObjects = state.objects.filter((obj) => obj.id !== id);
          const newSelectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
          return { objects: newObjects, selectedIds: newSelectedIds };
        });
        get().commitHistory();
      },
      selectObjects: (ids) => set({ selectedIds: ids }),
      setActiveLayer: (id) => set({ activeLayerId: id }),
      addLayer: (name) => set((state) => {
        const newLayer = {
          id: uuidv4(),
          name,
          visible: true,
          locked: false,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padEnd(6, "0")}`
        };
        return { layers: [...state.layers, newLayer] };
      }),
      toggleLayerVisibility: (id) => set((state) => ({
        layers: state.layers.map(
          (layer) => layer.id === id ? { ...layer, visible: !layer.visible } : layer
        )
      })),
      deleteLayer: (id) => set((state) => {
        if (state.layers.length <= 1) return state;
        const newLayers = state.layers.filter((layer) => layer.id !== id);
        let newActiveId = state.activeLayerId;
        if (newActiveId === id) {
          newActiveId = newLayers[0].id;
        }
        const newObjects = state.objects.filter((obj) => obj.layerId !== id);
        return { layers: newLayers, activeLayerId: newActiveId, objects: newObjects };
      }),
      undo: () => {
        set((state) => {
          if (state.historyStep > 0) {
            const step = state.historyStep - 1;
            return {
              historyStep: step,
              objects: state.history[step],
              selectedIds: []
            };
          }
          return state;
        });
      },
      redo: () => {
        set((state) => {
          if (state.historyStep < state.history.length - 1) {
            const step = state.historyStep + 1;
            return {
              historyStep: step,
              objects: state.history[step],
              selectedIds: []
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
        set({
          objects: [],
          history: [[]],
          historyStep: 0,
          selectedIds: [],
          layers: [{ id: DEFAULT_LAYER_ID, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
          loadedDrawingId: null,
          loadedDrawingName: null,
          activeLayerId: DEFAULT_LAYER_ID,
          stageScale: 1,
          stagePosition: { x: 0, y: 0 }
        });
      },
      setTemplateDrawerOpen: (isOpen) => set({ isTemplateDrawerOpen: isOpen })
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
        stageScale: state.stageScale,
        stagePosition: state.stagePosition,
        loadedDrawingId: state.loadedDrawingId,
        loadedDrawingName: state.loadedDrawingName,
      } as any),
      onRehydrateStorage: () => (state, error) => {
        if (state && !error) {
          state.history = [state.objects || []];
          state.historyStep = 0;
          
          if (state.stageScale < 0.05 || state.stageScale > 50 || isNaN(state.stageScale)) {
            state.stageScale = 1;
            state.stagePosition = { x: 0, y: 0 };
          }
        }
      },
    }
  )
);

export {
  useCadStore
};

