"use client";
import { useState, useRef, useEffect } from "react";
import { useCadStore }  from '@/store/useCadStore';
import { Undo2, Redo2, Grid, Magnet, Ruler, AlignEndHorizontal, Maximize2, Upload, Image, FileJson, FileEdit, CloudUpload, CloudDownload, ChevronDown, Save, FolderOpen, Trash2, X, FilePlus, Calculator, Sun, Moon } from "lucide-react";
import { cn, downloadFile }  from '@/lib/utils';
import { createDrawing, deleteDrawing, getDrawing, getDrawings, getPricingSettings, createOrder, updateDrawing }  from '@/services/api';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import Drawing from "dxf-writer";
import { ShapeType }  from '@/types';
import { calculateDrawingPrice }  from '@/utils/pricing';
function TopToolbar({ isTemplateMode, onBack }: { isTemplateMode?: boolean; onBack?: () => void }) {     
  const {
    gridEnabled,
    snapEnabled,
    orthoEnabled,
    showMeasurements,
    toggleGrid,
    toggleSnap,
    toggleOrtho,
    toggleMeasurements,
    zoomToFit,
    undo,
    redo,
    historyStep,
    history,
    objects,
    layers,
    activeColor,
    setActiveColor,
    clearDrawing,
    loadedDrawingId,
    loadedDrawingName,
    panels,
    canvasTheme,
    toggleCanvasTheme
  } = useCadStore();
  const fileInputRef = useRef<any>(null);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [openMenuOpen, setOpenMenuOpen] = useState(false);
  const [browserModalOpen, setBrowserModalOpen] = useState<any>(null);
  const [saveName, setSaveName] = useState("");
  const [browserProjects, setBrowserProjects] = useState<any[]>([]);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceResult, setPriceResult] = useState<any>(null);

  // Checkout form states
  const getCachedUser = () => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : {};
    } catch {
      return {};
    }
  };
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [customerName, setCustomerName] = useState(() => getCachedUser().name || "");
  const [customerEmail, setCustomerEmail] = useState(() => getCachedUser().email || "");
  const [customerPhone, setCustomerPhone] = useState(() => getCachedUser().phone || "");
  const [customerAddress, setCustomerAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  useEffect(() => {
    if (browserModalOpen !== "load") return;

    let cancelled = false;
    const loadDrawings = async () => {
      setBrowserLoading(true);
      try {
        const { data } = await getDrawings();
        if (!cancelled) setBrowserProjects(data);
      } catch (e: any) {
        if (!cancelled) {
          alert(e.response?.data?.message || "Failed to load cloud drawings.");
          setBrowserProjects([]);
        }
      } finally {
        if (!cancelled) setBrowserLoading(false);
      }
    };

    loadDrawings();
    return () => {
      cancelled = true;
    };
  }, [browserModalOpen]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem('role'));
    }
  }, []);

  useEffect(() => {
    const handleClick = () => {
      setSaveMenuOpen(false);
      setOpenMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);
  const handleNewDrawing = () => {
    if (objects.length > 0) {
      if (!confirm("Are you sure you want to create a new drawing? Any unsaved changes will be lost.")) return;
    }
    clearDrawing();
  };
  const handleClearCanvas = () => {
    if (confirm("Are you sure you want to clear the entire canvas? This will delete all drawn shapes.")) {
      clearDrawing();
    }
  };
  const handleExportPng = () => {
    window.dispatchEvent(new CustomEvent("export-png"));
  };
  const handleExportDxf = () => {
    let d = new Drawing();
    d.setUnits("Millimeters");
    layers.forEach((l) => {
      d.addLayer(l.name, Drawing.ACI.WHITE, "CONTINUOUS");
    });
    objects.forEach((obj) => {
      const layer = layers.find((l) => l.id === obj.layerId)?.name || "0";
      d.setActiveLayer(layer);
      switch (obj.type) {
        case ShapeType.LINE:
        case ShapeType.WALL:
        case ShapeType.BEAM:
        case ShapeType.LINTEL:
          if (obj.points.length >= 4) {
            d.drawLine(obj.points[0] + obj.x, -(obj.points[1] + obj.y), obj.points[2] + obj.x, -(obj.points[3] + obj.y));
          }
          break;
        case ShapeType.POLYLINE:
        case ShapeType.FREE_DRAW:
          if (obj.points.length >= 2) {
            const pts: [number, number][] = [];
            for (let i = 0; i < obj.points.length; i += 2) {
              pts.push([obj.points[i] + obj.x, -(obj.points[i + 1] + obj.y)]);
            }
            d.drawPolyline(pts);
          }
          break;
        case ShapeType.RECTANGLE:
          if (obj.width != null && obj.height != null) {
            d.drawRect(obj.x, -obj.y, obj.x + obj.width, -(obj.y + obj.height));
          }
          break;
        case ShapeType.CIRCLE:
          if (obj.radius != null) {
            d.drawCircle(obj.x, -obj.y, obj.radius);
          }
          break;
        case ShapeType.ARC:
          if (obj.radius != null && obj.endAngle != null) {
            let startAt = -(obj.rotation || 0) - obj.endAngle;
            let endAt = -(obj.rotation || 0);
            while (startAt < 0) startAt += 360;
            while (endAt < 0) endAt += 360;
            d.drawArc(obj.x, -obj.y, obj.radius, startAt, endAt);
          }
          break;
        case ShapeType.ANNOTATION:
          if (obj.startPoint && obj.textPos) {
            d.drawLine(obj.startPoint.x, -obj.startPoint.y, obj.textPos.x, -obj.textPos.y);
            if (obj.text) {
              const lines = String(obj.text).split('\n');
              lines.forEach((lineText, idx) => {
                d.drawText(obj.textPos.x, -(obj.textPos.y + idx * (obj.fontSize || 14)), obj.fontSize || 14, 0, lineText);
              });
            }
          }
          break;
      }
    });
    const dxfString = d.toDxfString();
    const blob = new Blob([dxfString], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "cad-export.dxf");
    URL.revokeObjectURL(url);
  };
  const formatMoney = (amount: any, currency = "INR") => `${currency} ${Number(amount || 0).toFixed(2)}`;
  const handleShowPrice = async () => {
    setPriceModalOpen(true);
    setCheckoutStep(false);
    setPriceLoading(true);
    // Refresh pre-filled user details in case profile updated
    const user = getCachedUser();
    if (user.name) setCustomerName(user.name);
    if (user.email) setCustomerEmail(user.email);
    if (user.phone) setCustomerPhone(user.phone);
    try {
      const { data: pricing } = await getPricingSettings();
      setPriceResult(calculateDrawingPrice(objects, pricing));
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to calculate drawing price.");
      setPriceModalOpen(false);
    } finally {
      setPriceLoading(false);
    }
  };
  const handlePlaceOrder = async (e: any) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim() || !customerAddress.trim()) {
      alert("Name, Email, and Address are required!");
      return;
    }
    setPlacingOrder(true);
    try {
      // Find loaded drawing name or default
      const productName = saveName.trim() || "Custom CAD Design Layout";
      const blueprintType = "custom_drawing";

      await createOrder({
        customerName: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        productName,
        quantity: 1,
        totalPrice: priceResult.total,
        blueprintType,
        drawingData: panels,
      });

      alert("Order placed successfully! Admins will review it shortly.");
      setPriceModalOpen(false);
      setCheckoutStep(false);
      setCustomerAddress("");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };
  const handleSaveJson = () => {
    const data = {
      objects,
      layers,
      panels,
      activePanelId: useCadStore.getState().activePanelId,
      version: "1.1"
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "cad-project.json");
    URL.revokeObjectURL(url);
  };
  const handleLoadJson = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event: any) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.panels && Array.isArray(data.panels) && data.panels.length > 0) {
          const activePanel = data.panels.find((p: any) => p.id === data.activePanelId) || data.panels[0];
          useCadStore.setState({
            panels: data.panels,
            activePanelId: activePanel.id,
            objects: activePanel.objects,
            layers: activePanel.layers,
            activeLayerId: activePanel.activeLayerId,
            loadedDrawingId: null,
            loadedDrawingName: null
          });
          useCadStore.getState().commitHistory();
        } else if (data.objects && Array.isArray(data.objects)) {
          const defaultLayerId = data.activeLayerId || (data.layers?.[0]?.id) || "layer-1";
          const fallbackPanel = {
            id: "panel-1",
            name: "Main Design",
            objects: data.objects,
            layers: data.layers || [{ id: defaultLayerId, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
            activeLayerId: defaultLayerId
          };
          useCadStore.setState({
            panels: [fallbackPanel],
            activePanelId: "panel-1",
            objects: data.objects,
            layers: fallbackPanel.layers,
            activeLayerId: defaultLayerId,
            loadedDrawingId: null,
            loadedDrawingName: null
          });
          useCadStore.getState().commitHistory();
        }
      } catch (err) {
        console.error(err);
        alert("Invalid project file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  const handleSaveBrowser = async () => {
    if (!saveName.trim()) {
      alert("Please enter a name for the drawing.");
      return;
    }
    const data = {
      objects,
      layers,
      panels,
      activePanelId: useCadStore.getState().activePanelId,
      version: "1.1"
    };
    setBrowserLoading(true);
    try {
      const { data: savedDrawing } = await createDrawing({
        name: saveName.trim(),
        data
      });
      setBrowserProjects((projects) => [savedDrawing, ...projects]);
      alert("Drawing saved to cloud successfully!");
      useCadStore.setState({
        loadedDrawingId: savedDrawing.id,
        loadedDrawingName: savedDrawing.name
      });
      setBrowserModalOpen(null);
      setSaveName("");
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to save drawing to cloud.");
    } finally {
      setBrowserLoading(false);
    }
  };
  const handleUpdateBrowser = async () => {
    if (!loadedDrawingId) return;
    const data = {
      objects,
      layers,
      panels,
      activePanelId: useCadStore.getState().activePanelId,
      version: "1.1"
    };
    setBrowserLoading(true);
    try {
      await updateDrawing(loadedDrawingId, {
        name: loadedDrawingName,
        data
      });
      alert("Drawing updated successfully!");
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to save drawing changes.");
    } finally {
      setBrowserLoading(false);
    }
  };
  const handleLoadBrowser = async (id: any) => {
    setBrowserLoading(true);
    try {
      const { data: drawing } = await getDrawing(id);
      const data = drawing.data;
      if (data.panels && Array.isArray(data.panels) && data.panels.length > 0) {
        const activePanel = data.panels.find((p: any) => p.id === data.activePanelId) || data.panels[0];
        useCadStore.setState({
          panels: data.panels,
          activePanelId: activePanel.id,
          objects: activePanel.objects,
          layers: activePanel.layers,
          activeLayerId: activePanel.activeLayerId,
          loadedDrawingId: drawing.id,
          loadedDrawingName: drawing.name
        });
        useCadStore.getState().commitHistory();
        setBrowserModalOpen(null);
      } else if (data.objects && Array.isArray(data.objects)) {
        const defaultLayerId = data.activeLayerId || (data.layers?.[0]?.id) || "layer-1";
        const fallbackPanel = {
          id: "panel-1",
          name: "Main Design",
          objects: data.objects,
          layers: data.layers || [{ id: defaultLayerId, name: "0", visible: true, locked: false, color: "#FFFFFF" }],
          activeLayerId: defaultLayerId
        };
        useCadStore.setState({
          panels: [fallbackPanel],
          activePanelId: "panel-1",
          objects: data.objects,
          layers: fallbackPanel.layers,
          activeLayerId: defaultLayerId,
          loadedDrawingId: drawing.id,
          loadedDrawingName: drawing.name
        });
        useCadStore.getState().commitHistory();
        setBrowserModalOpen(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to load drawing.");
    } finally {
      setBrowserLoading(false);
    }
  };
  const executeDeleteBrowser = async () => {
    if (!projectToDelete) return;
    setBrowserLoading(true);
    try {
      await deleteDrawing(projectToDelete.id);
      setBrowserProjects((projects) => projects.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete drawing.");
    } finally {
      setBrowserLoading(false);
    }
  };
  const ToggleBtn = ({ active, onClick, icon: Icon, label }: any) => <button
    onClick={onClick}
    title={label}
    className={cn(
      "px-2 py-1.5 rounded flex items-center gap-1 text-xs tracking-wider uppercase font-semibold transition-colors border",
      active ? "bg-[#3a3b41] text-[#4a90e2] border-[#4a90e2]" : "bg-transparent text-[#777] border-transparent hover:bg-[#3a3b41] hover:text-white"
    )}
  >
    <Icon size={14} />
    <span className="hidden 2xl:inline">{label}</span>
  </button>;
  return <><div className="flex flex-wrap items-center justify-start w-full gap-x-2 md:gap-x-3 gap-y-1.5 py-1">
      {/* Group 1: Logo & File Info */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="w-6 h-6 shrink-0 bg-[#4a90e2] rounded flex items-center justify-center font-bold text-white text-xs">P</div>
        <span className="text-sm font-semibold tracking-tight uppercase text-white hidden sm:inline">PrecisionCAD</span>
        {loadedDrawingName && (
          <span className="text-xs text-[#888] ml-2 border-l border-[#333] pl-2 hidden lg:flex items-center gap-1">
            Editing: <strong className="text-white font-medium truncate max-w-[80px] xl:max-w-[150px]">{loadedDrawingName}</strong>
          </span>
        )}
      </div>

      <div className="h-4 w-px shrink-0 bg-[#333] mx-1 hidden sm:block" />

      {/* Group 2: History (Undo/Redo/Clear) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="p-1.5 rounded text-[#777] hover:bg-[#3a3b41] hover:text-white disabled:opacity-50"
          onClick={undo}
          disabled={historyStep === 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="p-1.5 rounded text-[#777] hover:bg-[#3a3b41] hover:text-white disabled:opacity-50"
          onClick={redo}
          disabled={historyStep >= history.length - 1}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
        <button
          className="px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold transition-colors border bg-transparent text-[#777] border-transparent hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/20"
          onClick={handleClearCanvas}
          title="Clear Design"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Clear Design</span>
        </button>
      </div>

      <div className="h-4 w-px shrink-0 bg-[#333] mx-1" />

      {/* Group 3: View Options (Grid, Snap, Ortho, Measure, Theme, Fit) */}
      <div className="flex items-center gap-1 flex-wrap shrink-0">
        <ToggleBtn active={gridEnabled} onClick={toggleGrid} icon={Grid} label="Grid" />
        <ToggleBtn active={snapEnabled} onClick={toggleSnap} icon={Magnet} label="Snap" />
        <ToggleBtn active={orthoEnabled} onClick={toggleOrtho} icon={AlignEndHorizontal} label="Ortho" />
        <ToggleBtn active={showMeasurements} onClick={toggleMeasurements} icon={Ruler} label="Measure" />
        <button
          onClick={toggleCanvasTheme}
          title={canvasTheme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className="px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold transition-colors border bg-transparent text-[#777] border-transparent hover:bg-[#3a3b41] hover:text-white"
        >
          {canvasTheme === "light" ? <Sun size={14} /> : <Moon size={14} />}
          <span className="hidden xl:inline">{canvasTheme === "light" ? "Light" : "Dark"}</span>
        </button>
        <button
          onClick={zoomToFit}
          title="Zoom to Fit (Ctrl+0)"
          className="px-2.5 py-1.5 rounded flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold transition-colors border bg-transparent text-[#777] border-transparent hover:bg-[#3a3b41] hover:text-white"
        >
          <Maximize2 size={14} />
          <span className="hidden xl:inline">Fit View</span>
        </button>
      </div>

      <div className="h-4 w-px shrink-0 bg-[#333] mx-1" />

      {/* Group 4: Color Picker & Swatches */}
      <div className="flex items-center space-x-1.5 shrink-0 bg-[#1a1b1e] border border-[#333] px-2 py-1 rounded-md">
        <input
          type="color"
          value={activeColor}
          onChange={(e) => setActiveColor(e.target.value)}
          className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
          title="Custom Color Picker"
        />
        <div className="h-4 w-px bg-[#333] mx-1" />
        {[
          { hex: "#FFFFFF", name: "White" },
          { hex: "#9CA3AF", name: "Gray" },
          { hex: "#EF4444", name: "Red" },
          { hex: "#22C55E", name: "Green" },
          { hex: "#3B82F6", name: "Blue" },
          { hex: "#F97316", name: "Orange" },
          { hex: "#06B6D4", name: "Cyan" }
        ].map((swatch) => {
          const isActive = activeColor.toLowerCase() === swatch.hex.toLowerCase();
          return (
            <button
              key={swatch.hex}
              onClick={() => setActiveColor(swatch.hex)}
              title={swatch.name}
              className={cn(
                "w-4 h-4 rounded-full transition-all duration-150 relative border flex items-center justify-center",
                isActive 
                  ? "scale-110 ring-1 ring-blue-500 border-white" 
                  : "border-transparent hover:scale-110 hover:border-gray-400"
              )}
              style={{ backgroundColor: swatch.hex }}
            >
              {isActive && (
                <span 
                  className="absolute text-[8px] font-bold" 
                  style={{ color: swatch.hex === "#FFFFFF" ? "#000000" : "#FFFFFF" }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-4 w-px shrink-0 bg-[#333] mx-1 hidden lg:block" />

      {/* Flat File Action Buttons */}
      {isTemplateMode ? (
        <>
          <button
            className="px-3 py-1.5 text-xs uppercase font-semibold tracking-wider bg-transparent text-[#777] border border-transparent hover:text-white rounded hover:bg-[#3a3b41] transition-colors flex items-center gap-1.5 shrink-0"
            onClick={onBack}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1.5 text-xs uppercase font-bold tracking-wider bg-[#4a90e2] text-white hover:bg-[#3a7fc2] rounded transition-colors flex items-center gap-1.5 shrink-0"
            onClick={() => window.dispatchEvent(new CustomEvent('save-template-intent'))}
          >
            <Save size={14} /> Save Template Details
          </button>
        </>
      ) : (
        <>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleLoadJson}
          />

          <button
            className="px-3 py-1.5 text-xs uppercase font-semibold tracking-wider bg-transparent text-[#777] border border-transparent hover:text-white rounded hover:bg-[#3a3b41] transition-colors flex items-center gap-1.5 shrink-0"
            onClick={handleNewDrawing}
            title="New Drawing"
          >
            <FilePlus size={14} /> <span className="hidden lg:inline">New</span>
          </button>

          {/* Open Menu */}
          <div className="relative shrink-0">
            <button
              className="px-3 py-1.5 text-xs uppercase font-semibold tracking-wider bg-[#1e1f22] text-[#777] border border-[#333] hover:text-white rounded hover:bg-[#3a3b41] transition-colors flex items-center gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuOpen(!openMenuOpen);
                setSaveMenuOpen(false);
              }}
              title="Open Options"
            >
              <FolderOpen size={14} /> <span className="hidden lg:inline">Open</span> <ChevronDown size={12} />
            </button>

            {openMenuOpen && <div className="absolute left-0 top-full mt-1 w-40 bg-[#1e1f22] border border-[#333] rounded shadow-xl z-50 overflow-hidden flex flex-col">
              <button
                className="px-4 py-2 text-xs text-left text-[#aaa] hover:text-white hover:bg-[#3a3b41] flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                <Upload size={14} /> Local File (.json)
              </button>
              <button
                className="px-4 py-2 text-xs text-left text-[#aaa] hover:text-white hover:bg-[#3a3b41] flex items-center gap-2 border-t border-[#333]"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuOpen(false);
                  setBrowserModalOpen("load");
                }}
              >
                <CloudDownload size={14} /> Cloud / Browser
              </button>
            </div>}
          </div>

          {/* Save Menu */}
          <div className="relative shrink-0">
            <button
              className="px-3 py-1.5 text-xs uppercase font-semibold tracking-wider bg-[#1e1f22] text-[#777] border border-[#333] hover:text-white rounded hover:bg-[#3a3b41] transition-colors flex items-center gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                setSaveMenuOpen(!saveMenuOpen);
                setOpenMenuOpen(false);
              }}
              title="Save Options"
            >
              <Save size={14} /> <span className="hidden lg:inline">Save</span> <ChevronDown size={12} />
            </button>

            {saveMenuOpen && <div className="absolute left-0 top-full mt-1 w-40 bg-[#1e1f22] border border-[#333] rounded shadow-xl z-50 overflow-hidden flex flex-col">
              {loadedDrawingId && (
                <button
                  className="px-4 py-2 text-xs text-left text-[#aaa] hover:text-white hover:bg-[#3a3b41] flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSaveMenuOpen(false);
                    handleUpdateBrowser();
                  }}
                >
                  <Save size={14} /> Save Changes
                </button>
              )}
              <button
                className={cn(
                  "px-4 py-2 text-xs text-left text-[#aaa] hover:text-white hover:bg-[#3a3b41] flex items-center gap-2",
                  loadedDrawingId && "border-t border-[#333]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSaveMenuOpen(false);
                  handleSaveJson();
                }}
              >
                <FileJson size={14} /> Local File (.json)
              </button>
              <button
                className="px-4 py-2 text-xs text-left text-[#aaa] hover:text-white hover:bg-[#3a3b41] flex items-center gap-2 border-t border-[#333]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSaveMenuOpen(false);
                  setBrowserModalOpen("save");
                }}
              >
                <CloudUpload size={14} /> {loadedDrawingId ? "Save As New..." : "Cloud / Browser"}
              </button>
            </div>}
          </div>

          <button
            className="px-3 py-1.5 text-xs uppercase font-semibold tracking-wider bg-transparent text-[#777] hover:text-white rounded hover:bg-[#3a3b41] transition-colors flex items-center gap-1.5 shrink-0"
            onClick={handleExportDxf}
            title="Export DXF"
          >
            <FileEdit size={14} /> <span className="hidden lg:inline">DXF</span>
          </button>
          {userRole !== 'admin' && userRole !== 'staff' && (
            <button
              className="px-3 py-1.5 text-xs uppercase font-bold tracking-wider bg-[#16a34a] text-white hover:bg-[#15803d] rounded transition-colors flex items-center gap-1.5 shrink-0"
              onClick={handleShowPrice}
              title="Calculate drawing price"
            >
              <Calculator size={14} /> <span className="hidden md:inline">Show Price</span>
            </button>
          )}
          <button
            className="px-4 py-1.5 text-xs uppercase font-bold tracking-wider bg-[#4a90e2] text-white hover:bg-[#3a7fc2] rounded transition-colors flex items-center gap-1.5 shrink-0"
            onClick={handleExportPng}
            title="Export PNG"
          >
            <Image size={14} /> <span className="hidden md:inline">PNG</span>
          </button>
        </>
      )}
    </div>

    {browserModalOpen && <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-[#1e1f22] border border-[#333] rounded-lg shadow-2xl w-[400px] max-w-[90vw] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h3 className="text-white font-semibold">
            {browserModalOpen === "save" ? "Save Drawing to Cloud" : "Open Drawing from Cloud"}
          </h3>
          <button onClick={() => setBrowserModalOpen(null)} className="text-[#888] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 bg-[#141517] flex-1 overflow-y-auto max-h-[60vh]">
          {browserModalOpen === "save" ? <div>
            <label className="block text-sm text-[#aaa] mb-2">Drawing Name</label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="E.g. Ground Floor Plan"
              className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveBrowser();
              }}
              disabled={browserLoading}
            />
          </div> : <div className="flex flex-col gap-2">
            {browserLoading ? <p className="text-[#666] text-center text-sm py-4">Loading saved drawings...</p> : browserProjects.length === 0 ? <p className="text-[#666] text-center text-sm py-4">No saved drawings found.</p> : browserProjects.map((proj) => <div key={proj.id} className="flex flex-row items-center justify-between bg-[#1e1f22] border border-[#333] hover:border-[#444] rounded p-3 transition-colors">
              <div>
                <div className="text-white font-medium text-sm">{proj.name}</div>
                <div className="text-[#666] text-xs mt-1">{new Date(proj.updatedAt || proj.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLoadBrowser(proj.id)}
                  disabled={browserLoading}
                  className="bg-[#4a90e2] text-white hover:bg-[#3a7fc2] px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => {
                    setProjectToDelete(proj);
                    setBrowserModalOpen(null);
                  }}
                  disabled={browserLoading}
                  className="text-[#ef4444] hover:bg-[#ef4444] hover:text-white p-1.5 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>)}
          </div>}
        </div>

        {browserModalOpen === "save" && <div className="p-4 border-t border-[#333] flex justify-end gap-3 bg-[#1e1f22]">
          <button
            onClick={() => setBrowserModalOpen(null)}
            className="px-4 py-2 text-sm text-[#ccc] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveBrowser}
            disabled={browserLoading}
            className="px-4 py-2 text-sm bg-[#4a90e2] text-white hover:bg-[#3a7fc2] rounded font-semibold transition-colors"
          >
            {browserLoading ? "Saving..." : "Save Drawing"}
          </button>
        </div>}
      </div>
    </div>}
    {priceModalOpen && <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-[#1e1f22] border border-[#333] rounded-lg shadow-2xl w-[460px] max-w-[92vw] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h3 className="text-white font-semibold">
            {checkoutStep ? "Place Drawing Order" : "Drawing Price"}
          </h3>
          <button onClick={() => { setPriceModalOpen(false); setCheckoutStep(false); }} className="text-[#888] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {checkoutStep ? (
          <form onSubmit={handlePlaceOrder} className="flex flex-col flex-1">
            <div className="p-4 bg-[#141517] space-y-4">
              <div>
                <label className="block text-xs text-[#aaa] mb-1 font-semibold uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2]"
                  disabled={placingOrder}
                />
              </div>
              <div>
                <label className="block text-xs text-[#aaa] mb-1 font-semibold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2]"
                  disabled={placingOrder}
                />
              </div>
              <div>
                <label className="block text-xs text-[#aaa] mb-1 font-semibold uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number (optional)"
                  className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2]"
                  disabled={placingOrder}
                />
              </div>
              <div>
                <label className="block text-xs text-[#aaa] mb-1 font-semibold uppercase tracking-wider">Delivery/Shipping Address</label>
                <textarea
                  required
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter complete billing/delivery address"
                  className="w-full bg-[#1e1f22] border border-[#444] rounded px-3 py-2 text-white outline-none focus:border-[#4a90e2] resize-none"
                  disabled={placingOrder}
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#333] flex items-center justify-between bg-[#1e1f22]">
              <button
                type="button"
                onClick={() => setCheckoutStep(false)}
                className="px-4 py-2 text-sm text-[#ccc] hover:text-white"
                disabled={placingOrder}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={placingOrder}
                className="px-4 py-2 text-sm bg-[#16a34a] hover:bg-[#15803d] text-white rounded font-bold transition-colors"
              >
                {placingOrder ? "Placing Order..." : `Confirm Order (${formatMoney(priceResult?.total || 0, priceResult?.currency)})`}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="p-4 bg-[#141517] flex-1 overflow-y-auto max-h-[50vh]">
              {priceLoading ? (
                <p className="text-[#777] text-sm py-4 text-center">Calculating price...</p>
              ) : priceResult?.items?.length ? (
                <div className="space-y-3">
                  {priceResult.items.map((item: any) => (
                    <div key={item.key} className="flex items-center justify-between gap-4 text-sm border-b border-[#2a2b30] pb-2">
                      <div>
                        <div className="text-white font-medium">{item.label}</div>
                        <div className="text-[#777] text-xs">
                          {item.quantity.toFixed(2)} {item.unit} x {formatMoney(item.rate, priceResult.currency)}
                        </div>
                      </div>
                      <div className="text-white font-semibold">{formatMoney(item.total, priceResult.currency)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#777] text-sm py-4 text-center">
                  No priced drawing items found. Add drawing objects or set rates in the admin dashboard.
                </p>
              )}
            </div>

            <div className="p-4 border-t border-[#333] flex items-center justify-between bg-[#1e1f22]">
              <div className="flex flex-col">
                <span className="text-[#aaa] text-xs">Total Price</span>
                <span className="text-white text-xl font-bold">{formatMoney(priceResult?.total || 0, priceResult?.currency || "INR")}</span>
              </div>
              {priceResult?.total > 0 && !priceLoading && (
                <button
                  onClick={() => setCheckoutStep(true)}
                  className="px-4 py-2 bg-[#4a90e2] text-white hover:bg-[#3a7fc2] rounded font-bold text-sm transition-colors"
                >
                  Place Order
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>}
    <DeleteConfirmModal
      isOpen={!!projectToDelete}
      title="Delete Drawing"
      itemName={projectToDelete?.name || ''}
      onConfirm={executeDeleteBrowser}
      onCancel={() => setProjectToDelete(null)}
      isDeleting={browserLoading}
    />
  </>;
}
export {
  TopToolbar
};
