export type ShapeTool = "select" | "pencil" | "rectangle" | "ellipse" | "text" | "eraser";

export type Point = {
  x: number;
  y: number;
};

type ShapeBase = {
  id: string;
  type: "path" | "rectangle" | "ellipse" | "text";
  x: number;
  y: number;
  rotation: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  version: number;
  createdBy: string;
  updatedAt: string;
};

export type PathShape = ShapeBase & {
  type: "path";
  points: Point[];
};

export type RectangleShape = ShapeBase & {
  type: "rectangle";
  width: number;
  height: number;
};

export type EllipseShape = ShapeBase & {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
};

export type TextShape = ShapeBase & {
  type: "text";
  text: string;
  fontSize: number;
};

export type BoardShape = PathShape | RectangleShape | EllipseShape | TextShape;

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

export type BoardScene = {
  boardId: string;
  version: number;
  shapes: BoardShape[];
  updatedAt: string;
};

export type CursorState = {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
  boardId: string;
  updatedAt: string;
};

export type CollaboratorPresence = {
  userId: string;
  username: string;
  color: string;
  isEditing: boolean;
  lastSeenAt: string;
};

export type BoardMemberRole = "owner" | "editor" | "viewer" | "guest";
