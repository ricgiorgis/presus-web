"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Receipt, TrendingDown, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/services/supabase/auth";
import { expensesService } from "@/services/supabase/expenses";
import { budgetService } from "@/services/supabase/budget";
import { streakService } from "@/services/supabase/streak";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { formatAmount } from "@/constants/currencies";
import type { Expense, Budget } from "@/types/models";
import type { User } from "@supabase/supabase-js";

function SummaryCard({ title, value, icon: Icon, color }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Icon size={22} style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentMonth = format(new Date(), "yyyy-MM");
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  useEffect(() => {
    async function loadData() {
      try {
        const u = await authService.getUser();
        setUser(u);
        if (!u) return;

        const [exp, bud, streakData] = await Promise.all([
          expensesService.getAll(u.id, { month: currentMonth }),
          budgetService.getAll(u.id),
          streakService.get(u.id),
        ]);
        setExpenses(exp);
        setBudgets(bud);
        setStreak(streakData.current_streak);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentMonth]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const available = totalBudget - totalSpent;
  const currency = expenses[0]?.currency_code ?? budgets[0]?.currency_code ?? "GTQ";
  const recentExpenses = expenses.slice(0, 5);

  const getCategoryInfo = (catId: string) =>
    EXPENSE_CATEGORIES.find((c) => c.id === catId) ?? { emoji: "📦", color: "#BDC3C7", labelKey: "" };

  const getBudgetSpent = (budget: Budget) =>
    expenses.filter((e) => e.category === budget.category).reduce((sum, e) => sum + e.amount, 0);

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return "#EF4444";
    if (pct >= 70) return "#F59E0B";
    return "#2E7D32";
  };

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const firstName = fullName?.split(" ")[0] ?? "Usuario";

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.greeting", { name: firstName })}</h1>
        <p className="text-muted-foreground capitalize">{todayFormatted}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title={t("dashboard.thisMonth")}
          value={formatAmount(totalSpent, currency)}
          icon={TrendingDown}
          color="#EF4444"
        />
        <SummaryCard
          title={t("dashboard.available")}
          value={formatAmount(Math.max(available, 0), currency)}
          icon={Receipt}
          color="#2E7D32"
        />
        <SummaryCard
          title={t("dashboard.expenses")}
          value={expenses.length}
          icon={Receipt}
          color="#1565C0"
        />
        <SummaryCard
          title="Racha"
          value={streak > 0 ? `🔥 ${streak} días` : "Registra hoy"}
          icon={Flame}
          color="#F57F17"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Budget progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.monthlyBudget")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dashboard.createBudget")}</p>
            ) : (
              budgets.map((budget) => {
                const spent = getBudgetSpent(budget);
                const pct = Math.min((spent / budget.limit_amount) * 100, 100);
                const cat = getCategoryInfo(budget.category);
                const color = getProgressColor(pct);
                return (
                  <div key={budget.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <span>{cat.emoji}</span>
                        <span className="font-medium capitalize">{budget.category}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {formatAmount(spent, budget.currency_code)} / {formatAmount(budget.limit_amount, budget.currency_code)}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" style={{ "--progress-color": color } as React.CSSProperties} />
                    {pct >= 90 && (
                      <Badge variant="destructive" className="text-xs">
                        {pct >= 100 ? t("presupuesto.overspent", { amount: formatAmount(spent - budget.limit_amount, budget.currency_code) }) : `${pct.toFixed(0)}% usado`}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.lastExpenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => {
                  const cat = getCategoryInfo(expense.category);
                  return (
                    <div key={expense.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.emoji}</span>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{expense.description || expense.category}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(expense.date), "d MMM", { locale: es })}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-destructive">
                        -{formatAmount(expense.amount, expense.currency_code)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
