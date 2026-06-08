import { Sparkles, TrendingUp, Target, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OperationKpis, OperationPriorities } from '@/hooks/useOperationCenter';

interface Props {
  kpis?: OperationKpis;
  priorities?: OperationPriorities;
}

const STATIC_INSIGHTS = [
  {
    icon: TrendingUp,
    title: 'Responda em até 5 min',
    body: 'Conversas respondidas rápido têm 3× mais chance de fechamento.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
];

export function AiInsightsCard({ kpis, priorities }: Props) {
  const insights = [...STATIC_INSIGHTS];

  if ((kpis?.hotLeadsNeedingAction ?? 0) > 0) {
    insights.push({
      icon: Target,
      title: `${kpis!.hotLeadsNeedingAction} leads engajados sem ação`,
      body: 'Aproveite o momento — timing é tudo em vendas.',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    });
  }

  if ((priorities?.overdueTasks ?? 0) === 0) {
    insights.push({
      icon: Users,
      title: 'Time em dia com as tarefas',
      body: 'Sem pendências atrasadas. Ótimo ritmo de operação.',
      color: 'text-success',
      bg: 'bg-success/10',
    });
  } else {
    insights.push({
      icon: Users,
      title: `${priorities!.overdueTasks} tarefas atrasadas`,
      body: 'Priorize para manter o pipeline saudável.',
      color: 'text-warning',
      bg: 'bg-warning/10',
    });
  }

  const hasData = (kpis?.newLeadsToday ?? 0) > 0 || (kpis?.openConversations ?? 0) > 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header with gradient accent */}
      <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Insights da IA</h3>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-1">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground max-w-[160px] leading-relaxed">
              Os insights aparecerão conforme a operação gerar dados.
            </p>
          </div>
        ) : (
          insights.slice(0, 3).map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', ins.bg)}>
                  <Icon className={cn('h-4 w-4', ins.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">{ins.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{ins.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
