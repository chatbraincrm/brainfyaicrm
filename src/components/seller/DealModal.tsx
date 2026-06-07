import { useState, useEffect, useMemo } from 'react';
import { useCreateDeal } from '@/hooks/useDeals';
import { useAuth } from '@/hooks/useAuth';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DollarSign, PartyPopper, Star } from 'lucide-react';
import type { ProductPlan } from '@/components/admin/products/tabs/PricingPlansSection';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  productId?: string | null;
  organizationId: string;
}

export function DealModal({ isOpen, onClose, leadId, leadName, productId, organizationId }: DealModalProps) {
  const { user } = useAuth();
  const createDeal = useCreateDeal();
  const { data: allProducts = [] } = useProducts();
  const [chosenProductId, setChosenProductId] = useState<string>('');

  const effectiveProductId = productId || chosenProductId;
  const { data: product } = useProduct(effectiveProductId || '');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');

  const orgProducts = useMemo(
    () => allProducts.filter((p: any) => p.organization_id === organizationId),
    [allProducts, organizationId]
  );

  const activePlans: ProductPlan[] = ((product?.pricing as unknown as ProductPlan[]) || []).filter(p => p.active);
  const hasPlans = activePlans.length > 0;
  const needsProduct = !productId;

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlanId('');
      setDealValue('');
      setNotes('');
      setChosenProductId('');
    }
  }, [isOpen]);

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = activePlans.find(p => p.id === planId);
    if (plan) {
      setDealValue(formatCurrency(String(Math.round(plan.price * 100))));
    }
  };

  const handleSubmit = async () => {
    if (!effectiveProductId) {
      toast.error('Selecione um produto');
      return;
    }

    const normalized = dealValue.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(normalized.replace(/[^\d.-]/g, ''));

    if (!value || value <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    const selectedPlan = activePlans.find(p => p.id === selectedPlanId);

    try {
      await createDeal.mutateAsync({
        lead_id: leadId,
        product_id: effectiveProductId,
        seller_id: user?.id || '',
        organization_id: organizationId,
        deal_value: value,
        status: 'won',
        notes: notes || null,
        closed_at: new Date().toISOString(),
        plan_name: selectedPlan?.name || null,
      });

      toast.success('Negócio registrado! Comissão calculada automaticamente.', {
        icon: <PartyPopper className="h-5 w-5" />
      });

      onClose();
    } catch (error: any) {
      console.error('[DealModal] Erro ao registrar negócio:', error);
      toast.error(error?.message || 'Erro ao registrar negócio');
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const number = parseInt(numericValue) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPlanLabel = (plan: ProductPlan) => {
    const price = plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const cycle = plan.billing_cycle !== 'unico' ? `/${plan.billing_cycle === 'mensal' ? 'mês' : plan.billing_cycle === 'anual' ? 'ano' : plan.billing_cycle}` : '';
    return `${plan.name} - ${price}${cycle}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-green-500" />
            Parabéns! Negócio Fechado!
          </DialogTitle>
          <DialogDescription>
            Registre o valor do negócio com <strong>{leadName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {needsProduct && (
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select value={chosenProductId} onValueChange={(v) => { setChosenProductId(v); setSelectedPlanId(''); setDealValue(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {orgProducts.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {orgProducts.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum produto cadastrado para esta empresa.</p>
              )}
            </div>
          )}

          {hasPlans && (
            <div className="space-y-2">
              <Label>Plano *</Label>
              <Select value={selectedPlanId} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <span className="flex items-center gap-1">
                        {plan.recommended && <Star className="h-3 w-3 text-primary" />}
                        {formatPlanLabel(plan)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="value">Valor do Negócio (R$)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="value"
                placeholder="0,00"
                value={dealValue}
                onChange={(e) => setDealValue(formatCurrency(e.target.value))}
                className="pl-9 text-lg font-medium"
                autoFocus={!hasPlans}
                readOnly={hasPlans && !!selectedPlanId}
              />
            </div>
            {hasPlans && selectedPlanId && (
              <p className="text-xs text-muted-foreground">Valor definido pelo plano selecionado</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Detalhes sobre o fechamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createDeal.isPending || !effectiveProductId || (hasPlans && !selectedPlanId)}
          >
            Registrar Negócio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
