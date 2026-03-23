const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useQuery } from '@tanstack/react-query';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Clock, Star } from 'lucide-react';

export default function SetStats({ setId, cardCount }) {
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', setId],
    queryFn: () => db.entities.StudySession.filter({ set_id: setId, completed: true }, '-created_date', 10),
  });

  if (sessions.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/60 p-5 text-center">
        <TrendingUp className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No study sessions yet</p>
      </div>
    );
  }

  const last = sessions[0];
  const avgScore = Math.round(sessions.reduce((s, r) => s + (r.score_pct || 0), 0) / sessions.length);
  const chartData = sessions.slice(0, 7).reverse().map((s, i) => ({
    name: `${i + 1}`,
    score: s.score_pct || 0,
  }));

  return (
    <div className="bg-card rounded-xl border border-border/60 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Statistics</h3>
      <div className="grid grid-cols-3 gap-3">
        {[
          { IconComp: Star, label: 'Avg Score', value: `${avgScore}%`, color: 'text-amber-500' },
          { IconComp: TrendingUp, label: 'Sessions', value: sessions.length, color: 'text-primary' },
          { IconComp: Clock, label: 'Last Score', value: `${last.score_pct || 0}%`, color: 'text-emerald-500' },
        ].map(({ IconComp, label, value, color }) => (
          <div key={label} className="text-center bg-muted/50 rounded-lg p-3">
            <IconComp className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
            <p className="text-sm font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {chartData.length > 1 && (
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={16}>
              <XAxis dataKey="name" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--primary))`} opacity={0.6 + (i / chartData.length) * 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}