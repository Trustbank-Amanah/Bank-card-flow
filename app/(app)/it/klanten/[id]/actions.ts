// app/(app)/it/klanten/[id]/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function markeerEmailAlertToegevoegdAction(customerId: string) {
  await requireRole(['IT', 'ADMIN']);

  const supabase = await createClient();
  const { error } = await supabase.rpc('mark_email_alert_added', {
    p_customer_id: customerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/it');
  revalidatePath('/it/afgerond');
  revalidatePath(`/it/klanten/${customerId}`);
  redirect(`/it/klanten/${customerId}?success=toegevoegd`);
}