import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  alerts: { type: string; severity: string; title: string; message: string }[];
}

const severityStyles: Record<string, { icon: typeof Info; cls: string }> = {
  INFO: { icon: Info, cls: "text-primary" },
  WARNING: { icon: AlertTriangle, cls: "text-warning" },
  CRITICAL: { icon: AlertCircle, cls: "text-destructive" },
};

export function AlertsPanel({ alerts }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas inteligentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 && (
          <p className="text-sm text-muted-foreground">Todo en orden. Sin alertas activas.</p>
        )}
        {alerts.map((a, i) => {
          const s = severityStyles[a.severity] ?? severityStyles.INFO!;
          const Icon = s.icon;
          return (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", s.cls)} />
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.message}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
