import { createClient } from "@/lib/supabase/client";
import type { FamilyGroup, FamiliaDbMember, FamilyInvite, FamilyGroupWithMembers, FamilyGroupType } from "@/types/models";

export const familyService = {
  async getUserGroup(userId: string): Promise<FamilyGroupWithMembers | null> {
    const supabase = createClient();
    const { data: membership } = await supabase
      .from("familia_members")
      .select("group_id")
      .eq("user_id", userId)
      .single();

    if (!membership) return null;

    const { data, error } = await supabase
      .from("familia_groups")
      .select("*, familia_members(*)")
      .eq("id", membership.group_id)
      .single();

    if (error || !data) return null;
    return data as FamilyGroupWithMembers;
  },

  async createGroup(name: string, type: FamilyGroupType, userId: string): Promise<FamilyGroup> {
    const supabase = createClient();
    const maxMembers = type === "pareja" ? 2 : 10;

    const { data: group, error: groupErr } = await supabase
      .from("familia_groups")
      .insert({ name, type, user_id: userId, max_members: maxMembers })
      .select()
      .single();

    if (groupErr) throw groupErr;

    const { error: memberErr } = await supabase
      .from("familia_members")
      .insert({ group_id: group.id, user_id: userId, role: "owner" });

    if (memberErr) throw memberErr;

    return group as FamilyGroup;
  },

  async migrateUserDataToGroup(userId: string, groupId: string): Promise<void> {
    const supabase = createClient();
    await Promise.all([
      supabase.from("gastos").update({ family_group_id: groupId, added_by_user_id: userId }).eq("user_id", userId).is("family_group_id", null),
      supabase.from("presupuesto").update({ family_group_id: groupId }).eq("user_id", userId).is("family_group_id", null),
      supabase.from("metas").update({ family_group_id: groupId, added_by_user_id: userId }).eq("user_id", userId).is("family_group_id", null),
      supabase.from("cuotas").update({ family_group_id: groupId, added_by_user_id: userId }).eq("user_id", userId).is("family_group_id", null),
      supabase.from("debts").update({ family_group_id: groupId, added_by_user_id: userId }).eq("user_id", userId).is("family_group_id", null),
      supabase.from("custom_categories").update({ family_group_id: groupId }).eq("user_id", userId).is("family_group_id", null),
      supabase.from("vehiculos").update({ family_group_id: groupId }).eq("user_id", userId).is("family_group_id", null),
    ]);
  },

  async joinByInviteCode(inviteCode: string, userId: string): Promise<FamilyGroup> {
    const supabase = createClient();

    const { data: invite, error: inviteErr } = await supabase
      .from("family_invites")
      .select("*")
      .eq("invite_code", inviteCode)
      .eq("status", "pending")
      .single();

    if (inviteErr || !invite) throw new Error("Invitación inválida o expirada");
    if (new Date(invite.expires_at) < new Date()) throw new Error("La invitación expiró");

    const { data: group, error: groupErr } = await supabase
      .from("familia_groups")
      .select("*")
      .eq("id", invite.group_id)
      .single();

    if (groupErr || !group) throw new Error("Grupo no encontrado");

    const { count } = await supabase
      .from("familia_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", invite.group_id);

    if ((count ?? 0) >= group.max_members) throw new Error("El grupo ya está lleno");

    await supabase
      .from("familia_members")
      .insert({ group_id: invite.group_id, user_id: userId, role: "member" });

    await supabase
      .from("family_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    await familyService.migrateUserDataToGroup(userId, invite.group_id);

    return group as FamilyGroup;
  },

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("familia_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  async removeMember(groupId: string, targetUserId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("familia_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", targetUserId);
    if (error) throw error;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("familia_groups")
      .delete()
      .eq("id", groupId);
    if (error) throw error;
  },

  async createEmailInvite(groupId: string, email: string, invitedBy: string): Promise<FamilyInvite> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_invites")
      .insert({ group_id: groupId, invite_email: email, invited_by: invitedBy })
      .select()
      .single();
    if (error) throw error;
    return data as FamilyInvite;
  },

  async createLinkInvite(groupId: string, invitedBy: string): Promise<FamilyInvite> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_invites")
      .insert({ group_id: groupId, invited_by: invitedBy })
      .select()
      .single();
    if (error) throw error;
    return data as FamilyInvite;
  },

  async getInviteByCode(code: string): Promise<FamilyInvite & { familia_groups: FamilyGroup } | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_invites")
      .select("*, familia_groups(*)")
      .eq("invite_code", code)
      .single();
    if (error || !data) return null;
    return data as FamilyInvite & { familia_groups: FamilyGroup };
  },

  async cancelInvite(inviteId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("family_invites")
      .update({ status: "expired" })
      .eq("id", inviteId);
    if (error) throw error;
  },

  async getPendingInvites(groupId: string): Promise<FamilyInvite[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_invites")
      .select("*")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as FamilyInvite[];
  },

  async getGroupMembers(groupId: string): Promise<FamiliaDbMember[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("familia_members")
      .select("*")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });
    if (error) throw error;
    return data as FamiliaDbMember[];
  },

  async updateGroupName(groupId: string, name: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("familia_groups")
      .update({ name })
      .eq("id", groupId);
    if (error) throw error;
  },
};
