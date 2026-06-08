import { useSearchParams } from 'react-router-dom';
import {
  useOperationKpis,
  useOperationPriorities,
  useTodayAgenda,
  useRecentLeads,
} from '@/hooks/useOperationCenter';
import { OperationKpiCards } from './OperationKpiCards';
import { PrioritiesCard } from './PrioritiesCard';
import { TodayAgendaCard } from './TodayAgendaCard';
import { RecentLeadsTable } from './RecentLeadsTable';
import { AiInsightsCard } from './AiInsightsCard';
import { Activity } from 'lucide-react';

export function OperationCenter() {
  const [, setSearchParams] = useSearchParams();
  const { data: kpis } = useOperationKpis();
  const { data: priorities } = useOperationPriorities();
  const { data: agenda } = useTodayAgenda();
  const { data: recentLeads } = useRecentLeads();

  const handleNavigate = (section: string) => {
    setSearchParams({ tab: section }, { replace: true });
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ─── Page Header ─── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Central de Operações
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {greeting} · {dateStr}
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 flex-shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-success">Ao vivo</span>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <OperationKpiCards kpis={kpis} onNavigate={handleNavigate} />

      {/* ─── Middle Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PrioritiesCard data={priorities} onNavigate={handleNavigate} />
        <TodayAgendaCard items={agenda} onNavigate={handleNavigate} />
      </div>

      {/* ─── Bottom Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentLeadsTable leads={recentLeads} onNavigate={handleNavigate} />
        </div>
        <AiInsightsCard kpis={kpis} priorities={priorities} />
      </div>
    </div>
  );
}
