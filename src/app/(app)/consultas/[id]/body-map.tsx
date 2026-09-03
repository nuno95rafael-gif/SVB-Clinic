"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  BODY_REGIONS,
  DECORATIVE_SHAPES,
  VIEW_BOX,
  VIEW_LABELS,
  painColor,
  type RegionShape,
} from "./body-map-data";
import type { BodySide, BodyView, PainAssessment } from "@/types/database";

type CommonShapeProps = {
  fill: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  onClick?: (e: MouseEvent<SVGElement>) => void;
  children?: ReactNode;
};

function ShapeEl({ shape, ...common }: { shape: RegionShape } & CommonShapeProps) {
  if (shape.kind === "ellipse") {
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
  }
  if (shape.kind === "circle") {
    return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
  }
  return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />;
}

export function BodyMap({
  view,
  onViewChange,
  points,
  pendingPoint = null,
  onRegionClick,
  readOnly = false,
}: {
  view: BodyView;
  onViewChange: (view: BodyView) => void;
  points: PainAssessment[];
  pendingPoint?: { region: string; side: BodySide; x: number; y: number } | null;
  onRegionClick?: (region: string, side: BodySide, x: number, y: number) => void;
  readOnly?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const box = VIEW_BOX[view];

  function handleClick(e: MouseEvent<SVGElement>, region: string, side: BodySide) {
    if (readOnly || !onRegionClick) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    const x = Math.min(1, Math.max(0, loc.x / box.w));
    const y = Math.min(1, Math.max(0, loc.y / box.h));
    onRegionClick(region, side, x, y);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(Object.keys(VIEW_LABELS) as BodyView[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            className={cn(
              "rounded-full px-3 py-1 text-[12.5px] font-medium border",
              v === view
                ? "bg-accent-soft text-accent-ink border-accent"
                : "border-line text-foreground-faint hover:text-foreground"
            )}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${box.w} ${box.h}`}
        className="w-full max-w-[260px] mx-auto select-none"
      >
        {DECORATIVE_SHAPES[view].map((shape, i) => (
          <ShapeEl key={`deco-${i}`} shape={shape} fill="var(--line)" opacity={0.35} />
        ))}

        {BODY_REGIONS[view].map((r) => (
          <ShapeEl
            key={r.key}
            shape={r.shape}
            fill="var(--mono-bg, var(--background))"
            stroke="var(--line-strong)"
            strokeWidth={1}
            className={cn(
              "transition-colors",
              readOnly ? "cursor-default" : "cursor-pointer hover:fill-[var(--accent-soft)]"
            )}
            onClick={(e: MouseEvent<SVGElement>) => handleClick(e, r.region, r.side)}
          >
            <title>
              {r.region} {r.side !== "central" ? `(${r.side})` : ""}
            </title>
          </ShapeEl>
        ))}

        {points
          .filter((p) => p.body_view === view && p.x !== null && p.y !== null)
          .map((p) => (
            <circle
              key={p.id}
              cx={(p.x ?? 0) * box.w}
              cy={(p.y ?? 0) * box.h}
              r={7}
              fill={painColor(p.intensity)}
              stroke="#fff"
              strokeWidth={1.5}
              pointerEvents="none"
            />
          ))}

        {pendingPoint && (
          <circle
            cx={pendingPoint.x * box.w}
            cy={pendingPoint.y * box.h}
            r={9}
            fill="none"
            stroke="var(--accent-ink)"
            strokeDasharray="3 2"
            strokeWidth={2}
            pointerEvents="none"
          />
        )}
      </svg>
      {!readOnly && (
        <p className="text-center text-[12px] text-foreground-faint mt-2">
          Clique numa região do corpo para marcar dor ou sintoma.
        </p>
      )}
    </div>
  );
}
