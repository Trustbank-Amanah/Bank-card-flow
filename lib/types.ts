// lib/types.ts

export type Role = 'FRONT_OFFICER' | 'IT' | 'ADMIN';

export type WorkflowStatus =
  | 'PENDING'
  | 'EMAIL_ALERT_PENDING'
  | 'EMAIL_ALERT_ADDED';

export type AuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'COLLECTED'
  | 'EMAIL_ALERT_ADDED'
  | 'IMPORTED';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;

  // Verplicht
  naam: string;
  id_nummer: string;
  additional_reference: string;

  // Optioneel
  voornaam: string | null;
  tel: string | null;
  email_adres: string | null;
  status: string | null;
  opmerking_2: string | null;
  pinpas_aangeleverd: boolean;
  contact_gemaakt_klant: boolean;
  afgehaald: boolean;

  // Workflow
  workflow_status: WorkflowStatus;

  // Tracking
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;

  collected_at: string | null;
  collected_by: string | null;

  email_alert_added: boolean;
  email_alert_added_at: string | null;
  email_alert_added_by: string | null;
}

export interface AuditLogEntry {
  id: number;
  customer_id: string | null;
  action: AuditAction;
  performed_by: string | null;
  performed_at: string;
  changes: Record<string, unknown> | null;
  notes: string | null;
}