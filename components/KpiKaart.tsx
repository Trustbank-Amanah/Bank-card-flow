// components/KpiKaart.tsx
interface KpiKaartProps {
  label: string;
  waarde: number;
  variant?: 'default' | 'warning' | 'success';
}

const VARIANT_STYLES = {
  default: 'border-gray-200',
  warning: 'border-amber-200 bg-amber-50/40',
  success: 'border-green-200 bg-green-50/40',
};

export function KpiKaart({ label, waarde, variant = 'default' }: KpiKaartProps) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 ${VARIANT_STYLES[variant]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{waarde}</p>
    </div>
  );
}