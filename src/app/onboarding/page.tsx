"use client";
import "@/i18n";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authService } from "@/services/supabase/auth";
import { budgetService } from "@/services/supabase/budget";
import { useSettingsStore } from "@/store/settingsStore";
import { ISO_4217_CURRENCIES } from "@/constants/currencies";
import { EXPENSE_CATEGORIES } from "@/constants/categories";

const SUGGESTED_BUDGETS: Record<string, number> = {
  alimentacion: 500, transporte: 300, salud: 200, entretenimiento: 150, hogar: 400, servicios: 200,
};

export default function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { setCurrency, setLanguage } = useSettingsStore();
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState("es");
  const [selectedCurrency, setSelectedCurrency] = useState("GTQ");
  const [budgets, setBudgets] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(SUGGESTED_BUDGETS).map(([k, v]) => [k, String(v)]))
  );
  const [enabledBudgets, setEnabledBudgets] = useState<Set<string>>(new Set(Object.keys(SUGGESTED_BUDGETS)));
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const user = await authService.getUser();
      if (!user) { router.replace("/login"); return; }
      const promises = [...enabledBudgets].map((catId) => {
        const amount = parseFloat(budgets[catId] ?? "0");
        if (!amount) return Promise.resolve();
        return budgetService.create({ user_id: user.id, category: catId, limit_amount: amount, currency_code: selectedCurrency, period: "monthly" });
      });
      await Promise.all(promises);
      setCurrency(selectedCurrency);
      setLanguage(selectedLang);
      i18n.changeLanguage(selectedLang);
      router.replace("/");
    } catch { toast.error(t("errors.genericError")); }
    finally { setSaving(false); }
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center space-y-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto" style={{ backgroundColor: "#2E7D32" }}>P</div>
      <div>
        <h1 className="text-3xl font-bold">Presus</h1>
        <p className="text-muted-foreground mt-2">{t("onboarding.welcomeDesc")}</p>
      </div>
      <div className="space-y-3 text-left">
        {[t("onboarding.feat1"), t("onboarding.feat2"), t("onboarding.feat3")].map((feat) => (
          <div key={feat} className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
            <p className="text-sm">{feat}</p>
          </div>
        ))}
      </div>
      <Button className="w-full text-white" style={{ backgroundColor: "#2E7D32" }} onClick={() => setStep(1)}>
        {t("onboarding.start")} <ArrowRight size={16} className="ml-2" />
      </Button>
    </div>,

    // Step 1: Language & Currency
    <div key="locale" className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t("onboarding.localeTitle")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("onboarding.localeDesc")}</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>{t("settings.language")}</Label>
          <Select value={selectedLang} onValueChange={(v) => { if (v !== null) { setSelectedLang(v); i18n.changeLanguage(v); } }}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="es">🇪🇸 Español</SelectItem><SelectItem value="en">🇺🇸 English</SelectItem><SelectItem value="pt">🇧🇷 Português</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("settings.currency")}</Label>
          <Select value={selectedCurrency} onValueChange={(v) => v !== null && setSelectedCurrency(v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{ISO_4217_CURRENCIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.code} – {c.name} ({c.symbol})</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>{t("common.back")}</Button>
        <Button className="flex-1 text-white" style={{ backgroundColor: "#2E7D32" }} onClick={() => setStep(2)}>{t("onboarding.next")}</Button>
      </div>
    </div>,

    // Step 2: First budgets
    <div key="budgets" className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t("onboarding.budgetTitle")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("onboarding.budgetDesc")}</p>
      </div>
      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
        {EXPENSE_CATEGORIES.filter((c) => SUGGESTED_BUDGETS[c.id]).map((cat) => (
          <div key={cat.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${enabledBudgets.has(cat.id) ? "border-green-300 bg-green-50 dark:bg-green-950/30" : "opacity-60"}`}>
            <button
              className="text-xl shrink-0"
              onClick={() => setEnabledBudgets((prev) => { const s = new Set(prev); s.has(cat.id) ? s.delete(cat.id) : s.add(cat.id); return s; })}
            >
              {cat.emoji}
            </button>
            <span className="text-sm font-medium flex-1">{t(cat.labelKey as Parameters<typeof t>[0])}</span>
            <Input
              type="number"
              className="w-24 h-8 text-sm"
              value={budgets[cat.id] ?? ""}
              onChange={(e) => setBudgets({ ...budgets, [cat.id]: e.target.value })}
              disabled={!enabledBudgets.has(cat.id)}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>{t("common.back")}</Button>
        <Button className="flex-1 text-white" style={{ backgroundColor: "#2E7D32" }} onClick={handleFinish} disabled={saving}>
          {saving ? t("common.loading") : t("onboarding.createBudgets")}
        </Button>
      </div>
      <button className="text-sm text-muted-foreground underline w-full text-center" onClick={() => { setCurrency(selectedCurrency); setLanguage(selectedLang); router.replace("/"); }}>
        {t("onboarding.skip")}
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-6" : "w-2 bg-muted"}`} style={i === step ? { backgroundColor: "#2E7D32", width: "24px" } : undefined} />
            ))}
          </div>
          {steps[step]}
        </CardContent>
      </Card>
    </div>
  );
}
