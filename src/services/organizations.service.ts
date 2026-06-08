import { supabase } from "./supabase.service";

export const OrganizationsService = {
  async getById(id: string) {
    return supabase.from("organizations").select("*").eq("id", id).single();
  },

  async getBySlug(slug: string) {
    return supabase.from("organizations").select("*").eq("slug", slug).single();
  },

  async updateSettings(id: string, settings: Record<string, unknown>) {
    return supabase.from("organizations").update(settings as never).eq("id", id);
  },

  async listAll() {
    return supabase.from("organizations").select("*").order("created_at", { ascending: false });
  },
};
