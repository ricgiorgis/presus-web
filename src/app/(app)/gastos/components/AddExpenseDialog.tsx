"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { expensesService } from "@/services/supabase/expenses";
import { streakService } from "@/services/supabase/streak";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { ISO_4217_CURRENCIES } from "@/constants/currencies";
import type { FamilyGroupType } from "@/types/models";

const schema = z.object({
  category: z.string().min(1, "Selecciona una categoría"),
  amount: z.coerce.number().positive("Ingresa un monto válido"),
  description: z.string().optional(),
  date: z.string().min(1, "Selecciona una fecha"),
  currency_code: z.string().min(1, "Selecciona una moneda"),
});

type FormValues = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultCurrency?: string;
  familyGroupId?: string | null;
  groupType?: FamilyGroupType | null;
  onSuccess: () => void;
}

export function AddExpenseDialog({
  open, onOpenChange, userId, defaultCurrency = "GTQ",
  familyGroupId, groupType, onSuccess,
}: AddExpenseDialogProps) {
  const [saving, setSaving] = useState(false);
  const [isShared, setIsShared] = useState(true);

  const showToggle = familyGroupId && (groupType === "familiar" || groupType === "roommates");

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      currency_code: defaultCurrency,
    },
  });

  const selectedCategory = watch("category");
  const selectedCurrency = watch("currency_code");

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const sharedValue = familyGroupId
        ? (groupType === "pareja" ? true : isShared)
        : false;

      await expensesService.create({
        user_id: userId,
        amount: data.amount,
        currency_code: data.currency_code,
        category: data.category,
        description: data.description ?? "",
        date: data.date,
        ...(familyGroupId ? {
          family_group_id: familyGroupId,
          is_shared: sharedValue,
          added_by_user_id: userId,
        } : { is_shared: false }),
      });
      await streakService.recordActivity(userId);
      toast.success("Gasto registrado");
      reset();
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Error al registrar el gasto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select onValueChange={(v) => v !== null && setValue("category", v)} value={selectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.id.charAt(0).toUpperCase() + cat.id.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select onValueChange={(v) => v !== null && setValue("currency_code", v)} value={selectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Moneda" />
                </SelectTrigger>
                <SelectContent>
                  {ISO_4217_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} – {c.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input placeholder="Ej: Almuerzo en restaurante" {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>

          {showToggle && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Gasto compartido</p>
                <p className="text-xs text-muted-foreground">Visible para todos los miembros</p>
              </div>
              <Switch checked={isShared} onCheckedChange={setIsShared} />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 text-white" style={{ backgroundColor: "#2E7D32" }} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
