'use client';

import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Eraser, Pen, Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { DRAW_PALETTE } from '../../shared/constants';
import type { DrawStrokeSegment } from '../../shared/types';

export interface DrawingCanvasHandle {
  applyRemoteStroke: (stroke: DrawStrokeSegment) => void;
  clear: () => void;
}

interface DrawingCanvasProps {
  canDraw: boolean;
  onEmitStroke: (stroke: DrawStrokeSegment) => void;
  onEmitClear: () => void;
}

const BRUSH_SIZES = [
  { id: 'sm', label: 'Fin', size: 4 },
  { id: 'md', label: 'Moyen', size: 9 },
  { id: 'lg', label: 'Épais', size: 16 },
] as const;

const PEN_COLORS = DRAW_PALETTE.filter((c) => c !== '#FFFFFF');

export const DrawingCanvas = React.forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ canDraw, onEmitStroke, onEmitClear }, ref) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokesHistoryRef = useRef<DrawStrokeSegment[]>([]);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const lastEmitTimeRef = useRef<number>(0);

    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState<string>(PEN_COLORS[0]);
    const [brushSize, setBrushSize] = useState<number>(BRUSH_SIZES[1].size);

    const drawSegmentOnCanvas = (segment: DrawStrokeSegment) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = segment.tool === 'eraser' ? '#FFFFFF' : segment.color;
      ctx.lineWidth = segment.size;
      ctx.beginPath();
      ctx.moveTo(segment.x0 * width, segment.y0 * height);
      ctx.lineTo(segment.x1 * width, segment.y1 * height);
      ctx.stroke();
      ctx.restore();
    };

    const redrawAllStrokes = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      for (const seg of strokesHistoryRef.current) {
        drawSegmentOnCanvas(seg);
      }
    };

    useImperativeHandle(ref, () => ({
      applyRemoteStroke: (stroke: DrawStrokeSegment) => {
        strokesHistoryRef.current.push(stroke);
        drawSegmentOnCanvas(stroke);
      },
      clear: () => {
        strokesHistoryRef.current = [];
        redrawAllStrokes();
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const resizeCanvas = () => {
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.max(1, Math.floor(rect.width));
        const targetH = Math.max(1, Math.floor(rect.height));

        canvas.width = Math.floor(targetW * dpr);
        canvas.height = Math.floor(targetH * dpr);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        redrawAllStrokes();
      };

      resizeCanvas();
      const observer = new ResizeObserver(resizeCanvas);
      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(1, rect.width)));
      const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(1, rect.height)));
      return { x, y };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canDraw) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const pt = getNormalizedPoint(e);
      isDrawingRef.current = true;
      lastPointRef.current = pt;

      const dotSegment: DrawStrokeSegment = {
        x0: pt.x,
        y0: pt.y,
        x1: pt.x + 0.0001,
        y1: pt.y + 0.0001,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: tool === 'eraser' ? brushSize * 2 : brushSize,
        tool,
      };
      strokesHistoryRef.current.push(dotSegment);
      drawSegmentOnCanvas(dotSegment);
      onEmitStroke(dotSegment);
      lastEmitTimeRef.current = performance.now();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!canDraw || !isDrawingRef.current || !lastPointRef.current) return;
      const now = performance.now();
      const pt = getNormalizedPoint(e);
      const prev = lastPointRef.current;

      const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
      if (dist < 0.004) return;
      if (now - lastEmitTimeRef.current < 24 && dist < 0.04) {
        return;
      }

      const segment: DrawStrokeSegment = {
        x0: prev.x,
        y0: prev.y,
        x1: pt.x,
        y1: pt.y,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: tool === 'eraser' ? brushSize * 2 : brushSize,
        tool,
      };

      strokesHistoryRef.current.push(segment);
      drawSegmentOnCanvas(segment);
      lastPointRef.current = pt;
      lastEmitTimeRef.current = now;
      onEmitStroke(segment);
    };

    const stopDrawing = () => {
      isDrawingRef.current = false;
      lastPointRef.current = null;
    };

    const handleClearClick = () => {
      if (!canDraw) return;
      strokesHistoryRef.current = [];
      redrawAllStrokes();
      onEmitClear();
    };

    return (
      <div className="space-y-3">
        <div
          ref={containerRef}
          className="relative aspect-16/11 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            className={`h-full w-full touch-none select-none ${
              canDraw ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />
        </div>

        {canDraw && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTool('pen')}
                aria-pressed={tool === 'pen'}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tool === 'pen'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Pen className="h-3.5 w-3.5" />
                <span>{t.drawGuess.penTool}</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('eraser')}
                aria-pressed={tool === 'eraser'}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tool === 'eraser'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>{t.drawGuess.eraserTool}</span>
              </button>

              <div className="mx-1 h-5 w-px bg-slate-200 hidden sm:block" />

              {/* Color Swatches */}
              <div className="flex items-center gap-1.5">
                {PEN_COLORS.map((hex) => {
                  const active = tool === 'pen' && color === hex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        setTool('pen');
                        setColor(hex);
                      }}
                      aria-label={`Couleur ${hex}`}
                      aria-pressed={active}
                      className={`h-8 w-8 rounded-full border border-slate-200 transition-transform ${
                        active ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {BRUSH_SIZES.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBrushSize(b.size)}
                    className={`min-h-[32px] rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                      brushSize === b.size
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleClearClick}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t.drawGuess.clearCanvas}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
