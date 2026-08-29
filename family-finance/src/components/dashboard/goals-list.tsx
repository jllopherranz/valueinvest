import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

interface Props {
  goals: { name: string; current: number; target: number; progressPct: number }[];
}

export function GoalsList({ goals }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Objetivos de ahorro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((g) => (
          <div key={g.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{g.name}</span>
              <span className="text-muted-foreground">
                {formatCurrency(g.current)} / {formatCurrency(g.target)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, g.progressPct)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
