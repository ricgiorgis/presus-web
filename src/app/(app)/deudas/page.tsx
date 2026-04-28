"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, HandCoins, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { debtsService } from "@/services/supabase/debts";
import { authService } from "@/services/supabase/auth";
import { formatAmount, ISO_4217_CURRENCIES } from "@/constants/currencies";
import type { Debt } from "@/types/models";

export default function DeudasPage() {
  const { t } = useTranslation();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ person_name: "", amount: "", currency_code: "GTQ", direction: "i_owe" as "i_owe" | "they_owe", description: "", date: new Date().toISOString().split("T")[0] });

  useEffect(() => {
    authService.getUser().then((u) => {
      if (!u) return;
      setUserId(u.id);
      debtsService.getAll(u.id).then(setDebts).finally(() => setLoading(false));
    });
  }, []);

  const handleCreate = async () => {
    if (!userId || !form.person_name || !form.amount) { toast.error(t("errors.required")); return; }
    try {
      const newDebt = await debtsService.create({ user_id: userId, person_name: form.person_name, amount: parseFloat(form.amount), currency_code: form.currency_code, direction: form.direction, description: form.description, date: form.date });
      setDebts([newDebt, ...debts]);
      setOpen(false);
      setForm({ person_name: "", amount: "", currency_code: "GTQ", direction: "i_owe", description: "", date: new Date().toISOString().split("T")[0] });
      toast.success(t("common.success"));
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleTogglePaid = async (debt: Debt) => {
    try {
      await debtsService.markPaid(debt.id, !debt.paid);
      setDebts(debts.map((d) => d.id === debt.id ? { ...d, paid: !d.paid } : d));
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleDelete = async (id: string) => {
    try {
      await debtsService.delete(id);
      setDebts(debts.filter((d) => d.id !== id));
    } catch { toast.error(t("errors.genericError")); }
  };

  const iOwe = debts.filter((d) => d.direction === "i_owe");
  const theyOwe = debts.filter((d) => d.direction === "they_owe");
  const totalIOwe = iOwe.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0);
  const totalTheyOwe = theyOwe.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0);

  const DebtItem = ({ debt }: { debt: Debt }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{debt.person_name}</p>
        {debt.description && <p className="text-xs text-muted-foreground truncate">{debt.description}</p>}
        <p className="text-xs text-muted-foreground">{debt.date}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-sm">{formatAmount(debt.amount, debt.currency_code)}</span>
        {debt.paid && <Badge variant="outline" className="text-green-600 border-green-600 text-xs">Pagada</Badge>}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-700" onClick={() => handleTogglePaid(debt)} title={debt.paid ? "Marcar pendiente" : t("debts.markPaid")}><CheckCircle size={14} /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(debt.id)}><Trash2 size={14} /></Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("debts.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button style={{ backgroundColor: "#2E7D32" }} className="text-white" />}>
            <Plus size={16} className="mr-2" />{t("debts.addDebt")}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("debts.addDebt")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>{t("debts.person")}</Label><Input value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} placeholder="Nombre de la persona" /></div>
              <div><Label>Dirección</Label>
                <Select value={form.direction} onValueChange={(v) => v !== null && setForm({ ...form, direction: v as "i_owe" | "they_owe" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="i_owe">{t("debts.iOwe")}</SelectItem><SelectItem value="they_owe">{t("debts.theyOwe")}</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t("common.amount")}</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>{t("common.currency")}</Label>
                  <Select value={form.currency_code} onValueChange={(v) => v !== null && setForm({ ...form, currency_code: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ISO_4217_CURRENCIES.slice(0, 10).map((c) => (<SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>{t("common.description")} (opcional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>{t("common.date")}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleCreate}>{t("debts.saveDebt")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-red-200"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{t("debts.iOwe")}</p><p className="text-2xl font-bold text-red-600">{formatAmount(totalIOwe, "GTQ")}</p></CardContent></Card>
        <Card className="border-green-200"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{t("debts.theyOwe")}</p><p className="text-2xl font-bold text-green-700">{formatAmount(totalTheyOwe, "GTQ")}</p></CardContent></Card>
      </div>

      {loading ? <div className="space-y-3">{[1,2,3].map((n) => <Skeleton key={n} className="h-16" />)}</div> : (
        <div className="space-y-4">
          {iOwe.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base text-red-700">{t("debts.iOwe")}</CardTitle></CardHeader>
              <CardContent className="divide-y">{iOwe.map((d) => <DebtItem key={d.id} debt={d} />)}</CardContent>
            </Card>
          )}
          {theyOwe.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base text-green-700">{t("debts.theyOwe")}</CardTitle></CardHeader>
              <CardContent className="divide-y">{theyOwe.map((d) => <DebtItem key={d.id} debt={d} />)}</CardContent>
            </Card>
          )}
          {debts.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><HandCoins size={40} className="mx-auto mb-3 opacity-40" /><p>{t("debts.noDebts")}</p></CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
