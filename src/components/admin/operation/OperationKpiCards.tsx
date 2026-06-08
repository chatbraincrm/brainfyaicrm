import { cn } from '@/lib/utils';
import { Users, MessageCircle, Flame, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { OperationKpis } from '@/hooks/useOperationCenter';

interface Props {
  kpis?: OperationKpis;
  onNavigate: (section: string) => void;
}

const CARDS = (kpis?: OperationKpis) => [
  {
    id: 'leads',
    label: 'Novos leads hoje',
    value: kpis?.newLeadsToday ?? 0,
    delta: kpis?.newLeadsDelta,
    hint:
      kpis && kpis.newLeadsDelta !== 0
        ? `${kpis.newLeadsDelta > 0 ? '+' : ''}${kpis.newLeadsDelta}% vs ontem`
        : 'Sem comparação',
    icon: Users,
    accentClass: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
    barClass: 'bg-blue-500',
    section: 'leads',
  },
  {
    id: 'inbox',
    label: 'Atendimentos abertos',
    value: kpis?.openConversations ?? 0,
    delta: null,
    hint: kpis?.unansweredConversations
      ? `${kpis.unansweredConversations} sem resposta`
      : 'Todos respondidos',
    hintDanger: !!(kpis?.unansweredConversations),
    icon: MessageCircle,
    accentClass: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
    barClass: 'bg-violet-500',
    section: 'inbox',
  },
  {
    id: 'hot',
    label: 'Leads quentes',
    value: kpis?.hotLeads ?? 0,
    delta: null,
    hint: kpis?.hotLeadsNeedingAction
      ? `${kpis.hotLeadsNeedingAction} precisam de ação`
      : 'Todos com responsável',
    hintDanger: !!(kpis?.hotLeadsNeedingAction),
    icon: Flame,
    accentClass: 'bg-orange-500/10 text-orange-500 dark:text-orange-400',
    barClass: 'bg-orange-500',
    section: 'leads',
  },
  {
    id: 'agenda',
    label: 'Agenda de hoje',
    value: kpis?.todayAgenda ?? 0,
    delta: null,
    hint: kpis?.upcomingSoon
      ? `${kpis.upcomingSoon} em breve`
      : 'Sem compromissos próximos',
    hintDanger: false,
    icon: Calendar,
    accentClass: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
    barClass: 'bg-emerald-500',
    section: 'calendar',
  },
];

function DeltaBadge({ delta }: { delta: number | null | undefined }) {
  if (delta == null || delta === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
  const up = delta > 0;
  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-medium', up ? 'text-success' : 'text-destructive')}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(delta)}%
    </span>
  );
}

export function OperationKpiCards({ kpis, onNavigate }: Props) {
  const cards = CARDS(kpis);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            onClick={() => onNavigate(c.section)}
            className={cn(
              'group relative text-left bg-card border border-border rounded-xl p-5',
              'hover:border-primary/30 hover:shadow-md',
              'transition-all duration-200 cursor-pointer outline-none',
              'focus-visible:ring-2 focus-visible:ring-primary/50',
              `animate-slide-up stagger-${idx + 1}`,
            )}
          >
            {/* Top accent bar */}
            <div className={cn('absolute top-0 left-5 right-5 h-0.5 rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-200', c.barClass)} />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground leading-none mb-3">
                  {c.label}
                </p>
                <p className="text-3xl font-bold text-foreground tabular-nums leading-none">
                  {c.value}
                </p>
                <p className={cn(
                  'text-xs mt-2 leading-none',
                  c.hintDanger ? 'text-warning' : 'text-muted-foreground',
                )}>
                  {c.hint}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', c.accentClass)}>
                  <Icon className="h-5 w-5" />
                </div>
                <DeltaBadge delta={c.delta} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
