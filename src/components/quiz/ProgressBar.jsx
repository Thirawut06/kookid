import { Progress } from "@/components/ui/progress";

export default function ProgressBar({ current, total, sectionLabel }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{sectionLabel}</span>
        <span className="text-muted-foreground">{current}/{total} คำถาม</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}