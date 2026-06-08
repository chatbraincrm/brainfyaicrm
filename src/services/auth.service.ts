import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@supabase/supabase-js";

export const AuthService = {
  async signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signInWithOAuth(provider: Provider, redirectTo?: string) {
    return supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo ?? window.location.origin },
    });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async resetPasswordForEmail(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  },

  async updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async getUser() {
    return supabase.auth.getUser();
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
