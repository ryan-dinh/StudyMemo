export default function ProgressBar({ current, total, correct, incorrect }) {
  const answered = correct + incorrect;
  const pct = total > 0 ? (answered / total) * 100 : 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground tabular-nums">
          {Math.min(current + 1, total)} <span className="text-muted-foreground/50">/</span> {total}
        </span>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {correct} correct
          </span>
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            {incorrect} missed
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}