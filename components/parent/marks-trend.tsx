"use client";

import { useId, useState } from "react";
import { cn } from "cn";

export type TrendPoint = {
  id: string;
  /** Short date, already formatted on the server so both renders agree. */
  date: string;
  /** Percentage when the maximum is known, otherwise the raw score. */
  score: number;
  /** How the mark reads to a person, e.g. "81/100". */
  label: string;
  chapters: string;
  paper: string;
  delta: number | null;
};

const W = 320;
const H = 132;
const PAD = { top: 14, right: 12, bottom: 14, left: 12 };

/**
 * One series over time: a 2px line, 8px markers, a hover and focus tooltip
 * on every point, and a table for screen readers. Colour carries no meaning
 * a label does not also carry.
 */
export function MarksTrend({
  points,
  percent,
  className,
}: {
  points: TrendPoint[];
  /** When every mark has a maximum the scale is fixed to 0–100. */
  percent: boolean;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();

  if (points.length === 0) return null;

  const scores = points.map((point) => point.score);
  const min = percent ? 0 : Math.max(0, Math.floor(Math.min(...scores) * 0.85));
  const max = percent ? 100 : Math.ceil(Math.max(...scores) * 1.1) || 1;
  const x = (index: number) =>
    points.length === 1
      ? W / 2
      : PAD.left + (index / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (score: number) =>
    PAD.top + (1 - (score - min) / (max - min || 1)) * (H - PAD.top - PAD.bottom);

  const coords = points.map((point, index) => [x(index), y(point.score)] as const);
  const line = coords.map(([cx, cy], index) => `${index === 0 ? "M" : "L"}${cx},${cy}`).join(" ");
  const area = `${line} L${coords.at(-1)![0]},${H - PAD.bottom} L${coords[0][0]},${H - PAD.bottom} Z`;
  const shown = active === null ? null : points[active];

  return (
    <figure className={cn("relative", className)}>
      <div className="relative" onMouseLeave={() => setActive(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={`Marks trend across ${points.length} tests`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.5].map((fraction) => (
            <line
              key={fraction}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={PAD.top + fraction * (H - PAD.top - PAD.bottom)}
              y2={PAD.top + fraction * (H - PAD.top - PAD.bottom)}
              className="stroke-line"
              strokeDasharray="3 4"
            />
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="stroke-line" />
          {points.length > 1 ? (
            <>
              <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" />
              <path
                d={line}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                strokeDasharray="100"
                className="animate-draw stroke-brand"
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
          {active !== null ? (
            <line
              x1={coords[active][0]}
              x2={coords[active][0]}
              y1={PAD.top}
              y2={H - PAD.bottom}
              className="stroke-line-strong"
            />
          ) : null}
          {coords.map(([cx, cy], index) => (
            <g key={points[index].id}>
              <circle
                cx={cx}
                cy={cy}
                r={active === index || index === coords.length - 1 ? 5 : 4}
                className="fill-brand stroke-surface"
                strokeWidth="2"
              />
              <circle
                cx={cx}
                cy={cy}
                r="16"
                fill="transparent"
                tabIndex={0}
                aria-label={`${points[index].date}: ${points[index].label}`}
                className="cursor-pointer outline-none focus-visible:stroke-ring focus-visible:stroke-2"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              />
            </g>
          ))}
        </svg>

        {shown && active !== null ? (
          <div
            role="status"
            className="pointer-events-none absolute z-10 w-max max-w-56 -translate-x-1/2 -translate-y-full rounded-lg bg-raised px-3 py-2 text-xs shadow-elevation-lg ring-1 ring-line"
            style={{
              left: `${Math.min(85, Math.max(15, (coords[active][0] / W) * 100))}%`,
              top: `calc(${(coords[active][1] / H) * 100}% - 10px)`,
            }}
          >
            <p className="font-heading tabular text-title-3 font-semibold text-content">
              {shown.label}
              {shown.delta !== null && shown.delta !== 0 ? (
                <span
                  className={cn(
                    "ml-2 font-sans text-xs font-medium",
                    shown.delta > 0 ? "text-success" : "text-danger",
                  )}
                >
                  {shown.delta > 0 ? "▲" : "▼"} {Math.abs(shown.delta)}
                  {percent ? " pts" : ""}
                </span>
              ) : null}
            </p>
            <p className="truncate text-content-muted">{shown.chapters}</p>
            <p className="text-content-subtle">
              {shown.paper} · {shown.date}
            </p>
          </div>
        ) : null}
      </div>

      <figcaption className="mt-2 flex justify-between text-xs text-content-subtle">
        <span>{points[0].date}</span>
        {points.length > 1 ? <span>{points.at(-1)!.date}</span> : null}
      </figcaption>

      <table className="sr-only">
        <caption>Marks by test date</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Marks</th>
            <th scope="col">Chapters</th>
            <th scope="col">Paper</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.id}>
              <td>{point.date}</td>
              <td>{point.label}</td>
              <td>{point.chapters}</td>
              <td>{point.paper}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
