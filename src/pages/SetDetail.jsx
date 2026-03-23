const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Play, ListChecks, Trash2, Pencil, ArrowLeft } from 'lucide-react';
import CardEditor from '@/components/set/CardEditor';
import CreateSetDialog from '@/components/home/CreateSetDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function SetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const { data: set, isLoading: loadingSet } = useQuery({
    queryKey: ['set', id],
    queryFn: () => db.entities.FlashcardSet.filter({ id }),
    select: (data) => data[0],
  });

  const { data: cards = [], isLoading: loadingCards } = useQuery({
    queryKey: ['cards', id],
    queryFn: () => db.entities.Flashcard.filter({ set_id: id }, 'order'),
  });

  const addCardMutation = useMutation({
    mutationFn: (data) => db.entities.Flashcard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', id] });
      updateCardCount();
      setNewFront('');
      setNewBack('');
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, data }) => db.entities.Flashcard.update(cardId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', id] }),
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => db.entities.Flashcard.delete(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', id] });
      updateCardCount(-1);
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: (data) => db.entities.FlashcardSet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['set', id] });
      queryClient.invalidateQueries({ queryKey: ['sets'] });
      setShowEdit(false);
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: async () => {
      for (const card of cards) {
        await db.entities.Flashcard.delete(card.id);
      }
      await db.entities.FlashcardSet.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sets'] });
      navigate('/');
    },
  });

  const updateCardCount = (delta = 1) => {
    db.entities.FlashcardSet.update(id, {
      card_count: (set?.card_count || cards.length) + delta,
    });
    queryClient.invalidateQueries({ queryKey: ['set', id] });
    queryClient.invalidateQueries({ queryKey: ['sets'] });
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    addCardMutation.mutate({
      set_id: id,
      front: newFront.trim(),
      back: newBack.trim(),
      order: cards.length,
    });
  };

  if (loadingSet || loadingCards) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Set not found</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block">Go home</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{set.title}</h1>
          {set.description && <p className="text-sm text-muted-foreground mt-1">{set.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">{cards.length} cards</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this set?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{set.title}" and all its cards.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteSetMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {cards.length >= 1 && (
        <div className="flex gap-2 mb-8">
          <Button asChild className="gap-2 flex-1 sm:flex-none">
            <Link to={`/study/${id}`}>
              <Play className="w-4 h-4" />
              Study
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 flex-1 sm:flex-none">
            <Link to={`/review/${id}`}>
              <ListChecks className="w-4 h-4" />
              Review
            </Link>
          </Button>
        </div>
      )}

      {/* Add card form */}
      <form onSubmit={handleAddCard} className="bg-card rounded-xl border border-border/60 p-4 mb-6">
        <p className="text-sm font-medium text-foreground mb-3">Add a card</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Term"
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            className="bg-background"
          />
          <Input
            placeholder="Definition"
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            className="bg-background"
          />
        </div>
        <Button type="submit" size="sm" className="mt-3 gap-1.5" disabled={!newFront.trim() || !newBack.trim()}>
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </form>

      {/* Card list */}
      <div className="space-y-3">
        {cards.map((card, i) => (
          <CardEditor
            key={card.id}
            card={card}
            index={i}
            onUpdate={(cardId, data) => updateCardMutation.mutate({ cardId, data })}
            onDelete={(cardId) => deleteCardMutation.mutate(cardId)}
          />
        ))}
      </div>

      <CreateSetDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        onSubmit={(data) => updateSetMutation.mutate(data)}
        initialData={set}
      />
    </div>
  );
}