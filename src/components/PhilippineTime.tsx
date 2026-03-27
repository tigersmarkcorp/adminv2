import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function PhilippineTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const phTime = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(time);

  const phDate = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(time);

  return (
    <div className="px-4 py-3 rounded-xl bg-muted/50 border border-border/50 space-y-1.5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
        <Clock className="w-3 h-3" />
        <span>Philippine Time</span>
      </div>
      <div className="text-lg font-bold text-primary tabular-nums" style={{ fontFamily: "'Poppins', monospace" }}>
        {phTime}
      </div>
      <div className="text-[11px] text-muted-foreground">{phDate}</div>
    </div>
  );
}
