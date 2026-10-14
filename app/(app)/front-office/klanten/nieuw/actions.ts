// app/(app)/front-office/klanten/nieuw/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { parseKlantFormData } from '@/lib/schemas';
import type { KlantFormState } from '@/components/KlantForm';

export async function maakKlantAction(
  _prev: KlantFormState,
  formData: FormData
): Promise<KlantFormState> {
  await requireRole(['FRONT_OFFICER', 'ADMIN']);

  const parsed = parseKlantFormData(formData);

  if (!parsed.success) {
    const fieldErrors: KlantFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof KlantFormState['fieldErrors'];
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }

    return {
      fieldErrors,
      values: formDataToValues(formData),
    };
  }

  const supabase = await createClient();
  const data = parsed.data;

  const { data: created, error } = await supabase.rpc('create_customer', {
    p_naam: data.naam,
    p_id_nummer: data.id_nummer,
    p_additional_reference: data.additional_reference,
    p_voornaam: data.voornaam,
    p_tel: data.tel,
    p_email_adres: data.email_adres,
    p_status: data.status,
    p_opmerking_2: data.opmerking_2,
    p_pinpas_aangeleverd: data.pinpas_aangeleverd,
    p_contact_gemaakt_klant: data.contact_gemaakt_klant,
  });

  if (error) {
    // Duplicate detectie op basis van DB constraint
    if (
      error.message.includes('unique') ||
      error.message.includes('Er bestaat al')
    ) {
      return {
        error:
          'Er bestaat al een klant met dit ID nummer en deze additional reference.',
        values: formDataToValues(formData),
      };
    }
    return {
      error: error.message,
      values: formDataToValues(formData),
    };
  }

  const createdId = (created as { id: string } | null)?.id;
  redirect(createdId ? `/front-office/klanten/${createdId}` : '/front-office');
}

function formDataToValues(
  formData: FormData
): KlantFormState['values'] {
  return {
    naam: String(formData.get('naam') ?? ''),
    id_nummer: String(formData.get('id_nummer') ?? ''),
    additional_reference: String(formData.get('additional_reference') ?? ''),
    voornaam: String(formData.get('voornaam') ?? ''),
    tel: String(formData.get('tel') ?? ''),
    email_adres: String(formData.get('email_adres') ?? ''),
    status: String(formData.get('status') ?? ''),
    opmerking_2: String(formData.get('opmerking_2') ?? ''),
    pinpas_aangeleverd: formData.get('pinpas_aangeleverd') === 'on',
    contact_gemaakt_klant: formData.get('contact_gemaakt_klant') === 'on',
  };
}