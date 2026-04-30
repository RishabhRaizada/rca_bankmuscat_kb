import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

interface DataItem {
  name: string;
  value: number;
}

export function CategoryBar({
  data,
  color,
  xLabel,
  yLabel,
}: {
  data: DataItem[];
  color?: string;
  xLabel?: string;
  yLabel?: string;
}) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 20, left: 20, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        {/* X Axis */}
        <XAxis
          dataKey="name"
          interval={0}
          height={60}
          tick={{ fontSize: 11 }}
        >
          {xLabel && (
            <text
              x={250}
              y={50}
              textAnchor="middle"
              fontSize={12}
              fill="#666"
            >
              {xLabel}
            </text>
          )}
        </XAxis>

        {/* Y Axis */}
        <YAxis allowDecimals={false}>
          {yLabel && (
            <text
              x={-10}
              y={80}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize={12}
              fill="#666"
            >
              {yLabel}
            </text>
          )}
        </YAxis>

        <Tooltip />

        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {/* ✅ VALUE LABELS ON BARS */}
          <LabelList dataKey="value" position="top" fontSize={11} />

          {data.map((_, i) => (
            <Cell key={i} fill={color ?? COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}