import React from 'react';

// Bounding box calculator
const calculateBounds = (objects: any) => {
  if (!objects || objects.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  objects.forEach((obj: any) => {
    let ox1 = obj.x;
    let oy1 = obj.y;
    let ox2 = obj.x;
    let oy2 = obj.y;
    
    if (obj.type === 'rectangle') {
      ox2 = obj.x + (obj.width || 0);
      oy2 = obj.y + (obj.height || 0);
    } else if (obj.type === 'circle' || obj.type === 'arc') {
      ox1 = obj.x - (obj.radius || 0);
      ox2 = obj.x + (obj.radius || 0);
      oy1 = obj.y - (obj.radius || 0);
      oy2 = obj.y + (obj.radius || 0);
    } else if (obj.points && obj.points.length > 0) {
      const px = obj.points.filter((_: any, i: number) => i % 2 === 0);
      const py = obj.points.filter((_: any, i: number) => i % 2 !== 0);
      ox1 = Math.min(...px) + obj.x;
      ox2 = Math.max(...px) + obj.x;
      oy1 = Math.min(...py) + obj.y;
      oy2 = Math.max(...py) + obj.y;
    }
    
    minX = Math.min(minX, ox1, ox2);
    minY = Math.min(minY, oy1, oy2);
    maxX = Math.max(maxX, ox1, ox2);
    maxY = Math.max(maxY, oy1, oy2);
  });
  
  if (minX === Infinity) return null;
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
  const bounds = calculateBounds(objects);

  if (!bounds || bounds.width === 0 || bounds.height === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-900/10 dark:bg-white/5 rounded text-gray-400 ${className}`}>
        <span className="text-[10px]">No design</span>
      </div>
    );
  }

  // Add 10% padding to prevent clipping at edges
  const paddingX = bounds.width * 0.1 || 10;
  const paddingY = bounds.height * 0.1 || 10;
  const viewBox = `${bounds.x - paddingX} ${bounds.y - paddingY} ${bounds.width + paddingX * 2} ${bounds.height + paddingY * 2}`;

  return (
    <svg 
      viewBox={viewBox} 
      className={`w-full h-full ${className}`}
      style={{ overflow: 'visible' }}
    >
      {objects.map((obj: any) => {
        const color = obj.stroke || strokeColor;
        const strokeWidth = 1.5;

        switch (obj.type) {
          case 'line':
          case 'polyline':
          case 'free_draw': {
            if (!obj.points || obj.points.length < 2) return null;
            const pointsStr = obj.points
              .reduce((acc: string, current: number, idx: number) => {
                if (idx % 2 === 0) {
                  return `${acc} ${current + obj.x}`;
                } else {
                  return `${acc},${current + obj.y}`;
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
                x={obj.x}
                y={obj.y}
                width={obj.width}
                height={obj.height}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
                transform={`rotate(${obj.rotation || 0} ${obj.x} ${obj.y})`}
              />
            );

          case 'circle':
            return (
              <circle
                key={obj.id}
                cx={obj.x}
                cy={obj.y}
                r={obj.radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            );

          case 'arc': {
            const d = describeArc(obj.x, obj.y, obj.radius, obj.rotation, obj.endAngle);
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
              const wx1 = x1 + obj.x;
              const wy1 = y1 + obj.y;
              const wx2 = x2 + obj.x;
              const wy2 = y2 + obj.y;

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
                x1={x1 + obj.x}
                y1={y1 + obj.y}
                x2={x2 + obj.x}
                y2={y2 + obj.y}
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
              const lx1 = x1 + obj.x;
              const ly1 = y1 + obj.y;
              const lx2 = x2 + obj.x;
              const ly2 = y2 + obj.y;

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

          default:
            return null;
        }
      })}
    </svg>
  );
}
