import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;

export type Row<T extends TableName> = Tables[T]["Row"];
export type Insert<T extends TableName> = Tables[T]["Insert"];
export type Update<T extends TableName> = Tables[T]["Update"];

export { supabase };

export async function callEdgeFunction<T = unknown>(
  fn: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(fn, {
    body,
    headers,
  });
  if (error) throw error;
  return data as T;
}
