const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Play, ListChecks, Brain, Share2, Trash2, Sparkles, Upload, Download } from 'lucide-react';
import CardEditor from '@/components/set/CardEditor';
import SetStats from '@/components/set/SetStats';
import ShareDialog from '@/components/home/ShareDialog';
import AIGenerateDialog from '@/components/set/AIGenerateDialog';
import ImportDialog from '@/components/set/ImportDialog';
import { generateShareCode } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const isNew = (id) => id === 'new';

export default function SetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const creating = isNew(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [saved, setSaved] = useState(creating ? false : true);

  const { data: set } = useQuery({
    queryKey: ['set', id],
    queryFn: () => db.entities.FlashcardSet.filter({ id }),
    select: d => d[0],
    enabled: !creating,
  });

  const { data: cards = [], isLoading: loadingCards } = useQuery({
    queryKey: ['cards', id],
    queryFn: () => db.entities.Flashcard.filter({ set_id: id }, 'order'),
    enabled: !creating,
  });

  useEffect(() => {
    if (set) { setTitle(set.title || ''); setDescription(set.description || ''); }
  }, [set?.id]);

  const createSetMutation = useMutation({
    mutationFn: (data) => db.entities.FlashcardSet.create(data),
    onSuccess: (newSet) => {
      queryClient.invalidateQueries({ queryKey: ['sets'] });
      navigate(`/set/${newSet.id}`, { replace: true });
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: (data) => db.entities.FlashcardSet.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['set', id] }); queryClient.invalidateQueries({ queryKey: ['sets'] }); setSaved(true); },
  });

  const deleteSetMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(cards.map(c => db.entities.Flashcard.delete(c.id)));
      await db.entities.FlashcardSet.delete(id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sets'] }); navigate('/'); },
  });

  const addCardMutation = useMutation({
    mutationFn: (data) => db.entities.Flashcard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', id] });
      db.entities.FlashcardSet.update(id, { card_count: cards.length + 1 });
      queryClient.invalidateQueries({ queryKey: ['set', id] });
      setNewFront(''); setNewBack('');
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, data }) => db.entities.Flashcard.update(cardId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', id] }),
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId) => {
      await db.entities.Flashcard.delete(cardId);
      await db.entities.FlashcardSet.update(id, { card_count: Math.max(0, cards.length - 1) });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cards', id] }); queryClient.invalidateQueries({ queryKey: ['set', id] }); },
  });

  const handleSaveSet = () => {
    if (!title.trim()) return;
    if (creating) {
      const urlParams = new URLSearchParams(window.location.search);
      const presetFolder = urlParams.get('folder') || undefined;
      createSetMutation.mutate({ title: title.trim(), description: description.trim(), card_count: 0, share_code: generateShareCode(), folder_id: presetFolder });
    } else {
      updateSetMutation.mutate({ title: title.trim(), description: description.trim() });
    }
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || creating) return;
    addCardMutation.mutate({ set_id: id, front: newFront.trim(), back: newBack.trim(), order: cards.length });
  };

  const handleBulkAddCards = async (newCards) => {
    await Promise.all(
      newCards.map((c, i) =>
        db.entities.Flashcard.create({ set_id: id, front: c.front, back: c.back, order: cards.length + i })
      )
    );
    await db.entities.FlashcardSet.update(id, { card_count: cards.length + newCards.length });
    queryClient.invalidateQueries({ queryKey: ['cards', id] });
    queryClient.invalidateQueries({ queryKey: ['set', id] });
  };

  const handleExport = () => {
    const lines = cards.map(c => `${c.front}\t${c.back}`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(set?.title || 'flashcards').replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground flex-1 truncate">
          {creating ? 'New Set' : (set?.title || 'Edit Set')}
        </h1>
        {!creating && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} className="gap-1.5">
              <Share2 className="w-3.5 h-3.5" />Share
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this set?</AlertDialogTitle>
                  <AlertDialogDescription>This will delete "{set?.title}" and all {cards.length} cards permanently.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteSetMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Set info */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 mb-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Title <span className="text-destructive">*</span></Label>
          <Input value={title} onChange={e => { setTitle(e.target.value); setSaved(false); }} placeholder="e.g. Spanish Vocabulary" className="text-base font-medium" />
        </div>
        <div className="space-y-1.5">
          <Label>Description <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
          <Textarea value={description} onChange={e => { setDescription(e.target.value); setSaved(false); }} placeholder="What's this set about?" className="resize-none h-16" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">{!creating ? `${cards.length} cards` : ''}</span>
          <Button onClick={handleSaveSet} disabled={!title.trim()} size="sm" variant={saved ? 'outline' : 'default'}>
            {creating ? 'Create Set' : saved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {!creating && (
        <>
          {/* Study buttons */}
          {cards.length >= 2 && (
            <div className="flex gap-2 mb-5">
              <Button asChild className="flex-1 gap-2">
                <Link to={`/study/${id}`}><Play className="w-4 h-4" />Study</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 gap-2">
                <Link to={`/test/${id}`}><ListChecks className="w-4 h-4" />Test</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 gap-2">
                <Link to={`/spaced/${id}`}><Brain className="w-4 h-4" />Spaced</Link>
              </Button>
            </div>
          )}

          {/* Stats */}
          <SetStats setId={id} cardCount={cards.length} />

          {/* Add card */}
          <div className="mt-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Cards</h3>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAiOpen(true)}>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />Generate with AI
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setImportOpen(true)}>
                  <Upload className="w-3.5 h-3.5" />Import
                </Button>
                {cards.length > 0 && (
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleExport}>
                    <Download className="w-3.5 h-3.5" />Export
                  </Button>
                )}
              </div>
            </div>
            <form onSubmit={handleAddCard} className="bg-card rounded-xl border border-dashed border-border p-4 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Add new card</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Term</label>
                  <Input value={newFront} onChange={e => setNewFront(e.target.value)} placeholder="Term" className="bg-background" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Definition</label>
                  <Input value={newBack} onChange={e => setNewBack(e.target.value)} placeholder="Definition" className="bg-background" />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={!newFront.trim() || !newBack.trim()} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />Add Card
              </Button>
            </form>

            <div className="space-y-3">
              {loadingCards ? (
                [1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)
              ) : (
                cards.map((card, i) => (
                  <CardEditor
                    key={card.id}
                    card={card}
                    index={i}
                    onUpdate={(cardId, data) => updateCardMutation.mutate({ cardId, data })}
                    onDelete={(cardId) => deleteCardMutation.mutate(cardId)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {set && <ShareDialog set={set} open={shareOpen} onOpenChange={setShareOpen} />}
      <AIGenerateDialog open={aiOpen} onOpenChange={setAiOpen} onCardsGenerated={handleBulkAddCards} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleBulkAddCards} />
    </div>
  );
}