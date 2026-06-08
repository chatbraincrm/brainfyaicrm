import { Button } from '@/components/ui/button';
import { Video, Phone, CheckSquare, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/hooks/useOperationCenter';

interface Props {
  items?: AgendaItem[];
  onNavigate: (section: string) => void;
}

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

const TYPE_CONFIG = {
  task:    { icon: CheckSquare, iconClass: 'bg-violet-500/10 text-violet-500', action: 'Ver', section: 'leads' },
  call:    { icon: Phone,       iconClass: 'bg-blue-500/10 text-blue-500',     action: 'Ligar', section: 'calendar' },
  meeting: { icon: Video,       iconClass: 'bg-emerald-500/10 text-emerald-500', action: 'Entrar', section: 'calendar' },
} as const;

export function TodayAgendaCard({ items, onNavigate }: Props) {
  const list = items ?? [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <h3 className="text-sm font-semibold text-foreground">Agenda e Tarefas de Hoje</h3>
        <span className="text-xs text-muted-foreground">{list.length} items</span>
      </div>

      <div className="p-2">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <CalendarX className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa ou reunião para hoje.
            </p>
          </div>
        ) : (
          list.map((item) => {
            const typeKey = (item.type as keyof typeof TYPE_CONFIG) in TYPE_CONFIG ? item.type as keyof typeof TYPE_CONFIG : 'task';
            const config = TYPE_CONFIG[typeKey];
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
              >
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', config.iconClass)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-primary tabular-nums">
                      {formatTime(item.time)}
                    </span>
                    <span className="text-sm text-foreground truncate leading-tight">{item.title}</span>
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNavigate(config.section)}
                  className="h-7 px-2.5 text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {config.action}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
