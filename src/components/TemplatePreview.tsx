import React from 'react';

// Normalize nested objects or multi-panel structure into a flat array of CAD objects (shows first panel for multi-panel templates)
const normalizeObjects = (input: any): any[] => {
  if (!input) return [];

  // Check if input is an array of panels
  if (Array.isArray(input) && input.length > 0) {
    const isMultiPanel = input[0] !== null && typeof input[0] === 'object' && 'objects' in input[0];
    if (isMultiPanel) {
      // Find the first panel that has objects, or fallback to the first panel's objects
      const firstPanelWithDesign = input.find((panel: any) => Array.isArray(panel?.objects) && panel.objects.length > 0) || input[0];
      return Array.isArray(firstPanelWithDesign?.objects) ? firstPanelWithDesign.objects : [];
    }

    // Flat array of CAD objects
    return input.filter((item: any) => item && typeof item === 'object' && (item.type || item.points || item.x !== undefined || item.y !== undefined));
  }

  if (typeof input === 'object' && 'objects' in input && Array.isArray(input.objects)) {
    return input.objects;
  }

  return [];
};

// Bounding box calculator
const calculateBounds = (objects: any[]) => {
  if (!objects || objects.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  objects.forEach((obj: any) => {
    const ox = obj.x || 0;
    const oy = obj.y || 0;
    let ox1 = ox;
    let oy1 = oy;
    let ox2 = ox;
    let oy2 = oy;
    
    if (obj.type === 'rectangle') {
      ox2 = ox + (obj.width || 0);
      oy2 = oy + (obj.height || 0);
    } else if (obj.type === 'circle' || obj.type === 'arc') {
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
    } else if (obj.type === 'annotation') {
      const sp = obj.startPoint || { x: ox, y: oy };
      const tp = obj.textPos || { x: ox + 60, y: oy - 30 };
      const ep = obj.elbowPoint;
      const pts = [sp, tp];
      if (ep) pts.push(ep);
      ox1 = Math.min(...pts.map(p => p.x));
      ox2 = Math.max(...pts.map(p => p.x));
      oy1 = Math.min(...pts.map(p => p.y));
      oy2 = Math.max(...pts.map(p => p.y));
    }
    
    minX = Math.min(minX, ox1, ox2);
    minY = Math.min(minY, oy1, oy2);
    maxX = Math.max(maxX, ox1, ox2);
    maxY = Math.max(maxY, oy1, oy2);
  });
  
  if (minX === Infinity || isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

// Convert Konva Arc parameters to SVG Path 'd' attribute
const describeArc = (x: number, y: number, radius: number, rotation: number = 0, angle: number = 360) => {
  if (angle >= 360) {
    return `M ${x - radius} ${y} A ${radius} ${radius} 0 1 0 ${x + radius} ${y} A ${radius} ${radius} 0 1 0 ${x - radius} ${y}`;
  }
  
  const startAngleRad = (rotation * Math.PI) / 180;
  const endAngleRad = ((rotation + angle) * Math.PI) / 180;
  
  const x1 = x + radius * Math.cos(startAngleRad);
  const y1 = y + radius * Math.sin(startAngleRad);
  const x2 = x + radius * Math.cos(endAngleRad);
  const y2 = y + radius * Math.sin(endAngleRad);
  
  const largeArcFlag = angle <= 180 ? '0' : '1';
  
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
};

export default function TemplatePreview({ objects, className = '', strokeColor = 'currentColor' }: { objects: any; className?: string; strokeColor?: string }) {
  const flatObjects = normalizeObjects(objects);
  const bounds = calculateBounds(flatObjects);

  if (!bounds) {
    return (
      <div className={`flex items-center justify-center bg-gray-900/10 dark:bg-white/5 rounded text-gray-400 ${className}`}>
        <span className="text-[10px]">No design</span>
      </div>
    );
  }

  const boundsWidth = Math.max(bounds.width, 20);
  const boundsHeight = Math.max(bounds.height, 20);
  const paddingX = boundsWidth * 0.1 || 10;
  const paddingY = boundsHeight * 0.1 || 10;
  const viewBox = `${bounds.x - paddingX} ${bounds.y - paddingY} ${boundsWidth + paddingX * 2} ${boundsHeight + paddingY * 2}`;

  return (
    <svg 
      viewBox={viewBox} 
      className={`w-full h-full ${className}`}
      style={{ overflow: 'visible' }}
    >
      {flatObjects.map((obj: any) => {
        const color = obj.stroke || strokeColor;
        const strokeWidth = 1.5;
        const ox = obj.x || 0;
        const oy = obj.y || 0;

        switch (obj.type) {
          case 'line':
          case 'polyline':
          case 'free_draw': {
            if (!obj.points || obj.points.length < 2) return null;
            const pointsStr = obj.points
              .reduce((acc: string, current: number, idx: number) => {
                if (idx % 2 === 0) {
                  return `${acc} ${current + ox}`;
                } else {
                  return `${acc},${current + oy}`;
                }
              }, '')
              .trim();
            return (
              <polyline
                key={obj.id}
                points={pointsStr}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          case 'rectangle':
            return (
              <rect
                key={obj.id}
                x={ox}
                y={oy}
                width={obj.width}
                height={obj.height}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
                transform={`rotate(${obj.rotation || 0} ${ox} ${oy})`}
              />
            );

          case 'circle':
            return (
              <circle
                key={obj.id}
                cx={ox}
                cy={oy}
                r={obj.radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            );

          case 'arc': {
            const d = describeArc(ox, oy, obj.radius, obj.rotation, obj.endAngle);
            return (
              <path
                key={obj.id}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            );
          }

          case 'wall': {
            if (!obj.points || obj.points.length < 4) return null;
            const [x1, y1, x2, y2] = obj.points;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
              const nx = -dy / len;
              const ny = dx / len;
              const offset = 6;
              const wx1 = x1 + ox;
              const wy1 = y1 + oy;
              const wx2 = x2 + ox;
              const wy2 = y2 + oy;

              return (
                <g key={obj.id}>
                  {/* Center guideline */}
                  <line 
                    x1={wx1} y1={wy1} x2={wx2} y2={wy2} 
                    stroke={color} strokeWidth={strokeWidth} opacity={0.3}
                    vectorEffect="non-scaling-stroke" 
                  />
                  {/* Left wall edge */}
                  <line 
                    x1={wx1 + nx * offset} y1={wy1 + ny * offset} 
                    x2={wx2 + nx * offset} y2={wy2 + ny * offset} 
                    stroke={color} strokeWidth={strokeWidth} 
                    vectorEffect="non-scaling-stroke" 
                  />
                  {/* Right wall edge */}
                  <line 
                    x1={wx1 - nx * offset} y1={wy1 - ny * offset} 
                    x2={wx2 - nx * offset} y2={wy2 - ny * offset} 
                    stroke={color} strokeWidth={strokeWidth} 
                    vectorEffect="non-scaling-stroke" 
                  />
                </g>
              );
            }
            return null;
          }

          case 'beam': {
            if (!obj.points || obj.points.length < 4) return null;
            const [x1, y1, x2, y2] = obj.points;
            return (
              <line
                key={obj.id}
                x1={x1 + ox}
                y1={y1 + oy}
                x2={x2 + ox}
                y2={y2 + oy}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            );
          }

          case 'lintel': {
            if (!obj.points || obj.points.length < 4) return null;
            const [x1, y1, x2, y2] = obj.points;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
              const nx = -dy / len;
              const ny = dx / len;
              const capLen = 5;
              const lx1 = x1 + ox;
              const ly1 = y1 + oy;
              const lx2 = x2 + ox;
              const ly2 = y2 + oy;

              return (
                <g key={obj.id}>
                  <line 
                    x1={lx1} y1={ly1} x2={lx2} y2={ly2} 
                    stroke={color} strokeWidth={strokeWidth} 
                    vectorEffect="non-scaling-stroke" 
                  />
                  <line 
                    x1={lx1 + nx * capLen} y1={ly1 + ny * capLen} 
                    x2={lx1 - nx * capLen} y2={ly1 - ny * capLen} 
                    stroke={color} strokeWidth={strokeWidth + 1} 
                    vectorEffect="non-scaling-stroke" 
                  />
                  <line 
                    x1={lx2 + nx * capLen} y1={ly2 + ny * capLen} 
                    x2={lx2 - nx * capLen} y2={ly2 - ny * capLen} 
                    stroke={color} strokeWidth={strokeWidth + 1} 
                    vectorEffect="non-scaling-stroke" 
                  />
                </g>
              );
            }
            return null;
          }

          case 'annotation': {
            const startPoint = obj.startPoint || { x: ox, y: oy };
            const textPos = obj.textPos || { x: ox + 60, y: oy - 30 };
            const elbowPoint = obj.elbowPoint;
            const pts = [startPoint];
            if (elbowPoint) pts.push(elbowPoint);
            pts.push(textPos);
            const linePointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');

            return (
              <polyline
                key={obj.id}
                points={linePointsStr}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
                strokeDasharray={obj.leaderStyle === 'dashed' ? '3 3' : undefined}
              />
            );
          }

          default:
            return null;
        }
      })}
    </svg>
  );
}

