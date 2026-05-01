"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { differenceInDays, format, parseISO } from "date-fns";
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
import { goalsService } from "@/services/supabase/goals";
import { useFamily } from "@/contexts/FamilyContext";
import { ISO_4217_CURRENCIES, formatAmount } from "@/constants/currencies";
import { useSettingsStore } from "@/store/settingsStore";
import type { Goal } from "@/types/models";

const GOAL_COLORS = ["#2E7D32", "#1565C0", "#F57F17", "#C62828", "#6A1B9A", "#00838F"];

const goalSchema = z.object({
  name: z.string().min(1, "Requerido"),
  target_amount: z.coerce.number().positive("Ingresa un monto válido"),
  currency_code: z.string().min(1),
  color: z.string().min(1),
  deadline: z.string().optional(),
});
type GoalForm = z.output<typeof goalSchema>;
type GoalFormInput = z.input<typeof goalSchema>;

const fundsSchema = z.object({ amount: z.coerce.number().positive("Ingresa un monto válido") });
type FundsForm = z.output<typeof fundsSchema>;
type FundsFormInput = z.input<typeof fundsSchema>;

export default function MetasPage() {
  const { t } = useTranslation();
  const { currency: defaultCurrency } = useSettingsStore();
  const { familyGroupId } = useFamily();
  const [userId, setUserId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fundsDialogOpen, setFundsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<GoalFormInput, unknown, GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: { currency_code: defaultCurrency, color: GOAL_COLORS[0] },
  });
  const selCurr = watch("currency_code");
  const selColor = watch("color");

  const fundsForm = useForm<FundsFormInput, unknown, FundsForm>({ resolver: zodResolver(fundsSchema) });

  async function load(uid: string) {
    setLoading(true);
    try {
      setGoals(await goalsService.getAll(uid, familyGroupId));
    } catch {
      toast.error("Error al cargar metas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    authService.getUser().then((u) => { if (u) { setUserId(u.id); load(u.id); } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyGroupId]);

  const onSubmitGoal = async (data: GoalForm) => {
    if (!userId) return;
    setSaving(true);
    try {
      await goalsService.create({
        user_id: userId,
        name: data.name,
        target_amount: data.target_amount,
        current_amount: 0,
        currency_code: data.currency_code,
        color: data.color,
        deadline: data.deadline ?? null,
        ...(familyGroupId ? { family_group_id: familyGroupId } : {}),
      });
      toast.success("Meta creada");
      reset();
      setDialogOpen(false);
      load(userId);
    } catch {
      toast.error("Error al crear meta");
    } finally {
      setSaving(false);
    }
  };

  const onAddFunds = async (data: FundsForm) => {
    if (!selectedGoal) return;
    setSaving(true);
    try {
      await goalsService.addFunds(selectedGoal.id, data.amount);
      toast.success("Fondos agregados");
      fundsForm.reset();
      setFundsDialogOpen(false);
      setSelectedGoal(null);
      if (userId) load(userId);
    } catch {
      toast.error("Error al agregar fondos");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await goalsService.delete(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success("Meta eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("metas.title")}</h1>
        <Button className="text-white gap-2" style={{ backgroundColor: "#2E7D32" }} onClick={() => setDialogOpen(true)}>
          <Plus size={16} />
          {t("metas.addGoal")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t("metas.noGoals")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
            const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;
            const completed = goal.current_amount >= goal.target_amount;

            return (
              <Card key={goal.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: goal.color }} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{goal.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completed && (
                    <Badge className="text-white" style={{ backgroundColor: "#2E7D32" }}>
                      {t("metas.completed")}
                    </Badge>
                  )}
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{formatAmount(goal.current_amount, goal.currency_code)}</span>
                      <span>{formatAmount(goal.target_amount, goal.currency_code)}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-right mt-1 text-muted-foreground">{pct.toFixed(0)}%</p>
                  </div>
                  <div className="flex items-center justify-between">
                    {daysLeft !== null && (
                      <Badge variant={daysLeft < 30 ? "destructive" : "secondary"} className="text-xs">
                        {daysLeft > 0 ? t("metas.daysLeft", { days: daysLeft }) : "Vencida"}
                      </Badge>
                    )}
                    {!completed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs ml-auto"
                        onClick={() => { setSelectedGoal(goal); setFundsDialogOpen(true); }}
                      >
                        {t("metas.addFunds")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("metas.addGoal")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmitGoal)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la meta</Label>
              <Input placeholder="Ej: Vacaciones" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("metas.targetAmount")}</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register("target_amount")} />
                {errors.target_amount && <p className="text-sm text-destructive">{errors.target_amount.message}</p>}
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
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: selColor === c ? "#000" : "transparent" }}
                    onClick={() => setValue("color", c)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("metas.deadline")} (opcional)</Label>
              <Input type="date" min={format(new Date(), "yyyy-MM-dd")} {...register("deadline")} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 text-white" style={{ backgroundColor: "#2E7D32" }} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={fundsDialogOpen} onOpenChange={setFundsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar fondos — {selectedGoal?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={fundsForm.handleSubmit(onAddFunds)} className="space-y-4">
            <div className="space-y-2">
              <Label>Monto a agregar</Label>
              <Input type="number" step="0.01" placeholder="0.00" {...fundsForm.register("amount")} />
              {fundsForm.formState.errors.amount && (
                <p className="text-sm text-destructive">{fundsForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setFundsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 text-white" style={{ backgroundColor: "#2E7D32" }} disabled={saving}>
                {saving ? "Guardando..." : "Agregar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
