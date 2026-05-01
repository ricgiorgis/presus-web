"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { familyService } from "@/services/supabase/family";
import type { FamilyGroupWithMembers, FamiliaDbMember, FamilyGroupType } from "@/types/models";
import { useAuthStore } from "@/store/authStore";

interface FamilyContextValue {
  group: FamilyGroupWithMembers | null;
  members: FamiliaDbMember[];
  isInFamily: boolean;
  familyGroupId: string | null;
  groupType: FamilyGroupType | null;
  isOwner: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextValue>({
  group: null,
  members: [],
  isInFamily: false,
  familyGroupId: null,
  groupType: null,
  isOwner: false,
  isLoading: true,
  refetch: async () => {},
});

export function FamilyProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [group, setGroup] = useState<FamilyGroupWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    try {
      const g = await familyService.getUserGroup(userId);
      setGroup(g);
    } catch {
      setGroup(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const members: FamiliaDbMember[] = group?.familia_members ?? [];
  const isOwner = members.some((m) => m.user_id === userId && m.role === "owner");

  return (
    <FamilyContext.Provider value={{
      group,
      members,
      isInFamily: !!group,
      familyGroupId: group?.id ?? null,
      groupType: group?.type ?? null,
      isOwner,
      isLoading,
      refetch: load,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
