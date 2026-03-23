const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, LayoutGrid, List } from 'lucide-react';
import SetCard from '@/components/home/SetCard';
import FolderSidebar from '@/components/home/FolderSidebar';
import MoveToFolderDialog from '@/components/home/MoveToFolderDialog';
import { cn } from '@/lib/utils';

export default function Home() {
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [movingSet, setMovingSet] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ['sets'],
    queryFn: () => db.entities.FlashcardSet.list('-updated_date', 200),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => db.entities.Folder.list('name'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const cards = await db.entities.Flashcard.filter({ set_id: id });
      await Promise.all(cards.map(c => db.entities.Flashcard.delete(c.id)));
      await db.entities.FlashcardSet.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sets'] }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, folder_id }) => db.entities.FlashcardSet.update(id, { folder_id: folder_id || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sets'] }); setMovingSet(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.FlashcardSet.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sets'] }),
  });

  // Handle shared folder selections (format: "shared:folder_id:role")
  const isSharedFolder = typeof selectedFolder === 'string' && selectedFolder.startsWith('shared:');
  const actualFolderId = isSharedFolder ? selectedFolder.split(':')[1] : selectedFolder;
  const sharedRole = isSharedFolder ? selectedFolder.split(':')[2] : null;

  const baseSets = actualFolderId === null ? sets : sets.filter(s => s.folder_id === actualFolderId);
  const pinnedSets = baseSets.filter(s => s.pinned);
  const unpinnedSets = baseSets.filter(s => !s.pinned);
  const visibleSets = [...pinnedSets, ...unpinnedSets];

  const recentSets = sets.filter(s => s.last_studied).sort((a, b) => new Date(b.last_studied) - new Date(a.last_studied)).slice(0, 4);

  return (
    <div>
      {recentSets.length > 0 && !selectedFolder && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recently Studied</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {recentSets.map(s => (
              <Link
                key={s.id}
                to={`/study/${s.id}`}
                className="shrink-0 bg-card border border-border/60 rounded-xl px-4 py-3 hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium text-foreground whitespace-nowrap">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.card_count || 0} cards</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile folder chips */}
      {folders.length > 0 && (
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedFolder(null)}
            className={cn('shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border', !selectedFolder ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:text-foreground')}
          >All</button>
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={cn('shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border', selectedFolder === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:text-foreground')}
            >{f.name}</button>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        <FolderSidebar selectedFolder={selectedFolder} onSelectFolder={setSelectedFolder} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                {selectedFolder ? (folders.find(f => f.id === actualFolderId)?.name || 'Folder') : 'All Sets'}
                {sharedRole && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                    {sharedRole}
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">{visibleSets.length} {visibleSets.length === 1 ? 'set' : 'sets'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
              {sharedRole !== 'viewer' && (
                <Button asChild size="sm" className="gap-1.5">
                  <Link to={actualFolderId ? `/set/new?folder=${actualFolderId}` : '/set/new'}>
                    <Plus className="w-3.5 h-3.5" />New Set
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {pinnedSets.length > 0 && !isLoading && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>📌</span> Pinned
              </p>
            </div>
          )}

          {isLoading ? (
            <div className={cn('gap-3', viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2' : 'grid grid-cols-1')}>
              {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-muted rounded-2xl animate-pulse" />)}
            </div>
          ) : visibleSets.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-medium text-foreground mb-1">No flashcard sets</h3>
              <p className="text-sm text-muted-foreground mb-5">Create your first set to start studying</p>
              <Button asChild size="sm">
                <Link to="/set/new"><Plus className="w-3.5 h-3.5 mr-1.5" />Create Set</Link>
              </Button>
            </div>
          ) : (
            <div className={cn('gap-3', viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2' : 'grid grid-cols-1')}>
              {visibleSets.map(set => (
                <SetCard
                  key={set.id}
                  set={set}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onMove={(s) => setMovingSet(s)}
                  onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <MoveToFolderDialog
        set={movingSet}
        open={!!movingSet}
        onOpenChange={(o) => !o && setMovingSet(null)}
        onMove={(folderId) => movingSet && moveMutation.mutate({ id: movingSet.id, folder_id: folderId })}
      />
    </div>
  );
}