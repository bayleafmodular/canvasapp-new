"use client";
import React, { useState } from "react";
import { Group, Circle } from "react-konva";
import { AnnotationObject, Point2D } from "./types";
import { LeaderLine } from "./LeaderLine";
import { ArrowHead } from "./ArrowHead";
import { AnnotationText } from "./AnnotationText";
import { useCadStore } from "@/store/useCadStore";
import { Tool } from "@/types";

interface AnnotationRendererProps {
  obj: AnnotationObject;
  isSelected: boolean;
  isEditing?: boolean;
  stageScale: number;
  activeTool: Tool;
  onStartEdit?: (obj: AnnotationObject) => void;
}

export const AnnotationRenderer: React.FC<AnnotationRendererProps> = ({
  obj,
  isSelected,
  isEditing = false,
  stageScale,
  activeTool,
  onStartEdit,
}) => {
  const { updateObject, commitHistory, canvasTheme } = useCadStore();
  const [textBounds, setTextBounds] = useState({ width: 60, height: 24 });

  const startPoint = obj.startPoint || { x: obj.x || 0, y: obj.y || 0 };
  const textPos = obj.textPos || { x: (obj.x || 0) + 60, y: (obj.y || 0) - 30 };
  const elbowPoint = obj.elbowPoint;

  // Compute text anchor point on nearest side of text box
  const textCenter = {
    x: textPos.x + textBounds.width / 2,
    y: textPos.y + textBounds.height / 2,
  };

  const approachPoint = elbowPoint || startPoint;
  
  // Calculate text connection anchor (closest edge/corner to approach point)
  let textAnchor: Point2D = { x: textPos.x, y: textPos.y + textBounds.height / 2 };
  if (approachPoint.x > textPos.x + textBounds.width) {
    textAnchor = { x: textPos.x + textBounds.width, y: textPos.y + textBounds.height / 2 };
  } else if (approachPoint.x < textPos.x) {
    textAnchor = { x: textPos.x, y: textPos.y + textBounds.height / 2 };
  } else {
    textAnchor = { x: (textPos.x + textPos.x + textBounds.width) / 2, y: approachPoint.y > textCenter.y ? textPos.y + textBounds.height : textPos.y };
  }

  const isLight = canvasTheme === "light";
  const rawLeaderColor = obj.leaderColor || obj.fontColor || (isLight ? "#0f172a" : "#ffffff");
  const leaderColor = (isLight && (rawLeaderColor.toLowerCase() === "#ffffff" || rawLeaderColor.toLowerCase() === "#fff")) 
    ? "#0f172a" 
    : rawLeaderColor;
  const strokeColor = isSelected ? "#3b82f6" : leaderColor;

  const rawFontColor = obj.fontColor || (isLight ? "#0f172a" : "#ffffff");
  const fontColor = (isLight && (rawFontColor.toLowerCase() === "#ffffff" || rawFontColor.toLowerCase() === "#fff"))
    ? "#0f172a"
    : rawFontColor;

  const handleDragStartPoint = (e: any) => {
    e.cancelBubble = true; // Prevent dragging parent group
    const newPt = { x: e.target.x(), y: e.target.y() };
    updateObject(obj.id, { startPoint: newPt });
  };

  const handleDragElbowPoint = (e: any) => {
    e.cancelBubble = true;
    const newPt = { x: e.target.x(), y: e.target.y() };
    updateObject(obj.id, { elbowPoint: newPt });
  };

  const handleDragTextPos = (e: any) => {
    e.cancelBubble = true;
    const newPt = { x: e.target.x(), y: e.target.y() };
    updateObject(obj.id, { textPos: newPt });
  };

  return (
    <Group
      id={obj.id}
      draggable={activeTool === Tool.SELECT && isSelected}
      onDragEnd={(e) => {
        if (e.target.id() === obj.id) {
          const dx = e.target.x();
          const dy = e.target.y();
          if (dx !== 0 || dy !== 0) {
            updateObject(obj.id, {
              startPoint: { x: startPoint.x + dx, y: startPoint.y + dy },
              textPos: { x: textPos.x + dx, y: textPos.y + dy },
              elbowPoint: elbowPoint ? { x: elbowPoint.x + dx, y: elbowPoint.y + dy } : undefined,
              x: 0,
              y: 0,
            });
            e.target.x(0);
            e.target.y(0);
            commitHistory();
          }
        }
      }}
    >
      {/* Leader Line */}
      <LeaderLine
        startPoint={startPoint}
        elbowPoint={elbowPoint}
        textAnchorPoint={textAnchor}
        leaderStyle={obj.leaderStyle}
        leaderWidth={obj.leaderWidth}
        leaderColor={strokeColor}
        stageScale={stageScale}
      />

      {/* Arrowhead at start point */}
      <ArrowHead
        startPoint={startPoint}
        fromPoint={approachPoint}
        arrowType={obj.arrowType}
        arrowSize={obj.arrowSize}
        color={strokeColor}
        strokeWidth={obj.leaderWidth}
        stageScale={stageScale}
      />

      {/* Annotation Text */}
      <AnnotationText
        position={textPos}
        text={obj.text}
        fontSize={obj.fontSize}
        fontFamily={obj.fontFamily}
        fontColor={fontColor}
        bold={obj.bold}
        italic={obj.italic}
        underline={obj.underline}
        align={obj.align}
        rotation={obj.rotation}
        stageScale={stageScale}
        isSelected={isSelected}
        isEditing={isEditing}
        onTextBoundsChange={setTextBounds}
        onDblClick={() => onStartEdit && onStartEdit(obj)}
      />

      {/* Interactive Drag Handles when Selected in SELECT mode */}
      {isSelected && activeTool === Tool.SELECT && (
        <Group>
          {/* Start Point (Arrow Target) Handle */}
          <Circle
            x={startPoint.x}
            y={startPoint.y}
            radius={5 / stageScale}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={1.5 / stageScale}
            draggable={true}
            onDragMove={handleDragStartPoint}
            onDragEnd={(e) => {
              handleDragStartPoint(e);
              commitHistory();
            }}
          />

          {/* Optional Elbow Handle */}
          {elbowPoint && (
            <Circle
              x={elbowPoint.x}
              y={elbowPoint.y}
              radius={4 / stageScale}
              fill="#eab308"
              stroke="#ffffff"
              strokeWidth={1.5 / stageScale}
              draggable={true}
              onDragMove={handleDragElbowPoint}
              onDragEnd={(e) => {
                handleDragElbowPoint(e);
                commitHistory();
              }}
            />
          )}

          {/* Text Box Drag Handle */}
          <Circle
            x={textPos.x}
            y={textPos.y}
            radius={5 / stageScale}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth={1.5 / stageScale}
            draggable={true}
            onDragMove={handleDragTextPos}
            onDragEnd={(e) => {
              handleDragTextPos(e);
              commitHistory();
            }}
          />
        </Group>
      )}
    </Group>
  );
};
