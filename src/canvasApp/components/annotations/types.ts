export interface Point2D {
  x: number;
  y: number;
}

export type LeaderStyle = "solid" | "dashed" | "dotted";
export type ArrowType = "none" | "open" | "filled" | "dot";
export type TextAlign = "left" | "center" | "right";

export interface AnnotationObject {
  id: string;
  type: string;
  x: number;
  y: number;
  startPoint: Point2D;
  textPos: Point2D;
  elbowPoint?: Point2D;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: TextAlign;
  rotation?: number;
  leaderColor?: string;
  leaderWidth?: number;
  leaderStyle?: LeaderStyle;
  arrowType?: ArrowType;
  arrowSize?: number;
  layerId: string;
  selectable?: boolean;
}
