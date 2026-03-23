const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, Shuffle, RotateCcw, ArrowRightLeft, Maximize2, Minimize2 } from 'lucide-react';
import FlipCard from '@/components/study/FlipCard';
import ClozeCard from '@/components/study/ClozeCard';
import ProgressBar from '@/components/study/ProgressBar';
import StudyControls from '@/components/study/StudyControls';
import SessionComplete from '@/components/study/SessionComplete';
import { shuffleArray } from '@/lib/utils';

function useFullscreen() {
  const ref = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const enter = () => ref.current?.requestFullscreen?.();
  const exit = () => document.exitFullscreen?.();
  const toggle = () => isFullscreen ? exit() : enter();

  return { ref, isFullscreen, toggle };
}

export default function StudyMode() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [startTime] = useState(Date.now());
  const { ref: fullscreenRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  // Touch swipe tracking
  const touchStart = useRef(null);

  const { data: set } = useQuery({
    queryKey: ['set', id],
    queryFn: () => db.entities.FlashcardSet.filter({ id }),
    select: d => d[0],
  });

  const { data: rawCards = [] } = useQuery({
    queryKey: ['cards', id],
    queryFn: () => db.entities.Flashcard.filter({ set_id: id }, 'order'),
  });

  useEffect(() => {
    if (rawCards.length > 0 && cards.length === 0) setCards([...rawCards]);
  }, [rawCards]);

  const finish = useCallback((c, ic) => {
    setDone(true);
    const pct = Math.round((c / cards.length) * 100);
    db.entities.FlashcardSet.update(id, {
      last_studied: new Date().toISOString(),
      total_studied: (set?.total_studied || 0) + 1,
      best_score: Math.max(set?.best_score || 0, pct),
    });
    db.entities.StudySession.create({
      set_id: id, mode: 'flashcard', total_cards: cards.length,
      correct: c, incorrect: ic, completed: true, score_pct: pct,
      duration_seconds: Math.round((Date.now() - startTime) / 1000),
    });
  }, [cards.length, id, set, startTime]);

  const markCard = useCallback((isCorrect) => {
    const newCorrect = correct + (isCorrect ? 1 : 0);
    const newIncorrect = incorrect + (isCorrect ? 0 : 1);
    if (index + 1 >= cards.length) {
      setCorrect(newCorrect); setIncorrect(newIncorrect);
      finish(newCorrect, newIncorrect);
    } else {
      setFlipped(false);
      setTimeout(() => { setIndex(i => i + 1); setCorrect(newCorrect); setIncorrect(newIncorrect); }, 150);
    }
  }, [correct, incorrect, index, cards.length, finish]);

  const handleShuffle = () => {
    setCards(shuffleArray(rawCards));
    setIndex(0); setFlipped(false); setCorrect(0); setIncorrect(0); setDone(false);
  };
  const handleRestart = () => {
    setCards([...rawCards]);
    setIndex(0); setFlipped(false); setCorrect(0); setIncorrect(0); setDone(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (done) return;
      const card = cards[index];
      if (card?.card_type === 'cloze') return; // cloze handles its own keys
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f); }
      if (e.key === 'ArrowRight' && flipped) markCard(true);
      if (e.key === 'ArrowLeft' && flipped) markCard(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, done, markCard, cards, index]);

  // Touch/swipe handlers
  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null || done) return;
    const card = cards[index];
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) < 50) return; // too small
    if (!flipped && card?.card_type !== 'cloze') {
      setFlipped(true); // swipe any direction to flip if not flipped
    } else if (flipped && card?.card_type !== 'cloze') {
      if (diff > 0) markCard(true);  // swipe right = correct
      else markCard(false);           // swipe left = missed
    }
    touchStart.current = null;
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">No cards in this set</p>
        <Button asChild variant="outline"><Link to={`/set/${id}`}>Go back</Link></Button>
      </div>
    );
  }

  if (done) return (
    <SessionComplete setTitle={set?.title} total={cards.length} correct={correct} incorrect={incorrect}
      onRestart={handleRestart} onShuffle={handleShuffle} setId={id} mode="flashcard" />
  );

  const card = cards[index];
  const isCloze = card?.card_type === 'cloze';

  return (
    <div
      ref={fullscreenRef}
      className={`max-w-2xl mx-auto ${isFullscreen ? 'bg-background flex flex-col justify-center min-h-screen px-8 py-6' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-5">
        <Link to={`/set/${id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />Exit
        </Link>
        <span className="text-sm font-medium text-muted-foreground truncate">{set?.title}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setReversed(r => !r); setFlipped(false); }}
            className={`gap-1 text-xs ${reversed ? 'text-primary' : 'text-muted-foreground'}`} title="Reverse cards">
            <ArrowRightLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Reverse</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShuffle} className="gap-1 text-xs text-muted-foreground">
            <Shuffle className="w-3 h-3" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1 text-xs text-muted-foreground">
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Restart</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-muted-foreground w-8 h-8">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      <ProgressBar current={index} total={cards.length} correct={correct} incorrect={incorrect} />

      <div className="mt-6 mb-6">
        {isCloze ? (
          <ClozeCard
            key={card.id}
            front={card.front}
            back={card.back}
            frontImage={card.front_image}
            onCorrect={() => markCard(true)}
            onIncorrect={() => markCard(false)}
          />
        ) : (
          <FlipCard
            front={card.front}
            back={card.back}
            frontImage={card.front_image}
            backImage={card.back_image}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            reversed={reversed}
          />
        )}
      </div>

      {!isCloze && (
        <>
          <StudyControls flipped={flipped} onCorrect={() => markCard(true)} onIncorrect={() => markCard(false)} />
          {flipped && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              ← Missed · Got it → · Swipe on mobile
            </p>
          )}
        </>
      )}
    </div>
  );
}