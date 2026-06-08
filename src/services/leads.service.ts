import { supabase } from "./supabase.service";

export interface LeadFilters {
  org_id?: string;
  status?: string;
  assignee_id?: string;
  tag_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const LeadsService = {
  async list(filters: LeadFilters = {}) {
    let query = supabase
      .from("leads")
      .select("*, lead_tags(tag_id, tags(*))", { count: "exact" });

    if (filters.org_id) query = query.eq("org_id", filters.org_id);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.assignee_id) query = query.eq("assignee_id", filters.assignee_id);
    if (filters.search) query = query.ilike("name", `%${filters.search}%`);
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

    return query.order("created_at", { ascending: false });
  },

  async getById(id: string) {
    return supabase
      .from("leads")
      .select("*, lead_tags(tag_id, tags(*))")
      .eq("id", id)
      .single();
  },

  async create(data: Record<string, unknown>) {
    return supabase.from("leads").insert(data as never).select().single();
  },

  async update(id: string, data: Record<string, unknown>) {
    return supabase.from("leads").update(data as never).eq("id", id).select().single();
  },

  async delete(id: string) {
    return supabase.from("leads").delete().eq("id", id);
  },
};
