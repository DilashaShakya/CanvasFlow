"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ellipse, Layer, Line, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";

import type { BoardShape, Point } from "@canvasflow/shared";

import { getSocket } from "@/lib/socket";
import { useBoardStore } from "@/features/board/store/use-board-store";

import { createPathShape, createShapeFromDrag, createTextShape } from "../lib/shape-factories";

export type BoardCanvasProps = {
  boardId: string;
  token: string;
  userId: string;
  username: string;
  userColor: string;
};

function toFlatPoints(points: Point[]) {
  return points.flatMap((point) => [point.x, point.y]);
}

export function BoardCanvasInner({ boardId, token, userId, username, userColor }: BoardCanvasProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastCursorEmitAtRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 720 });
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const scene = useBoardStore((state) => state.scene);
  const tool = useBoardStore((state) => state.tool);
  const stroke = useBoardStore((state) => state.stroke);
  const fill = useBoardStore((state) => state.fill);
  const strokeWidth = useBoardStore((state) => state.strokeWidth);
  const viewport = useBoardStore((state) => state.viewport);
  const selectedShapeId = useBoardStore((state) => state.selectedShapeId);
  const sessionId = useBoardStore((state) => state.sessionId);
  const setViewport = useBoardStore((state) => state.setViewport);
  const selectShape = useBoardStore((state) => state.selectShape);
  const upsertShape = useBoardStore((state) => state.upsertShape);
  const removeShape = useBoardStore((state) => state.removeShape);

  const socket = useMemo(() => getSocket(token, sessionId ?? undefined), [sessionId, token]);

  useEffect(() => {
    function syncDimensions(width: number, height: number) {
      if (width <= 0 || height <= 0) {
        return;
      }

      setDimensions({
        width,
        height,
      });
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        syncDimensions(entry.contentRect.width, entry.contentRect.height);
      }
    });

    if (containerRef.current) {
      const bounds = containerRef.current.getBoundingClientRect();
      syncDimensions(bounds.width, bounds.height);
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  function getScenePoint() {
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) {
      return null;
    }

    return {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    };
  }

  function handleStageMouseDown(event: Konva.KonvaEventObject<MouseEvent>) {
    const point = getScenePoint();
    if (!point || !scene) {
      return;
    }

    const clickedOnEmptyStage = event.target === event.target.getStage();
    if (clickedOnEmptyStage) {
      selectShape(null);
    }

    if (tool === "text" && clickedOnEmptyStage) {
      const text = window.prompt("Add text to the board");
      if (text) {
        upsertShape(
          createTextShape(point, text, {
            stroke,
            fill,
            strokeWidth,
            createdBy: userId,
          }),
        );
      }
      return;
    }

    if (tool === "pencil") {
      setDraftPoints([point]);
      return;
    }

    if (tool === "rectangle" || tool === "ellipse") {
      setDragStart(point);
    }
  }

  function handleStageMouseMove() {
    const point = getScenePoint();
    if (!point) {
      return;
    }

    const now = Date.now();
    if (now - lastCursorEmitAtRef.current >= 50) {
      lastCursorEmitAtRef.current = now;
      socket.emit("board:cursor", {
        userId,
        username,
        color: userColor,
        x: point.x,
        y: point.y,
        boardId,
        updatedAt: new Date().toISOString(),
      });
    }

    if (tool === "pencil" && draftPoints.length) {
      setDraftPoints((current) => [...current, point]);
    }
  }

  function commitLocalShape(shape: BoardShape | null) {
    if (!shape) {
      return;
    }

    upsertShape(shape);
    socket.emit("board:editing", { boardId, isEditing: false });
  }

  function handleStageMouseUp() {
    const point = getScenePoint();
    if (!point) {
      setDraftPoints([]);
      setDragStart(null);
      return;
    }

    if (tool === "pencil" && draftPoints.length > 1) {
      commitLocalShape(
        createPathShape(draftPoints, {
          stroke,
          fill,
          strokeWidth,
          createdBy: userId,
        }),
      );
      setDraftPoints([]);
      return;
    }

    if ((tool === "rectangle" || tool === "ellipse") && dragStart) {
      commitLocalShape(
        createShapeFromDrag(tool, dragStart, point, {
          stroke,
          fill,
          strokeWidth,
          createdBy: userId,
        }),
      );
    }

    setDragStart(null);
  }

  function handleWheel(event: Konva.KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const nextScale = event.evt.deltaY > 0 ? viewport.scale * 0.92 : viewport.scale * 1.08;
    setViewport({ scale: Math.min(2.5, Math.max(0.4, nextScale)) });
  }

  function handleShapeDragEnd(shape: BoardShape, event: Konva.KonvaEventObject<DragEvent>) {
    upsertShape({
      ...shape,
      x: event.target.x(),
      y: event.target.y(),
      version: shape.version + 1,
      updatedAt: new Date().toISOString(),
    } as BoardShape);
  }

  function handleShapePointerDown(shape: BoardShape, event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    event.cancelBubble = true;

    if (tool === "eraser") {
      removeShape(shape.id);
      return;
    }

    selectShape(shape.id);
  }

  function handleShapePointerMove(shape: BoardShape, event: Konva.KonvaEventObject<MouseEvent>) {
    if (tool !== "eraser" || event.evt.buttons !== 1) {
      return;
    }

    event.cancelBubble = true;
    removeShape(shape.id);
  }

  return (
    <div
      ref={containerRef}
      className="sketch-paper sketch-border relative h-[calc(100vh-10rem)] min-h-[520px] flex-1 overflow-hidden rounded-[2rem] border-4"
    >
      {scene?.shapes.length === 0 ? (
        <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-2xl border border-[#6B3F24]/20 bg-[#FFF5DF]/80 px-4 py-3 text-sm text-[#5D3521] shadow-2xl shadow-amber-950/15 backdrop-blur">
          Empty board. Pick a tool and start drawing.
        </div>
      ) : null}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        draggable={false}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onWheel={handleWheel}
      >
        <Layer>
          {scene?.shapes.map((shape) => {
            const commonProps = {
              key: shape.id,
              x: shape.x,
              y: shape.y,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              draggable: tool === "select",
              onMouseDown: (event: Konva.KonvaEventObject<MouseEvent>) => handleShapePointerDown(shape, event),
              onMouseMove: (event: Konva.KonvaEventObject<MouseEvent>) => handleShapePointerMove(shape, event),
              onTap: (event: Konva.KonvaEventObject<TouchEvent>) => handleShapePointerDown(shape, event),
              onDragStart: () => socket.emit("board:editing", { boardId, isEditing: true }),
              onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => handleShapeDragEnd(shape, event),
            };

            if (shape.type === "rectangle") {
              return (
                <Rect
                  {...commonProps}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  cornerRadius={16}
                  shadowBlur={selectedShapeId === shape.id ? 16 : 0}
                />
              );
            }

            if (shape.type === "ellipse") {
              return (
                <Ellipse
                  {...commonProps}
                  radiusX={shape.radiusX}
                  radiusY={shape.radiusY}
                  fill={shape.fill}
                  shadowBlur={selectedShapeId === shape.id ? 16 : 0}
                />
              );
            }

            if (shape.type === "text") {
              return <Text {...commonProps} text={shape.text} fill={shape.stroke} fontSize={shape.fontSize} />;
            }

            return (
              <Line
                {...commonProps}
                points={toFlatPoints(shape.points)}
                hitStrokeWidth={Math.max(shape.strokeWidth + 16, 24)}
                lineCap="round"
                lineJoin="round"
                tension={0.2}
              />
            );
          })}

          {draftPoints.length > 1 ? (
            <Line points={toFlatPoints(draftPoints)} stroke={stroke} strokeWidth={strokeWidth} lineCap="round" lineJoin="round" tension={0.2} />
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
}
