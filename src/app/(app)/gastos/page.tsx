"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authService } from "@/services/supabase/auth";
import { expensesService } from "@/services/supabase/expenses";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { formatAmount } from "@/constants/currencies";
import { AddExpenseDialog } from "./components/AddExpenseDialog";
import { useFamily } from "@/contexts/FamilyContext";
import type { Expense } from "@/types/models";

type SharedFilter = "all" | "shared" | "personal";

export default function GastosPage() {
  const { t } = useTranslation();
  const { familyGroupId, groupType, members } = useFamily();
  const [userId, setUserId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [sharedFilter, setSharedFilter] = useState<SharedFilter>("all");

  const showSharedFilter = !!familyGroupId && (groupType === "familiar" || groupType === "roommates");

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return format(d, "yyyy-MM");
  });

  async function loadExpenses(uid: string) {
    setLoading(true);
    try {
      const data = await expensesService.getAll(uid, {
        month: filterMonth,
        ...(filterCategory !== "all" ? { category: filterCategory } : {}),
        ...(showSharedFilter ? { sharedFilter } : {}),
      }, familyGroupId);
      setExpenses(data);
    } catch {
      toast.error("Error al cargar gastos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    authService.getUser().then((u) => {
      if (u) {
        setUserId(u.id);
        loadExpenses(u.id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterCategory, familyGroupId, sharedFilter]);

  const handleDelete = async (id: string) => {
    try {
      await expensesService.delete(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Gasto eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const defaultCurrency = expenses[0]?.currency_code ?? "GTQ";
  const getCat = (id: string) => EXPENSE_CATEGORIES.find((c) => c.id === id);

  function getMemberInitials(uid: string) {
    const m = members.find((m) => m.user_id === uid);
    if (!m) return uid.slice(0, 2).toUpperCase();
    return m.user_id === userId ? "Yo" : uid.slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("gastos.title")}</h1>
        <Button
          className="text-white gap-2"
          style={{ backgroundColor: "#2E7D32" }}
          onClick={() => setDialogOpen(true)}
        >
          <Plus size={16} />
          {t("gastos.addExpense")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterMonth} onValueChange={(v) => v !== null && setFilterMonth(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {format(new Date(m + "-01"), "MMMM yyyy", { locale: es })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={(v) => v !== null && setFilterCategory(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("gastos.allCategories")}</SelectItem>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.emoji} {cat.id.charAt(0).toUpperCase() + cat.id.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Shared filter pills — only shown in familiar/roommates groups */}
      {showSharedFilter && (
        <div className="flex gap-2">
          {(["all", "shared", "personal"] as SharedFilter[]).map((f) => {
            const labels = { all: "Todos", shared: "Compartidos", personal: "Solo míos" };
            return (
              <button
                key={f}
                onClick={() => setSharedFilter(f)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                  sharedFilter === f
                    ? "text-white border-transparent"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                style={sharedFilter === f ? { backgroundColor: "#2E7D32" } : undefined}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      )}

      {/* Expenses list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex justify-between">
            <span>Gastos del período</span>
            <span className="text-destructive">{formatAmount(total, defaultCurrency)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("gastos.noExpenses")}</p>
          ) : (
            <div className="divide-y">
              {expenses.map((expense) => {
                const cat = getCat(expense.category);
                const isSharedExpense = expense.is_shared && !!familyGroupId;
                const addedBy = expense.added_by_user_id;
                const isOwnExpense = addedBy === userId;

                return (
                  <div key={expense.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{cat?.emoji ?? "📦"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {expense.description || expense.category}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {expense.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(expense.date), "d MMM", { locale: es })}
                          </span>
                          {isSharedExpense && (
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <Users size={10} />compartido
                            </span>
                          )}
                          {familyGroupId && addedBy && !isOwnExpense && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: "#1565C0" }}>
                              {getMemberInitials(addedBy)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-sm">
                        -{formatAmount(expense.amount, expense.currency_code)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {userId && (
        <AddExpenseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          userId={userId}
          defaultCurrency={defaultCurrency}
          familyGroupId={familyGroupId}
          groupType={groupType}
          onSuccess={() => loadExpenses(userId)}
        />
      )}
    </div>
  );
}
