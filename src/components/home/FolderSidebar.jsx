const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder, FolderOpen, FolderPlus, ChevronRight, Home, MoreHorizontal, Pencil, Trash2, Share2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import FolderShareDialog from './FolderShareDialog';
import { useAuth } from '@/lib/AuthContext';

function FolderRow({ folder, selected, onSelect, onEdit, onDelete, onShare, depth = 0, allFolders }) {
  const [expanded, setExpanded] = useState(false);
  const children = allFolders.filter(f => f.parent_id === folder.id);

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors',
          selected === folder.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {children.length > 0 && (
          <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} className="shrink-0">
            <ChevronRight className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')} />
          </button>
        )}
        {selected === folder.id ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate flex-1">{folder.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onShare(folder)}>
            <Share2 className="w-3.5 h-3.5 mr-2" />Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(folder)}>
            <Pencil className="w-3.5 h-3.5 mr-2" />Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(folder.id)} className="text-destructive focus:text-destructive">
            <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
          </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && children.map(c => (
        <FolderRow key={c.id} folder={c} selected={selected} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} onShare={onShare} depth={depth + 1} allFolders={allFolders} />
      ))}
    </div>
  );
}

export default function FolderSidebar({ selectedFolder, onSelectFolder }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [sharingFolder, setSharingFolder] = useState(null);

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => db.entities.Folder.list('name'),
  });

  // Folders shared with this user
  const { data: sharedWithMe = [] } = useQuery({
    queryKey: ['shared-with-me', user?.email],
    queryFn: () => db.entities.FolderShare.filter({ shared_with_email: user?.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Folder.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['folders'] }); setAdding(false); setInputVal(''); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Folder.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['folders'] }); setEditingFolder(null); setInputVal(''); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Folder.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['folders'] }); if (selectedFolder) onSelectFolder(null); }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    if (editingFolder) updateMutation.mutate({ id: editingFolder.id, data: { name: inputVal.trim() } });
    else createMutation.mutate({ name: inputVal.trim() });
  };

  const rootFolders = folders.filter(f => !f.parent_id);

  return (
    <div className="hidden md:block w-48 shrink-0">
      <div className="space-y-0.5">
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
            !selectedFolder ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Home className="w-3.5 h-3.5 shrink-0" />
          All Sets
        </button>

        {rootFolders.map(folder => (
          <FolderRow
            key={folder.id}
            folder={folder}
            selected={selectedFolder}
            onSelect={onSelectFolder}
            onEdit={(f) => { setEditingFolder(f); setInputVal(f.name); setAdding(true); }}
            onDelete={(id) => deleteMutation.mutate(id)}
            onShare={(f) => setSharingFolder(f)}
            allFolders={folders}
          />
        ))}

        {adding ? (
          <form onSubmit={handleSubmit} className="px-2 py-1">
            <Input
              autoFocus
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Folder name"
              className="h-7 text-xs"
              onBlur={() => { setAdding(false); setEditingFolder(null); setInputVal(''); }}
            />
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New folder
          </button>
        )}
      </div>

      {sharedWithMe.length > 0 && (
        <div className="mt-4 space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1 flex items-center gap-1.5">
            <Users className="w-3 h-3" />Shared with me
          </p>
          {sharedWithMe.map(share => (
            <button
              key={share.id}
              onClick={() => onSelectFolder(`shared:${share.folder_id}:${share.role}`)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                selectedFolder === `shared:${share.folder_id}:${share.role}`
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Folder className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1 text-left">{share.folder_name}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide bg-muted rounded px-1">
                {share.role}
              </span>
            </button>
          ))}
        </div>
      )}

      <FolderShareDialog
        folder={sharingFolder}
        open={!!sharingFolder}
        onOpenChange={(o) => !o && setSharingFolder(null)}
      />
    </div>
  );
}