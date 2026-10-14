// components/StatusBadge.tsx
import type { WorkflowStatus } from '@/lib/types';

const STYLES: Record<WorkflowStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Nog af te halen',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  EMAIL_ALERT_PENDING: {
    label: 'Email Alert te verwerken',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  EMAIL_ALERT_ADDED: {
    label: 'Afgerond',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
};

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}