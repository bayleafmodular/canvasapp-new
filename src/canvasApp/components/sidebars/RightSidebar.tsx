"use client";
import { useCadStore }  from '@/store/useCadStore';
import { ShapeType }  from '@/types';
function RightSidebar() {
  const { layers, activeLayerId, setActiveLayer, addLayer, toggleLayerVisibility, selectedIds, objects, updateObject, commitHistory } = useCadStore();
  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
  const handleAddLayer = () => {
    const name = prompt("Enter layer name:", `Layer ${layers.length}`);
    if (name) {
      addLayer(name);
    }
  };
  const renderDimensions = (obj: any) => {
    if (obj.type === ShapeType.RECTANGLE) {
      return <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="text-[#555] block mb-1">Width</label>
            <input
        type="number"
        value={obj.width?.toFixed(2) || 0}
        onChange={(e) => {
          updateObject(obj.id, { width: parseFloat(e.target.value) || 0 });
          commitHistory();
        }}
        className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
      />
          </div>
          <div>
            <label className="text-[#555] block mb-1">Height</label>
            <input
        type="number"
        value={obj.height?.toFixed(2) || 0}
        onChange={(e) => {
          updateObject(obj.id, { height: parseFloat(e.target.value) || 0 });
          commitHistory();
        }}
        className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
      />
          </div>
        </div>;
    }
    if (obj.type === ShapeType.CIRCLE) {
      return <div className="mt-2">
          <label className="text-[#555] block mb-1">Radius</label>
          <input
        type="number"
        value={obj.radius?.toFixed(2) || 0}
        onChange={(e) => {
          updateObject(obj.id, { radius: parseFloat(e.target.value) || 0 });
          commitHistory();
        }}
        className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
      />
        </div>;
    }
    if (obj.type === ShapeType.ARC) {
      return <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="text-[#555] block mb-1">Radius</label>
            <input
        type="number"
        value={obj.radius?.toFixed(2) || 0}
        onChange={(e) => {
          updateObject(obj.id, { radius: parseFloat(e.target.value) || 0 });
          commitHistory();
        }}
        className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
      />
          </div>
          <div>
            <label className="text-[#555] block mb-1">Angle</label>
            <input
        type="number"
        value={obj.endAngle?.toFixed(2) || 0}
        onChange={(e) => {
          updateObject(obj.id, { endAngle: parseFloat(e.target.value) || 0 });
          commitHistory();
        }}
        className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
      />
          </div>
        </div>;
    }
    if ((obj.type === ShapeType.LINE || obj.type === ShapeType.WALL || obj.type === ShapeType.BEAM || obj.type === ShapeType.LINTEL) && obj.points?.length >= 4) {
      const x1 = obj.points[0];
      const y1 = obj.points[1];
      const x2 = obj.points[2];
      const y2 = obj.points[3];
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return <div className="mt-2">
          <label className="text-[#555] block mb-1">Length</label>
          <input
        type="number"
        value={length.toFixed(2)}
        onChange={(e) => {
          const newLength = parseFloat(e.target.value) || 0;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const newX2 = x1 + Math.cos(angle) * newLength;
          const newY2 = y1 + Math.sin(angle) * newLength;
          updateObject(obj.id, { points: [x1, y1, newX2, newY2] });
          commitHistory();
        }}
        className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
      />
        </div>;
    }
    return null;
  };
  return <div className="flex flex-col h-full w-full">
      {
    /* Properties Panel */
  }
      <div className="flex-1 border-b border-[#333] flex flex-col min-h-0 bg-[#25262b]">
        <div className="h-12 border-b border-[#333] flex items-center px-4 font-bold text-xs text-[#777] uppercase tracking-widest bg-[#25262b] sticky top-0">
           Properties
        </div>
        <div className="p-4 overflow-y-auto w-full text-xs space-y-4">
          {selectedObjects.length === 0 ? <div className="text-[#999] italic">No object selected</div> : selectedObjects.length === 1 ? <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[#999]">Object Type</span>
                <span className="text-white capitalize">{selectedObjects[0].type}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#555] block mb-1">Pos X</label>
                    <input
    type="number"
    value={selectedObjects[0].x.toFixed(2)}
    onChange={(e) => {
      updateObject(selectedObjects[0].id, { x: parseFloat(e.target.value) || 0 });
      commitHistory();
    }}
    className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
  />
                  </div>
                  <div>
                    <label className="text-[#555] block mb-1">Pos Y</label>
                    <input
    type="number"
    value={selectedObjects[0].y.toFixed(2)}
    onChange={(e) => {
      updateObject(selectedObjects[0].id, { y: parseFloat(e.target.value) || 0 });
      commitHistory();
    }}
    className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
  />
                  </div>
                </div>
                
                <div className="mt-1">
                  <label className="text-[#555] block mb-1">Rotation (deg)</label>
                  <input
                    type="number"
                    value={(selectedObjects[0].rotation || 0).toFixed(2)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      window.dispatchEvent(new CustomEvent("rotate-selected", { detail: val }));
                    }}
                    className="w-full bg-[#1a1b1e] border border-[#444] rounded px-2 py-1 text-white font-mono"
                  />
                </div>

                {renderDimensions(selectedObjects[0])}
              </div>
              
              <div>
                <label className="text-[#555] block mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
    type="color"
    value={selectedObjects[0].stroke}
    onChange={(e) => {
      updateObject(selectedObjects[0].id, { stroke: e.target.value });
      commitHistory();
    }}
    className="w-5 h-5 p-0 border border-[#444] rounded cursor-pointer bg-transparent"
  />
                  <span className="text-white uppercase">{selectedObjects[0].stroke}</span>
                </div>
              </div>
            </div> : <div className="text-[#999]">{selectedObjects.length} objects selected</div>}
        </div>
      </div>

      {
    /* Layers Panel */
  }
      <div className="h-1/3 flex flex-col min-h-0 bg-[#25262b]">
        <div className="h-12 flex items-center justify-between px-4">
          <h3 className="font-bold text-xs text-[#777] uppercase tracking-widest">Layers</h3>
          <button onClick={handleAddLayer} className="text-[#4a90e2] text-lg hover:text-white">+</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {layers.map((layer) => <div
    key={layer.id}
    onClick={() => setActiveLayer(layer.id)}
    className={`flex items-center px-2 py-1.5 rounded cursor-pointer text-xs ${activeLayerId === layer.id ? "bg-[#333] text-white" : "text-[#d1d1d1] opacity-60 hover:bg-[#333]"}`}
  >
              <div
    className="w-3 h-3 mr-2"
    style={{ backgroundColor: layer.color }}
  />
              <span className="flex-1">{layer.name}</span>
              <button
    onClick={(e) => {
      e.stopPropagation();
      toggleLayerVisibility(layer.id);
    }}
    className={layer.visible ? "text-[#555] hover:text-white" : "text-red-500 hover:text-red-400"}
    title={layer.visible ? "Visible" : "Hidden"}
  >
                {layer.visible ? "On" : "Off"}
              </button>
            </div>)}
        </div>
      </div>
    </div>;
}
export {
  RightSidebar
};
