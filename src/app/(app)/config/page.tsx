"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { User, Shield, Database, Tag, LogOut, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { authService } from "@/services/supabase/auth";
import { customCategoriesService } from "@/services/supabase/customCategories";
import { expensesService } from "@/services/supabase/expenses";
import { budgetService } from "@/services/supabase/budget";
import { goalsService } from "@/services/supabase/goals";
import { useSettingsStore } from "@/store/settingsStore";
import { ISO_4217_CURRENCIES } from "@/constants/currencies";
import type { CustomCategory } from "@/types/models";

export default function ConfigPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, budgetPeriod, setBudgetPeriod } = useSettingsStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [openCat, setOpenCat] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", emoji: "🙂", color: "#4CAF50" });
  const [pinForm, setPinForm] = useState({ pin: "", confirm: "" });
  const [openPin, setOpenPin] = useState(false);

  useEffect(() => {
    authService.getUser().then((u) => {
      if (!u) return;
      setUserId(u.id);
      setUserEmail(u.email ?? "");
      setFullName((u.user_metadata?.full_name as string) ?? "");
      customCategoriesService.getAll(u.id).then(setCustomCats);
    });
  }, []);

  const handleLogout = async () => {
    try { await authService.signOut(); router.replace("/login"); }
    catch { toast.error(t("errors.genericError")); }
  };

  const handleCreateCat = async () => {
    if (!userId || !catForm.name) { toast.error(t("errors.required")); return; }
    try {
      const cat = await customCategoriesService.create({ user_id: userId, name: catForm.name, emoji: catForm.emoji, color: catForm.color });
      setCustomCats([...customCats, cat]);
      setOpenCat(false); setCatForm({ name: "", emoji: "🙂", color: "#4CAF50" });
      toast.success(t("common.success"));
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleDeleteCat = async (id: string) => {
    try { await customCategoriesService.delete(id); setCustomCats(customCats.filter((c) => c.id !== id)); }
    catch { toast.error(t("errors.genericError")); }
  };

  const handleExport = async () => {
    if (!userId) return;
    try {
      const [expenses, budgets, goals] = await Promise.all([
        expensesService.getAll(userId),
        budgetService.getAll(userId),
        goalsService.getAll(userId),
      ]);
      const blob = new Blob([JSON.stringify({ expenses, budgets, goals, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `presus-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Backup exportado");
    } catch { toast.error(t("errors.genericError")); }
  };

  const handleSetPin = () => {
    if (pinForm.pin.length < 4) { toast.error("El PIN debe tener al menos 4 dígitos"); return; }
    if (pinForm.pin !== pinForm.confirm) { toast.error(t("security.pinMismatch")); return; }
    sessionStorage.setItem("presus_pin", pinForm.pin);
    setOpenPin(false); setPinForm({ pin: "", confirm: "" });
    toast.success(t("security.pinSet"));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {/* Perfil */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><User size={16} />{t("settings.profile")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><p className="text-sm font-medium">{fullName || "Sin nombre"}</p><p className="text-sm text-muted-foreground">{userEmail}</p></div>
        </CardContent>
      </Card>

      {/* Preferencias */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Preferencias</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("settings.language")}</Label>
            <Select value={(i18n.language ?? "es").slice(0, 2)} onValueChange={(v) => v !== null && i18n.changeLanguage(v)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="pt">Português</SelectItem></SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>{t("settings.currency")}</Label>
            <Select value={currency} onValueChange={(v) => v !== null && setCurrency(v)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{ISO_4217_CURRENCIES.slice(0, 15).map((c) => (<SelectItem key={c.code} value={c.code}>{c.code} – {c.symbol}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>{t("settings.theme")}</Label>
            <div className="flex gap-1">
              {([["light", Sun], ["dark", Moon], ["system", Monitor]] as const).map(([val, Icon]) => (
                <Button key={val} variant={theme === val ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setTheme(val)} style={theme === val ? { backgroundColor: "#2E7D32" } : undefined}><Icon size={14} /></Button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label>{t("settings.budgetCycle")}</Label>
            <Select value={budgetPeriod} onValueChange={(v) => v !== null && setBudgetPeriod(v as "monthly" | "weekly")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="monthly">{t("settings.monthly")}</SelectItem><SelectItem value="weekly">{t("settings.weekly")}</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Shield size={16} />{t("settings.security")}</CardTitle></CardHeader>
        <CardContent>
          <Dialog open={openPin} onOpenChange={setOpenPin}>
            <DialogTrigger render={<Button variant="outline" className="w-full" />}>{t("security.setPin")}</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("security.setPin")}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>{t("security.enterPin")}</Label><Input type="password" inputMode="numeric" maxLength={8} value={pinForm.pin} onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value })} /></div>
                <div><Label>{t("security.confirmPin")}</Label><Input type="password" inputMode="numeric" maxLength={8} value={pinForm.confirm} onChange={(e) => setPinForm({ ...pinForm, confirm: e.target.value })} /></div>
                <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleSetPin}>{t("common.save")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Categorías personalizadas */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Tag size={16} />{t("settings.customCategories")}</CardTitle>
          <Dialog open={openCat} onOpenChange={setOpenCat}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>+ {t("customCategories.addCategory")}</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("customCategories.addCategory")}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>{t("customCategories.name")}</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Ej. Golf, Masajes..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>{t("customCategories.emoji")}</Label><Input value={catForm.emoji} onChange={(e) => setCatForm({ ...catForm, emoji: e.target.value })} className="text-2xl text-center" /></div>
                  <div><Label>{t("customCategories.color")}</Label><input type="color" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} className="w-full h-10 rounded border cursor-pointer" /></div>
                </div>
                <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleCreateCat}>{t("customCategories.saveCategory")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {customCats.length === 0 ? <p className="text-sm text-muted-foreground">{t("customCategories.noCategories")}</p> : (
            <div className="flex flex-wrap gap-2">
              {customCats.map((c) => (
                <Badge key={c.id} variant="outline" className="gap-1 pr-1" style={{ borderColor: c.color }}>
                  <span>{c.emoji}</span><span>{c.name}</span>
                  <button onClick={() => handleDeleteCat(c.id)} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Datos */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Database size={16} />{t("settings.backup")}</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleExport}>{t("backup.export")}</Button>
          <p className="text-xs text-muted-foreground mt-2">{t("backup.exportDesc")}</p>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut size={16} className="mr-2" />{t("auth.logout")}
      </Button>
    </div>
  );
}
