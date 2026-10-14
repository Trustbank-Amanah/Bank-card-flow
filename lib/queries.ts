// lib/queries.ts
import { createClient } from '@/lib/supabase/server';
import type {
  AuditLogEntry,
  Customer,
  WorkflowStatus,
} from '@/lib/types';

/* ============================================================
 * KLANTEN
 * ============================================================ */

export interface KlantFilters {
  zoek?: string;
  workflow_status?: WorkflowStatus;
}

export async function haalKlanten(
  filters: KlantFilters = {}
): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase.from('customers').select('*');

  if (filters.workflow_status) {
    query = query.eq('workflow_status', filters.workflow_status);
  }

  if (filters.zoek && filters.zoek.trim() !== '') {
    const q = filters.zoek.trim();
    // ILIKE search op meerdere velden
    query = query.or(
      [
        `naam.ilike.%${q}%`,
        `voornaam.ilike.%${q}%`,
        `id_nummer.ilike.%${q}%`,
        `additional_reference.ilike.%${q}%`,
        `tel.ilike.%${q}%`,
      ].join(',')
    );
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Customer[];
}

export async function haalKlant(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Customer | null;
}

/* ============================================================
 * DASHBOARD STATISTIEKEN
 * ============================================================ */

export interface DashboardStats {
  totaal: number;
  nogAfTeHalen: number;
  afgehaald: number;
  emailAlertPending: number;
  emailAlertAdded: number;
}

export async function haalDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [totaal, pending, alertPending, alertAdded] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_status', 'PENDING'),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_status', 'EMAIL_ALERT_PENDING'),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_status', 'EMAIL_ALERT_ADDED'),
  ]);

  const totaalCount = totaal.count ?? 0;
  const pendingCount = pending.count ?? 0;
  const alertPendingCount = alertPending.count ?? 0;
  const alertAddedCount = alertAdded.count ?? 0;

  return {
    totaal: totaalCount,
    nogAfTeHalen: pendingCount,
    afgehaald: totaalCount - pendingCount,
    emailAlertPending: alertPendingCount,
    emailAlertAdded: alertAddedCount,
  };
}

/* ============================================================
 * AUDIT LOG
 * ============================================================ */

export interface AuditFilters {
  actie?:
    | 'CREATED'
    | 'UPDATED'
    | 'COLLECTED'
    | 'EMAIL_ALERT_ADDED'
    | 'IMPORTED';
  zoek?: string;
  limiet?: number;
}

export interface AuditEntryMetProfiel extends AuditLogEntry {
  performer_naam: string | null;
  performer_email: string | null;
  klant_naam: string | null;
  klant_id_nummer: string | null;
  klant_reference: string | null;
}

export async function haalAuditLog(
  filters: AuditFilters = {}
): Promise<AuditEntryMetProfiel[]> {
  const supabase = await createClient();

  // Join met profiles (performer) en customers (klant info).
  // De FK-namen zijn de standaard Supabase naming:
  //   audit_log_performed_by_fkey
  //   audit_log_customer_id_fkey
  let query = supabase
    .from('audit_log')
    .select(
      `
      *,
      performer:profiles!audit_log_performed_by_fkey (full_name, email),
      klant:customers!audit_log_customer_id_fkey (naam, id_nummer, additional_reference)
    `
    )
    .order('performed_at', { ascending: false })
    .limit(filters.limiet ?? 200);

  if (filters.actie) {
    query = query.eq('action', filters.actie);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Supabase geeft joins soms als array terug (afhankelijk van versie).
  // Normaliseer naar één object per join.
  const mapped: AuditEntryMetProfiel[] = (data ?? []).map((row) => {
    const performer = Array.isArray(row.performer)
      ? row.performer[0]
      : row.performer;
    const klant = Array.isArray(row.klant) ? row.klant[0] : row.klant;

    return {
      id: row.id,
      customer_id: row.customer_id,
      action: row.action,
      performed_by: row.performed_by,
      performed_at: row.performed_at,
      changes: row.changes,
      notes: row.notes,
      performer_naam: performer?.full_name ?? null,
      performer_email: performer?.email ?? null,
      klant_naam: klant?.naam ?? null,
      klant_id_nummer: klant?.id_nummer ?? null,
      klant_reference: klant?.additional_reference ?? null,
    };
  });

  // Klant-side zoekfilter (eenvoudiger dan DB-side join filter)
  if (filters.zoek && filters.zoek.trim() !== '') {
    const q = filters.zoek.trim().toLowerCase();
    return mapped.filter(
      (e) =>
        e.klant_naam?.toLowerCase().includes(q) ||
        e.klant_id_nummer?.toLowerCase().includes(q) ||
        e.klant_reference?.toLowerCase().includes(q) ||
        e.performer_naam?.toLowerCase().includes(q) ||
        e.performer_email?.toLowerCase().includes(q)
    );
  }

  return mapped;
}