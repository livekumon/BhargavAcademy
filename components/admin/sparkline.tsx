import { cn } from "cn";

/**
 * A tiny trend line: faint area, brand stroke, emphasised latest point. It is
 * decoration next to a labelled number, so it is hidden from assistive tech.
 * The SVG stretches to its box; the end dot is HTML so it stays round.
 */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2 || values.every((value) => value === 0)) {
    return <div aria-hidden="true" className={className} />;
  }

  const width = 100;
  const height = 28;
  const pad = 3;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const lastY = points.at(-1)![1];

  return (
    <div aria-hidden="true" className={cn("relative", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="size-full">
        <polygon points={`0,${height} ${line} ${width},${height}`} className="fill-brand/10" />
        <polyline
          points={line}
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-brand"
        />
      </svg>
      <span
        className="absolute right-0 size-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-2 ring-surface"
        style={{ top: `${(lastY / height) * 100}%` }}
      />
    </div>
  );
}
