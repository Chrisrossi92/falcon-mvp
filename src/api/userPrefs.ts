import { supabase } from "@/lib/supabaseClient";

export type OrdersDefaultFilters = {
  status?: Array<"new" | "in_review" | "completed" | "cancelled">;
  includeArchived?: boolean;
  q?: string;
  dueFrom?: string;
  dueTo?: string;
  assigneeId?: string | null;
  clientId?: string | null;
};

export type UserPrefs = {
  mute_my_toasts: boolean;
  orders_default_filters: OrdersDefaultFilters;
  orders_page_size: number;
};

const DEFAULT_PREFS: UserPrefs = {
  mute_my_toasts: true,
  orders_default_filters: {
    status: ["new", "in_review"],
    includeArchived: false,
    q: "",
    dueFrom: "",
    dueTo: "",
    assigneeId: null,
    clientId: null,
  },
  orders_page_size: 20,
};

export async function getUserPrefs(): Promise<UserPrefs> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return DEFAULT_PREFS;

  const { data, error } = await supabase
    .from("user_prefs")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_PREFS;

  return {
    mute_my_toasts: !!data.mute_my_toasts,
    orders_default_filters: (data.orders_default_filters ?? DEFAULT_PREFS.orders_default_filters) as OrdersDefaultFilters,
    orders_page_size: Number(data.orders_page_size ?? 20),
  };
}

export async function updateUserPrefs(next: Partial<UserPrefs>): Promise<UserPrefs> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");

  // read current to merge
  const current = await getUserPrefs();
  const merged: UserPrefs = {
    mute_my_toasts: next.mute_my_toasts ?? current.mute_my_toasts,
    orders_default_filters: { ...current.orders_default_filters, ...(next.orders_default_filters ?? {}) },
    orders_page_size: next.orders_page_size ?? current.orders_page_size,
  };

  const { error } = await supabase
    .from("user_prefs")
    .upsert(
      {
        user_id: uid,
        mute_my_toasts: merged.mute_my_toasts,
        orders_default_filters: merged.orders_default_filters,
        orders_page_size: merged.orders_page_size,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
  return merged;
}
