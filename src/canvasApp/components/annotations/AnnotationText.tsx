"use client";
import React, { useRef, useEffect, useState } from "react";
import { Group, Text, Rect } from "react-konva";
import { Point2D, TextAlign } from "./types";

interface AnnotationTextProps {
  position: Point2D;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: TextAlign;
  rotation?: number;
  stageScale?: number;
  isSelected?: boolean;
  isEditing?: boolean;
  onTextBoundsChange?: (bounds: { width: number; height: number }) => void;
  onDblClick?: (e: any) => void;
}

export const AnnotationText: React.FC<AnnotationTextProps> = ({
  position,
  text,
  fontSize = 14,
  fontFamily = "sans-serif",
  fontColor = "#ffffff",
  bold = false,
  italic = false,
  underline = false,
  align = "left",
  rotation = 0,
  stageScale = 1,
  isSelected = false,
  isEditing = false,
  onTextBoundsChange,
  onDblClick,
}) => {
  const textRef = useRef<any>(null);
  const [bounds, setBounds] = useState({ width: 60, height: 24 });

  useEffect(() => {
    if (textRef.current) {
      const w = Math.max(30, textRef.current.width());
      const h = Math.max(20, textRef.current.height());
      setBounds({ width: w, height: h });
      if (onTextBoundsChange) {
        onTextBoundsChange({ width: w, height: h });
      }
    }
  }, [text, fontSize, fontFamily, bold, italic, align, stageScale]);

  let fontStyle = "normal";
  if (bold && italic) fontStyle = "italic bold";
  else if (bold) fontStyle = "bold";
  else if (italic) fontStyle = "italic";

  const padding = 6 / stageScale;

  return (
    <Group
      x={position.x}
      y={position.y}
      rotation={rotation}
      onDblClick={onDblClick}
      opacity={isEditing ? 0 : 1}
    >
      {/* Background box for text */}
      <Rect
        x={-padding}
        y={-padding}
        width={bounds.width + padding * 2}
        height={bounds.height + padding * 2}
        fill="transparent"
        stroke={isSelected ? "#3b82f6" : undefined}
        strokeWidth={isSelected ? 1 / stageScale : 0}
        cornerRadius={3 / stageScale}
        dash={isSelected ? [4 / stageScale, 4 / stageScale] : undefined}
      />
      <Text
        ref={textRef}
        x={0}
        y={0}
        text={text || "Enter Text..."}
        fontSize={fontSize / stageScale}
        fontFamily={fontFamily}
        fill={fontColor}
        fontStyle={fontStyle}
        textDecoration={underline ? "underline" : ""}
        align={align}
        padding={0}
      />
    </Group>
  );
};
