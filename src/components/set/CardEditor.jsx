import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, HelpCircle } from 'lucide-react';
import CardImageUpload from './CardImageUpload';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function CardEditor({ card, index, onUpdate, onDelete }) {
  const [front, setFront] = useState(card.front || '');
  const [back, setBack] = useState(card.back || '');
  const [dirty, setDirty] = useState(false);
  const isCloze = card.card_type === 'cloze';

  useEffect(() => {
    setFront(card.front || '');
    setBack(card.back || '');
  }, [card.id]);

  const handleBlur = () => {
    if (dirty && (front !== card.front || back !== card.back)) {
      onUpdate(card.id, { front, back });
      setDirty(false);
    }
  };

  const toggleCloze = () => {
    onUpdate(card.id, { card_type: isCloze ? 'standard' : 'cloze' });
  };

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 group hover:border-border transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground/30" />
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">{index + 1}</span>
          <button
            onClick={toggleCloze}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${isCloze ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}
          >
            {isCloze ? 'Cloze' : 'Standard'}
          </button>
          {isCloze && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Wrap answers in {`{{double braces}}`} to create fill-in-the-blank. Example: "The capital of France is {`{{Paris}}`}"
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <button
          className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(card.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            {isCloze ? 'Text (use {{answer}} for blanks)' : 'Term'}
          </label>
          <Textarea
            value={front}
            onChange={e => { setFront(e.target.value); setDirty(true); }}
            onBlur={handleBlur}
            placeholder={isCloze ? 'e.g. The capital of France is {{Paris}}' : 'Enter term'}
            className="bg-background resize-none min-h-[60px] text-sm"
            rows={2}
          />
          <CardImageUpload
            imageUrl={card.front_image}
            onUpload={(url) => onUpdate(card.id, { front_image: url })}
            onRemove={() => onUpdate(card.id, { front_image: null })}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            {isCloze ? 'Extra context (optional)' : 'Definition'}
          </label>
          <Textarea
            value={back}
            onChange={e => { setBack(e.target.value); setDirty(true); }}
            onBlur={handleBlur}
            placeholder={isCloze ? 'Additional notes shown after answer' : 'Enter definition'}
            className="bg-background resize-none min-h-[60px] text-sm"
            rows={2}
          />
          <CardImageUpload
            imageUrl={card.back_image}
            onUpload={(url) => onUpdate(card.id, { back_image: url })}
            onRemove={() => onUpdate(card.id, { back_image: null })}
          />
        </div>
      </div>
    </div>
  );
}