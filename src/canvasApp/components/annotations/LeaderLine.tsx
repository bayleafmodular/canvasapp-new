"use client";
import React from "react";
import { Line } from "react-konva";
import { Point2D, LeaderStyle } from "./types";

interface LeaderLineProps {
  startPoint: Point2D;
  elbowPoint?: Point2D;
  textAnchorPoint: Point2D;
  leaderStyle?: LeaderStyle;
  leaderWidth?: number;
  leaderColor: string;
  stageScale?: number;
}

export const LeaderLine: React.FC<LeaderLineProps> = ({
  startPoint,
  elbowPoint,
  textAnchorPoint,
  leaderStyle = "solid",
  leaderWidth = 1.5,
  leaderColor,
  stageScale = 1,
}) => {
  const points: number[] = [startPoint.x, startPoint.y];

  if (elbowPoint) {
    points.push(elbowPoint.x, elbowPoint.y);
  }
  points.push(textAnchorPoint.x, textAnchorPoint.y);

  let dashPattern: number[] | undefined = undefined;
  if (leaderStyle === "dashed") {
    dashPattern = [8 / stageScale, 4 / stageScale];
  } else if (leaderStyle === "dotted") {
    dashPattern = [2 / stageScale, 4 / stageScale];
  }

  return (
    <Line
      points={points}
      stroke={leaderColor}
      strokeWidth={leaderWidth / stageScale}
      dash={dashPattern}
      lineCap="round"
      lineJoin="round"
    />
  );
};
