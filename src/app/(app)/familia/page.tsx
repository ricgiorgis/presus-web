"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { familyService } from "@/services/supabase/family";
import { authService } from "@/services/supabase/auth";
import { formatAmount, ISO_4217_CURRENCIES } from "@/constants/currencies";
import type { FamilyGroup, FamilyExpense, FamilyMember } from "@/types/models";

function generateId() { return Math.random().toString(36).slice(2, 10); }
function randomColor() { const colors = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#85C1E9"]; return colors[Math.floor(Math.random() * colors.length)]; }

export default function FamiliaPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Record<string, FamilyExpense[]>>({});
  const [openGroup, setOpenGroup] = useState(false);
  const [openExpense, setOpenExpense] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", members: [{ name: "", email: "" }] });
  const [expenseForm, setExpenseForm] = useState({ description: "", total_amount: "", currency_code: "GTQ", date: new Date().toISOString().split("T")[0] });

  useEffect(() => {
    authService.getUser().then((u) => {
      if (!u) return;
      setUserId(u.id);
      familyService.getGroups(u.id).then(setGroups).finally(() => setLoading(false));
    });
  }, []);

  const handleCreateGroup = async () => {
    if (!userId || !groupForm.name) { toast.error(t("errors.required")); return; }
    try {
      const members: FamilyMember[] = groupForm.members.filter((m) => m.name).map((m) => ({ id: generateId(), name: m.name, email: m.email || undefined, avatar_color: randomColor() }));
      const newGroup = await familyService.createGroup({ user_id: userId, name: groupForm.name, members });
      setGroups([...groups, newGroup]);
      setOpenGroup(false);
      setGroupForm({ name: "", members: [{ name: "", email: "" }] });
      toast.success(t("common.success"));
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await familyService.deleteGroup(id);
      setGroups(groups.filter((g) => g.id !== id));
      if (expanded === id) setExpanded(null);
    } catch { toast.error(t("errors.genericError")); }
  };

  const loadExpenses = async (groupId: string) => {
    if (expenses[groupId]) return;
    const data = await familyService.getExpenses(groupId);
    setExpenses((prev) => ({ ...prev, [groupId]: data }));
  };

  const handleToggleExpand = async (groupId: string) => {
    if (expanded === groupId) { setExpanded(null); return; }
    setExpanded(groupId);
    await loadExpenses(groupId);
  };

  const handleCreateExpense = async (groupId: string, group: FamilyGroup) => {
    if (!expenseForm.description || !expenseForm.total_amount) { toast.error(t("errors.required")); return; }
    try {
      const total = parseFloat(expenseForm.total_amount);
      const splits = group.members.map((m) => ({ member_id: m.id, amount: total / group.members.length, paid: false }));
      const newExp = await familyService.createExpense({ family_group_id: groupId, description: expenseForm.description, total_amount: total, currency_code: expenseForm.currency_code, date: expenseForm.date, splits });
      setExpenses((prev) => ({ ...prev, [groupId]: [newExp, ...(prev[groupId] ?? [])] }));
      setOpenExpense(null);
      setExpenseForm({ description: "", total_amount: "", currency_code: "GTQ", date: new Date().toISOString().split("T")[0] });
      toast.success(t("common.success"));
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleDeleteExpense = async (groupId: string, expId: string) => {
    try {
      await familyService.deleteExpense(expId);
      setExpenses((prev) => ({ ...prev, [groupId]: (prev[groupId] ?? []).filter((e) => e.id !== expId) }));
    } catch { toast.error(t("errors.genericError")); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("familia.title")}</h1>
        <Dialog open={openGroup} onOpenChange={setOpenGroup}>
          <DialogTrigger render={<Button style={{ backgroundColor: "#2E7D32" }} className="text-white" />}>
            <Plus size={16} className="mr-2" />{t("familia.addGroup")}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("familia.addGroup")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>{t("familia.groupName")}</Label><Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="Ej. Familia García" /></div>
              <div>
                <Label>{t("familia.members")}</Label>
                <div className="space-y-2 mt-1">
                  {groupForm.members.map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="Nombre" value={m.name} onChange={(e) => { const arr = [...groupForm.members]; arr[i] = { ...arr[i], name: e.target.value }; setGroupForm({ ...groupForm, members: arr }); }} />
                      <Input placeholder="Email (opcional)" value={m.email} onChange={(e) => { const arr = [...groupForm.members]; arr[i] = { ...arr[i], email: e.target.value }; setGroupForm({ ...groupForm, members: arr }); }} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setGroupForm({ ...groupForm, members: [...groupForm.members, { name: "", email: "" }] })}>+ {t("familia.addMember")}</Button>
                </div>
              </div>
              <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleCreateGroup}>{t("common.save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="space-y-3">{[1,2].map((n) => <Skeleton key={n} className="h-24" />)}</div> : groups.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Users size={40} className="mx-auto mb-3 opacity-40" /><p>{t("familia.noGroups")}</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{Array.isArray(group.members) ? group.members.length : 0} miembros</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteGroup(group.id)}><Trash2 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleExpand(group.id)}>{expanded === group.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</Button>
                  </div>
                </div>
              </CardHeader>
              {expanded === group.id && (
                <CardContent className="pt-0">
                  <Separator className="mb-3" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{t("familia.sharedExpenses")}</span>
                    <Dialog open={openExpense === group.id} onOpenChange={(o) => setOpenExpense(o ? group.id : null)}>
                      <DialogTrigger render={<Button size="sm" variant="outline" />}>
                        <Plus size={14} className="mr-1" />{t("familia.addSharedExpense")}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{t("familia.addSharedExpense")}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div><Label>{t("common.description")}</Label><Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ej. Supermercado" /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label>{t("common.amount")}</Label><Input type="number" value={expenseForm.total_amount} onChange={(e) => setExpenseForm({ ...expenseForm, total_amount: e.target.value })} /></div>
                            <div><Label>{t("common.currency")}</Label>
                              <Select value={expenseForm.currency_code} onValueChange={(v) => v !== null && setExpenseForm({ ...expenseForm, currency_code: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{ISO_4217_CURRENCIES.slice(0, 10).map((c) => (<SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div><Label>{t("common.date")}</Label><Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} /></div>
                          <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={() => handleCreateExpense(group.id, group)}>{t("common.save")}</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {(expenses[group.id] ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("familia.noExpenses")}</p>
                  ) : (
                    <div className="divide-y">
                      {(expenses[group.id] ?? []).map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between py-2">
                          <div><p className="text-sm font-medium">{exp.description}</p><p className="text-xs text-muted-foreground">{exp.date}</p></div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{formatAmount(exp.total_amount, exp.currency_code)}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteExpense(group.id, exp.id)}><Trash2 size={13} /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
