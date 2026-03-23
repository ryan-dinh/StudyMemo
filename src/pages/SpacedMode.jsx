const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, Brain } from 'lucide-react';
import FlipCard from '@/components/study/FlipCard';
import SessionComplete from '@/components/study/SessionComplete';
import { computeNextReview } from '@/lib/utils';
import { motion } from 'framer-motion';

const QUALITY = [
  { label: 'Again', q: 0, className: 'border-rose-200 text-rose-600 hover:bg-rose-50' },
  { label: 'Hard', q: 1, className: 'border-amber-200 text-amber-600 hover:bg-amber-50' },
  { label: 'Good', q: 2, className: 'border-blue-200 text-blue-600 hover:bg-blue-50' },
  { label: 'Easy', q: 3, className: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' },
];

export default function SpacedMode() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);

  const { data: set } = useQuery({
    queryKey: ['set', id],
    queryFn: () => db.entities.FlashcardSet.filter({ id }),
    select: d => d[0],
  });

  const { data: rawCards = [] } = useQuery({
    queryKey: ['cards', id],
    queryFn: () => db.entities.Flashcard.filter({ set_id: id }),
  });

  useEffect(() => {
    if (rawCards.length > 0) {
      const now = new Date();
      const due = rawCards.filter(c => !c.due_date || new Date(c.due_date) <= now);
      setQueue(due.length > 0 ? due : rawCards.slice(0, Math.min(10, rawCards.length)));
    }
  }, [rawCards]);

  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, data }) => db.entities.Flashcard.update(cardId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', id] }),
  });

  const handleQuality = (q) => {
    const card = queue[index];
    const nextReview = computeNextReview(card, q);
    const isCorrect = q >= 2;
    updateCardMutation.mutate({
      cardId: card.id,
      data: {
        ...nextReview,
        times_correct: (card.times_correct || 0) + (isCorrect ? 1 : 0),
        times_incorrect: (card.times_incorrect || 0) + (isCorrect ? 0 : 1),
      }
    });
    if (isCorrect) setCorrect(c => c + 1); else setIncorrect(c => c + 1);

    if (index + 1 >= queue.length) {
      setDone(true);
      db.entities.FlashcardSet.update(id, { last_studied: new Date().toISOString() });
      db.entities.StudySession.create({
        set_id: id, mode: 'spaced', total_cards: queue.length,
        correct: correct + (isCorrect ? 1 : 0), incorrect: incorrect + (isCorrect ? 0 : 1),
        completed: true, score_pct: Math.round(((correct + (isCorrect ? 1 : 0)) / queue.length) * 100),
      });
    } else {
      setFlipped(false);
      setTimeout(() => setIndex(i => i + 1), 150);
    }
  };

  const handleRestart = () => {
    setQueue([...rawCards]);
    setIndex(0); setFlipped(false); setCorrect(0); setIncorrect(0); setDone(false);
  };

  if (queue.length === 0) {
    return (
      <div className="text-center py-20">
        <Brain className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No cards due!</h2>
        <p className="text-sm text-muted-foreground mb-5">All cards are scheduled for a later time.</p>
        <Button asChild variant="outline"><Link to={`/set/${id}`}>Back to set</Link></Button>
      </div>
    );
  }

  if (done) return (
    <SessionComplete setTitle={set?.title} total={queue.length} correct={correct} incorrect={incorrect}
      onRestart={handleRestart} onShuffle={handleRestart} setId={id} mode="spaced" />
  );

  const card = queue[index];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <Link to={`/set/${id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />Exit
        </Link>
        <div className="flex items-center gap-2 bg-primary/5 rounded-full px-3 py-1">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Spaced Repetition</span>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">{index + 1}/{queue.length}</span>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full mb-6">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((index) / queue.length) * 100}%` }} />
      </div>

      <div className="mb-6" style={{ minHeight: '260px' }}>
        <FlipCard front={card.front} back={card.back} flipped={flipped} onFlip={() => setFlipped(f => !f)} />
      </div>

      {!flipped ? (
        <p className="text-center text-sm text-muted-foreground">
          Tap card or press <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-xs font-mono border">Space</kbd> to reveal
        </p>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <p className="text-center text-xs text-muted-foreground font-medium">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-2">
            {QUALITY.map(({ label, q, className }) => (
              <Button key={q} variant="outline" size="sm" className={`${className} font-medium`} onClick={() => handleQuality(q)}>
                {label}
              </Button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">Again → soon · Easy → {card.interval ? Math.round(card.interval * 2.5) : 4}d</p>
        </motion.div>
      )}
    </div>
  );
}