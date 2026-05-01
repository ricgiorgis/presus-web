"use client";
import "@/i18n";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { familyService } from "@/services/supabase/family";
import { authService } from "@/services/supabase/auth";
import { useFamily } from "@/contexts/FamilyContext";
import type { FamilyInvite, FamilyGroup } from "@/types/models";

type InviteData = FamilyInvite & { familia_groups: FamilyGroup };

const GROUP_TYPE_LABELS = { pareja: "Pareja", familiar: "Grupo Familiar", roommates: "Roommates" };

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { isInFamily, refetch } = useFamily();

  const [userId, setUserId] = useState("");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "invalid" | "joined">("loading");
  const [joining, setJoining] = useState(false);

  useEffect(() => { authService.getUser().then((u) => { if (u) setUserId(u.id); }); }, []);

  useEffect(() => {
    familyService.getInviteByCode(code).then((data) => {
      if (!data) { setStatus("invalid"); return; }
      setInvite(data);
      setStatus("found");
    });
  }, [code]);

  async function handleJoin() {
    if (!userId || !invite) return;
    setJoining(true);
    try {
      await familyService.joinByInviteCode(code, userId);
      await refetch();
      setStatus("joined");
      toast.success("¡Te uniste al grupo!");
      setTimeout(() => router.push("/familia"), 1500);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al unirse");
    } finally {
      setJoining(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="max-w-sm mx-auto mt-16 space-y-4">
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <XCircle size={40} className="mx-auto text-destructive" />
            <p className="font-medium">Invitación inválida o expirada</p>
            <Button variant="outline" onClick={() => router.push("/familia")}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "joined") {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <CheckCircle size={40} className="mx-auto text-green-600" />
            <p className="font-medium">¡Te uniste exitosamente!</p>
            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInFamily) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Users size={40} className="mx-auto text-muted-foreground opacity-40" />
            <p className="font-medium">Ya perteneces a un grupo</p>
            <p className="text-sm text-muted-foreground">Debes salir de tu grupo actual antes de unirte a otro.</p>
            <Button variant="outline" onClick={() => router.push("/familia")}>Ver mi grupo</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2" style={{ backgroundColor: "#2E7D32" }}>
            {invite?.familia_groups?.name?.[0] ?? "G"}
          </div>
          <CardTitle>{invite?.familia_groups?.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {invite?.familia_groups?.type ? GROUP_TYPE_LABELS[invite.familia_groups.type] : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Fuiste invitado a unirte. Todos tus datos actuales se fusionarán con el grupo.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
              Cancelar
            </Button>
            <Button
              className="flex-1 text-white"
              style={{ backgroundColor: "#2E7D32" }}
              disabled={joining}
              onClick={handleJoin}
            >
              {joining ? "Uniéndome..." : "Unirme"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
