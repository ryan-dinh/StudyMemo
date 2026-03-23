const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Plus, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

export default function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: allSets = [] } = useQuery({
    queryKey: ['sets-search'],
    queryFn: () => db.entities.FlashcardSet.list('-updated_date', 200),
    enabled: searchOpen
  });

  const results = query.trim() ?
  allSets.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()) || (s.description || '').toLowerCase().includes(query.toLowerCase())) :
  [];

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {e.preventDefault();setSearchOpen(true);}
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background font-inter">
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 mr-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground hidden sm:block">Memo
</span>
          </Link>

          <button onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-xs flex items-center gap-2 px-3 h-9 bg-muted hover:bg-muted/80 rounded-lg text-sm text-muted-foreground transition-colors">
            
            <Search className="w-3.5 h-3.5" />
            <span>Search sets…</span>
            <kbd className="ml-auto text-xs bg-background/60 px-1.5 py-0.5 rounded hidden sm:block">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" className="gap-1.5 shadow-sm">
              <Link to="/set/new">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Set</span>
              </Link>
            </Button>
            {user &&
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                {(user.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
            }
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen &&
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
              ref={searchRef}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
              placeholder="Search flashcard sets…"
              value={query}
              onChange={(e) => setQuery(e.target.value)} />
            
              <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {results.length > 0 &&
          <ul className="py-2 max-h-72 overflow-y-auto">
                {results.map((set) =>
            <li key={set.id}>
                    <button
                className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3"
                onClick={() => {navigate(`/set/${set.id}`);setSearchOpen(false);setQuery('');}}>
                
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{set.title}</p>
                        {set.description && <p className="text-xs text-muted-foreground">{set.description}</p>}
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">{set.card_count || 0} cards</span>
                    </button>
                  </li>
            )}
              </ul>
          }
            {query && results.length === 0 &&
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No sets found</p>
          }
          </div>
        </div>
      }

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>);

}