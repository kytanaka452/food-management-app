import { differenceInDays } from 'date-fns';

export type ExpiryStatus = 'expired' | 'warning' | 'caution' | 'safe' | 'none';

export function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus {
  if (!expiryDate) return 'none';

  const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 3) return 'warning';
  if (daysUntilExpiry <= 7) return 'caution';
  return 'safe';
}

export function getExpiryStatusLabel(status: ExpiryStatus): string {
  switch (status) {
    case 'expired':
      return '期限切れ';
    case 'warning':
      return '3日以内';
    case 'caution':
      return '7日以内';
    case 'safe':
      return '安全';
    case 'none':
      return '未設定';
  }
}

export function formatExpiryDate(expiryDate: string | null | undefined): string {
  if (!expiryDate) return '未設定';
  return new Date(expiryDate).toLocaleDateString('ja-JP');
}

export function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  return differenceInDays(new Date(expiryDate), new Date());
}

export const STORAGE_LOCATION_LABELS: Record<string, string> = {
  refrigerator: '冷蔵庫',
  freezer: '冷凍庫',
  pantry: 'パントリー',
  other: 'その他',
};
