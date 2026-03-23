const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, CheckCircle2, XCircle, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import SessionComplete from '@/components/study/SessionComplete';
import { shuffleArray } from '@/lib/utils';

function MultipleChoiceQ({ card, allCards, index, onAnswer, answered }) {
  const [selected, setSelected] = useState(null);
  const options = shuffleArray([
    card.back,
    ...shuffleArray(allCards.filter(c => c.id !== card.id).map(c => c.back)).slice(0, 3)
  ]);

  const handleSelect = (opt) => {
    if (answered) return;
    setSelected(opt);
    onAnswer(opt === card.back);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl border border-border/60 p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-xs font-semibold text-muted-foreground mt-0.5 w-6 shrink-0">{index + 1}.</span>
        <p className="font-semibold text-foreground">{card.front}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
        {options.map((opt, i) => {
          let cls = 'text-left px-4 py-3 rounded-xl border border-border text-sm transition-all ';
          if (!answered) cls += 'hover:bg-muted hover:border-primary/30 cursor-pointer';
          if (answered && opt === card.back) cls += 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium';
          else if (answered && opt === selected) cls += 'bg-rose-50 border-rose-300 text-rose-600';
          else if (answered) cls += 'opacity-50';
          return (
            <button key={i} className={cls} onClick={() => handleSelect(opt)} disabled={answered}>
              <span className="text-xs font-semibold text-muted-foreground mr-2">
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function TypedQ({ card, index, onAnswer, submitted }) {
  const [val, setVal] = useState('');
  const isCorrect = submitted && val.trim().toLowerCase() === card.back.trim().toLowerCase();
  const isWrong = submitted && !isCorrect;

  useEffect(() => { if (submitted && !isCorrect && val.trim()) onAnswer(false); }, [submitted]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`bg-card rounded-2xl border p-5 ${isCorrect ? 'border-emerald-200' : isWrong ? 'border-rose-200' : 'border-border/60'}`}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xs font-semibold text-muted-foreground mt-0.5 w-6 shrink-0">{index + 1}.</span>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-2">{card.front}</p>
          <div className="flex items-center gap-2">
            <Input
              value={val}
              onChange={e => setVal(e.target.value)}
              disabled={submitted}
              placeholder="Your answer…"
              className={`${isCorrect ? 'border-emerald-300 bg-emerald-50' : isWrong ? 'border-rose-300 bg-rose-50' : 'bg-background'}`}
            />
            {submitted && (isCorrect
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
          </div>
          {isWrong && <p className="text-xs text-emerald-600 mt-1.5">Correct: <span className="font-medium">{card.back}</span></p>}
        </div>
      </div>
    </motion.div>
  );
}

export default function TestMode() {
  const { id } = useParams();
  const [mode, setMode] = useState('choice'); // 'choice' | 'typed' | 'mixed'
  const [started, setStarted] = useState(false);
  const [testCards, setTestCards] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [typedAnswers, setTypedAnswers] = useState({});

  const { data: set } = useQuery({
    queryKey: ['set', id],
    queryFn: () => db.entities.FlashcardSet.filter({ id }),
    select: d => d[0],
  });
  const { data: rawCards = [] } = useQuery({
    queryKey: ['cards', id],
    queryFn: () => db.entities.Flashcard.filter({ set_id: id }, 'order'),
  });

  const start = (m) => {
    setMode(m);
    setTestCards(shuffleArray(rawCards));
    setAnswers({});
    setTypedAnswers({});
    setSubmitted(false);
    setStarted(true);
  };

  const handleMCAnswer = (cardId, isCorrect) => {
    setAnswers(a => ({ ...a, [cardId]: isCorrect }));
  };

  const handleSubmit = () => {
    // score typed answers
    const typedResults = {};
    if (mode !== 'choice') {
      testCards.forEach(c => {
        const val = (document.getElementById(`typed-${c.id}`)?.value || '').trim();
        typedResults[c.id] = val.toLowerCase() === c.back.trim().toLowerCase();
      });
    }
    setTypedAnswers(typedResults);
    setSubmitted(true);

    const allAnswers = { ...answers, ...typedResults };
    const correct = Object.values(allAnswers).filter(Boolean).length;
    const total = testCards.length;
    const pct = Math.round((correct / total) * 100);

    db.entities.StudySession.create({
      set_id: id,
      mode: mode === 'typed' ? 'test_typed' : 'test_multiple',
      total_cards: total, correct, incorrect: total - correct,
      completed: true, score_pct: pct,
    });
    db.entities.FlashcardSet.update(id, {
      last_studied: new Date().toISOString(),
      best_score: Math.max(set?.best_score || 0, pct),
    });
  };

  const correct = submitted
    ? Object.values({ ...answers, ...typedAnswers }).filter(Boolean).length
    : 0;

  if (submitted) {
    return (
      <div>
        <SessionComplete
          setTitle={set?.title} total={testCards.length} correct={correct}
          incorrect={testCards.length - correct} onRestart={() => start(mode)}
          onShuffle={() => start(mode)} setId={id} mode="test"
        />
        <div className="mt-6 space-y-3 max-w-2xl mx-auto">
          <h3 className="text-sm font-semibold text-muted-foreground">Detailed Results</h3>
          {testCards.map((card, i) => {
            const isCorrect = { ...answers, ...typedAnswers }[card.id];
            return (
              <div key={card.id} className={`bg-card rounded-xl border p-4 ${isCorrect ? 'border-emerald-200' : 'border-rose-200'}`}>
                <div className="flex items-center gap-3">
                  {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  <p className="text-sm font-medium flex-1">{card.front}</p>
                  <p className="text-xs text-muted-foreground">{card.back}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-sm mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <ListChecks className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Test Mode</h2>
        <p className="text-sm text-muted-foreground mb-8">{rawCards.length} cards · {set?.title}</p>
        {rawCards.length < 4 ? (
          <div className="space-y-2">
            <Button className="w-full" onClick={() => start('typed')}>Start Typed Test</Button>
            <Button asChild variant="outline" className="w-full"><Link to={`/set/${id}`}>Back</Link></Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" onClick={() => start('choice')}>Multiple Choice</Button>
            <Button variant="outline" className="w-full" onClick={() => start('typed')}>Written Answers</Button>
            <Button variant="outline" className="w-full" onClick={() => start('mixed')}>Mixed</Button>
            <Button asChild variant="ghost" className="w-full"><Link to={`/set/${id}`}>Back</Link></Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setStarted(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />Exit
        </button>
        <span className="text-sm font-medium text-muted-foreground">{set?.title}</span>
        <span className="text-xs text-muted-foreground">{testCards.length} questions</span>
      </div>

      <div className="space-y-4 mb-8">
        {testCards.map((card, i) => (
          mode === 'typed' || (mode === 'mixed' && i % 2 === 1) ? (
            <div key={card.id} className="bg-card rounded-2xl border border-border/60 p-5">
              <div className="flex items-start gap-3">
                <span className="text-xs font-semibold text-muted-foreground mt-0.5 w-6 shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-2">{card.front}</p>
                  <Input id={`typed-${card.id}`} disabled={submitted} placeholder="Your answer…" className="bg-background" />
                </div>
              </div>
            </div>
          ) : (
            <MultipleChoiceQ
              key={card.id} card={card} allCards={rawCards} index={i}
              onAnswer={(ok) => handleMCAnswer(card.id, ok)} answered={submitted}
            />
          )
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg" className="gap-2">
          <CheckCircle2 className="w-4 h-4" />Submit Test
        </Button>
      </div>
    </div>
  );
}