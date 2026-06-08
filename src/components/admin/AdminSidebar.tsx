import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import {
  fixedItems,
  menuGroups,
  findGroupIdForSection,
} from '@/config/adminMenu';
import type { AdminMenuItem } from '@/config/adminMenu';
import { useIsSuperAdmin } from '@/hooks/useSuperAdmin';
import { prefetchAdminSection } from '@/pages/Admin';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

function NavItem({
  item,
  activeSection,
  collapsed,
  onSectionChange,
}: {
  item: AdminMenuItem;
  activeSection: string;
  collapsed: boolean;
  onSectionChange: (id: string) => void;
}) {
  const Icon = item.icon;
  const isActive = activeSection === item.id;
  const isDisabled = !!item.comingSoon;

  const btn = (
    <button
      key={item.id}
      onClick={() => { if (!isDisabled) onSectionChange(item.id); }}
      onMouseEnter={() => !isDisabled && prefetchAdminSection(item.id)}
      onTouchStart={() => !isDisabled && prefetchAdminSection(item.id)}
      onFocus={() => !isDisabled && prefetchAdminSection(item.id)}
      disabled={isDisabled}
      className={cn(
        'group relative w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none',
        collapsed ? 'h-9 w-9 justify-center p-0 mx-auto' : 'h-9 px-2.5',
        isDisabled
          ? 'opacity-40 cursor-not-allowed'
          : isActive
          ? 'bg-primary/12 text-primary'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      {/* Active left indicator */}
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
      )}

      <Icon className={cn('flex-shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')} />

      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate leading-none">{item.label}</span>
          {isDisabled && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-medium">
              breve
            </Badge>
          )}
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.label}
          {isDisabled && <span className="ml-1 text-muted-foreground">(em breve)</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return btn;
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const activeGroupId = findGroupIdForSection(activeSection);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-[width] duration-300 ease-in-out sticky top-0 overflow-hidden flex-shrink-0',
          collapsed ? 'w-[60px]' : 'w-[220px]',
        )}
      >
        {/* ─── Logo / Brand ─── */}
        <div className={cn(
          'flex items-center border-b border-sidebar-border flex-shrink-0 h-14',
          collapsed ? 'justify-center px-2' : 'justify-between px-3',
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Logo size="md" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center',
              'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              'transition-colors duration-150',
            )}
            title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* ─── Back to app ─── */}
        <div className={cn('px-2 py-2 border-b border-sidebar-border flex-shrink-0')}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink to="/" className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Voltar ao App</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/"
              className="flex items-center gap-2 h-8 px-2.5 rounded-lg text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Voltar ao App</span>
            </NavLink>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto min-h-0 py-2 px-2 space-y-0.5">

          {/* Fixed items */}
          {!collapsed && (
            <p className="section-label mt-1">Principal</p>
          )}
          {fixedItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              activeSection={activeSection}
              collapsed={collapsed}
              onSectionChange={onSectionChange}
            />
          ))}

          {/* Separator */}
          {collapsed ? (
            <div className="my-2 border-t border-sidebar-border" />
          ) : (
            <div className="my-2" />
          )}

          {/* Groups */}
          {collapsed ? (
            menuGroups.flatMap((g) =>
              g.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  activeSection={activeSection}
                  collapsed={collapsed}
                  onSectionChange={onSectionChange}
                />
              ))
            )
          ) : (
            <Accordion
              type="multiple"
              defaultValue={activeGroupId ? [activeGroupId] : []}
              className="w-full space-y-0.5"
            >
              {menuGroups.map((group) => {
                const GroupIcon = group.icon;
                const hasActive = group.items.some((i) => i.id === activeSection);

                return (
                  <AccordionItem
                    key={group.id}
                    value={group.id}
                    className="border-none"
                  >
                    <AccordionTrigger
                      className={cn(
                        'h-9 px-2.5 rounded-lg text-sm font-medium',
                        'hover:bg-sidebar-accent hover:no-underline',
                        '[&[data-state=open]]:bg-sidebar-accent/60',
                        'transition-colors duration-150 py-0',
                        hasActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground',
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <GroupIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{group.label}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-0.5">
                      <div className="pl-3.5 space-y-0.5 border-l border-sidebar-border ml-4 py-0.5">
                        {group.items.map((item) => (
                          <NavItem
                            key={item.id}
                            item={item}
                            activeSection={activeSection}
                            collapsed={collapsed}
                            onSectionChange={onSectionChange}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Super Admin */}
          {isSuperAdmin && (
            <>
              <div className="my-2 border-t border-sidebar-border" />
              {!collapsed && <p className="section-label">Plataforma</p>}
              {collapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink to="/super-admin" className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                      <Shield className="h-4 w-4" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Super Admin</TooltipContent>
                </Tooltip>
              ) : (
                <NavLink
                  to="/super-admin"
                  className="flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span>Super Admin</span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* ─── Footer ─── */}
        <div className={cn(
          'flex items-center border-t border-sidebar-border flex-shrink-0 h-12 px-2',
          collapsed ? 'justify-center' : 'justify-between',
        )}>
          {!collapsed && (
            <span className="text-[10px] text-sidebar-foreground/35 font-medium ml-1">
              Brainfy
            </span>
          )}
          <ThemeToggle />
        </div>
      </aside>
    </TooltipProvider>
  );
}
