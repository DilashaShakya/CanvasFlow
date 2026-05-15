"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ellipse, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
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

function getDraftBounds(start: Point, end: Point) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return { x, y, width, height };
}

type TextDraft = {
  scenePoint: Point;
  screenPoint: Point;
  value: string;
};

export function BoardCanvasInner({ boardId, token, userId, username, userColor }: BoardCanvasProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const shapeRefs = useRef(new Map<string, Konva.Node>());
  const lastCursorEmitAtRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 720 });
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [textDraft, setTextDraft] = useState<TextDraft | null>(null);
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
  const selectedTransformableShape = useMemo(() => {
    const shape = scene?.shapes.find((candidate) => candidate.id === selectedShapeId) ?? null;
    if (!shape) {
      return null;
    }

    if (shape.type === "text" || shape.type === "rectangle" || shape.type === "ellipse") {
      return shape;
    }

    return null;
  }, [scene?.shapes, selectedShapeId]);

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

  useEffect(() => {
    if (textDraft) {
      window.requestAnimationFrame(() => {
        textInputRef.current?.focus();
      });
    }
  }, [textDraft]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) {
      return;
    }

    if (!selectedTransformableShape || tool !== "select") {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const selectedNode = shapeRefs.current.get(selectedTransformableShape.id);
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedTransformableShape, tool]);

  useEffect(() => {
    if (textDraft && tool !== "text") {
      commitTextDraft(textInputRef.current?.value ?? textDraft.value);
    }
  }, [textDraft, tool]);

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
      setTextDraft({
        scenePoint: point,
        screenPoint: {
          x: point.x * viewport.scale + viewport.x,
          y: point.y * viewport.scale + viewport.y,
        },
        value: "",
      });
      return;
    }

    if (tool === "pencil") {
      setDraftPoints([point]);
      return;
    }

    if (tool === "rectangle" || tool === "ellipse") {
      setDragStart(point);
      setDragCurrent(point);
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

    if ((tool === "rectangle" || tool === "ellipse") && dragStart) {
      setDragCurrent(point);
    }
  }

  function commitLocalShape(shape: BoardShape | null) {
    if (!shape) {
      return;
    }

    upsertShape(shape);
    socket.emit("board:editing", { boardId, isEditing: false });
  }

  function commitTextDraft(value: string) {
    if (!textDraft) {
      return;
    }

    const text = value.trim();
    if (text) {
      commitLocalShape(
        createTextShape(textDraft.scenePoint, text, {
          stroke,
          fill,
          strokeWidth,
          createdBy: userId,
        }),
      );
    }

    setTextDraft(null);
  }

  function handleStageMouseUp() {
    const point = getScenePoint();
    if (!point) {
      setDraftPoints([]);
      setDragStart(null);
      setDragCurrent(null);
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
    setDragCurrent(null);
  }

  const draftBounds = dragStart && dragCurrent ? getDraftBounds(dragStart, dragCurrent) : null;

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

  function setShapeRef(shapeId: string, node: Konva.Node | null) {
    if (node) {
      shapeRefs.current.set(shapeId, node);
      return;
    }

    shapeRefs.current.delete(shapeId);
  }

  function handleTextTransformEnd(shape: Extract<BoardShape, { type: "text" }>, event: Konva.KonvaEventObject<Event>) {
    const node = event.target;
    const scale = Math.max(node.scaleX(), node.scaleY());
    const fontSize = Math.max(8, Math.round(shape.fontSize * scale));

    node.scaleX(1);
    node.scaleY(1);

    upsertShape({
      ...shape,
      x: node.x(),
      y: node.y(),
      fontSize,
      version: shape.version + 1,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleRectangleTransformEnd(shape: Extract<BoardShape, { type: "rectangle" }>, event: Konva.KonvaEventObject<Event>) {
    const node = event.target as Konva.Rect;
    const width = Math.max(8, shape.width * node.scaleX());
    const height = Math.max(8, shape.height * node.scaleY());

    node.scaleX(1);
    node.scaleY(1);

    upsertShape({
      ...shape,
      x: node.x(),
      y: node.y(),
      width,
      height,
      version: shape.version + 1,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleEllipseTransformEnd(shape: Extract<BoardShape, { type: "ellipse" }>, event: Konva.KonvaEventObject<Event>) {
    const node = event.target as Konva.Ellipse;
    const radiusX = Math.max(4, shape.radiusX * node.scaleX());
    const radiusY = Math.max(4, shape.radiusY * node.scaleY());

    node.scaleX(1);
    node.scaleY(1);

    upsertShape({
      ...shape,
      x: node.x(),
      y: node.y(),
      radiusX,
      radiusY,
      version: shape.version + 1,
      updatedAt: new Date().toISOString(),
    });
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
      className="relative h-[calc(100vh-10rem)] min-h-[520px] flex-1 overflow-hidden rounded-[2rem] border border-zinc-200 shadow-2xl shadow-zinc-950/10"
      style={{
        backgroundColor: "#FFFFFF",
        backgroundImage:
          "linear-gradient(rgba(24, 24, 27, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 24, 27, 0.055) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {scene?.shapes.length === 0 ? (
        <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-600 shadow-2xl shadow-zinc-950/10 backdrop-blur">
          Empty board. Pick a tool and start drawing.
        </div>
      ) : null}
      {textDraft ? (
        <input
          ref={textInputRef}
          value={textDraft.value}
          onChange={(event) => setTextDraft((current) => (current ? { ...current, value: event.target.value } : current))}
          onBlur={(event) => commitTextDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitTextDraft(event.currentTarget.value);
            }

            if (event.key === "Escape") {
              event.preventDefault();
              setTextDraft(null);
            }
          }}
          onMouseDown={(event) => event.stopPropagation()}
          className="absolute z-20 min-w-48 rounded-xl border-2 border-zinc-300 bg-white px-3 py-2 text-lg font-semibold text-zinc-950 shadow-xl shadow-zinc-950/15 outline-none ring-4 ring-violet-500/15 placeholder:text-zinc-400"
          style={{
            left: textDraft.screenPoint.x,
            top: textDraft.screenPoint.y,
            transform: "translateY(-50%)",
          }}
          placeholder="Type text..."
        />
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
              ref: (node: Konva.Node | null) => setShapeRef(shape.id, node),
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
                  onTransformEnd={(event) => handleRectangleTransformEnd(shape, event)}
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
                  onTransformEnd={(event) => handleEllipseTransformEnd(shape, event)}
                />
              );
            }

            if (shape.type === "text") {
              return (
                <Text
                  {...commonProps}
                  text={shape.text}
                  fill={shape.stroke}
                  fontSize={shape.fontSize}
                  onTransformEnd={(event) => handleTextTransformEnd(shape, event)}
                />
              );
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

          {draftBounds && tool === "rectangle" ? (
            <Rect
              x={draftBounds.x}
              y={draftBounds.y}
              width={draftBounds.width}
              height={draftBounds.height}
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              dash={[10, 6]}
              cornerRadius={16}
            />
          ) : null}

          {draftBounds && tool === "ellipse" ? (
            <Ellipse
              x={draftBounds.x + draftBounds.width / 2}
              y={draftBounds.y + draftBounds.height / 2}
              radiusX={draftBounds.width / 2}
              radiusY={draftBounds.height / 2}
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              dash={[10, 6]}
            />
          ) : null}

          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            anchorFill="#8B5CF6"
            anchorStroke="#FFFFFF"
            borderStroke="#8B5CF6"
            anchorSize={10}
            keepRatio={selectedTransformableShape?.type === "text"}
          />
        </Layer>
      </Stage>
    </div>
  );
}
