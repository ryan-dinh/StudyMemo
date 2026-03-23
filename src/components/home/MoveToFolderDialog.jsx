const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, Home } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';

export default function MoveToFolderDialog({ set, open, onOpenChange, onMove }) {
  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => db.entities.Folder.list('name'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Move to folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 py-2">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm transition-colors"
            onClick={() => onMove(null)}
          >
            <Home className="w-4 h-4 text-muted-foreground" />
            No folder (root)
          </button>
          {folders.map(f => (
            <button
              key={f.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm transition-colors"
              onClick={() => onMove(f.id)}
            >
              <Folder className="w-4 h-4 text-primary" />
              {f.name}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}