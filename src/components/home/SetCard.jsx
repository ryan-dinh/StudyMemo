import { Link } from 'react-router-dom';
import { Layers, MoreHorizontal, Play, ListChecks, Brain, Pencil, Trash2, FolderInput, Globe, Lock, Pin, PinOff, Palette } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { getColorForId, SET_COLORS } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function SetCard({ set, onDelete, onEdit, onMove, onUpdate }) {
  const color = set.color && set.color !== 'auto'
    ? SET_COLORS.find(c => c.name === set.color) || getColorForId(set.id)
    : getColorForId(set.id);
  const pct = set.total_studied > 0 ? Math.round((set.best_score || 0)) : null;

  return (
    <div className="group bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-md hover:border-border transition-all duration-200">
      <div className={`h-1.5 ${color.bg}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/set/${set.id}`} className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {set.pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
              <h3 className="font-semibold text-foreground truncate leading-tight hover:text-primary transition-colors">{set.title}</h3>
            </div>
            {set.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{set.description}</p>}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted -mt-0.5 -mr-1 shrink-0">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild><Link to={`/set/${set.id}`}><Pencil className="w-3.5 h-3.5 mr-2" />Edit</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to={`/study/${set.id}`}><Play className="w-3.5 h-3.5 mr-2" />Study</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to={`/test/${set.id}`}><ListChecks className="w-3.5 h-3.5 mr-2" />Test</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to={`/spaced/${set.id}`}><Brain className="w-3.5 h-3.5 mr-2" />Spaced Rep</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onUpdate?.(set.id, { pinned: !set.pinned })}>
                {set.pinned ? <><PinOff className="w-3.5 h-3.5 mr-2" />Unpin</> : <><Pin className="w-3.5 h-3.5 mr-2" />Pin to top</>}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Palette className="w-3.5 h-3.5 mr-2" />Color label</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onUpdate?.(set.id, { color: 'auto' })}>
                    <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 mr-2" />Auto
                  </DropdownMenuItem>
                  {SET_COLORS.map(c => (
                    <DropdownMenuItem key={c.name} onClick={() => onUpdate?.(set.id, { color: c.name })}>
                      <span className={`w-3 h-3 rounded-full ${c.bg} mr-2`} />
                      {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => onMove?.(set)}><FolderInput className="w-3.5 h-3.5 mr-2" />Move to folder</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(set.id)} className="text-destructive focus:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">
              {set.card_count || 0} {set.card_count === 1 ? 'card' : 'cards'}
            </span>
            {pct !== null && (
              <span className="text-xs font-medium text-emerald-600">Best: {pct}%</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {set.is_public ? <Globe className="w-3 h-3 text-muted-foreground" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
            {set.last_studied && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(set.last_studied), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <Link to={`/study/${set.id}`} className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
          <Play className="w-3 h-3" />Study
        </Link>
        <Link to={`/test/${set.id}`} className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors">
          <ListChecks className="w-3 h-3" />Test
        </Link>
        <Link to={`/spaced/${set.id}`} className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors">
          <Brain className="w-3 h-3" />Spaced
        </Link>
      </div>
    </div>
  );
}