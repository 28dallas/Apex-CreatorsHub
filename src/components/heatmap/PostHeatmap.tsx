"use client";

import { useMemo } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12am";
  if (i < 12) return `${i}am`;
  if (i === 12) return "12pm";
  return `${i - 12}pm`;
});

export interface HeatmapCell {
  day: number;   // 0-6 (Sun-Sat)
  hour: number;  // 0-23
  engagement: number; // 0-100 normalized score
  post_count: number;
}

interface PostHeatmapProps {
  data: HeatmapCell[];
  goldenWindows: Array<{ day: number; hour: number }>;
}

function getColor(value: number, isGolden: boolean): string {
  if (isGolden) return "var(--country-accent)";
  if (value === 0) return "#1e293b";
  if (value < 20) return "#312e81";
  if (value < 40) return "#4338ca";
  if (value < 60) return "#6d28d9";
  if (value < 80) return "#7c3aed";
  return "#a855f7";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: HeatmapCell }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold text-white">{DAYS[d.day]} at {HOURS[d.hour]}</p>
      <p className="text-slate-400 mt-1">Engagement score: <span style={{ color: "var(--country-secondary)" }}>{d.engagement.toFixed(0)}</span></p>
      <p className="text-slate-400">Posts: <span className="text-white">{d.post_count}</span></p>
    </div>
  );
}

export default function PostHeatmap({ data, goldenWindows }: PostHeatmapProps) {
  const goldenSet = useMemo(
    () => new Set(goldenWindows.map((w) => `${w.day}-${w.hour}`)),
    [goldenWindows]
  );

  // Build full 7x24 grid, filling missing cells with 0
  const grid = useMemo(() => {
    const map = new Map(data.map((d) => [`${d.day}-${d.hour}`, d]));
    const cells: HeatmapCell[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        cells.push(map.get(`${day}-${hour}`) ?? { day, hour, engagement: 0, post_count: 0 });
      }
    }
    return cells;
  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      {/* Hour labels */}
      <div className="flex mb-1 ml-10">
        {HOURS.filter((_, i) => i % 3 === 0).map((h) => (
          <div key={h} className="flex-1 text-center text-xs text-slate-600 min-w-[28px]">
            {h}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1">
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1">
            <span className="text-xs text-slate-500 w-9 text-right flex-shrink-0">{day}</span>
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = grid[dayIdx * 24 + hour];
                const isGolden = goldenSet.has(`${dayIdx}-${hour}`);
                return (
                  <div
                    key={hour}
                    title={`${day} ${HOURS[hour]}: ${cell.engagement.toFixed(0)} score`}
                    className="flex-1 aspect-square rounded-sm min-w-[10px] transition-transform hover:scale-125 cursor-pointer"
                    style={{ backgroundColor: getColor(cell.engagement, isGolden) }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#1e293b]" /> No data
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#a855f7]" /> High engagement
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--country-accent)" }} /> 🏆 Golden window
        </div>
      </div>

      {goldenWindows.length > 0 && (
        <div className="mt-4 p-3 rounded-xl border" style={{ backgroundColor: "rgba(var(--country-accent-rgb),0.14)", borderColor: "rgba(var(--country-accent-rgb),0.24)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--country-accent)" }}>🏆 Top Golden Windows</p>
          <div className="flex flex-wrap gap-2">
            {goldenWindows.map((w) => (
              <span key={`${w.day}-${w.hour}`} className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: "rgba(var(--country-accent-rgb),0.18)", color: "var(--country-accent)" }}>
                {DAYS[w.day]} {HOURS[w.hour]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
