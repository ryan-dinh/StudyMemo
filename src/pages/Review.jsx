const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SessionComplete from '@/components/study/SessionComplete';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Review() {
  const { id } = useParams();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [reviewCards, setReviewCards] = useState([]);

  const { data: set } = useQuery({
    queryKey: ['set', id],
    queryFn: () => db.entities.FlashcardSet.filter({ id }),
    select: (d) => d[0],
  });

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['cards', id],
    queryFn: () => db.entities.Flashcard.filter({ set_id: id }, 'order'),
  });

  useEffect(() => {
    if (cards.length > 0 && reviewCards.length === 0) {
      setReviewCards(shuffleArray(cards));
    }
  }, [cards]);

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = reviewCards.filter(
      (c) => answers[c.id]?.trim().toLowerCase() === c.back.trim().toLowerCase()
    ).length;
    db.entities.StudySession.create({
      set_id: id,
      total_cards: reviewCards.length,
      correct,
      incorrect: reviewCards.length - correct,
      mode: 'review',
      completed: true,
    });
  };

  const handleRestart = () => {
    setReviewCards(shuffleArray(cards));
    setAnswers({});
    setSubmitted(false);
  };

  if (isLoading) {
    return <div className="h-64 bg-muted rounded-xl animate-pulse" />;
  }

  if (reviewCards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No cards to review</p>
        <Link to={`/set/${id}`} className="text-primary text-sm mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  if (submitted) {
    const correct = reviewCards.filter(
      (c) => answers[c.id]?.trim().toLowerCase() === c.back.trim().toLowerCase()
    ).length;

    return (
      <div>
        <SessionComplete
          setTitle={set?.title}
          total={reviewCards.length}
          correct={correct}
          incorrect={reviewCards.length - correct}
          onRestart={handleRestart}
          onShuffle={handleRestart}
          setId={id}
        />

        <div className="mt-8 space-y-3 max-w-2xl mx-auto">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Detailed Results</h3>
          {reviewCards.map((card) => {
            const userAnswer = answers[card.id]?.trim() || '';
            const isCorrect = userAnswer.toLowerCase() === card.back.trim().toLowerCase();
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`bg-card rounded-xl border p-4 ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{card.front}</p>
                    {!isCorrect && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-rose-500">Your answer: {userAnswer || '(empty)'}</p>
                        <p className="text-emerald-600">Correct: {card.back}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/set/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
          Exit
        </Link>
        <h2 className="text-sm font-medium text-muted-foreground">
          Review: {set?.title}
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Type the definition for each term. Answers are case-insensitive.
      </p>

      <div className="space-y-4 mb-8">
        {reviewCards.map((card, i) => (
          <div key={card.id} className="bg-card rounded-xl border border-border/60 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xs font-medium text-muted-foreground mt-2 w-6 shrink-0">{i + 1}.</span>
              <div className="flex-1 space-y-2">
                <p className="font-medium text-foreground">{card.front}</p>
                <Input
                  placeholder="Type your answer..."
                  value={answers[card.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [card.id]: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Submit Answers
        </Button>
      </div>
    </div>
  );
}