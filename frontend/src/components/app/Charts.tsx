import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

const COLORS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f97316", // orange
  "#ec4899", // pink
  "#8b5cf6", // violet
];

interface DataItem {
  name: string;
  value: number;
}

export function CategoryBar({
  data,
  color,
  colorMap,
  xLabel,
  yLabel,
  rotateLabels,
}: {
  data: DataItem[];
  color?: string;
  colorMap?: Record<string, string>;
  xLabel?: string;
  yLabel?: string;
  rotateLabels?: boolean;
}) {
  if (!data || data.length === 0) return null;

  const shouldRotate = rotateLabels ?? data.length > 4;
  const bottomMargin = shouldRotate ? 80 : 50;

  return (
    <ResponsiveContainer width="100%" height={shouldRotate ? 280 : 220}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 20, left: 20, bottom: bottomMargin }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />

        <XAxis
          dataKey="name"
          interval={0}
          height={shouldRotate ? 80 : 60}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tick={{ fontSize: 11, angle: shouldRotate ? -40 : 0, textAnchor: shouldRotate ? "end" : "middle", dy: shouldRotate ? 4 : 0 } as any}
          tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 16) + "…" : v}
          axisLine={false}
          tickLine={false}
        >
          {xLabel && (
            <text x={250} y={50} textAnchor="middle" fontSize={12} fill="#666">
              {xLabel}
            </text>
          )}
        </XAxis>

        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11 }}>
          {yLabel && (
            <text x={-10} y={80} transform="rotate(-90)" textAnchor="middle" fontSize={12} fill="#666">
              {yLabel}
            </text>
          )}
        </YAxis>

        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
        />

        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          <LabelList dataKey="value" position="top" fontSize={11} />
          {data.map((entry, i) => (
            <Cell key={i} fill={colorMap?.[entry.name] ?? color ?? COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function SentimentPie({
  data,
  colorMap,
}: {
  data: DataItem[];
  colorMap?: Record<string, string>;
}) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          outerRadius={90}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={colorMap?.[entry.name] ?? COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}