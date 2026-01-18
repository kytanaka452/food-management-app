import type { FoodItemWithCategory } from '../types';
import { getExpiryStatus, formatExpiryDate, getDaysUntilExpiry, STORAGE_LOCATION_LABELS } from '../utils/expiryHelpers';

interface Props {
  item: FoodItemWithCategory;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FoodItemCard({ item, onEdit, onDelete }: Props) {
  const expiryStatus = getExpiryStatus(item.expiry_date);
  const daysUntil = getDaysUntilExpiry(item.expiry_date);

  const getExpiryText = () => {
    if (daysUntil === null) return '期限未設定';
    if (daysUntil < 0) return `${Math.abs(daysUntil)}日前に期限切れ`;
    if (daysUntil === 0) return '本日期限';
    return `あと${daysUntil}日`;
  };

  return (
    <div className={`food-item-card ${expiryStatus}`}>
      <div className="card-header">
        <h3 className="item-name">
          {item.category?.icon && <span className="category-icon">{item.category.icon}</span>}
          {item.name}
        </h3>
        <div className="card-actions">
          <button onClick={onEdit} className="btn-icon" title="編集">
            編集
          </button>
          <button onClick={onDelete} className="btn-icon delete" title="削除">
            削除
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="item-detail">
          <span className="label">数量:</span>
          <span className="value">{item.quantity}{item.unit || '個'}</span>
        </div>

        {item.storage_location && (
          <div className="item-detail">
            <span className="label">保存場所:</span>
            <span className="value">{STORAGE_LOCATION_LABELS[item.storage_location]}</span>
          </div>
        )}

        {item.category && (
          <div className="item-detail">
            <span className="label">カテゴリ:</span>
            <span className="value">{item.category.name}</span>
          </div>
        )}

        <div className={`item-expiry ${expiryStatus}`}>
          <span className="expiry-date">{formatExpiryDate(item.expiry_date)}</span>
          <span className="expiry-text">{getExpiryText()}</span>
        </div>

        {item.notes && (
          <div className="item-notes">
            <span className="label">メモ:</span>
            <p>{item.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
