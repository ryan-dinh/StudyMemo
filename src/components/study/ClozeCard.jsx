import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Parses cloze text: "The capital of France is {{Paris}}" → blanks
function parseCloze(text) {
  const parts = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
    parts.push({ type: 'blank', value: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

export default function ClozeCard({ front, back, frontImage, onCorrect, onIncorrect }) {
  const parts = parseCloze(front);
  const blanks = parts.filter(p => p.type === 'blank');
  const [inputs, setInputs] = useState(blanks.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState([]);

  // Fallback: if no {{}} syntax, treat whole front as a question and back as answer
  const isCloze = blanks.length > 0;

  const handleCheck = () => {
    if (isCloze) {
      const res = blanks.map((b, i) => inputs[i].trim().toLowerCase() === b.value.trim().toLowerCase());
      setResults(res);
      setChecked(true);
    } else {
      setChecked(true);
    }
  };

  const allCorrect = isCloze ? results.every(Boolean) : null;

  let blankIdx = 0;

  return (
    <motion.div
      key={checked ? 'checked' : 'input'}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center"
      style={{ minHeight: '280px' }}
    >
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] block mb-6">Fill in the blank</span>

      {frontImage && (
        <img src={frontImage} alt="" className="max-h-28 max-w-full object-contain rounded-lg mb-4 border border-border mx-auto" />
      )}

      {isCloze ? (
        <p className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed mb-6">
          {parts.map((part, i) => {
            if (part.type === 'text') return <span key={i}>{part.value}</span>;
            const idx = blankIdx++;
            const isCorrect = results[idx];
            return (
              <span key={i} className="inline-block mx-1">
                {checked ? (
                  <span className={`px-3 py-0.5 rounded-lg font-bold text-lg ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isCorrect ? inputs[idx] : `${inputs[idx] || '—'} → ${part.value}`}
                  </span>
                ) : (
                  <Input
                    className="inline-block w-32 text-center text-base font-semibold h-8 border-b-2 border-primary border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus:ring-0 px-1"
                    value={inputs[idx]}
                    onChange={e => { const a = [...inputs]; a[idx] = e.target.value; setInputs(a); }}
                    onKeyDown={e => e.key === 'Enter' && !checked && handleCheck()}
                    autoFocus={idx === 0}
                  />
                )}
              </span>
            );
          })}
        </p>
      ) : (
        <div>
          <p className="text-xl font-semibold text-foreground mb-4">{front}</p>
          {checked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Answer</p>
              <p className="text-lg font-medium text-foreground">{back}</p>
            </motion.div>
          )}
        </div>
      )}

      {!checked ? (
        <Button onClick={handleCheck} className="mt-4" size="sm">Check Answer</Button>
      ) : (
        <div className="flex justify-center gap-3 mt-4">
          {isCloze ? (
            <Button onClick={() => allCorrect ? onCorrect() : onIncorrect()} className={allCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'}>
              {allCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onIncorrect} className="text-rose-600 border-rose-200 hover:bg-rose-50">Missed</Button>
              <Button onClick={onCorrect} className="bg-emerald-600 hover:bg-emerald-700">Got it</Button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}