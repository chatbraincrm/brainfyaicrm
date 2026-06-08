import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Mail, Instagram, Phone, Users, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecentLead } from '@/hooks/useOperationCenter';

interface Props {
  leads?: RecentLead[];
  onNavigate: (section: string) => void;
}

const CHANNEL_ICON = (ch: string | null) => {
  const c = (ch || '').toLowerCase();
  if (c.includes('whats'))  return <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />;
  if (c.includes('insta'))  return <Instagram className="h-3.5 w-3.5 text-pink-500" />;
  if (c.includes('mail') || c.includes('email')) return <Mail className="h-3.5 w-3.5 text-blue-500" />;
  if (c.includes('phone') || c.includes('call')) return <Phone className="h-3.5 w-3.5 text-blue-500" />;
  return <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />;
};

const TEMP_CONFIG = {
  hot:  { label: 'Quente',  className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  warm: { label: 'Morno',   className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  cold: { label: 'Frio',    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
} as const;

const initials = (n: string) =>
  n.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

const avatarHue = (n: string) => {
  const hues = [196, 228, 142, 38, 280, 4];
  const idx = n.charCodeAt(0) % hues.length;
  return hues[idx];
};

export function RecentLeadsTable({ leads, onNavigate }: Props) {
  const list = leads ?? [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <h3 className="text-sm font-semibold text-foreground">Leads / Conversas Recentes</h3>
        <button
          onClick={() => onNavigate('leads')}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Ver todos
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Empty state */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Nenhum lead recente</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Os novos leads aparecerão aqui em tempo real.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3">Lead</th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Canal</th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3 hidden md:table-cell">Responsável</th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => {
                const tempKey = (l.temperature as keyof typeof TEMP_CONFIG);
                const temp = tempKey in TEMP_CONFIG ? TEMP_CONFIG[tempKey] : null;
                const hue = avatarHue(l.name);

                return (
                  <tr
                    key={l.id}
                    onClick={() => onNavigate('leads')}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarFallback
                            className="text-[10px] font-semibold"
                            style={{
                              background: `hsl(${hue} 70% 90%)`,
                              color: `hsl(${hue} 70% 30%)`,
                            }}
                          >
                            {initials(l.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm leading-tight truncate">{l.name}</p>
                          {l.company && (
                            <p className="text-xs text-muted-foreground truncate">{l.company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {CHANNEL_ICON(l.channel)}
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {l.assignedName || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {temp ? (
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          temp.className,
                        )}>
                          {temp.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-muted text-muted-foreground border-border">
                          Novo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
