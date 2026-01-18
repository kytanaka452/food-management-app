import { supabase } from '../lib/supabaseClient';
import type { Group, GroupMember, CreateGroupForm } from '../types';

export const groupService = {
  async getUserGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(*)')
      .order('joined_at', { ascending: false });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data?.map((item: any) => item.groups).filter(Boolean) as Group[];
  },

  async getGroup(groupId: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data;
  },

  async createGroup(form: CreateGroupForm): Promise<Group> {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: form.name })
      .select()
      .single();

    if (groupError) throw groupError;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証されていません');

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    return group;
  },

  async updateGroup(groupId: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .update({ name })
      .eq('id', groupId);

    if (error) throw error;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  },

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
