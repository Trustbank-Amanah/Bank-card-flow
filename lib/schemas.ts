// lib/schemas.ts
import { z } from 'zod';

const optionalString = (max = 255) =>
  z
    .string()
    .max(max, `Maximaal ${max} tekens`)
    .optional()
    .transform((v) => (v && v.trim() !== '' ? v.trim() : null));

const optionalEmail = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : null))
  .refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    { message: 'Ongeldig e-mailadres' }
  );

export const klantSchema = z.object({
  naam: z
    .string()
    .min(1, 'Naam is verplicht')
    .max(200, 'Maximaal 200 tekens')
    .transform((v) => v.trim()),
  id_nummer: z
    .string()
    .min(1, 'ID nummer is verplicht')
    .max(100, 'Maximaal 100 tekens')
    .transform((v) => v.trim()),
  additional_reference: z
    .string()
    .min(1, 'Additional reference is verplicht')
    .max(100, 'Maximaal 100 tekens')
    .transform((v) => v.trim()),

  voornaam: optionalString(200),
  tel: optionalString(50),
  email_adres: optionalEmail,
  status: optionalString(100),
  opmerking_2: optionalString(1000),
  pinpas_aangeleverd: z.coerce.boolean().default(false),
  contact_gemaakt_klant: z.coerce.boolean().default(false),
});

export type KlantInput = z.infer<typeof klantSchema>;

// Voor het formulier: platte strings (checkbox → 'on'/'off')
export function parseKlantFormData(formData: FormData) {
  const raw = {
    naam: formData.get('naam') ?? '',
    id_nummer: formData.get('id_nummer') ?? '',
    additional_reference: formData.get('additional_reference') ?? '',
    voornaam: formData.get('voornaam') ?? '',
    tel: formData.get('tel') ?? '',
    email_adres: formData.get('email_adres') ?? '',
    status: formData.get('status') ?? '',
    opmerking_2: formData.get('opmerking_2') ?? '',
    pinpas_aangeleverd: formData.get('pinpas_aangeleverd') === 'on',
    contact_gemaakt_klant: formData.get('contact_gemaakt_klant') === 'on',
  };

  return klantSchema.safeParse(raw);
}