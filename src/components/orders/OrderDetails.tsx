import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, Phone, MapPin, Calendar, ZoomIn, ZoomOut, Maximize2, 
  ChevronLeft, FileText, LayoutGrid, MessageSquare, Clock, ShieldAlert,
  CheckCircle2, AlertCircle, PlayCircle, ClipboardCheck, Printer, Sun, Moon
} from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import BlueprintDrawing from './BlueprintDrawing';
import { calculateDrawingPrice }  from '@/utils/pricing';

interface StandardizedPanel {
  id: string;
  name: string;
  objects: any[];
  layers?: any[];
}

export default function OrderDetails({ order, isAdmin, onBack, onStatusChange, updating }: { order: any; isAdmin: boolean; onBack: () => void; onStatusChange: (orderId: string, status: string, remarks: string) => void; updating: boolean }) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [adminLightMode, setAdminLightMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remarks, setRemarks] = useState(order.remarks || '');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Helper to parse annotation text
  const getAnnotationInfo = (panelObjects: any[]) => {
    if (!panelObjects || !Array.isArray(panelObjects)) {
      return { id: '—', material: 'MondoClad', color: 'Charcoal', face: 'B.O.P.' };
    }
    const annotationObj = panelObjects.find(
      (obj) => (obj.type === 'annotation' || obj.type === 'ANNOTATION') && obj.text
    );
    if (!annotationObj) {
      return { id: '—', material: 'MondoClad', color: 'Charcoal', face: 'B.O.P.' };
    }
    const lines = annotationObj.text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    let id = '—';
    let material = 'MondoClad';
    let color = 'Charcoal';
    let face = 'B.O.P.';
    if (lines.length > 0) {
      const idLine = lines.find((l: string) => l.startsWith('ID -') || l.includes('ID'));
      if (idLine) id = idLine;
      else id = lines[0];
      if (lines.length > 1) material = lines[1];
      if (lines.length > 2) color = lines[2];
      if (lines.length > 3) face = lines[3];
    }
    return { id, material, color, face };
  };

  // Helper to get panel dimensions in mm
  const getPanelDimensions = (panelObjects: any[]) => {
    if (!panelObjects || panelObjects.length === 0) return { width: 0, height: 0 };
    const rect = panelObjects.find(obj => obj.type === 'rectangle' || obj.type === 'RECTANGLE');
    if (rect && rect.width && rect.height) {
      return { width: Math.round(rect.width), height: Math.round(rect.height) };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    panelObjects.forEach((obj: any) => {
      let ox1 = obj.x || 0;
      let oy1 = obj.y || 0;
      let ox2 = obj.x || 0;
      let oy2 = obj.y || 0;
      if (obj.type === 'rectangle' || obj.type === 'RECTANGLE') {
        ox2 = (obj.x || 0) + (obj.width || 0);
        oy2 = (obj.y || 0) + (obj.height || 0);
      } else if (obj.type === 'circle' || obj.type === 'CIRCLE' || obj.type === 'arc' || obj.type === 'ARC') {
        ox1 = (obj.x || 0) - (obj.radius || 0);
        ox2 = (obj.x || 0) + (obj.radius || 0);
        oy1 = (obj.y || 0) - (obj.radius || 0);
        oy2 = (obj.y || 0) + (obj.radius || 0);
      } else if (obj.points && obj.points.length > 0) {
        const px = obj.points.filter((_: any, i: number) => i % 2 === 0);
        const py = obj.points.filter((_: any, i: number) => i % 2 !== 0);
        ox1 = Math.min(...px) + (obj.x || 0);
        ox2 = Math.max(...px) + (obj.x || 0);
        oy1 = Math.min(...py) + (obj.y || 0);
        oy2 = Math.max(...py) + (obj.y || 0);
      }
      minX = Math.min(minX, ox1, ox2);
      minY = Math.min(minY, oy1, oy2);
      maxX = Math.max(maxX, ox1, ox2);
      maxY = Math.max(maxY, oy1, oy2);
    });
    if (minX === Infinity) return { width: 0, height: 0 };
    return { width: Math.round(maxX - minX), height: Math.round(maxY - minY) };
  };

  // Standardize panels array
  const standardizedPanels = useMemo<StandardizedPanel[]>(() => {
    if (Array.isArray(order.drawingData) && order.drawingData.length > 0) {
      if (order.drawingData[0] !== null && typeof order.drawingData[0] === 'object' && 'objects' in order.drawingData[0]) {
        return order.drawingData;
      } else {
        return [{
          id: 'panel-1',
          name: 'Main Design',
          objects: order.drawingData,
          layers: []
        }];
      }
    }
    return [];
  }, [order.drawingData]);

  // Aggregate panel counts by color/material
  const aggregatedPanelCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    standardizedPanels.forEach((p) => {
      const info = getAnnotationInfo(p.objects);
      const key = `${info.material} ${info.color} Panels`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts);
  }, [standardizedPanels]);

  // Nesting Sheet Size groups
  const nestingSheetGroups = useMemo(() => {
    const groups: { [sheetSize: string]: string[] } = {};
    standardizedPanels.forEach((p) => {
      const dims = getPanelDimensions(p.objects);
      const info = getAnnotationInfo(p.objects);
      
      let sheetSize = '4000×1250';
      if (dims.width <= 2500 && dims.height <= 1250) {
        sheetSize = '2500×1250';
      } else if (dims.width <= 3200 && dims.height <= 1250) {
        sheetSize = '3200×1250';
      } else if (dims.width <= 4000 && dims.height <= 1250) {
        sheetSize = '4000×1250';
      } else if (dims.width <= 4000 && dims.height <= 1575) {
        sheetSize = '4000×1575';
      }
      
      if (!groups[sheetSize]) {
        groups[sheetSize] = [];
      }
      const panelName = (info.id && info.id !== '—') ? info.id : p.name;
      groups[sheetSize].push(panelName);
    });
    return Object.entries(groups);
  }, [standardizedPanels]);

  // Dynamic notes/fabrication checklists states derived from actual drawing data
  const hasStiffeners = useMemo(() => {
    return standardizedPanels.some(p => 
      p.objects.some(obj => 
        obj.type === 'stiffener' || 
        (obj.text && obj.text.toLowerCase().includes('stiffener'))
      )
    );
  }, [standardizedPanels]);

  const hasWeepHoles = useMemo(() => {
    return standardizedPanels.some(p => 
      p.objects.some(obj => 
        obj.type === 'weep_hole' || 
        (obj.text && obj.text.toLowerCase().includes('weep'))
      )
    );
  }, [standardizedPanels]);

  const hasAdheseal = useMemo(() => {
    return standardizedPanels.some(p => 
      p.objects.some(obj => obj.text && obj.text.toLowerCase().includes('adheseal'))
    );
  }, [standardizedPanels]);

  const hasTremco = useMemo(() => {
    return standardizedPanels.some(p => 
      p.objects.some(obj => obj.text && obj.text.toLowerCase().includes('tremco'))
    );
  }, [standardizedPanels]);

  const hasArrowDirection = useMemo(() => {
    return standardizedPanels.some(p => 
      p.objects.some(obj => 
        obj.type === 'arrow' || 
        (obj.type === 'line' && obj.points && obj.points.length > 4)
      )
    );
  }, [standardizedPanels]);

  const hasTagLayout = useMemo(() => {
    return standardizedPanels.some(p => 
      p.objects.some(obj => obj.type === 'annotation' || obj.type === 'ANNOTATION')
    );
  }, [standardizedPanels]);

  const hasNesting = standardizedPanels.length > 1;

  const rivetCentresValue = useMemo(() => {
    let value = '—';
    standardizedPanels.forEach(p => {
      p.objects.forEach(obj => {
        if (obj.text && obj.text.toLowerCase().includes('rivet')) {
          const match = obj.text.match(/\d+/);
          if (match) value = `${match[0]} mm`;
        }
      });
    });
    return value;
  }, [standardizedPanels]);

  // Keep local remarks in sync if order prop changes
  useEffect(() => {
    setRemarks(order.remarks || '');
  }, [order.remarks]);

  const handleSavePDF = async () => {
    const element = document.getElementById('invoice-print-container');
    if (!element) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pages = element.querySelectorAll('.pdf-page-container');
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2.5,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(`ORD-${order.id}-skyline-spec-sheet.pdf`);
      setIsGeneratingPDF(false);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      setIsGeneratingPDF(false);
    }
  };
  const formatPrice = (price: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine status history checklist
  const getStatusHistory = () => {
    const history: any[] = [
      { 
        status: 'Pending', 
        label: 'Order Placed', 
        description: 'Your blueprint order has been successfully placed.',
        date: order.orderDate || order.createdAt,
        active: true,
        done: true 
      }
    ];

    const currentStatus = order.status;
    const isUnderReview = ['In Review', 'Processing', 'Approved', 'Rejected', 'Completed'].includes(currentStatus);
    const isApprovedOrRejected = ['Approved', 'Rejected', 'Completed'].includes(currentStatus);
    const isCompleted = currentStatus === 'Completed';

    history.push({
      status: 'In Review',
      label: 'Under Review',
      description: 'Our engineering staff is reviewing your drawing specifications.',
      date: isUnderReview ? (order.updatedAt || order.createdAt) : null,
      active: currentStatus === 'In Review' || currentStatus === 'Processing',
      done: isUnderReview
    });

    if (currentStatus === 'Rejected') {
      history.push({
        status: 'Rejected',
        label: 'Rejected',
        description: 'Design rejected. Please check admin comments for details.',
        date: order.updatedAt,
        active: true,
        done: true,
        isError: true
      });
    } else {
      history.push({
        status: 'Approved',
        label: 'Approved',
        description: 'Design approved. Preparing finalized drawings for delivery.',
        date: isApprovedOrRejected ? order.updatedAt : null,
        active: currentStatus === 'Approved',
        done: isApprovedOrRejected
      });

      history.push({
        status: 'Completed',
        label: 'Completed',
        description: 'Order completed. Blueprint deliverables are ready.',
        date: isCompleted ? order.updatedAt : null,
        active: currentStatus === 'Completed',
        done: isCompleted
      });
    }

    return history;
  };

  const historySteps = getStatusHistory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 text-gray-600"
            title="Back to Orders"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-gray-400">Order Details</div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mt-0.5">
              {order.id}
              <OrderStatusBadge status={order.status} />
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:text-indigo-600 font-semibold text-sm transition-all flex items-center gap-2 shadow-sm shadow-gray-50 shrink-0"
            title="Print/Save Blueprint Spec Sheet PDF"
          >
            <Printer size={16} className="text-indigo-500" />
            <span>Download Spec Sheet / PDF</span>
          </button>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">Status:</span>
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order.id, e.target.value, remarks)}
                disabled={updating}
                className="w-full sm:w-40 rounded-lg border border-gray-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold disabled:opacity-55"
              >
                <option value="Pending">Pending</option>
                <option value="In Review">In Review</option>
                <option value="Processing">Processing (Blue)</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Metadata & Remarks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer info */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-indigo-500" /> Customer Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400 block text-xs">Customer Name</span>
                <span className="font-semibold text-gray-700">{order.customerName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Email Address</span>
                <span className="font-medium text-gray-700 break-all">{order.email}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Phone Number</span>
                <span className="font-medium text-gray-700">{order.phone || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs flex items-center gap-1">
                  <MapPin size={12} /> Billing/Delivery Address
                </span>
                <span className="font-medium text-gray-600 leading-relaxed block mt-0.5">{order.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" /> Order Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400 block text-xs">Product Name/Title</span>
                <span className="font-semibold text-gray-700">{order.productName}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 block text-xs">Quantity</span>
                  <span className="font-semibold text-gray-700">{order.quantity} unit(s)</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs">Created Date</span>
                  <span className="font-semibold text-gray-700">
                    {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Total Price</span>
                <span className="text-lg font-extrabold text-indigo-600">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </div>


          {/* Admin remarks / feedback section */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-500" /> Reviewer Remarks
            </h3>
            
            {isAdmin ? (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or feedback for the user..."
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-gray-700"
                />
                <button
                  onClick={() => onStatusChange(order.id, order.status, remarks)}
                  disabled={updating || remarks === (order.remarks || '')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
                >
                  {updating ? 'Saving remarks...' : 'Save Remarks'}
                </button>
              </div>
            ) : (
              <div className="text-sm">
                {order.remarks ? (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-indigo-900 leading-relaxed relative">
                    <span className="absolute -top-2 left-6 text-[10px] font-bold text-indigo-500 bg-white px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                      Admin Message
                    </span>
                    <p className="text-gray-700 font-medium text-sm mt-1">{order.remarks}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-center py-4">No comments or feedback added by reviewers yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Status timeline for user side */}
          {!isAdmin && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 space-y-5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" /> Tracking Timeline
              </h3>
              
              <div className="relative border-l-2 border-gray-100 ml-3.5 pl-6 space-y-6">
                {historySteps.map((step, idx) => {
                  let iconBg = 'bg-gray-100 text-gray-400';
                  let icon = <AlertCircle size={14} />;

                  if (step.done) {
                    if (step.isError) {
                      iconBg = 'bg-red-500 text-white';
                      icon = <ShieldAlert size={14} />;
                    } else {
                      iconBg = 'bg-indigo-600 text-white';
                      icon = <CheckCircle2 size={14} />;
                    }
                  } else if (step.active) {
                    iconBg = 'bg-blue-500 text-white animate-pulse';
                    icon = <PlayCircle size={14} />;
                  }

                  return (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${iconBg}`}>
                        {icon}
                      </span>
                      
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                        <p className={`text-xs mt-0.5 leading-relaxed ${step.done ? 'text-gray-500' : 'text-gray-400'}`}>
                          {step.description}
                        </p>
                        {step.date && (
                          <span className="text-[10px] font-semibold text-gray-400 mt-1 flex items-center gap-1">
                            <Clock size={10} /> {formatDate(step.date)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: CAD/Design Preview */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden h-full flex flex-col">
            
            {/* Drawing Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                <LayoutGrid size={16} className="text-indigo-500" /> Blueprint Preview
              </h3>

              <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                  className="p-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} /> <span className="hidden sm:inline">Zoom Out</span>
                </button>
                <span className="px-2 py-2 text-xs font-mono font-bold text-gray-600 flex items-center justify-center min-w-[45px]">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))}
                  className="p-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Zoom In"
                >
                  <ZoomIn size={14} /> <span className="hidden sm:inline">Zoom In</span>
                </button>
                <button
                  onClick={() => setAdminLightMode(!adminLightMode)}
                  className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  title={adminLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
                >
                  {adminLightMode ? <Sun size={14} /> : <Moon size={14} />}
                  <span className="hidden sm:inline">{adminLightMode ? "Light" : "Dark"}</span>
                </button>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Fullscreen Preview"
                >
                  <Maximize2 size={14} /> <span className="hidden sm:inline">Fullscreen</span>
                </button>
              </div>
            </div>

            {/* SVG Drawing Area */}
            <div className={`flex-1 min-h-[350px] relative overflow-hidden transition-colors duration-200 ${adminLightMode ? "bg-white border-t border-gray-100" : "bg-slate-950"}`}>
              <div
                className="w-full h-full absolute inset-0 transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
              >
                <BlueprintDrawing type={order.blueprintType} drawingData={order.drawingData} lightMode={adminLightMode} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Fullscreen Modal via React Portal to prevent layout stacking context overlay */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
            <div>
              <h3 className="font-semibold text-base">{order.productName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Fullscreen View • Drawing ID: {order.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAdminLightMode(!adminLightMode)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
                title={adminLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {adminLightMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>{adminLightMode ? "Light" : "Dark"}</span>
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="Close Fullscreen"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-hidden relative flex items-center justify-center p-6 transition-colors duration-200 ${adminLightMode ? "bg-white" : "bg-slate-950"}`}>
            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex gap-2 z-10 bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-2xl backdrop-blur-sm">
              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                className="p-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <ZoomOut size={16} />
              </button>
              <span className="px-3 text-xs font-mono font-bold text-slate-200 flex items-center justify-center min-w-[60px]">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                className="p-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            <div
              className="w-full h-full absolute inset-0 transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
            >
              <BlueprintDrawing type={order.blueprintType} drawingData={order.drawingData} lightMode={adminLightMode} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Print Preview Modal */}
      {isPrintModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-text">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="text-indigo-500" size={18} />
                  <span>Blueprint Spec Sheet & Invoice Preview</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Verify details before downloading your PDF file</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSavePDF}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={14} />
                      <span>Save PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  disabled={isGeneratingPDF}
                  className="p-2 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
              
              {/* Paper Print Box target */}
              <div 
                id="invoice-print-container" 
                className="bg-transparent text-black font-sans text-xs flex flex-col items-center select-text"
              >
                <style>{`
                  .pdf-page-container {
                    width: 210mm;
                    height: 297mm;
                    min-height: 297mm;
                    max-height: 297mm;
                    flex-shrink: 0;
                    padding: 15mm;
                    box-sizing: border-box;
                    background: white;
                    color: black;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    overflow: hidden;
                    border: 1px dashed #cbd5e1;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    margin-bottom: 24px;
                  }
                  .pdf-page-container * {
                    box-sizing: border-box;
                  }
                  .table-custom {
                    width: 100%;
                    border-collapse: collapse;
                  }
                  .table-custom th, .table-custom td {
                    border: 1px solid #000;
                    padding: 6px 8px;
                    text-align: left;
                    font-size: 10px;
                  }
                  .table-custom th {
                    background-color: #f3f4f6;
                    font-weight: bold;
                  }
                  .underline-input {
                    border-bottom: 1.5px solid #000;
                    display: inline-block;
                    min-width: 120px;
                    padding-bottom: 2px;
                    font-weight: bold;
                    text-align: center;
                  }
                `}</style>

                {/* ==================== PAGE 1: COVER SHEET ==================== */}
                <div className="pdf-page-container">
                  {/* Brand Header */}
                  <div className="flex justify-between items-start pb-4 border-b-2 border-black">
                    <div className="flex items-center gap-3">
                      {/* Skyline Facades Logo */}
                      <svg viewBox="0 0 100 100" className="w-16 h-16">
                        <path d="M 50 15 L 25 80 L 40 80 L 50 40 L 60 80 L 75 80 Z" fill="none" stroke="#000" strokeWidth="2.5" />
                        <line x1="50" y1="15" x2="50" y2="85" stroke="#000" strokeWidth="2" />
                        <line x1="32" y1="60" x2="68" y2="60" stroke="#000" strokeWidth="2" />
                      </svg>
                      <div>
                        <h2 className="text-xl font-black tracking-wider text-black leading-none uppercase">Skyline</h2>
                        <h3 className="text-[10px] uppercase tracking-widest text-gray-700 font-extrabold mt-1">Facades</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-md font-black text-black tracking-widest">SF - PANEL ORDER</h1>
                      <h2 className="text-[10px] font-bold text-gray-700 tracking-wider">COVER SHEET</h2>
                    </div>
                  </div>

                  {/* Information Fields Grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 my-6 text-[10px]">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">ORDER #:</span>
                      <span className="underline-input flex-1 ml-4">{order.id.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">DATE:</span>
                      <span className="underline-input flex-1 ml-4">{new Date(order.orderDate || order.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">PROJECT:</span>
                      <span className="underline-input flex-1 ml-4">{order.productName}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">NAME:</span>
                      <span className="underline-input flex-1 ml-4">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">DATE REQ'D:</span>
                      <span className="underline-input flex-1 ml-4">{new Date(new Date(order.orderDate || order.createdAt).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">PHONE:</span>
                      <span className="underline-input flex-1 ml-4">{order.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">SYSTEM:</span>
                      <span className="underline-input flex-1 ml-4">{order.blueprintType === 'custom_drawing' ? 'Cassette' : order.blueprintType}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">PAGES:</span>
                      <span className="underline-input flex-1 ml-4">{2 + standardizedPanels.length} (incl. cover)</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">STATUS:</span>
                      <span className="underline-input flex-1 ml-4 text-indigo-700 uppercase font-black">{order.status}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      {/* Empty column to keep grid balance */}
                    </div>
                  </div>

                  {/* Quantity & Description Table */}
                  <div className="flex-1 my-4">
                    <table className="table-custom">
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>QTY</th>
                          <th>DESCRIPTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standardizedPanels.map((p, i) => {
                          const info = getAnnotationInfo(p.objects);
                          const dims = getPanelDimensions(p.objects);
                          const panelName = (info.id && info.id !== '—') ? info.id : p.name;
                          const descParts = [];
                          if (info.material && info.material !== '—') descParts.push(info.material);
                          if (info.color && info.color !== '—') descParts.push(info.color);
                          descParts.push(`Panel: ${panelName}`);
                          if (dims.width > 0 && dims.height > 0) {
                            descParts.push(`(${dims.width} × ${dims.height} mm)`);
                          }
                          const desc = descParts.join(' ');
                          return (
                            <tr key={p.id || i}>
                              <td className="font-bold text-center">1</td>
                              <td>{desc}</td>
                            </tr>
                          );
                        })}
                        {Array.from({ length: Math.max(1, 10 - standardizedPanels.length) }).map((_, idx) => (
                          <tr key={`empty-${idx}`}>
                            <td className="py-3">&nbsp;</td>
                            <td>&nbsp;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes & Checklist Table */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="font-bold text-[10px] text-gray-700 uppercase tracking-wider mb-2">NOTES & FABRICATION CHECKLIST</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <table className="table-custom">
                        <thead>
                          <tr>
                            <th>ITEM</th>
                            <th style={{ width: '40px', textAlign: 'center' }}>YES</th>
                            <th style={{ width: '40px', textAlign: 'center' }}>NO</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Adheseal PU25</td>
                            <td className="text-center font-bold text-green-600">{hasAdheseal ? '✓' : ''}</td>
                            <td className="text-center font-bold text-red-600">{!hasAdheseal ? '✗' : ''}</td>
                          </tr>
                          <tr>
                            <td>Tremco</td>
                            <td className="text-center font-bold text-green-600">{hasTremco ? '✓' : ''}</td>
                            <td className="text-center font-bold text-red-600">{!hasTremco ? '✗' : ''}</td>
                          </tr>
                          <tr>
                            <td>Stiffeners</td>
                            <td className="text-center font-bold text-green-600">{hasStiffeners ? '✓' : ''}</td>
                            <td className="text-center font-bold text-red-600">{!hasStiffeners ? '✗' : ''}</td>
                          </tr>
                          <tr>
                            <td>Weep Holes</td>
                            <td className="text-center font-bold text-green-600">{hasWeepHoles ? '✓' : ''}</td>
                            <td className="text-center font-bold text-red-600">{!hasWeepHoles ? '✗' : ''}</td>
                          </tr>
                        </tbody>
                      </table>

                      <table className="table-custom">
                        <thead>
                          <tr>
                            <th>ITEM</th>
                            <th style={{ width: '40px', textAlign: 'center' }}>YES</th>
                            <th style={{ width: '40px', textAlign: 'center' }}>NO</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Arrow Direction</td>
                            <td className="text-center font-bold text-green-600">{hasArrowDirection ? '✓' : ''}</td>
                            <td className="text-center font-bold text-red-600">{!hasArrowDirection ? '✗' : ''}</td>
                          </tr>
                          <tr>
                            <td>Tag Layout</td>
                            <td className="text-center font-bold text-green-600">{hasTagLayout ? '✓' : ''}</td>
                            <td className="text-center font-bold text-red-600">{!hasTagLayout ? '✗' : ''}</td>
                          </tr>
                          <tr>
                            <td>Nesting</td>
                            <td className="text-center font-bold text-green-600">{hasNesting ? '✓' : ''}</td>
                            <td className="text-center font-bold text-red-600">{!hasNesting ? '✗' : ''}</td>
                          </tr>
                          <tr>
                            <td>Rivet Centres</td>
                            <td colSpan={2} className="text-center font-bold font-mono">{rivetCentresValue}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cover Footer */}
                  <div className="flex justify-between items-center text-[8px] text-gray-400 border-t border-gray-100 pt-2 mt-4">
                    <span>© {new Date().getFullYear()} Skyline Facades Spec Sheet System</span>
                    <span>Page 1 of {2 + standardizedPanels.length}</span>
                  </div>
                </div>

                {/* ==================== PAGE 2: SUMMARY / NESTING SHEET ==================== */}
                <div className="pdf-page-container">
                  {/* Summary Header */}
                  <div className="flex justify-between items-start pb-4 border-b-2 border-black">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 100 100" className="w-12 h-12">
                        <path d="M 50 15 L 25 80 L 40 80 L 50 40 L 60 80 L 75 80 Z" fill="none" stroke="#000" strokeWidth="2.5" />
                        <line x1="50" y1="15" x2="50" y2="85" stroke="#000" strokeWidth="2" />
                      </svg>
                      <div>
                        <h2 className="text-lg font-black tracking-wider text-black leading-none uppercase">Skyline</h2>
                        <h3 className="text-[9px] uppercase tracking-widest text-gray-600 font-extrabold mt-0.5">Facades</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-sm font-black text-black tracking-wider">SF - DRAWING SHEET</h1>
                      <h2 className="text-[9px] font-bold text-gray-700 tracking-wider">NESTING & PANELS BATCH SUMMARY</h2>
                    </div>
                  </div>

                  {/* Summary Meta Fields */}
                  <div className="grid grid-cols-4 gap-4 my-4 text-[9px] pb-4 border-b border-gray-100">
                    <div>
                      <span className="font-bold text-gray-500 block uppercase">DATE</span>
                      <span className="font-bold text-black">{new Date(order.orderDate || order.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-500 block uppercase">DRAWN BY</span>
                      <span className="font-bold text-black">{order.customerName}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold text-gray-500 block uppercase">JOB / PROJECT</span>
                      <span className="font-bold text-black">{order.productName}</span>
                    </div>
                  </div>

                  {/* Nesting Table */}
                  <div className="flex-1 my-2">
                    <table className="table-custom">
                      <thead>
                        <tr>
                          <th style={{ width: '150px' }}>SHEET SIZE (mm)</th>
                          <th>PANEL ID'S NESTED ON SHEET</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nestingSheetGroups.map(([sheetSize, ids], i) => (
                          <tr key={i}>
                            <td className="font-bold font-mono text-center text-red-700">{sheetSize}</td>
                            <td className="font-mono text-blue-700 font-bold">{ids.join(' & ')}</td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(1, 15 - nestingSheetGroups.length) }).map((_, idx) => (
                          <tr key={`nesting-empty-${idx}`}>
                            <td className="py-2.5">&nbsp;</td>
                            <td>&nbsp;</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  <div className="flex justify-between items-center text-[8px] text-gray-400 border-t border-gray-100 pt-2">
                    <span>© {new Date().getFullYear()} Skyline Facades Spec Sheet System</span>
                    <span>Page 2 of {2 + standardizedPanels.length}</span>
                  </div>
                </div>


                {/* ==================== PAGES 3+: PANEL DETAIL SHEET ==================== */}
                {standardizedPanels.map((panel, idx) => {
                  const info = getAnnotationInfo(panel.objects);
                  const dims = getPanelDimensions(panel.objects);
                  const pageNo = idx + 3;
                  
                  return (
                    <div key={panel.id} className="pdf-page-container">
                      {/* Panel Sheet Header */}
                      <div className="flex justify-between items-start pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 100 100" className="w-10 h-10">
                            <path d="M 50 15 L 25 80 L 40 80 L 50 40 L 60 80 L 75 80 Z" fill="none" stroke="#000" strokeWidth="2.5" />
                            <line x1="50" y1="15" x2="50" y2="85" stroke="#000" strokeWidth="2" />
                          </svg>
                          <div>
                            <h2 className="text-base font-black tracking-wider text-black leading-none uppercase">Skyline</h2>
                            <h3 className="text-[8px] uppercase tracking-widest text-gray-600 font-extrabold mt-0.5">Facades</h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <h1 className="text-xs font-black text-black tracking-wider">SF - PANEL ORDER TEMPLATE (MULTIPLE)</h1>
                          <h2 className="text-[8px] font-bold text-gray-500 tracking-wider">JOB: {order.productName}</h2>
                        </div>
                      </div>

                      {/* SVG Canvas Renderer Box */}
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg my-4 flex items-center justify-center p-6 relative">
                        <div className="w-full h-full max-h-[360px] flex items-center justify-center overflow-hidden">
                          <BlueprintDrawing 
                            type="custom_drawing" 
                            drawingData={[panel]} 
                            lightMode={true} 
                            hideTabs={true}
                          />
                        </div>
                        <span className="absolute top-4 right-4 bg-slate-100 border border-gray-200 text-slate-500 text-[8px] font-bold px-2 py-0.5 rounded">
                          TAB SHEET: {panel.name}
                        </span>
                      </div>

                      {/* Technical Info Grid */}
                      <div className="grid grid-cols-4 gap-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-[9px] font-medium mb-2">
                        <div>
                          <span className="text-gray-500 block uppercase text-[7px] font-extrabold mb-0.5">Panel ID</span>
                          <span className="font-bold text-black font-mono">{info.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block uppercase text-[7px] font-extrabold mb-0.5">Panel Colour</span>
                          <span className="font-bold text-black">{info.color}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block uppercase text-[7px] font-extrabold mb-0.5">B.O.P. / F.O.P.</span>
                          <span className="font-bold text-black">{info.face}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block uppercase text-[7px] font-extrabold mb-0.5">Approx. Dimensions</span>
                          <span className="font-bold text-red-600 font-mono">{dims.width} × {dims.height} mm</span>
                        </div>
                      </div>

                      {/* Panel Footer */}
                      <div className="flex justify-between items-center text-[8px] text-gray-400 border-t border-gray-100 pt-2">
                        <span>© {new Date().getFullYear()} Skyline Facades Spec Sheet System</span>
                        <span>Page {pageNo} of {2 + standardizedPanels.length}</span>
                      </div>
                    </div>
                  );
                })}

              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
