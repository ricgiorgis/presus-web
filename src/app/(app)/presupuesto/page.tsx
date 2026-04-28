"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authService } from "@/services/supabase/auth";
import { expensesService } from "@/services/supabase/expenses";
import { budgetService } from "@/services/supabase/budget";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { ISO_4217_CURRENCIES, formatAmount } from "@/constants/currencies";
import { useSettingsStore } from "@/store/settingsStore";
import type { Budget, Expense } from "@/types/models";

const budgetSchema = z.object({
  category: z.string().min(1),
  limit_amount: z.coerce.number().positive("Ingresa un monto válido"),
  currency_code: z.string().min(1),
  period: z.enum(["monthly", "weekly"]),
});
type BudgetForm = z.output<typeof budgetSchema>;
type BudgetFormInput = z.input<typeof budgetSchema>;

function getProgressColor(pct: number) {
  if (pct >= 100) return "#EF4444";
  if (pct >= 70) return "#F59E0B";
  return "#2E7D32";
}

export default function PresupuestoPage() {
  const { t } = useTranslation();
  const { currency: defaultCurrency } = useSettingsStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BudgetFormInput, unknown, BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { currency_code: defaultCurrency, period: "monthly" },
  });
  const selCat = watch("category");
  const selCurr = watch("currency_code");
  const selPeriod = watch("period");

  const currentMonth = format(new Date(), "yyyy-MM");

  async function load(uid: string) {
    setLoading(true);
    try {
      const [bud, exp] = await Promise.all([
        budgetService.getAll(uid),
        expensesService.getAll(uid, { month: currentMonth }),
      ]);
      setBudgets(bud);
      setExpenses(exp);
    } catch {
      toast.error("Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    authService.getUser().then((u) => {
      if (u) { setUserId(u.id); load(u.id); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSpent = (cat: string) =>
    expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);

  const onSubmit = async (data: BudgetForm) => {
    if (!userId) return;
    setSaving(true);
    try {
      await budgetService.create({ ...data, user_id: userId });
      toast.success("Presupuesto creado");
      reset();
      setDialogOpen(false);
      load(userId);
    } catch {
      toast.error("Error al crear presupuesto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await budgetService.delete(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      toast.success("Presupuesto eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const getCat = (id: string) => EXPENSE_CATEGORIES.find((c) => c.id === id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("presupuesto.title")}</h1>
        <Button className="text-white gap-2" style={{ backgroundColor: "#2E7D32" }} onClick={() => setDialogOpen(true)}>
          <Plus size={16} />
          {t("presupuesto.addBudget")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t("presupuesto.noBudgets")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget) => {
            const spent = getSpent(budget.category);
            const pct = budget.limit_amount > 0 ? Math.min((spent / budget.limit_amount) * 100, 100) : 0;
            const remaining = budget.limit_amount - spent;
            const color = getProgressColor(pct);
            const cat = getCat(budget.category);

            return (
              <Card key={budget.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat?.emoji ?? "📦"}</span>
                      <CardTitle className="text-sm capitalize">{budget.category}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("presupuesto.spent")}: {formatAmount(spent, budget.currency_code)}</span>
                    <span>{t("presupuesto.limit")}: {formatAmount(budget.limit_amount, budget.currency_code)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color }}>
                      {pct.toFixed(0)}% usado
                    </span>
                    {remaining < 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        Excedido {formatAmount(Math.abs(remaining), budget.currency_code)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("presupuesto.remaining")}: {formatAmount(remaining, budget.currency_code)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("presupuesto.addBudget")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select onValueChange={(v) => v !== null && setValue("category", v)} value={selCat}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.id.charAt(0).toUpperCase() + cat.id.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">Requerido</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Límite</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register("limit_amount")} />
                {errors.limit_amount && <p className="text-sm text-destructive">{errors.limit_amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select onValueChange={(v) => v !== null && setValue("currency_code", v)} value={selCurr}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ISO_4217_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <Select onValueChange={(v) => setValue("period", v as "monthly" | "weekly")} value={selPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t("presupuesto.monthly")}</SelectItem>
                  <SelectItem value="weekly">{t("presupuesto.weekly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 text-white" style={{ backgroundColor: "#2E7D32" }} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
