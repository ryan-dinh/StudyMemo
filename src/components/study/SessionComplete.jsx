import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RotateCcw, Shuffle, ArrowLeft, Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SessionComplete({ setTitle, total, correct, incorrect, onRestart, onShuffle, setId, mode = 'study' }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '📚' : '💪';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
      <div className="text-5xl mb-4">{emoji}</div>
      <h2 className="text-2xl font-bold text-foreground mb-1">
        {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep practicing!'}
      </h2>
      <p className="text-muted-foreground mb-8 text-sm">{setTitle}</p>

      <div className="inline-grid grid-cols-3 gap-3 mb-10">
        {[
          { label: 'Score', value: `${pct}%`, color: 'text-primary' },
          { label: 'Correct', value: correct, color: 'text-emerald-600' },
          { label: 'Missed', value: incorrect, color: 'text-rose-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-border px-5 py-4 min-w-[80px]">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
        <Button onClick={onRestart} className="w-full sm:w-auto gap-2">
          <RotateCcw className="w-4 h-4" />Again
        </Button>
        {mode === 'flashcard' && (
          <Button onClick={onShuffle} variant="outline" className="w-full sm:w-auto gap-2">
            <Shuffle className="w-4 h-4" />Shuffle
          </Button>
        )}
        <Button asChild variant="ghost" className="w-full sm:w-auto gap-2">
          <Link to={`/set/${setId}`}><ArrowLeft className="w-4 h-4" />Back to set</Link>
        </Button>
      </div>
    </motion.div>
  );
}