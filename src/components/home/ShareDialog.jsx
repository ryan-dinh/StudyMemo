const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Copy, Check, Globe, Lock } from 'lucide-react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateShareCode } from '@/lib/utils';

export default function ShareDialog({ set, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => db.entities.FlashcardSet.update(set.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['set', set.id] }); queryClient.invalidateQueries({ queryKey: ['sets'] }); }
  });

  const togglePublic = () => {
    const data = { is_public: !set.is_public };
    if (!set.share_code) data.share_code = generateShareCode();
    updateMutation.mutate(data);
  };

  const shareUrl = set.share_code ? `${window.location.origin}/shared/${set.share_code}` : null;

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateCode = () => {
    updateMutation.mutate({ share_code: generateShareCode(), is_public: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share "{set?.title}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {set?.is_public ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
              <Label className="text-sm font-medium cursor-pointer" htmlFor="public-toggle">
                {set?.is_public ? 'Public set' : 'Private set'}
              </Label>
            </div>
            <Switch id="public-toggle" checked={!!set?.is_public} onCheckedChange={togglePublic} />
          </div>

          {set?.is_public && (
            <div className="space-y-3">
              {shareUrl ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground truncate">{shareUrl}</div>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={handleGenerateCode} className="w-full">Generate share link</Button>
              )}
              {set?.share_code && (
                <p className="text-xs text-muted-foreground text-center">
                  Code: <span className="font-mono font-medium text-foreground">{set.share_code}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}