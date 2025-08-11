export type OrderStatus = "new" | "in_review" | "completed" | "cancelled";

export type OrderBase = {
  id: string;
  organization_id?: string | null;
  client_id?: string | null;
  assigned_to?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  status: OrderStatus;
  due_date: string | null;
  created_at: string;
  updated_at?: string | null;
  is_archived?: boolean | null;
  appointment_start?: string | null;
  appointment_end?: string | null;
};

export type OrderView = OrderBase & {
  client_name: string | null;
  assignee_name: string | null;
};

export type ActivityEvent =
  | "status_changed"
  | "assignee_changed"
  | "file_uploaded"
  | "file_deleted"
  | "appointment_set"
  | "appointment_cleared"
  | "order_archived"
  | "order_restored"
  | "note_added";

export type UserLite = { id: string; full_name: string | null };
export type ClientLite = { id: string; display_name: string };

export type Paged<T> = { rows: T[]; total: number; page: number; pageSize: number };
