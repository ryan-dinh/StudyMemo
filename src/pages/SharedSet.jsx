const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BookOpen, Copy, Eye, Play, Layers, ArrowLeft } from 'lucide-react';
import { generateShareCode } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function SharedSet() {
  const { code } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ['shared', code],
    queryFn: () => db.entities.FlashcardSet.filter({ share_code: code }),
  });

  const set = sets[0];

  const { data: cards = [] } = useQuery({
    queryKey: ['shared-cards', set?.id],
    queryFn: () => db.entities.Flashcard.filter({ set_id: set.id }, 'order'),
    enabled: !!set?.id,
  });

  const copyMutation = useMutation({
    mutationFn: async () => {
      const newSet = await db.entities.FlashcardSet.create({
        title: `${set.title} (copy)`,
        description: set.description,
        card_count: cards.length,
        share_code: generateShareCode(),
      });
      await Promise.all(cards.map((c, i) => db.entities.Flashcard.create({
        set_id: newSet.id, front: c.front, back: c.back, order: i,
      })));
      return newSet;
    },
    onSuccess: (newSet) => {
      queryClient.invalidateQueries({ queryKey: ['sets'] });
      navigate(`/set/${newSet.id}`);
    },
  });

  if (isLoading) return (
    <div className="text-center py-20">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!set) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground mb-2">Set not found or no longer shared.</p>
      <Button asChild variant="outline"><Link to="/">Go home</Link></Button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl border border-border/60 p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{set.title}</h1>
            {set.description && <p className="text-sm text-muted-foreground mt-1">{set.description}</p>}
            <p className="text-sm text-muted-foreground mt-2">{cards.length} cards</p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button className="flex-1 gap-2" asChild>
            <Link to={`/study/${set.id}`}><Play className="w-4 h-4" />Study Now</Link>
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => copyMutation.mutate()} disabled={copyMutation.isPending}>
            <Copy className="w-4 h-4" />
            {copyMutation.isPending ? 'Copying…' : 'Copy to My Sets'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">All Cards</h2>
        {cards.map((card, i) => (
          <div key={card.id} className="bg-card rounded-xl border border-border/60 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Term</p>
                <p className="text-sm text-foreground">{card.front}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Definition</p>
                <p className="text-sm text-muted-foreground">{card.back}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}