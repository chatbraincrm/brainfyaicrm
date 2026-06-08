import { cn } from '@/lib/utils';
import { MessageCircle, Flame, Calendar, CheckSquare, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { OperationPriorities } from '@/hooks/useOperationCenter';

interface Props {
  data?: OperationPriorities;
  onNavigate: (section: string) => void;
}

const ITEMS = (data?: OperationPriorities) => [
  {
    icon: MessageCircle,
    iconClass: 'bg-red-500/10 text-red-500',
    count: data?.unansweredConversations ?? 0,
    label: 'conversas sem resposta',
    section: 'inbox',
    urgency: (data?.unansweredConversations ?? 0) > 5 ? 'high' : (data?.unansweredConversations ?? 0) > 0 ? 'medium' : 'none',
  },
  {
    icon: Flame,
    iconClass: 'bg-orange-500/10 text-orange-500',
    count: data?.hotLeadsUnassigned ?? 0,
    label: 'leads quentes sem responsável',
    section: 'leads',
    urgency: (data?.hotLeadsUnassigned ?? 0) > 0 ? 'medium' : 'none',
  },
  {
    icon: Calendar,
    iconClass: 'bg-blue-500/10 text-blue-500',
    count: data?.pendingMeetings ?? 0,
    label: 'reuniões pendentes',
    section: 'calendar',
    urgency: 'none' as const,
  },
  {
    icon: CheckSquare,
    iconClass: 'bg-violet-500/10 text-violet-500',
    count: data?.overdueTasks ?? 0,
    label: 'tarefas atrasadas',
    section: 'leads',
    urgency: (data?.overdueTasks ?? 0) > 0 ? 'medium' : 'none',
  },
];

export function PrioritiesCard({ data, onNavigate }: Props) {
  const items = ITEMS(data);
  const allZero = items.every((i) => i.count === 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <h3 className="text-sm font-semibold text-foreground">Prioridades agora</h3>
        {allZero && (
          <span className="flex items-center gap-1 text-xs text-success font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Tudo em ordem
          </span>
        )}
      </div>

      <div className="p-2">
        {allZero ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[18rem]">
              Nenhuma ação urgente no momento. Bom trabalho!
            </p>
          </div>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            if (item.count === 0) return null;
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.section)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg',
                  'hover:bg-muted/50 transition-colors text-left group',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', item.iconClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground">{item.count}</span>
                    {' '}
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0 transition-colors" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
