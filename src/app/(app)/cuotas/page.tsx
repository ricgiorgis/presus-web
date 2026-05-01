"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, CreditCard, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { installmentsService } from "@/services/supabase/installments";
import { authService } from "@/services/supabase/auth";
import { useFamily } from "@/contexts/FamilyContext";
import { formatAmount, ISO_4217_CURRENCIES } from "@/constants/currencies";
import type { Installment } from "@/types/models";

export default function CuotasPage() {
  const { t } = useTranslation();
  const { familyGroupId } = useFamily();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", total_amount: "", installments_count: "", currency_code: "GTQ", start_date: new Date().toISOString().split("T")[0] });

  useEffect(() => {
    authService.getUser().then((u) => {
      if (!u) return;
      setUserId(u.id);
      installmentsService.getAll(u.id, familyGroupId).then(setInstallments).finally(() => setLoading(false));
    });
  }, []);

  const handleCreate = async () => {
    if (!userId || !form.name || !form.total_amount || !form.installments_count) {
      toast.error(t("errors.required")); return;
    }
    try {
      const newItem = await installmentsService.create({
        user_id: userId, name: form.name, total_amount: parseFloat(form.total_amount),
        installments_count: parseInt(form.installments_count), paid_count: 0,
        start_date: form.start_date, currency_code: form.currency_code,
      });
      setInstallments([newItem, ...installments]);
      setOpen(false);
      setForm({ name: "", total_amount: "", installments_count: "", currency_code: "GTQ", start_date: new Date().toISOString().split("T")[0] });
      toast.success(t("common.success"));
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const updated = await installmentsService.markPaid(id);
      setInstallments(installments.map((i) => i.id === id ? updated : i));
      toast.success("¡Cuota pagada!");
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleDelete = async (id: string) => {
    try {
      await installmentsService.delete(id);
      setInstallments(installments.filter((i) => i.id !== id));
    } catch { toast.error(t("errors.genericError")); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("cuotas.title")}</h1>
          <p className="text-muted-foreground">{installments.length} registradas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button style={{ backgroundColor: "#2E7D32" }} className="text-white" />}>
            <Plus size={16} className="mr-2" />{t("cuotas.addInstallment")}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("cuotas.addInstallment")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>{t("common.description")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Celular, TV..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t("common.amount")}</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></div>
                <div><Label>{t("cuotas.installmentsCount")}</Label><Input type="number" value={form.installments_count} onChange={(e) => setForm({ ...form, installments_count: e.target.value })} /></div>
              </div>
              <div><Label>{t("common.currency")}</Label>
                <Select value={form.currency_code} onValueChange={(v) => v !== null && setForm({ ...form, currency_code: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ISO_4217_CURRENCIES.slice(0, 10).map((c) => (<SelectItem key={c.code} value={c.code}>{c.code} – {c.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><Label>{t("cuotas.startDate")}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleCreate}>{t("common.save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((n) => <Skeleton key={n} className="h-28" />)}</div>
      ) : installments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><CreditCard size={40} className="mx-auto mb-3 opacity-40" /><p>{t("cuotas.noInstallments")}</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {installments.map((item) => {
            const pct = Math.min((item.paid_count / item.installments_count) * 100, 100);
            const isDone = item.paid_count >= item.installments_count;
            return (
              <Card key={item.id}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{formatAmount(item.total_amount, item.currency_code)}</p>
                  </div>
                  <div className="flex gap-1">
                    {isDone ? <Badge className="bg-green-600 text-white">{t("cuotas.completed")}</Badge> : <Badge variant="outline">{t("cuotas.pending")}</Badge>}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{item.paid_count} / {item.installments_count} pagadas</span>
                    <span className="font-medium">{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  {!isDone && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleMarkPaid(item.id)}>
                      <CheckCircle size={14} className="mr-2" />Marcar cuota pagada
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
