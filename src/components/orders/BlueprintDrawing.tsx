import React, { useMemo } from 'react';

// Helper to compute bounding box of custom CAD drawings to auto-scale/center the preview
const getBoundingBox = (objects: any) => {
  if (!objects || objects.length === 0) return { minX: 0, minY: 0, width: 400, height: 300 };

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  objects.forEach((obj: any) => {
    const ox = obj.x || 0;
    const oy = obj.y || 0;

    if (obj.type === "annotation") {
      const sp = obj.startPoint || { x: ox, y: oy };
      const tp = obj.textPos || { x: ox + 60, y: oy - 30 };
      const ep = obj.elbowPoint;

      const pointsToCheck = [sp, tp];
      if (ep) pointsToCheck.push(ep);

      // Estimate text bounds to make sure they are in view
      const estWidth = Math.max(30, (obj.text || "").length * (obj.fontSize || 14) * 0.55);
      const estHeight = Math.max(20, (obj.fontSize || 14) * 1.2);
      pointsToCheck.push(
        { x: tp.x + estWidth, y: tp.y },
        { x: tp.x, y: tp.y + estHeight },
        { x: tp.x + estWidth, y: tp.y + estHeight }
      );

      pointsToCheck.forEach((pt: any) => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      });
    } else if (obj.points && Array.isArray(obj.points) && obj.points.length > 0) {
      if (obj.points.length === 4) {
        const dx = obj.points[2] - obj.points[0];
        const dy = obj.points[3] - obj.points[1];
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          return;
        }
      }
      for (let i = 0; i < obj.points.length; i += 2) {
        const px = obj.points[i] + ox;
        const py = obj.points[i + 1] + oy;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    } else {
      if (obj.width != null && obj.height != null) {
        if (obj.width === 0 && obj.height === 0) {
          return;
        }
        const x1 = Math.min(ox, ox + obj.width);
        const x2 = Math.max(ox, ox + obj.width);
        const y1 = Math.min(oy, oy + obj.height);
        const y2 = Math.max(oy, oy + obj.height);
        if (x1 < minX) minX = x1;
        if (x2 > maxX) maxX = x2;
        if (y1 < minY) minY = y1;
        if (y2 > maxY) maxY = y2;
      } else if (obj.radius != null) {
        const r = obj.radius;
        if (ox - r < minX) minX = ox - r;
        if (ox + r > maxX) maxX = ox + r;
        if (oy - r < minY) minY = oy - r;
        if (oy + r > maxY) maxY = oy + r;
      } else {
        if (ox < minX) minX = ox;
        if (ox > maxX) maxX = ox;
        if (oy < minY) minY = oy;
        if (oy > maxY) maxY = oy;
      }
    }
  });

  if (minX === Infinity || minY === Infinity) {
    return { minX: 0, minY: 0, width: 400, height: 300 };
  }

  const padding = 55; // Increased padding to prevent right-aligned labels from cutting off
  const width = Math.max(50, (maxX - minX) + padding * 2);
  const height = Math.max(50, (maxY - minY) + padding * 2);

  return {
    minX: minX - padding,
    minY: minY - padding,
    width,
    height
  };
};

const getDistance = (p1: any, p2: any) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
const formatMeasurement = (value: any) => Number(value || 0).toFixed(1);

const isStraight = (pts: number[]) => {
  if (!pts || pts.length < 4) return false;
  const firstX = pts[0];
  const firstY = pts[1];
  let allXSame = true;
  let allYSame = true;
  for (let i = 2; i < pts.length; i += 2) {
    if (Math.abs(pts[i] - firstX) > 0.1) allXSame = false;
    if (Math.abs(pts[i + 1] - firstY) > 0.1) allYSame = false;
  }
  return allXSame || allYSame;
};

// Custom Drawing SVG Renderer for displaying user CAD drawings
function CustomDrawingRenderer({ objects, lightMode }: { objects: any[]; lightMode: boolean }) {
  const bbox = useMemo(() => getBoundingBox(objects), [objects]);
  const labelColor = lightMode ? "#1d4ed8" : "#4a90e2";

  return (
    <svg
      viewBox={`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`}
      className={`w-full h-full ${lightMode ? 'text-slate-800 bg-white border border-gray-100' : 'text-indigo-900 bg-[#0f172a]'}`}
    >
      <defs>
        <pattern id="grid-custom-shared" width="25" height="25" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={lightMode ? "#cbd5e1" : "#333f50"} />
        </pattern>
      </defs>
      <rect
        x={bbox.minX}
        y={bbox.minY}
        width={bbox.width}
        height={bbox.height}
        fill="url(#grid-custom-shared)"
      />

      {objects.map((obj: any, idx: number) => {
        let stroke = obj.stroke || (lightMode ? "#0f172a" : "#ffffff");
        const strokeLower = stroke.toLowerCase();

        if (lightMode) {
          // Light mode: Keep original colors unless it's white (which would be invisible on white PDF background)
          if (strokeLower === "#ffffff" || strokeLower === "#fff") {
            stroke = "#0f172a";
          }
        } else {
          // Dark mode: keep original color. If the stroke is empty or dark, default to white.
          if (strokeLower === "#000000" || strokeLower === "#000" || strokeLower === "#0f172a") {
            stroke = "#ffffff";
          }
        }
        const strokeWidth = obj.strokeWidth || 2;
        const ox = obj.x || 0;
        const oy = obj.y || 0;
        const rotation = obj.rotation || 0;

        let shapeElement = null;

        switch (obj.type) {
          case "line":
            if (obj.points && obj.points.length >= 4) {
              shapeElement = (
                <line
                  x1={obj.points[0]}
                  y1={obj.points[1]}
                  x2={obj.points[2]}
                  y2={obj.points[3]}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              );
            }
            break;

          case "wall":
            if (obj.points && obj.points.length >= 4) {
              const [x1, y1, x2, y2] = obj.points;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len > 0) {
                const nx = -dy / len;
                const ny = dx / len;
                const offset = 6;
                const edgeStroke = isStraight(obj.points)
                  ? "#22c55e"
                  : (strokeLower === "#ffffff" || strokeLower === "#fff" || strokeLower === "#9ca3af"
                      ? (lightMode ? "#475569" : "#d1d5db")
                      : stroke);
                shapeElement = (
                  <g>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      opacity={lightMode ? 0.15 : 0.3}
                      strokeLinecap="round"
                    />
                    <line
                      x1={x1 + nx * offset}
                      y1={y1 + ny * offset}
                      x2={x2 + nx * offset}
                      y2={y2 + ny * offset}
                      stroke={edgeStroke}
                      strokeWidth={1.5}
                    />
                    <line
                      x1={x1 - nx * offset}
                      y1={y1 - ny * offset}
                      x2={x2 - nx * offset}
                      y2={y2 - ny * offset}
                      stroke={edgeStroke}
                      strokeWidth={1.5}
                    />
                  </g>
                );
              }
            }
            break;

          case "beam":
            if (obj.points && obj.points.length >= 4) {
              shapeElement = (
                <line
                  x1={obj.points[0]}
                  y1={obj.points[1]}
                  x2={obj.points[2]}
                  y2={obj.points[3]}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="square"
                  strokeDasharray="12,6"
                />
              );
            }
            break;

          case "lintel":
            if (obj.points && obj.points.length >= 4) {
              const [x1, y1, x2, y2] = obj.points;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len > 0) {
                const nx = -dy / len;
                const ny = dx / len;
                const capLen = 5;
                shapeElement = (
                  <g>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeLinecap="square"
                    />
                    <line
                      x1={x1 + nx * capLen}
                      y1={y1 + ny * capLen}
                      x2={x1 - nx * capLen}
                      y2={y1 - ny * capLen}
                      stroke={stroke}
                      strokeWidth={3}
                    />
                    <line
                      x1={x2 + nx * capLen}
                      y1={y2 + ny * capLen}
                      x2={x2 - nx * capLen}
                      y2={y2 - ny * capLen}
                      stroke={stroke}
                      strokeWidth={3}
                    />
                  </g>
                );
              }
            }
            break;

          case "polyline":
          case "free_draw":
            if (obj.points && obj.points.length >= 2) {
              const pointsStr = obj.points
                .reduce((acc: string, val: number, i: number) => {
                  const coord = val;
                  return acc + (i === 0 ? "" : i % 2 === 0 ? " " : ",") + coord;
                }, "");
              shapeElement = (
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            break;

          case "rectangle":
            if (obj.width != null && obj.height != null) {
              if (obj.height === 0) {
                shapeElement = (
                  <line
                    x1={0}
                    y1={0}
                    x2={obj.width}
                    y2={0}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                );
              } else if (obj.width === 0) {
                shapeElement = (
                  <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={obj.height}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                );
              } else {
                shapeElement = (
                  <rect
                    x={Math.min(0, obj.width)}
                    y={Math.min(0, obj.height)}
                    width={Math.abs(obj.width)}
                    height={Math.abs(obj.height)}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                  />
                );
              }
            }
            break;

          case "circle":
            if (obj.radius != null) {
              shapeElement = (
                <circle
                  cx={0}
                  cy={0}
                  r={obj.radius}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            }
            break;

          case "arc":
            if (obj.radius != null && obj.endAngle != null) {
              const radius = obj.radius;
              const startAngleRad = 0;
              const endAngleRad = (obj.endAngle) * Math.PI / 180;

              const startX = radius * Math.cos(startAngleRad);
              const startY = radius * Math.sin(startAngleRad);
              const endX = radius * Math.cos(endAngleRad);
              const endY = radius * Math.sin(endAngleRad);

              const largeArcFlag = obj.endAngle > 180 ? 1 : 0;
              const sweepFlag = 1;

              const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
              shapeElement = (
                <path
                  d={pathData}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
              );
            }
            break;

          case "annotation": {
            const startPoint = obj.startPoint || { x: ox, y: oy };
            const textPos = obj.textPos || { x: ox + 60, y: oy - 30 };
            const elbowPoint = obj.elbowPoint;

            const estWidth = Math.max(30, (obj.text || "").length * (obj.fontSize || 14) * 0.55);
            const estHeight = Math.max(20, (obj.fontSize || 14) * 1.2);
            const textCenter = {
              x: textPos.x + estWidth / 2,
              y: textPos.y + estHeight / 2,
            };

            const approachPoint = elbowPoint || startPoint;

            let textAnchor = { x: textPos.x, y: textPos.y + estHeight / 2 };
            if (approachPoint.x > textPos.x + estWidth) {
              textAnchor = { x: textPos.x + estWidth, y: textPos.y + estHeight / 2 };
            } else if (approachPoint.x < textPos.x) {
              textAnchor = { x: textPos.x, y: textPos.y + estHeight / 2 };
            } else {
              textAnchor = {
                x: textPos.x + estWidth / 2,
                y: approachPoint.y > textCenter.y ? textPos.y + estHeight : textPos.y
              };
            }

            const linePoints = [startPoint.x, startPoint.y];
            if (elbowPoint) {
              linePoints.push(elbowPoint.x, elbowPoint.y);
            }
            linePoints.push(textAnchor.x, textAnchor.y);
            const linePointsStr = linePoints.map(p => p.toFixed(1)).join(' ');

            let strokeDasharray = undefined;
            if (obj.leaderStyle === "dashed") {
              strokeDasharray = "8,4";
            } else if (obj.leaderStyle === "dotted") {
              strokeDasharray = "2,4";
            }

            let resolvedStroke = stroke;
            const colorLower = (obj.leaderColor || obj.fontColor || "").toLowerCase();
            if (lightMode) {
              if (colorLower === "#ffffff" || colorLower === "#fff") {
                resolvedStroke = "#0f172a";
              } else if (obj.leaderColor || obj.fontColor) {
                resolvedStroke = obj.leaderColor || obj.fontColor;
              } else {
                resolvedStroke = stroke; // Fallback to mapped main stroke color
              }
            } else {
              if (colorLower === "#000000" || colorLower === "#000" || colorLower === "#0f172a") {
                resolvedStroke = "#ffffff";
              } else if (obj.leaderColor || obj.fontColor) {
                resolvedStroke = obj.leaderColor || obj.fontColor;
              } else {
                resolvedStroke = stroke; // Fallback to mapped main stroke color
              }
            }

            const lWidth = obj.leaderWidth || 1.5;

            const arrowType = obj.arrowType || "dot";
            const arrowSize = obj.arrowSize || 10;
            let arrowheadElement = null;

            if (arrowType === "dot") {
              arrowheadElement = (
                <circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r={arrowSize / 2}
                  fill={resolvedStroke}
                  stroke={resolvedStroke}
                  strokeWidth={1}
                />
              );
            } else if (arrowType === "open" || arrowType === "filled") {
              const angle = Math.atan2(startPoint.y - approachPoint.y, startPoint.x - approachPoint.x);
              const wingAngle = Math.PI / 6;
              const leftWing = {
                x: startPoint.x - arrowSize * Math.cos(angle - wingAngle),
                y: startPoint.y - arrowSize * Math.sin(angle - wingAngle),
              };
              const rightWing = {
                x: startPoint.x - arrowSize * Math.cos(angle + wingAngle),
                y: startPoint.y - arrowSize * Math.sin(angle + wingAngle),
              };

              if (arrowType === "open") {
                arrowheadElement = (
                  <polyline
                    points={`${leftWing.x.toFixed(1)},${leftWing.y.toFixed(1)} ${startPoint.x.toFixed(1)},${startPoint.y.toFixed(1)} ${rightWing.x.toFixed(1)},${rightWing.y.toFixed(1)}`}
                    fill="none"
                    stroke={resolvedStroke}
                    strokeWidth={lWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              } else {
                arrowheadElement = (
                  <polygon
                    points={`${startPoint.x.toFixed(1)},${startPoint.y.toFixed(1)} ${leftWing.x.toFixed(1)},${leftWing.y.toFixed(1)} ${rightWing.x.toFixed(1)},${rightWing.y.toFixed(1)}`}
                    fill={resolvedStroke}
                    stroke={resolvedStroke}
                    strokeWidth={1}
                  />
                );
              }
            }

            let fStyle = "normal";
            let fWeight = "normal";
            if (obj.bold && obj.italic) {
              fStyle = "italic";
              fWeight = "bold";
            } else if (obj.bold) {
              fWeight = "bold";
            } else if (obj.italic) {
              fStyle = "italic";
            }
            const textDecoration = obj.underline ? "underline" : "none";
            const textRotation = obj.rotation || 0;

            let textX = 0;
            if (obj.align === "center") {
              textX = estWidth / 2;
            } else if (obj.align === "right") {
              textX = estWidth;
            }

            shapeElement = (
              <g>
                <polyline
                  points={linePointsStr}
                  fill="none"
                  stroke={resolvedStroke}
                  strokeWidth={lWidth}
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {arrowheadElement}
                <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${textRotation})`}>
                  <text
                    x={textX}
                    y={obj.fontSize || 14}
                    fill={resolvedStroke}
                    fontSize={obj.fontSize || 14}
                    fontFamily={obj.fontFamily || "sans-serif"}
                    fontStyle={fStyle}
                    fontWeight={fWeight}
                    textDecoration={textDecoration}
                    textAnchor={obj.align === "center" ? "middle" : obj.align === "right" ? "end" : "start"}
                  >
                    {obj.text || "Enter Text..."}
                  </text>
                </g>
              </g>
            );
            break;
          }

          default:
            break;
        }

        if ((obj.type === "line" || obj.type === "wall" || obj.type === "beam" || obj.type === "lintel") && obj.points && obj.points.length === 4) {
          const pt1 = { x: obj.points[0], y: obj.points[1] };
          const pt2 = { x: obj.points[2], y: obj.points[3] };
          const dist = getDistance(pt1, pt2);
          shapeElement = (
            <g>
              {shapeElement}
              <text
                x={(pt1.x + pt2.x) / 2 + 10}
                y={(pt1.y + pt2.y) / 2 - 10}
                fill={labelColor}
                fontSize={10}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {formatMeasurement(dist)} mm
              </text>
            </g>
          );
        } else if (obj.type === "rectangle" && obj.width != null && obj.height != null) {
          const rw = Math.abs(obj.width);
          const rh = Math.abs(obj.height);
          const rx = Math.min(0, obj.width);
          const ry = Math.min(0, obj.height);
          shapeElement = (
            <g>
              {shapeElement}
              {rw > 0 && (
                <text
                  x={rx + rw / 2}
                  y={ry - 8}
                  fill={labelColor}
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {formatMeasurement(rw)} mm
                </text>
              )}
              {rh > 0 && (
                <text
                  x={rx + rw + 8}
                  y={ry + rh / 2}
                  fill={labelColor}
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight="bold"
                  alignmentBaseline="middle"
                >
                  {formatMeasurement(rh)} mm
                </text>
              )}
            </g>
          );
        } else if (obj.type === "circle" && obj.radius != null) {
          shapeElement = (
            <g>
              {shapeElement}
              <text
                x={obj.radius + 8}
                y={0}
                fill={labelColor}
                fontSize={10}
                fontFamily="monospace"
                fontWeight="bold"
                alignmentBaseline="middle"
              >
                R {formatMeasurement(obj.radius)} mm
              </text>
            </g>
          );
        }

        return (
          <g key={idx} transform={`translate(${ox}, ${oy}) rotate(${rotation})`}>
            {shapeElement}
          </g>
        );
      })}
    </svg>
  );
}

// Blueprint SVG Drawer to render real vector floorplans interactively
export default function BlueprintDrawing({ type, drawingData, lightMode = false, hideTabs = false }: { type?: string; drawingData?: any[]; lightMode?: boolean; hideTabs?: boolean }) {
  const isMultiPanel = Array.isArray(drawingData) &&
    drawingData.length > 0 &&
    drawingData[0] !== null &&
    typeof drawingData[0] === 'object' &&
    'objects' in drawingData[0] &&
    'name' in drawingData[0];

  const [activeTabId, setActiveTabId] = React.useState<string>("");

  React.useEffect(() => {
    if (isMultiPanel && drawingData) {
      setActiveTabId((drawingData[0] as any).id);
    }
  }, [drawingData, isMultiPanel]);

  if (drawingData && Array.isArray(drawingData) && drawingData.length > 0) {
    if (isMultiPanel) {
      const activePanel = (drawingData as any[]).find((p) => p.id === activeTabId) || drawingData[0];
      if (hideTabs || (drawingData as any[]).length === 1) {
        return <CustomDrawingRenderer objects={activePanel.objects} lightMode={lightMode} />;
      }
      return (
        <div className={`flex flex-col h-full w-full rounded-lg border ${lightMode ? 'border-gray-200 bg-white' : 'border-slate-800 bg-[#0f172a]'}`}>
          <div className={`flex items-center gap-1 border-b p-1.5 overflow-x-auto shrink-0 select-none scrollbar-none rounded-t-lg ${lightMode ? 'bg-gray-50 border-gray-200' : 'bg-slate-900 border-slate-700/50'}`}>
            {(drawingData as any[]).map((panel) => {
              const isActive = panel.id === activeTabId;
              return (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setActiveTabId(panel.id)}
                  className={`
                    px-3 py-1 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap
                    ${isActive
                      ? "bg-blue-600 text-white shadow-sm font-semibold"
                      : (lightMode ? "text-gray-600 hover:bg-gray-200 hover:text-gray-800" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200")
                    }
                  `}
                >
                  {panel.name}
                </button>
              );
            })}
          </div>
          <div className="flex-1 relative min-h-[300px] w-full">
            <CustomDrawingRenderer objects={activePanel.objects} lightMode={lightMode} />
          </div>
        </div>
      );
    }

    return <CustomDrawingRenderer objects={drawingData} lightMode={lightMode} />;
  }

  switch (type) {
    case 'house_2bhk':
      return (
        <svg viewBox="0 0 400 300" className={`w-full h-full ${lightMode ? 'text-slate-800 bg-white border border-gray-100' : 'text-indigo-900 bg-slate-900'}`}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={lightMode ? "#f1f5f9" : "#1e293b"} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#grid)" />
          <rect x="40" y="30" width="320" height="240" fill="none" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="4" />
          <line x1="200" y1="30" x2="200" y2="270" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <line x1="40" y1="150" x2="200" y2="150" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <line x1="200" y1="120" x2="360" y2="120" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />

          <text x="120" y="90" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">BEDROOM 1</text>
          <text x="120" y="210" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">LIVING ROOM</text>
          <text x="280" y="75" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">BEDROOM 2</text>
          <text x="280" y="195" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">KITCHEN</text>

          <path d="M 200 90 A 30 30 0 0 1 170 120" fill="none" stroke={lightMode ? "#e11d48" : "#f43f5e"} strokeWidth="2" />
          <line x1="200" y1="90" x2="200" y2="120" stroke={lightMode ? "#e11d48" : "#f43f5e"} strokeWidth="2" />
          <path d="M 200 210 A 30 30 0 0 0 230 240" fill="none" stroke={lightMode ? "#e11d48" : "#f43f5e"} strokeWidth="2" />
          <line x1="200" y1="210" x2="200" y2="240" stroke={lightMode ? "#e11d48" : "#f43f5e"} strokeWidth="2" />

          <line x1="40" y1="15" x2="360" y2="15" stroke={lightMode ? "#64748b" : "#475569"} strokeWidth="1" strokeDasharray="4" />
          <text x="200" y="12" fill={lightMode ? "#475569" : "#94a3b8"} fontSize="10" fontFamily="monospace" textAnchor="middle">16.00 m</text>
          <line x1="20" y1="30" x2="20" y2="270" stroke={lightMode ? "#64748b" : "#475569"} strokeWidth="1" strokeDasharray="4" />
          <text x="12" y="150" fill={lightMode ? "#475569" : "#94a3b8"} fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 12 150)">12.00 m</text>
        </svg>
      );
    case 'office':
      return (
        <svg viewBox="0 0 400 300" className={`w-full h-full ${lightMode ? 'text-slate-800 bg-white border border-gray-100' : 'text-indigo-900 bg-slate-900'}`}>
          <defs>
            <pattern id="grid-office" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={lightMode ? "#f1f5f9" : "#1e293b"} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#grid-office)" />
          <rect x="30" y="30" width="340" height="240" fill="none" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="4" />

          <rect x="30" y="30" width="120" height="100" fill="none" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <rect x="30" y="170" width="120" height="100" fill="none" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <rect x="250" y="30" width="120" height="240" fill="none" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />

          <line x1="170" y1="100" x2="210" y2="100" stroke="#475569" strokeWidth="2" />
          <line x1="170" y1="150" x2="210" y2="150" stroke="#475569" strokeWidth="2" />
          <line x1="170" y1="200" x2="210" y2="200" stroke="#475569" strokeWidth="2" />
          <line x1="190" y1="100" x2="190" y2="200" stroke="#475569" strokeWidth="2" />

          <text x="90" y="80" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">CONFERENCE</text>
          <text x="90" y="220" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MANAGER</text>
          <text x="310" y="150" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">OPEN OFFICE</text>
          <text x="190" y="70" fill={lightMode ? "#7c3aed" : "#a78bfa"} fontSize="10" fontFamily="monospace" textAnchor="middle">CUBICLES</text>

          <rect x="185" y="45" width="10" height="10" fill={lightMode ? "#0284c7" : "#38bdf8"} />
          <rect x="185" y="245" width="10" height="10" fill={lightMode ? "#0284c7" : "#38bdf8"} />
        </svg>
      );
    case 'warehouse':
      return (
        <svg viewBox="0 0 400 300" className={`w-full h-full ${lightMode ? 'text-slate-800 bg-white border border-gray-200' : 'text-indigo-900 bg-slate-900'}`}>
          <rect width="400" height="300" fill={lightMode ? "#f8fafc" : "#0f172a"} />
          <rect x="20" y="20" width="360" height="260" fill="none" stroke={lightMode ? "#64748b" : "#475569"} strokeWidth="3" strokeDasharray="8 4" />
          <rect x="30" y="30" width="340" height="240" fill="none" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="4" />

          <rect x="60" y="60" width="40" height="180" fill="none" stroke={lightMode ? "#475569" : "#64748b"} strokeWidth="2" />
          <rect x="140" y="60" width="40" height="180" fill="none" stroke={lightMode ? "#475569" : "#64748b"} strokeWidth="2" />
          <rect x="220" y="60" width="40" height="180" fill="none" stroke={lightMode ? "#475569" : "#64748b"} strokeWidth="2" />

          <rect x="300" y="200" width="70" height="70" fill="none" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <text x="335" y="240" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">OFFICE</text>

          <text x="80" y="150" fill={lightMode ? "#475569" : "#475569"} fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 80 150)">AISLE A</text>
          <text x="160" y="150" fill={lightMode ? "#475569" : "#475569"} fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 160 150)">AISLE B</text>
          <text x="240" y="150" fill={lightMode ? "#475569" : "#475569"} fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 240 150)">AISLE C</text>
          <text x="180" y="28" fill={lightMode ? "#059669" : "#10b981"} fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">LOADING DOCK</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 400 300" className={`w-full h-full ${lightMode ? 'text-slate-800 bg-white border border-gray-200' : 'text-indigo-900 bg-slate-900'}`}>
          <defs>
            <pattern id="grid-default" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={lightMode ? "#f1f5f9" : "#1e293b"} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#grid-default)" />
          <rect x="50" y="40" width="300" height="220" fill="none" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="4" />
          <line x1="50" y1="150" x2="350" y2="150" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <line x1="200" y1="40" x2="200" y2="260" stroke={lightMode ? "#334155" : "#94a3b8"} strokeWidth="3" />
          <circle cx="200" cy="150" r="30" fill="none" stroke={lightMode ? "#0284c7" : "#38bdf8"} strokeWidth="2" strokeDasharray="5 3" />

          <text x="125" y="100" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ZONE A</text>
          <text x="275" y="100" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ZONE B</text>
          <text x="125" y="210" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ZONE C</text>
          <text x="275" y="210" fill={lightMode ? "#0284c7" : "#38bdf8"} fontSize="14" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ZONE D</text>
        </svg>
      );
  }
}
