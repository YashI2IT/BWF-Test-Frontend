// app/admin/components/StatusBadge.tsx
// Reusable color-coded status badge.

type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'paid' | 'valid' | 'expired' | 'expiring_soon' | 'not_done' | string;

const COLORS: Record<string, string> = {
  active:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid:          'bg-blue-50 text-blue-700 border-blue-200',
  valid:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:       'bg-amber-50 text-amber-700 border-amber-200',
  expiring_soon: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive:      'bg-gray-100 text-gray-500 border-gray-200',
  rejected:      'bg-red-50 text-red-600 border-red-200',
  expired:       'bg-red-50 text-red-600 border-red-200',
  not_done:      'bg-gray-100 text-gray-500 border-gray-200',
};

const LABELS: Record<string, string> = {
  expiring_soon: 'Expiring Soon',
  not_done:      'Not Done',
};

export default function StatusBadge({ status }: { status: Status }) {
  const safeStatus = status || 'unknown';
  const cls = COLORS[safeStatus] || 'bg-gray-100 text-gray-500 border-gray-200';
  const label = LABELS[safeStatus] || safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
