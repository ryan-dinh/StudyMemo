import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

const EXAMPLE = `photosynthesis\tthe process by which plants make food using sunlight
mitosis\tcell division producing two identical daughter cells
osmosis\tmovement of water across a semipermeable membrane`;

export default function ImportDialog({ open, onOpenChange, onImport }) {
  const [text, setText] = useState('');
  const [termSep, setTermSep] = useState('tab');
  const [cardSep, setCardSep] = useState('newline');
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');

  const parse = (raw) => {
    const tSep = termSep === 'tab' ? '\t' : termSep === 'comma' ? ',' : ' - ';
    const cSep = cardSep === 'newline' ? '\n' : '\n\n';
    const pairs = raw.trim().split(cSep).map(line => line.trim()).filter(Boolean);
    const cards = pairs.map(pair => {
      const idx = pair.indexOf(tSep);
      if (idx === -1) return null;
      return { front: pair.slice(0, idx).trim(), back: pair.slice(idx + tSep.length).trim() };
    }).filter(c => c && c.front && c.back);
    return cards;
  };

  const handlePreview = () => {
    setError('');
    const cards = parse(text);
    if (!cards.length) { setError('No valid cards found. Check your separators.'); return; }
    setPreview(cards);
  };

  const handleImport = () => {
    const cards = parse(text);
    onImport(cards);
    onOpenChange(false);
    setText('');
    setPreview([]);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Cards
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Between term & definition</Label>
              <select value={termSep} onChange={e => { setTermSep(e.target.value); setPreview([]); }}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="tab">Tab</option>
                <option value="comma">Comma</option>
                <option value="dash">Space-dash-space ( - )</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Between cards</Label>
              <select value={cardSep} onChange={e => { setCardSep(e.target.value); setPreview([]); }}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="newline">New line</option>
                <option value="blank">Blank line</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Paste text or upload CSV</Label>
            <Textarea
              value={text}
              onChange={e => { setText(e.target.value); setPreview([]); }}
              placeholder={EXAMPLE}
              className="resize-none h-36 text-sm font-mono"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload .txt or .csv file
            <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFile} />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{preview.length} cards found</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {preview.map((c, i) => (
                  <div key={i} className="text-xs bg-muted rounded-lg px-3 py-2 grid grid-cols-2 gap-2">
                    <span className="font-medium truncate">{c.front}</span>
                    <span className="text-muted-foreground truncate">{c.back}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {preview.length === 0 ? (
              <Button onClick={handlePreview} disabled={!text.trim()} variant="outline" className="flex-1">Preview</Button>
            ) : (
              <Button onClick={handleImport} className="flex-1">Import {preview.length} Cards</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}