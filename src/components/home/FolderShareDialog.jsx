const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, UserPlus, Eye, Pencil } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function FolderShareDialog({ folder, open, onOpenChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  const { data: shares = [] } = useQuery({
    queryKey: ['folder-shares', folder?.id],
    queryFn: () => db.entities.FolderShare.filter({ folder_id: folder?.id }),
    enabled: !!folder?.id && open,
  });

  const addMutation = useMutation({
    mutationFn: (data) => db.entities.FolderShare.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-shares', folder?.id] });
      setEmail('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => db.entities.FolderShare.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folder-shares', folder?.id] }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => db.entities.FolderShare.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folder-shares', folder?.id] }),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!email.trim() || !folder) return;
    const existing = shares.find(s => s.shared_with_email === email.trim());
    if (existing) return;
    addMutation.mutate({
      folder_id: folder.id,
      shared_with_email: email.trim(),
      role,
      owner_email: user?.email,
      folder_name: folder.name,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{folder?.name}"</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAdd} className="flex gap-2 mt-2">
          <Input
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            className="flex-1"
          />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="icon" disabled={!email.trim() || addMutation.isPending}>
            <UserPlus className="w-4 h-4" />
          </Button>
        </form>

        <div className="text-xs text-muted-foreground mt-1 mb-3">
          <span className="font-medium">Viewers</span> can browse the folder. <span className="font-medium">Editors</span> can also add sets.
        </div>

        {shares.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No one has access yet.</p>
        ) : (
          <div className="space-y-2">
            {shares.map(share => (
              <div key={share.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{share.shared_with_email}</p>
                </div>
                <div className="flex items-center gap-1">
                  {share.role === 'viewer'
                    ? <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    : <Pencil className="w-3.5 h-3.5 text-primary" />
                  }
                  <Select
                    value={share.role}
                    onValueChange={(r) => updateRoleMutation.mutate({ id: share.id, role: r })}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => removeMutation.mutate(share.id)}
                    className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}