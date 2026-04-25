import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

export function CategoryBar({ data, horizontal = false, color }: { data: DataItem[]; horizontal?: boolean; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 16, left: horizontal ? 80 : 0, bottom: 8 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis dataKey="name" type="category" stroke="var(--color-muted-foreground)" fontSize={11} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
          </>
        )}
        <Tooltip
          cursor={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color ?? COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
