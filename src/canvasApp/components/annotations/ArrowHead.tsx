"use client";
import React from "react";
import { Line, Circle } from "react-konva";
import { Point2D, ArrowType } from "./types";

interface ArrowHeadProps {
  startPoint: Point2D; // Arrow tip
  fromPoint: Point2D;  // Direction line approach
  arrowType?: ArrowType;
  arrowSize?: number;
  color: string;
  strokeWidth?: number;
  stageScale?: number;
}

export const ArrowHead: React.FC<ArrowHeadProps> = ({
  startPoint,
  fromPoint,
  arrowType = "dot",
  arrowSize = 10,
  color,
  strokeWidth = 1.5,
  stageScale = 1,
}) => {
  if (arrowType === "none" || !arrowType) return null;

  if (arrowType === "dot") {
    return (
      <Circle
        x={startPoint.x}
        y={startPoint.y}
        radius={(arrowSize / 2) / stageScale}
        fill={color}
        stroke={color}
        strokeWidth={1 / stageScale}
      />
    );
  }

  const angle = Math.atan2(startPoint.y - fromPoint.y, startPoint.x - fromPoint.x);
  const size = arrowSize / stageScale;
  const wingAngle = Math.PI / 6; // 30 degrees

  const leftWing = {
    x: startPoint.x - size * Math.cos(angle - wingAngle),
    y: startPoint.y - size * Math.sin(angle - wingAngle),
  };

  const rightWing = {
    x: startPoint.x - size * Math.cos(angle + wingAngle),
    y: startPoint.y - size * Math.sin(angle + wingAngle),
  };

  if (arrowType === "open") {
    return (
      <Line
        points={[
          leftWing.x,
          leftWing.y,
          startPoint.x,
          startPoint.y,
          rightWing.x,
          rightWing.y,
        ]}
        stroke={color}
        strokeWidth={strokeWidth / stageScale}
        lineCap="round"
        lineJoin="round"
      />
    );
  }

  // Filled arrow
  return (
    <Line
      points={[
        startPoint.x,
        startPoint.y,
        leftWing.x,
        leftWing.y,
        rightWing.x,
        rightWing.y,
      ]}
      fill={color}
      stroke={color}
      strokeWidth={1 / stageScale}
      closed={true}
    />
  );
};
