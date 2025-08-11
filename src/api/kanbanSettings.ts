import { supabase } from "@/lib/supabaseClient";
import { getMyOrgId } from "@/api/getMyOrgId";
import type { OrderStatus } from "@/types/domain";

export type KanbanSettings = {
  organization_id: string;
  wip_new: number | null;
  wip_in_review: number | null;
  wip_completed: number | null;
  wip_cancelled: number | null;
  show_cancelled: boolean;
  group_by_assignee_default: boolean;
};

const DEFAULTS: Omit<KanbanSettings, "organization_id"> = {
  wip_new: null,
  wip_in_review: null,
  wip_completed: null,
  wip_cancelled: null,
  show_cancelled: false,
  group_by_assignee_default: false,
};

export type WipMap = Partial<Record<OrderStatus, number | null>>;

export function toWipMap(k: KanbanSettings): WipMap {
  return {
    new: k.wip_new,
    in_review: k.wip_in_review,
    completed: k.wip_completed,
    cancelled: k.wip_cancelled,
  };
}

export async function getKanbanSettings(): Promise<{ settings: KanbanSettings; wip: WipMap }> {
  const orgId = await getMyOrgId();
  const { data, error } = await supabase
    .from("kanban_settings")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error) throw error;

  const settings: KanbanSettings = {
    organization_id: orgId,
    ...(data ?? DEFAULTS),
  } as KanbanSettings;

  return { settings, wip: toWipMap(settings) };
}

export async function updateKanbanSettings(
  patch: Partial<Omit<KanbanSettings, "organization_id">>
): Promise<{ settings: KanbanSettings; wip: WipMap }> {
  const orgId = await getMyOrgId();
  const { settings: cur } = await getKanbanSettings();

  const next: KanbanSettings = {
    organization_id: orgId,
    wip_new: patch.wip_new ?? cur.wip_new,
    wip_in_review: patch.wip_in_review ?? cur.wip_in_review,
    wip_completed: patch.wip_completed ?? cur.wip_completed,
    wip_cancelled: patch.wip_cancelled ?? cur.wip_cancelled,
    show_cancelled: patch.show_cancelled ?? cur.show_cancelled,
    group_by_assignee_default: patch.group_by_assignee_default ?? cur.group_by_assignee_default,
  };

  const { error } = await supabase
    .from("kanban_settings")
    .upsert(
      { ...next, updated_at: new Date().toISOString() },
      { onConflict: "organization_id" }
    );
  if (error) throw error;

  return { settings: next, wip: toWipMap(next) };
}

