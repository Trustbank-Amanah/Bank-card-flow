// app/(app)/front-office/klanten/[id]/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';

export async function markeerAfgehaaldAction(customerId: string) {
  await requireRole(['FRONT_OFFICER', 'ADMIN']);

  const supabase = await createClient();
  const { error } = await supabase.rpc('mark_collected', {
    p_customer_id: customerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/front-office');
  revalidatePath(`/front-office/klanten/${customerId}`);
  redirect(`/front-office/klanten/${customerId}?success=afgehaald`);
}