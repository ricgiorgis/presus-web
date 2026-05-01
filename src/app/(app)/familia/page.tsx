"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Users, Plus, Copy, Mail, Link, LogOut, Trash2, Crown, UserX, Check, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { familyService } from "@/services/supabase/family";
import { authService } from "@/services/supabase/auth";
import { useFamily } from "@/contexts/FamilyContext";
import type { FamilyGroupType, FamilyInvite } from "@/types/models";

const GROUP_TYPES: { id: FamilyGroupType; label: string; description: string; max: number }[] = [
  { id: "pareja", label: "Pareja", description: "2 personas, todo compartido", max: 2 },
  { id: "familiar", label: "Grupo Familiar", description: "Hasta 10 personas, gastos opcionales", max: 10 },
  { id: "roommates", label: "Roommates", description: "Hasta 10 personas, gastos opcionales", max: 10 },
];

function GroupTypeBadge({ type }: { type: FamilyGroupType }) {
  const labels = { pareja: "Pareja", familiar: "Familiar", roommates: "Roommates" };
  return <Badge variant="secondary">{labels[type]}</Badge>;
}

export default function FamiliaPage() {
  const { t } = useTranslation();
  const { group, members, isInFamily, familyGroupId, groupType, isOwner, isLoading, refetch } = useFamily();
  const [userId, setUserId] = useState("");

  useEffect(() => { authService.getUser().then((u) => { if (u) setUserId(u.id); }); }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [createStep, setCreateStep] = useState<"name" | "type">("name");
  const [groupName, setGroupName] = useState("");
  const [selectedType, setSelectedType] = useState<FamilyGroupType>("familiar");
  const [joinCode, setJoinCode] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [linkInvite, setLinkInvite] = useState<FamilyInvite | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!groupName.trim()) { toast.error("Ingresa un nombre"); return; }
    setSaving(true);
    try {
      const g = await familyService.createGroup(groupName.trim(), selectedType, userId);
      await familyService.migrateUserDataToGroup(userId, g.id);
      await refetch();
      setShowCreate(false);
      setGroupName("");
      setCreateStep("name");
      toast.success("Grupo creado");
    } catch { toast.error("Error al crear grupo"); }
    finally { setSaving(false); }
  }

  async function handleJoin() {
    if (!joinCode.trim()) { toast.error("Ingresa el código"); return; }
    setSaving(true);
    try {
      await familyService.joinByInviteCode(joinCode.trim(), userId);
      await refetch();
      setShowJoin(false);
      setJoinCode("");
      toast.success("¡Te uniste al grupo!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al unirse");
    } finally { setSaving(false); }
  }

  async function handleLeave() {
    if (!familyGroupId) return;
    setSaving(true);
    try {
      await familyService.leaveGroup(familyGroupId, userId);
      await refetch();
      toast.success("Saliste del grupo");
    } catch { toast.error("Error al salir del grupo"); }
    finally { setSaving(false); }
  }

  async function handleDeleteGroup() {
    if (!familyGroupId) return;
    setSaving(true);
    try {
      await familyService.deleteGroup(familyGroupId);
      await refetch();
      toast.success("Grupo eliminado");
    } catch { toast.error("Error al eliminar grupo"); }
    finally { setSaving(false); }
  }

  async function handleRemoveMember(targetUserId: string) {
    if (!familyGroupId) return;
    try {
      await familyService.removeMember(familyGroupId, targetUserId);
      await refetch();
      toast.success("Miembro eliminado");
    } catch { toast.error("Error al eliminar miembro"); }
  }

  async function handleOpenInvite() {
    if (!familyGroupId) return;
    setShowInvite(true);
    try {
      const pending = await familyService.getPendingInvites(familyGroupId);
      setInvites(pending);
    } catch { /* silently */ }
  }

  async function handleEmailInvite() {
    if (!inviteEmail.trim() || !familyGroupId) return;
    setSaving(true);
    try {
      const inv = await familyService.createEmailInvite(familyGroupId, inviteEmail.trim(), userId);
      setInvites((prev) => [inv, ...prev]);
      setInviteEmail("");
      toast.success("Invitación creada");
    } catch { toast.error("Error al crear invitación"); }
    finally { setSaving(false); }
  }

  async function handleLinkInvite() {
    if (!familyGroupId) return;
    setSaving(true);
    try {
      const inv = await familyService.createLinkInvite(familyGroupId, userId);
      setLinkInvite(inv);
    } catch { toast.error("Error al crear enlace"); }
    finally { setSaving(false); }
  }

  async function handleCancelInvite(id: string) {
    try {
      await familyService.cancelInvite(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      if (linkInvite?.id === id) setLinkInvite(null);
      toast.success("Invitación cancelada");
    } catch { toast.error("Error al cancelar"); }
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/familia/unirse/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!isInFamily) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Grupo Familiar</h1>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Users size={48} className="mx-auto opacity-30" />
            <p className="text-muted-foreground">No perteneces a ningún grupo todavía.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button style={{ backgroundColor: "#2E7D32" }} className="text-white" onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-2" />Crear grupo
              </Button>
              <Button variant="outline" onClick={() => setShowJoin(true)}>
                <Link size={16} className="mr-2" />Unirme con código
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setCreateStep("name"); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Crear grupo</DialogTitle></DialogHeader>
            {createStep === "name" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del grupo</Label>
                  <Input
                    placeholder="Ej. Familia García"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && groupName.trim() && setCreateStep("type")}
                  />
                </div>
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: "#2E7D32" }}
                  disabled={!groupName.trim()}
                  onClick={() => setCreateStep("type")}
                >
                  Siguiente
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Tipo de grupo para <strong>{groupName}</strong></p>
                <div className="space-y-2">
                  {GROUP_TYPES.map((gt) => (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => setSelectedType(gt.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedType === gt.id ? "border-green-700 bg-green-50" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <p className="font-medium text-sm">{gt.label}</p>
                      <p className="text-xs text-muted-foreground">{gt.description}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setCreateStep("name")}>Atrás</Button>
                  <Button
                    className="flex-1 text-white"
                    style={{ backgroundColor: "#2E7D32" }}
                    disabled={saving}
                    onClick={handleCreate}
                  >
                    {saving ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Join Dialog */}
        <Dialog open={showJoin} onOpenChange={setShowJoin}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Unirme a un grupo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Código de invitación</Label>
                <Input
                  placeholder="Ingresa el código"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
              </div>
              <Button
                className="w-full text-white"
                style={{ backgroundColor: "#2E7D32" }}
                disabled={saving || !joinCode.trim()}
                onClick={handleJoin}
              >
                {saving ? "Uniéndome..." : "Unirme"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group?.name}</h1>
          {groupType && <GroupTypeBadge type={groupType} />}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={refetch} title="Actualizar">
            <RefreshCw size={16} />
          </Button>
          {isOwner && (
            <Button size="sm" variant="outline" onClick={handleOpenInvite}>
              <Plus size={14} className="mr-1" />Invitar
            </Button>
          )}
        </div>
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Miembros ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#1565C0" }}>
                  {m.user_id.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.user_id === userId ? "Tú" : `Miembro`}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                </div>
                {m.role === "owner" && <Crown size={14} className="text-amber-500 ml-1" />}
              </div>
              {isOwner && m.user_id !== userId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveMember(m.user_id)}
                >
                  <UserX size={14} />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-destructive">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!isOwner && (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/50 hover:bg-destructive hover:text-white"
              disabled={saving}
              onClick={handleLeave}
            >
              <LogOut size={14} className="mr-2" />Salir del grupo
            </Button>
          )}
          {isOwner && (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/50 hover:bg-destructive hover:text-white"
              disabled={saving}
              onClick={handleDeleteGroup}
            >
              <Trash2 size={14} className="mr-2" />Eliminar grupo
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invitar personas</DialogTitle></DialogHeader>
          <Tabs defaultValue="link">
            <TabsList className="w-full">
              <TabsTrigger value="link" className="flex-1"><Link size={14} className="mr-1" />Por enlace</TabsTrigger>
              <TabsTrigger value="email" className="flex-1"><Mail size={14} className="mr-1" />Por email</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4 pt-2">
              {linkInvite ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/familia/unirse/${linkInvite.invite_code}`}
                      className="text-xs"
                    />
                    <Button variant="outline" size="icon" onClick={() => copyLink(linkInvite.invite_code)}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Código: <code className="font-mono">{linkInvite.invite_code}</code></p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleCancelInvite(linkInvite.id)}
                  >
                    Cancelar enlace
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: "#2E7D32" }}
                  disabled={saving}
                  onClick={handleLinkInvite}
                >
                  {saving ? "Generando..." : "Generar enlace de invitación"}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-4 pt-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button
                  style={{ backgroundColor: "#2E7D32" }}
                  className="text-white shrink-0"
                  disabled={saving || !inviteEmail.trim()}
                  onClick={handleEmailInvite}
                >
                  Invitar
                </Button>
              </div>

              {invites.filter((i) => i.invite_email).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Pendientes</p>
                  {invites.filter((i) => i.invite_email).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-1">
                      <span className="text-sm">{inv.invite_email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleCancelInvite(inv.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Join Dialog (if not in family already, shouldn't show, but here for completeness) */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Unirme a un grupo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código de invitación</Label>
              <Input placeholder="Ingresa el código" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
            </div>
            <Button
              className="w-full text-white"
              style={{ backgroundColor: "#2E7D32" }}
              disabled={saving || !joinCode.trim()}
              onClick={handleJoin}
            >
              {saving ? "Uniéndome..." : "Unirme"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
