import { User, Settings, LogOut, HelpCircle, Sparkles, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { UserStatusIndicator } from '@/components/layout/UserStatusIndicator';
import { HeaderProductSwitcher } from '@/components/layout/HeaderProductSwitcher';
import { WhatsAppDisconnectedBanner } from '@/components/layout/WhatsAppDisconnectedBanner';
import { Tables } from '@/integrations/supabase/types';
import { useUnreadReleasesCount } from '@/hooks/useReleases';
import { cn } from '@/lib/utils';

type DBProduct = Tables<'products'>;

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSelectLead?: (leadId: string) => void;
  onSelectProduct?: (productId: string) => void;
  assignedProducts?: DBProduct[];
  selectedProduct?: DBProduct | null;
  onSelectProductObject?: (product: DBProduct) => void;
}

export function Header({
  title,
  subtitle,
  assignedProducts = [],
  selectedProduct = null,
  onSelectProductObject,
}: HeaderProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: unreadReleases = 0 } = useUnreadReleasesCount();

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <WhatsAppDisconnectedBanner />
      <div className="flex items-center justify-between h-14 px-5 gap-4">

        {/* ─── Left: Page Title ─── */}
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-foreground leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground leading-tight truncate">{subtitle}</p>
          )}
        </div>

        {/* ─── Right: Actions ─── */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Product Switcher */}
          {assignedProducts.length > 0 && onSelectProductObject && (
            <HeaderProductSwitcher
              products={assignedProducts}
              selectedProduct={selectedProduct}
              onSelectProduct={onSelectProductObject}
            />
          )}

          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/ajuda')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Ajuda"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Novidades */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/novidades')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
            title="Novidades"
          >
            <Sparkles className="h-4 w-4" />
            {unreadReleases > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </Button>

          {/* Theme */}
          <ThemeToggle />

          {/* User Status */}
          <UserStatusIndicator />

          {/* Notifications */}
          <NotificationCenter />

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-muted transition-colors outline-none ring-0">
                <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-[10px] font-semibold">
                    {getInitials(profile?.full_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm text-foreground">{profile?.full_name || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground truncate">{profile?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <User className="h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
