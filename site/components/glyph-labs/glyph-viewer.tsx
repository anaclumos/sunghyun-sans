"use client";

import { memo, useMemo } from "react";
import opentype from "opentype.js";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface GlyphViewerBaseProps {
  font: opentype.Font | null;
  char: string;
  fontSize?: number;
  showPoints?: boolean;
  color?: string;
  className?: string;
}

type GlyphViewerCardProps = GlyphViewerBaseProps;

type GlyphViewerOverlayProps = GlyphViewerBaseProps;

interface GlyphViewerCanvasProps extends GlyphViewerBaseProps {
  mode: "card" | "overlay";
}

const VIEW_SIZE = 400;

function hasCoordinates(cmd: opentype.Command): cmd is opentype.Command & { x: number; y: number } {
  return typeof cmd.x === "number" && typeof cmd.y === "number";
}

function hasControlPoint1(cmd: opentype.Command): cmd is opentype.Command & { x1: number; y1: number } {
  return typeof cmd.x1 === "number" && typeof cmd.y1 === "number";
}

function hasControlPoint2(cmd: opentype.Command): cmd is opentype.Command & { x2: number; y2: number } {
  return typeof cmd.x2 === "number" && typeof cmd.y2 === "number";
}

const EMPTY_GEOMETRY = {
  pathData: "",
  points: [] as React.ReactElement[],
  viewBox: `0 0 ${VIEW_SIZE} ${VIEW_SIZE}`,
  center: { x: VIEW_SIZE / 2, y: VIEW_SIZE / 2 },
};

function GlyphViewerCanvas({
  font,
  char,
  fontSize = 300,
  showPoints = true,
  color = "black",
  className,
  mode,
}: GlyphViewerCanvasProps) {
  const t = useTranslations("GlyphViewer");

  const { pathData, points, viewBox, center } = useMemo(() => {
    if (!font) return EMPTY_GEOMETRY;

    const glyph = font.charToGlyph(char);
    const path = glyph.getPath(0, fontSize, fontSize);
    const bb = path.getBoundingBox();
    const computedPathData = path.toPathData(2);

    const bboxW = bb.x2 - bb.x1;
    const bboxH = bb.y2 - bb.y1;
    const cx = bb.x1 + bboxW / 2;
    const cy = bb.y1 + bboxH / 2;
    const computedViewBox = bboxW > 0 && bboxH > 0
      ? `${cx - VIEW_SIZE / 2} ${cy - VIEW_SIZE / 2} ${VIEW_SIZE} ${VIEW_SIZE}`
      : `0 0 ${VIEW_SIZE} ${VIEW_SIZE}`;

    const newPoints: React.ReactElement[] = [];
    if (showPoints) {
      let lastX = 0;
      let lastY = fontSize;

      path.commands.forEach((cmd, index) => {
        const keyBase = `${char}-${index}-${cmd.type}`;
        if (cmd.type === "M" && hasCoordinates(cmd)) {
          lastX = cmd.x;
          lastY = cmd.y;
          newPoints.push(
            <circle key={`${keyBase}-m`} cx={cmd.x} cy={cmd.y} r={3} fill={color} />
          );
        } else if (cmd.type === "L" && hasCoordinates(cmd)) {
          newPoints.push(
            <circle key={`${keyBase}-l`} cx={cmd.x} cy={cmd.y} r={3} fill={color} />
          );
          lastX = cmd.x;
          lastY = cmd.y;
        } else if (cmd.type === "C" && hasCoordinates(cmd) && hasControlPoint1(cmd) && hasControlPoint2(cmd)) {
          newPoints.push(
            <line
              key={`${keyBase}-c-l1`}
              x1={lastX}
              y1={lastY}
              x2={cmd.x1}
              y2={cmd.y1}
              stroke={color}
              strokeWidth={1}
              opacity={0.5}
            />
          );
          newPoints.push(
            <circle
              key={`${keyBase}-c-p1`}
              cx={cmd.x1}
              cy={cmd.y1}
              r={2}
              style={{ fill: 'var(--surface)' }}
              stroke={color}
              strokeWidth={1}
            />
          );
          newPoints.push(
            <line
              key={`${keyBase}-c-l2`}
              x1={cmd.x2}
              y1={cmd.y2}
              x2={cmd.x}
              y2={cmd.y}
              stroke={color}
              strokeWidth={1}
              opacity={0.5}
            />
          );
          newPoints.push(
            <circle
              key={`${keyBase}-c-p2`}
              cx={cmd.x2}
              cy={cmd.y2}
              r={2}
              style={{ fill: 'var(--surface)' }}
              stroke={color}
              strokeWidth={1}
            />
          );
          newPoints.push(
            <circle key={`${keyBase}-c-e`} cx={cmd.x} cy={cmd.y} r={3} fill={color} />
          );
          lastX = cmd.x;
          lastY = cmd.y;
        } else if (cmd.type === "Q" && hasCoordinates(cmd) && hasControlPoint1(cmd)) {
          newPoints.push(
            <line
              key={`${keyBase}-q-l1`}
              x1={lastX}
              y1={lastY}
              x2={cmd.x1}
              y2={cmd.y1}
              stroke={color}
              strokeWidth={1}
              opacity={0.5}
            />
          );
          newPoints.push(
            <line
              key={`${keyBase}-q-l2`}
              x1={cmd.x1}
              y1={cmd.y1}
              x2={cmd.x}
              y2={cmd.y}
              stroke={color}
              strokeWidth={1}
              opacity={0.5}
            />
          );
          newPoints.push(
            <circle
              key={`${keyBase}-q-p1`}
              cx={cmd.x1}
              cy={cmd.y1}
              r={2}
              style={{ fill: 'var(--surface)' }}
              stroke={color}
              strokeWidth={1}
            />
          );
          newPoints.push(
            <circle key={`${keyBase}-q-e`} cx={cmd.x} cy={cmd.y} r={3} fill={color} />
          );
          lastX = cmd.x;
          lastY = cmd.y;
        }
      });
    }

    return { pathData: computedPathData, points: newPoints, viewBox: computedViewBox, center: { x: cx, y: cy } };
  }, [font, char, fontSize, showPoints, color]);

  if (!font) {
    return (
      <div className="w-full aspect-square flex items-center justify-center text-warm-muted">
        {t("loading")}
      </div>
    );
  }

  const fontFamily = font.names.fontFamily.en || "Unknown Font";

  return (
    <div
      className={cn(
        "relative w-full aspect-square overflow-hidden rounded-2xl transition-[background-color,border-color] duration-300",
        mode === "overlay" ? "bg-transparent" : "bg-surface border border-line",
        className
      )}
    >
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        aria-label={`Glyph ${char} from ${fontFamily}`}
      >
        <title>
          Glyph {char} from {fontFamily}
        </title>
        
        <line 
            x1={center.x - VIEW_SIZE} y1={center.y} 
            x2={center.x + VIEW_SIZE} y2={center.y} 
            style={{ stroke: 'var(--line)' }} strokeWidth={1} 
        />
        <line 
            x1={center.x} y1={center.y - VIEW_SIZE} 
            x2={center.x} y2={center.y + VIEW_SIZE} 
            style={{ stroke: 'var(--line)' }} strokeWidth={1} 
        />

        <path d={pathData} fill="none" stroke={color} strokeWidth={1.5} />
        {showPoints && points}
      </svg>
      {mode === "card" && (
        <div className="absolute bottom-4 left-4 text-xs font-medium text-warm-muted bg-surface/90 px-3 py-1.5 rounded-full backdrop-blur-sm border border-line">
          {fontFamily}
        </div>
      )}
    </div>
  );
}

export const GlyphViewerCard = memo(function GlyphViewerCard(props: GlyphViewerCardProps) {
  return <GlyphViewerCanvas {...props} mode="card" />;
});

export const GlyphViewerOverlay = memo(function GlyphViewerOverlay(props: GlyphViewerOverlayProps) {
  return <GlyphViewerCanvas {...props} mode="overlay" />;
});
