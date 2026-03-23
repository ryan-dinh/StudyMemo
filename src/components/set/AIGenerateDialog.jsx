const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Upload, Image, Loader2, X } from 'lucide-react';

export default function AIGenerateDialog({ open, onOpenChange, onCardsGenerated }) {
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [numCards, setNumCards] = useState(10);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    fileRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!notes.trim() && !imageFile) return;
    setLoading(true);
    let fileUrl = null;

    if (imageFile) {
      const { file_url } = await db.integrations.Core.UploadFile({ file: imageFile });
      fileUrl = file_url;
    }

    const prompt = `You are a flashcard generator. Given the following study material, generate exactly ${numCards} high-quality flashcards.
Each flashcard should have a concise "front" (term, concept, or question) and a clear "back" (definition or answer).
Focus on the most important concepts, facts, and vocabulary.

Study material:
${notes || '(see attached image)'}

Return ONLY valid JSON matching the schema. No extra text.`;

    const result = await db.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrl ? [fileUrl] : undefined,
      response_json_schema: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: { type: 'string' },
                back: { type: 'string' },
              },
              required: ['front', 'back'],
            },
          },
        },
        required: ['cards'],
      },
    });

    setLoading(false);
    if (result?.cards?.length) {
      onCardsGenerated(result.cards);
      onOpenChange(false);
      setNotes('');
      removeImage();
    }
  };

  const canGenerate = (notes.trim() || imageFile) && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Generate Cards with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Paste your notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Paste lecture notes, a chapter, bullet points, or any text…"
              className="resize-none h-36 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span>or upload an image</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Upload preview" className="w-full max-h-40 object-contain rounded-xl border border-border" />
              <button onClick={removeImage} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background border border-border">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/40 transition-colors text-muted-foreground"
            >
              <Image className="w-5 h-5" />
              <span className="text-sm">Click to upload image (textbook, notes, diagram)</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          <div className="flex items-center gap-3">
            <Label className="shrink-0 text-sm">Number of cards</Label>
            <Input
              type="number"
              min={3}
              max={50}
              value={numCards}
              onChange={e => setNumCards(Number(e.target.value))}
              className="w-20 text-sm"
            />
          </div>

          <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate {numCards} Cards</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}