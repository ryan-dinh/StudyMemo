const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Shuffle, RotateCcw, X } from 'lucide-react';
import FlipCard from '@/components/study/FlipCard';
import ProgressBar from '@/components/study/ProgressBar';
import SessionComplete from '@/components/study/SessionComplete';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Study() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [studyCards, setStudyCards] = useState([]);
  const [done, setDone] = useState(false);

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
    if (cards.length > 0 && studyCards.length === 0) {
      setStudyCards([...cards]);
    }
  }, [cards]);

  const handleShuffle = () => {
    setStudyCards(shuffleArray(cards));
    setCurrentIndex(0);
    setFlipped(false);
    setCorrect(0);
    setIncorrect(0);
    setDone(false);
  };

  const handleRestart = () => {
    setStudyCards([...cards]);
    setCurrentIndex(0);
    setFlipped(false);
    setCorrect(0);
    setIncorrect(0);
    setDone(false);
  };

  const advance = useCallback((delta) => {
    if (currentIndex + 1 >= studyCards.length && delta > 0) return;
    setFlipped(false);
    setTimeout(() => setCurrentIndex((i) => i + delta), 150);
  }, [currentIndex, studyCards.length]);

  const handleMark = (isCorrect) => {
    if (isCorrect) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);

    if (currentIndex + 1 >= studyCards.length) {
      setDone(true);
      db.entities.StudySession.create({
        set_id: id,
        total_cards: studyCards.length,
        correct: correct + (isCorrect ? 1 : 0),
        incorrect: incorrect + (isCorrect ? 0 : 1),
        mode: 'study',
        completed: true,
      });
    } else {
      setFlipped(false);
      setTimeout(() => setCurrentIndex((i) => i + 1), 150);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === 'ArrowRight' && flipped) handleMark(true);
      if (e.key === 'ArrowLeft' && flipped) handleMark(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipped, currentIndex]);

  if (isLoading) {
    return <div className="h-64 bg-muted rounded-xl animate-pulse" />;
  }

  if (studyCards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No cards to study</p>
        <Link to={`/set/${id}`} className="text-primary text-sm mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  if (done) {
    return (
      <SessionComplete
        setTitle={set?.title}
        total={studyCards.length}
        correct={correct}
        incorrect={incorrect}
        onRestart={handleRestart}
        onShuffle={handleShuffle}
        setId={id}
      />
    );
  }

  const card = studyCards[currentIndex];

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleShuffle} className="gap-1.5 text-muted-foreground">
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </Button>
        </div>
      </div>

      <ProgressBar current={currentIndex} total={studyCards.length} correct={correct} incorrect={incorrect} />

      <div className="mt-8 mb-8">
        <FlipCard front={card.front} back={card.back} flipped={flipped} onFlip={() => setFlipped(!flipped)} />
      </div>

      {!flipped ? (
        <p className="text-center text-sm text-muted-foreground">
          Tap card or press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Space</kbd> to flip
        </p>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            className="flex-1 max-w-[160px] gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => handleMark(false)}
          >
            <X className="w-4 h-4" />
            Incorrect
          </Button>
          <Button
            className="flex-1 max-w-[160px] gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleMark(true)}
          >
            ✓ Correct
          </Button>
        </div>
      )}
    </div>
  );
}