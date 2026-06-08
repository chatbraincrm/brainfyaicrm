import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  MessageSquareWarning,
  FolderOpen,
  Bot,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Users,
  CheckSquare,
  DollarSign,
  Shield,
  MessageSquare,
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo } from '@/components/ui/Logo';
import { Tables } from '@/integrations/supabase/types';
import { prefetchIndexTab } from '@/pages/Index';

type DBProduct = Tables<'products'>;

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedProduct?: DBProduct | null;
  hasMultipleProducts?: boolean;
  onBackToProducts?: () => void;
  assignedProducts?: DBProduct[];
  onSelectProduct?: (product: DBProduct) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// Menu quando tem produto selecionado
const productNavItems = [
  { id: 'product-dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'leads', label: 'Pipeline', icon: Users },
  { id: 'inbox', label: 'Conversas', icon: MessageSquare },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'bookings', label: 'Agendamentos', icon: CalendarCheck },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'cadence', label: 'Cadência', icon: Calendar },
  { id: 'playbook', label: 'Playbook', icon: BookOpen },
  { id: 'objections', label: 'Objeções', icon: MessageSquareWarning },
  { id: 'materials', label: 'Materiais', icon: FolderOpen },
  { id: 'ai', label: 'IA Copiloto', icon: Bot },
];

export function Sidebar({ 
  activeTab, 
  onTabChange, 
  selectedProduct, 
  hasMultipleProducts,
  onBackToProducts,
  assignedProducts = [],
  onSelectProduct,
  onCollapsedChange,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin, isManager, isSuperAdmin } = useAuth();
  const showAdminLink = isAdmin() || isManager();
  const showSuperAdminLink = isSuperAdmin();

  const navItems = selectedProduct ? productNavItems : [];

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      onCollapsedChange?.(next);
      return next;
    });
  };

  const NavItem = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    onPrefetch,
  }: {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    onPrefetch?: () => void;
  }) => {
    const btn = (
      <button
        onClick={onClick}
        onMouseEnter={onPrefetch}
        onTouchStart={onPrefetch}
        onFocus={onPrefetch}
        className={cn(
          "relative w-full flex items-center gap-3 rounded-lg transition-all duration-200 group",
          collapsed ? "h-10 w-10 justify-center mx-auto px-0" : "px-3 h-9",
          isActive
            ? "bg-primary/12 text-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
        )}
        <Icon size={18} className="shrink-0" />
        {!collapsed && (
          <span className="text-sm font-medium leading-none">{label}</span>
        )}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return btn;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
          "bg-sidebar border-r border-sidebar-border flex flex-col",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
          {!collapsed && <Logo size="md" />}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleCollapsed}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              onPrefetch={() => prefetchIndexTab(item.id)}
            />
          ))}

          {/* Assigned products when no product is selected */}
          {!selectedProduct && !collapsed && (
            <div className="pt-3">
              {assignedProducts.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <Package className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Nenhum produto atribuído
                  </p>
                </div>
              ) : (
                <>
                  <p className="section-label px-3 mb-2">Meus Produtos</p>
                  <div className="space-y-0.5">
                    {assignedProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => onSelectProduct?.(product)}
                        className="w-full flex items-center gap-2 px-3 h-9 rounded-lg transition-colors text-left text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      >
                        <Package size={15} className="shrink-0" />
                        <span className="text-sm truncate">{product.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
          {showSuperAdminLink && (
            <Link to="/super-admin" className="block">
              <NavItem icon={Shield} label="Super Admin" isActive={false} onClick={() => {}} />
            </Link>
          )}
          {showAdminLink && (
            <Link to="/admin" className="block">
              <NavItem icon={Shield} label="Painel Admin" isActive={false} onClick={() => {}} />
            </Link>
          )}
          <Link to="/configuracoes" className="block">
            <NavItem icon={Settings} label="Configurações" isActive={false} onClick={() => {}} />
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  );
}
