"use client";
import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle, Arc, Text, Transformer, Group } from "react-konva";
import { useCadStore }  from '@/store/useCadStore';
import { Tool, ShapeType }  from '@/types';
import { snapToGrid, getDistance, getAngle, getOrthoPoint, SNAP_THRESHOLD, formatMeasurement }  from '@/utils/math';
const GRID_SIZE = 50;
function CadCanvas() {
  const containerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const {
    objects,
    activeTool,
    stageScale,
    stagePosition,
    setStageScale,
    setStagePosition,
    gridEnabled,
    snapEnabled,
    orthoEnabled,
    showMeasurements,
    activeColor,
    layers,
    addObject,
    updateObject,
    selectObjects,
    selectedIds,
    commitHistory,
    deleteObject
  } = useCadStore();
  const [drawingState, setDrawingState] = useState<any>({ active: false, points: [], currentPos: null });
  const [selectionStart, setSelectionStart] = useState<any>(null);
  const [selectionBounds, setSelectionBounds] = useState<any>(null);
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    const handleExport = () => {
      if (stageRef.current) {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        const link = document.createElement("a");
        link.download = "cad-export.png";
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    window.addEventListener("export-png", handleExport);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("export-png", handleExport);
    };
  }, []);
  useEffect(() => {
    if (activeTool === Tool.SELECT && selectedIds.length > 0) {
      if (trRef.current && stageRef.current) {
        const nodes = selectedIds.map((id) => stageRef.current.findOne(`#${id}`)).filter(Boolean);
        trRef.current.nodes(nodes);
        trRef.current.getLayer()?.batchDraw();
      }
    } else {
      if (trRef.current) {
        trRef.current.nodes([]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedIds, activeTool, objects]);
  useEffect(() => {
    const handleSetRotation = (e: any) => {
      const newRotation = e.detail;
      const node = trRef.current?.nodes()[0];
      if (node && selectedIds.length === 1) {
        const shapeId = selectedIds[0];
        const oldRotation = node.rotation();
        if (newRotation === oldRotation) return;
        const rad = (newRotation - oldRotation) * Math.PI / 180;
        const localBox = node.getClientRect({ skipTransform: true });
        const localCx = localBox.x + localBox.width / 2;
        const localCy = localBox.y + localBox.height / 2;
        const pt = node.getTransform().point({ x: localCx, y: localCy });
        const dx = node.x() - pt.x;
        const dy = node.y() - pt.y;
        const newX = pt.x + dx * Math.cos(rad) - dy * Math.sin(rad);
        const newY = pt.y + dx * Math.sin(rad) + dy * Math.cos(rad);
        useCadStore.getState().updateObject(shapeId, {
          rotation: newRotation,
          x: newX,
          y: newY
        });
        useCadStore.getState().commitHistory();
      }
    };
    window.addEventListener("rotate-selected", handleSetRotation);
    return () => window.removeEventListener("rotate-selected", handleSetRotation);
  }, [selectedIds]);
  const getRelativePointerPosition = (stage: any) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    return pos ? transform.point(pos) : { x: 0, y: 0 };
  };
  const getSnappedPosition = (pos: any, priorPoints: any) => {
    let finalPos = { ...pos };
    if (orthoEnabled && priorPoints && priorPoints.length > 0) {
      const lastPt = priorPoints[priorPoints.length - 1];
      finalPos = getOrthoPoint(lastPt, pos);
    }
    if (snapEnabled) {
      let closestSnap = null;
      let minDistance = SNAP_THRESHOLD / stageScale;
      objects.forEach((obj) => {
        if ((obj.type === ShapeType.LINE || obj.type === ShapeType.POLYLINE) && obj.points) {
          for (let i = 0; i < obj.points.length; i += 2) {
            const pt = { x: obj.points[i], y: obj.points[i + 1] };
            const dist = getDistance(finalPos, pt);
            if (dist < minDistance) {
              minDistance = dist;
              closestSnap = pt;
            }
          }
        }
      });
      if (closestSnap) {
        return closestSnap;
      }
      if (gridEnabled) {
        return snapToGrid(finalPos, 1);
      }
    } else if (gridEnabled) {
      return snapToGrid(finalPos, 1);
    }
    return finalPos;
  };
  const handlePointerDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    if (e.evt.button === 1 || activeTool === Tool.HAND) {
      return;
    }
    const pos = getRelativePointerPosition(stage);
    const snappedPos = getSnappedPosition(pos, drawingState.points);
    if (activeTool === Tool.SELECT) {
      const clickedOnEmpty = e.target === stage;
      if (clickedOnEmpty) {
        const pos2 = getRelativePointerPosition(stage);
        setSelectionStart(pos2);
        setSelectionBounds({ x: pos2.x, y: pos2.y, width: 0, height: 0 });
        if (!e.evt.shiftKey) {
          selectObjects([]);
        }
      } else {
        const id = e.target.id();
        const obj = objects.find((o) => o.id === id);
        if (id && obj && obj.selectable !== false) {
          if (e.evt.shiftKey) {
            if (selectedIds.includes(id)) {
              selectObjects(selectedIds.filter((i) => i !== id));
            } else {
              selectObjects([...selectedIds, id]);
            }
          } else if (!selectedIds.includes(id)) {
            selectObjects([id]);
          }
        }
      }
      return;
    }
    if (activeTool === Tool.FREE_DRAW) {
      setDrawingState({ active: true, points: [pos], currentPos: pos });
      return;
    }
    if (activeTool === Tool.POLYLINE) {
      if (!drawingState.active) {
        setDrawingState({ active: true, points: [snappedPos], currentPos: snappedPos });
      } else {
        setDrawingState((prev: any) => ({
          ...prev,
          points: [...prev.points, snappedPos]
        }));
      }
      return;
    }
    if (activeTool === Tool.ARC) {
      if (!drawingState.active) {
        setDrawingState({ active: true, points: [snappedPos], currentPos: snappedPos });
      } else if (drawingState.points.length === 1) {
        setDrawingState((prev: any) => ({
          ...prev,
          points: [...prev.points, snappedPos]
        }));
      } else {
        const p1 = drawingState.points[0];
        const p2 = drawingState.points[1];
        const p3 = snappedPos;
        const radius = getDistance(p1, p2);
        const startAngle = getAngle(p1, p2);
        let endAngle = getAngle(p1, p3);
        let rotation = startAngle;
        let angle = endAngle - startAngle;
        if (angle < 0) angle += 360;
        const newObj = {
          type: ShapeType.ARC,
          x: p1.x,
          y: p1.y,
          radius,
          rotation,
          startAngle: 0,
          endAngle: angle,
          points: [],
          stroke: activeColor,
          strokeWidth: 2,
          layerId: useCadStore.getState().activeLayerId,
          selectable: true
        };
        addObject(newObj);
        commitHistory();
        setDrawingState({ active: false, points: [], currentPos: null });
      }
      return;
    }
    if (activeTool === Tool.LINE || activeTool === Tool.WALL || activeTool === Tool.BEAM || activeTool === Tool.LINTEL) {
      if (!drawingState.active) {
        setDrawingState({ active: true, points: [snappedPos], currentPos: snappedPos });
      } else {
        let shapeType = ShapeType.LINE;
        let strokeWidth = 2;
        let customStroke = activeColor;
        let dashPat;
        if (activeTool === Tool.WALL) {
          shapeType = ShapeType.WALL;
          strokeWidth = 12;
          customStroke = activeColor === "#FFFFFF" ? "#9ca3af" : activeColor;
        } else if (activeTool === Tool.BEAM) {
          shapeType = ShapeType.BEAM;
          strokeWidth = 6;
          customStroke = activeColor === "#FFFFFF" ? "#f59e0b" : activeColor;
          dashPat = [10, 5];
        } else if (activeTool === Tool.LINTEL) {
          shapeType = ShapeType.LINTEL;
          strokeWidth = 6;
          customStroke = activeColor === "#FFFFFF" ? "#06b6d4" : activeColor;
        }
        const newObj = {
          type: shapeType,
          x: 0,
          y: 0,
          points: [drawingState.points[0].x, drawingState.points[0].y, snappedPos.x, snappedPos.y],
          stroke: customStroke,
          strokeWidth,
          layerId: useCadStore.getState().activeLayerId,
          selectable: true,
          dash: dashPat
        };
        addObject(newObj);
        commitHistory();
        setDrawingState({ active: false, points: [], currentPos: null });
        selectObjects([]);
      }
    } else if (activeTool === Tool.RECTANGLE) {
      if (!drawingState.active) {
        setDrawingState({ active: true, points: [snappedPos], currentPos: snappedPos });
      } else {
        const p1 = drawingState.points[0];
        const newObj = {
          type: ShapeType.RECTANGLE,
          x: Math.min(p1.x, snappedPos.x),
          y: Math.min(p1.y, snappedPos.y),
          width: Math.abs(snappedPos.x - p1.x),
          height: Math.abs(snappedPos.y - p1.y),
          points: [],
          stroke: activeColor,
          strokeWidth: 2,
          layerId: useCadStore.getState().activeLayerId,
          selectable: true
        };
        addObject(newObj);
        commitHistory();
        setDrawingState({ active: false, points: [], currentPos: null });
      }
    } else if (activeTool === Tool.CIRCLE) {
      if (!drawingState.active) {
        setDrawingState({ active: true, points: [snappedPos], currentPos: snappedPos });
      } else {
        const p1 = drawingState.points[0];
        const radius = getDistance(p1, snappedPos);
        const newObj = {
          type: ShapeType.CIRCLE,
          x: p1.x,
          y: p1.y,
          radius,
          points: [],
          stroke: activeColor,
          strokeWidth: 2,
          layerId: useCadStore.getState().activeLayerId,
          selectable: true
        };
        addObject(newObj);
        commitHistory();
        setDrawingState({ active: false, points: [], currentPos: null });
      }
    }
  };
  const handlePointerMove = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    if (activeTool === Tool.SELECT && selectionStart) {
      const pos2 = getRelativePointerPosition(stage);
      setSelectionBounds({
        x: Math.min(pos2.x, selectionStart.x),
        y: Math.min(pos2.y, selectionStart.y),
        width: Math.abs(pos2.x - selectionStart.x),
        height: Math.abs(pos2.y - selectionStart.y)
      });
      return;
    }
    if (!drawingState.active) return;
    const pos = getRelativePointerPosition(stage);
    if (activeTool === Tool.FREE_DRAW) {
      setDrawingState((prev: any) => ({
        ...prev,
        points: [...prev.points, pos]
      }));
      return;
    }
    const snappedPos = getSnappedPosition(pos, drawingState.points);
    setDrawingState((prev: any) => ({ ...prev, currentPos: snappedPos }));
  };
  const handlePointerUp = (e: any) => {
    if (activeTool === Tool.SELECT && selectionStart && selectionBounds) {
      if (selectionBounds.width > 2 && selectionBounds.height > 2) {
        const selected = objects.filter((obj) => {
          if (obj.selectable === false) return false;
          let ox1 = obj.x;
          let oy1 = obj.y;
          let ox2 = obj.x;
          let oy2 = obj.y;
          if (obj.type === ShapeType.RECTANGLE) {
            ox2 = obj.x + (obj.width || 0);
            oy2 = obj.y + (obj.height || 0);
          } else if (obj.type === ShapeType.CIRCLE || obj.type === ShapeType.ARC) {
            ox1 = obj.x - (obj.radius || 0);
            ox2 = obj.x + (obj.radius || 0);
            oy1 = obj.y - (obj.radius || 0);
            oy2 = obj.y + (obj.radius || 0);
          } else if (obj.points && obj.points.length > 0) {
            ox1 = Math.min(...obj.points.filter((_: any, i: number) => i % 2 === 0)) + obj.x;
            ox2 = Math.max(...obj.points.filter((_: any, i: number) => i % 2 === 0)) + obj.x;
            oy1 = Math.min(...obj.points.filter((_: any, i: number) => i % 2 !== 0)) + obj.y;
            oy2 = Math.max(...obj.points.filter((_: any, i: number) => i % 2 !== 0)) + obj.y;
          }
          const minX = Math.min(ox1, ox2);
          const maxX = Math.max(ox1, ox2);
          const minY = Math.min(oy1, oy2);
          const maxY = Math.max(oy1, oy2);
          return minX >= selectionBounds.x && maxX <= selectionBounds.x + selectionBounds.width && minY >= selectionBounds.y && maxY <= selectionBounds.y + selectionBounds.height;
        });
        const ids = selected.map((o) => o.id);
        if (e.evt.shiftKey) {
          selectObjects([.../* @__PURE__ */ new Set([...selectedIds, ...ids])]);
        } else {
          selectObjects(ids);
        }
      } else if (!e.evt.shiftKey) {
        selectObjects([]);
      }
      setSelectionStart(null);
      setSelectionBounds(null);
      return;
    }
    if (activeTool === Tool.FREE_DRAW && drawingState.active) {
      if (drawingState.points.length > 2) {
        const newObj = {
          type: ShapeType.FREE_DRAW,
          x: 0,
          y: 0,
          points: drawingState.points.flatMap((p: any) => [p.x, p.y]),
          stroke: activeColor,
          strokeWidth: 2,
          layerId: useCadStore.getState().activeLayerId,
          selectable: true
        };
        addObject(newObj);
        commitHistory();
      }
      setDrawingState({ active: false, points: [], currentPos: null });
    }
  };
  const handleDblClick = (e: any) => {
    if (activeTool === Tool.POLYLINE && drawingState.active && drawingState.points.length > 1) {
      const newObj = {
        type: ShapeType.POLYLINE,
        x: 0,
        y: 0,
        points: drawingState.points.flatMap((p: any) => [p.x, p.y]),
        stroke: activeColor,
        strokeWidth: 2,
        layerId: useCadStore.getState().activeLayerId,
        selectable: true
      };
      addObject(newObj);
      commitHistory();
      setDrawingState({ active: false, points: [], currentPos: null });
    }
  };
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const scaleBy = 1.1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale
      };
      let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      // Clamp the scale to prevent zooming out into infinity (0%) or zooming in too much
      if (newScale < 0.05) newScale = 0.05;
      if (newScale > 50) newScale = 50;
      setStageScale(newScale);
      setStagePosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale
      });
    } else {
      let dx = e.evt.deltaX;
      let dy = e.evt.deltaY;
      if (e.evt.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }
      setStagePosition({
        x: stage.x() - dx,
        y: stage.y() - dy
      });
    }
  };
  const renderGrid = () => {
    return null;
  };
  const renderActiveDrawing = () => {
    if (!drawingState.active || !drawingState.currentPos) return null;
    const { points, currentPos } = drawingState;
    const p1 = points[0];
    const linePts = [p1.x, p1.y, currentPos.x, currentPos.y];
    const isStraight = (pts: any) => {
      if (pts.length < 4) return false;
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
    const previewColor = activeColor;
    return <Layer>
        {activeTool === Tool.LINE && <Line
      points={linePts}
      stroke={isStraight(linePts) ? "#22c55e" : previewColor}
      strokeWidth={2 / stageScale}
    />}
        {activeTool === Tool.WALL && <Group>
          <Line
            points={linePts}
            stroke={isStraight(linePts) ? "#22c55e" : activeColor === "#FFFFFF" ? "#9ca3af" : activeColor}
            strokeWidth={12 / stageScale}
            opacity={0.4}
          />
          {(() => {
            const dx = currentPos.x - p1.x;
            const dy = currentPos.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len <= 0) return null;
            const nx = -dy / len;
            const ny = dx / len;
            const offset = 6 / stageScale;
            return <React.Fragment>
                <Line points={[p1.x + nx * offset, p1.y + ny * offset, currentPos.x + nx * offset, currentPos.y + ny * offset]} stroke={isStraight(linePts) ? "#22c55e" : "#e5e7eb"} strokeWidth={1.5 / stageScale} />
                <Line points={[p1.x - nx * offset, p1.y - ny * offset, currentPos.x - nx * offset, currentPos.y - ny * offset]} stroke={isStraight(linePts) ? "#22c55e" : "#e5e7eb"} strokeWidth={1.5 / stageScale} />
              </React.Fragment>;
          })()}
        </Group>}
        {activeTool === Tool.BEAM && <Line
      points={linePts}
      stroke={isStraight(linePts) ? "#22c55e" : activeColor === "#FFFFFF" ? "#f59e0b" : activeColor}
      strokeWidth={6 / stageScale}
      dash={[10 / stageScale, 5 / stageScale]}
    />}
        {activeTool === Tool.LINTEL && <Group>
          <Line
            points={linePts}
            stroke={isStraight(linePts) ? "#22c55e" : activeColor === "#FFFFFF" ? "#06b6d4" : activeColor}
            strokeWidth={6 / stageScale}
          />
          {(() => {
            const dx = currentPos.x - p1.x;
            const dy = currentPos.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len <= 0) return null;
            const nx = -dy / len;
            const ny = dx / len;
            const capLen = 5 / stageScale;
            const stroke = isStraight(linePts) ? "#22c55e" : activeColor === "#FFFFFF" ? "#06b6d4" : activeColor;
            return <React.Fragment>
                <Line points={[p1.x + nx * capLen, p1.y + ny * capLen, p1.x - nx * capLen, p1.y - ny * capLen]} stroke={stroke} strokeWidth={3 / stageScale} />
                <Line points={[currentPos.x + nx * capLen, currentPos.y + ny * capLen, currentPos.x - nx * capLen, currentPos.y - ny * capLen]} stroke={stroke} strokeWidth={3 / stageScale} />
              </React.Fragment>;
          })()}
        </Group>}
        {activeTool === Tool.POLYLINE && <Line
      points={[...points.flatMap((p: any) => [p.x, p.y]), currentPos.x, currentPos.y]}
      stroke={previewColor}
      strokeWidth={2 / stageScale}
    />}
        {activeTool === Tool.FREE_DRAW && <Line
      points={points.flatMap((p: any) => [p.x, p.y])}
      stroke={
        /* activeTool === Tool.ERASER ? '#ffffff' : */
        previewColor
      }
      strokeWidth={
        /* activeTool === Tool.ERASER ? 20 : */
        2 / stageScale
      }
      tension={0.5}
      lineCap="round"
      lineJoin="round"
    />}
        {activeTool === Tool.RECTANGLE && <Rect
      x={Math.min(p1.x, currentPos.x)}
      y={Math.min(p1.y, currentPos.y)}
      width={Math.abs(currentPos.x - p1.x)}
      height={Math.abs(currentPos.y - p1.y)}
      stroke={previewColor}
      strokeWidth={2 / stageScale}
    />}
        {activeTool === Tool.CIRCLE && <Circle
      x={p1.x}
      y={p1.y}
      radius={getDistance(p1, currentPos)}
      stroke={previewColor}
      strokeWidth={2 / stageScale}
    />}
        {activeTool === Tool.ARC && points.length === 1 && <Line
      points={[p1.x, p1.y, currentPos.x, currentPos.y]}
      stroke={previewColor}
      strokeWidth={1 / stageScale}
      dash={[4 / stageScale, 4 / stageScale]}
    />}
        {activeTool === Tool.ARC && points.length === 2 && <Arc
      x={p1.x}
      y={p1.y}
      innerRadius={getDistance(p1, points[1])}
      outerRadius={getDistance(p1, points[1])}
      rotation={getAngle(p1, points[1])}
      angle={(getAngle(p1, currentPos) - getAngle(p1, points[1]) + 360) % 360}
      stroke={previewColor}
      strokeWidth={2 / stageScale}
    />}

        {
      /* Live Measurement Overlay */
    }
        {showMeasurements && (activeTool === Tool.LINE || activeTool === Tool.POLYLINE) && <Text
      x={(points[points.length - 1].x + currentPos.x) / 2 + 10 / stageScale}
      y={(points[points.length - 1].y + currentPos.y) / 2 - 20 / stageScale}
      text={formatMeasurement(getDistance(points[points.length - 1], currentPos))}
      fill={previewColor}
      fontSize={14 / stageScale}
      fontFamily="monospace"
    />}
      </Layer>;
  };
  const renderSelectionBox = () => {
    if (activeTool === Tool.SELECT && selectionBounds) {
      return <Layer>
          <Rect
        x={selectionBounds.x}
        y={selectionBounds.y}
        width={selectionBounds.width}
        height={selectionBounds.height}
        fill="rgba(74, 144, 226, 0.2)"
        stroke="#4a90e2"
        strokeWidth={1 / stageScale}
        listening={false}
      />
        </Layer>;
    }
    return null;
  };
  const renderObjects = () => {
    const isStraight = (pts: any) => {
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
    return objects.map((obj) => {
      const isSelected = selectedIds.includes(obj.id);
      const stroke = isSelected ? "#3b82f6" : obj.stroke;
      const strokeWidth = isSelected ? 3 : obj.strokeWidth;
      const commonProps = {
        id: obj.id,
        listening: true,
        stroke,
        strokeWidth: strokeWidth / stageScale,
        hitStrokeWidth: Math.max(20 / stageScale, strokeWidth / stageScale),
        draggable: activeTool === Tool.SELECT && isSelected,
        rotation: obj.rotation || 0,
        onDragStart: (e: any) => {
          const stage = stageRef.current;
          if (stage) {
            selectedIds.forEach((selId) => {
              const shape = stage.findOne(`#${selId}`);
              if (shape) {
                shape.setAttr("startX", shape.x());
                shape.setAttr("startY", shape.y());
              }
            });
          }
        },
        onDragMove: (e: any) => {
          if (selectedIds.length > 1) {
            const id = e.target.id();
            const node = e.target;
            const dx = node.x() - node.attrs.startX;
            const dy = node.y() - node.attrs.startY;
            const stage = stageRef.current;
            if (stage) {
              selectedIds.forEach((selId) => {
                if (selId !== id) {
                  const shape = stage.findOne(`#${selId}`);
                  if (shape && shape.attrs.startX !== void 0) {
                    shape.x(shape.attrs.startX + dx);
                    shape.y(shape.attrs.startY + dy);
                  }
                }
              });
            }
          }
        },
        onDragEnd: (e: any) => {
          const stage = stageRef.current;
          if (stage) {
            useCadStore.setState((state) => {
              const newObjects = state.objects.map((o) => {
                if (selectedIds.includes(o.id)) {
                  const shape = stage.findOne(`#${o.id}`);
                  if (shape) {
                    return { ...o, x: shape.x(), y: shape.y() };
                  }
                }
                return o;
              });
              return { objects: newObjects };
            });
            commitHistory();
          }
        }
      };
      let shapeParams = {};
      const renderMeasurements = () => {
        if (!showMeasurements) return null;
        if ((obj.type === ShapeType.LINE || obj.type === ShapeType.WALL || obj.type === ShapeType.BEAM || obj.type === ShapeType.LINTEL) && obj.points.length === 4) {
          const pt1 = { x: obj.points[0] + obj.x, y: obj.points[1] + obj.y };
          const pt2 = { x: obj.points[2] + obj.x, y: obj.points[3] + obj.y };
          const dist = getDistance(pt1, pt2);
          return <Text
            x={(pt1.x + pt2.x) / 2 + 10 / stageScale}
            y={(pt1.y + pt2.y) / 2 - 20 / stageScale}
            text={formatMeasurement(dist) + " mm"}
            fill="#4a90e2"
            fontSize={10 / stageScale}
            fontFamily="monospace"
            padding={2 / stageScale}
          />;
        }
        if (obj.type === ShapeType.RECTANGLE) {
          return <React.Fragment>
              <Text
            x={obj.x + (obj.width || 0) / 2}
            y={obj.y - 15 / stageScale}
            text={formatMeasurement(Math.abs(obj.width || 0)) + " mm"}
            fill="#4a90e2"
            fontSize={10 / stageScale}
            fontFamily="monospace"
          />
              <Text
            x={obj.x + (obj.width || 0) + 5 / stageScale}
            y={obj.y + (obj.height || 0) / 2}
            text={formatMeasurement(Math.abs(obj.height || 0)) + " mm"}
            fill="#4a90e2"
            fontSize={10 / stageScale}
            fontFamily="monospace"
          />
            </React.Fragment>;
        }
        if (obj.type === ShapeType.CIRCLE) {
          return <Text
            x={obj.x + (obj.radius || 0) + 5 / stageScale}
            y={obj.y}
            text={`R ${formatMeasurement(obj.radius || 0)} mm`}
            fill="#4a90e2"
            fontSize={10 / stageScale}
            fontFamily="monospace"
          />;
        }
        return null;
      };
      let renderedShape = null;
      switch (obj.type) {
        case ShapeType.LINE:
        case ShapeType.POLYLINE:
          renderedShape = <Line {...commonProps} x={obj.x} y={obj.y} points={obj.points} lineCap="round" lineJoin="round" />;
          break;
        case ShapeType.FREE_DRAW:
          renderedShape = <Line {...commonProps} x={obj.x} y={obj.y} points={obj.points} lineCap="round" lineJoin="round" tension={0.5} />;
          break;
        case ShapeType.RECTANGLE:
          renderedShape = <Rect {...commonProps} x={obj.x} y={obj.y} width={obj.width} height={obj.height} />;
          break;
        case ShapeType.CIRCLE:
          renderedShape = <Circle {...commonProps} x={obj.x} y={obj.y} radius={obj.radius} />;
          break;
        case ShapeType.ARC:
          renderedShape = <Arc {...commonProps} x={obj.x} y={obj.y} innerRadius={obj.radius} outerRadius={obj.radius} rotation={obj.rotation} angle={obj.endAngle} />;
          break;
        case ShapeType.WALL: {
          const [x1, y1, x2, y2] = obj.points;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const nx = -dy / len;
            const ny = dx / len;
            const offset = 6;
            const edgeStroke = commonProps.stroke === "#3b82f6" ? "#3b82f6" : isStraight(obj.points) ? "#22c55e" : obj.stroke === "#9ca3af" ? "#d1d5db" : obj.stroke;
            renderedShape = <Group {...commonProps} x={obj.x} y={obj.y}>
                <Line points={obj.points} stroke={commonProps.stroke} strokeWidth={obj.strokeWidth / stageScale} opacity={0.3} lineCap="round" />
                <Line points={[x1 + nx * offset, y1 + ny * offset, x2 + nx * offset, y2 + ny * offset]} stroke={edgeStroke} strokeWidth={1.5 / stageScale} />
                <Line points={[x1 - nx * offset, y1 - ny * offset, x2 - nx * offset, y2 - ny * offset]} stroke={edgeStroke} strokeWidth={1.5 / stageScale} />
              </Group>;
          } else {
            renderedShape = <Line {...commonProps} x={obj.x} y={obj.y} points={obj.points} lineCap="round" lineJoin="round" />;
          }
          break;
        }
        case ShapeType.BEAM:
          renderedShape = <Line {...commonProps} x={obj.x} y={obj.y} points={obj.points} lineCap="butt" lineJoin="miter" dash={[12 / stageScale, 6 / stageScale]} />;
          break;
        case ShapeType.LINTEL: {
          const [x1, y1, x2, y2] = obj.points;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const nx = -dy / len;
            const ny = dx / len;
            const capLen = 5;
            const capStroke = commonProps.stroke === "#3b82f6" ? "#3b82f6" : isStraight(obj.points) ? "#22c55e" : obj.stroke;
            renderedShape = <Group {...commonProps} x={obj.x} y={obj.y}>
                <Line points={obj.points} stroke={commonProps.stroke} strokeWidth={obj.strokeWidth / stageScale} lineCap="square" />
                <Line points={[x1 + nx * capLen, y1 + ny * capLen, x1 - nx * capLen, y1 - ny * capLen]} stroke={capStroke} strokeWidth={3 / stageScale} />
                <Line points={[x2 + nx * capLen, y2 + ny * capLen, x2 - nx * capLen, y2 - ny * capLen]} stroke={capStroke} strokeWidth={3 / stageScale} />
              </Group>;
          } else {
            renderedShape = <Line {...commonProps} x={obj.x} y={obj.y} points={obj.points} lineCap="round" lineJoin="round" />;
          }
          break;
        }
      }
      const layer = layers.find((l) => l.id === obj.layerId);
      if (layer && !layer.visible) {
        return null;
      }
      return <React.Fragment key={obj.id}>
          {renderedShape}
          {renderMeasurements()}
        </React.Fragment>;
    });
  };
  const gridStyle = gridEnabled ? {
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
    backgroundSize: `${20 * stageScale}px ${20 * stageScale}px`,
    backgroundPosition: `${stagePosition.x}px ${stagePosition.y}px`
  } : {};
  return <div
    ref={containerRef}
    className={`w-full h-full outline-none ${activeTool === Tool.HAND ? "cursor-grab active:cursor-grabbing" : (
      /* activeTool === Tool.ERASER ? 'cursor-pointer' : */
      "cursor-crosshair"
    )}`}
    style={gridStyle}
    tabIndex={0}
    onKeyDown={(e) => {
      const store = useCadStore.getState();
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        store.copyObjects();
      } else if (isMod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        store.pasteObjects();
      } else if (isMod && e.key.toLowerCase() === "x") {
        e.preventDefault();
        store.cutObjects();
      } else if (isMod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        store.duplicateObjects();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        store.deleteSelected();
      } else if (e.key === "Escape") {
        if (activeTool === Tool.POLYLINE && drawingState.points.length > 1) {
          handleDblClick(e);
        } else {
          setDrawingState({ active: false, points: [], currentPos: null });
        }
      }
    }}
  >
      <Stage
    ref={stageRef}
    width={dimensions.width}
    height={dimensions.height}
    onWheel={handleWheel}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onDblClick={handleDblClick}
    draggable={activeTool === Tool.HAND}
    onDragEnd={(e) => {
      if (e.target === stageRef.current) {
        setStagePosition({ x: e.target.x(), y: e.target.y() });
      }
    }}
    scaleX={stageScale}
    scaleY={stageScale}
    x={stagePosition.x}
    y={stagePosition.y}
  >
        <Layer>
          {renderGrid()}
        </Layer>
        <Layer>
          {renderObjects()}
          {activeTool === Tool.SELECT && selectedIds.length > 0 && <Transformer
    ref={trRef}
    enabledAnchors={[]}
    rotateEnabled={true}
    onTransformEnd={(e) => {
      const stage = stageRef.current;
      if (stage) {
        useCadStore.setState((state) => {
          const newObjects = state.objects.map((o) => {
            if (selectedIds.includes(o.id)) {
              const shape = stage.findOne(`#${o.id}`);
              if (shape) {
                return {
                  ...o,
                  x: shape.x(),
                  y: shape.y(),
                  rotation: shape.rotation()
                };
              }
            }
            return o;
          });
          return { objects: newObjects };
        });
        commitHistory();
      }
    }}
  />}
        </Layer>
        {renderActiveDrawing()}
        {renderSelectionBox()}
      </Stage>
    </div>;
}
export {
  CadCanvas
};
