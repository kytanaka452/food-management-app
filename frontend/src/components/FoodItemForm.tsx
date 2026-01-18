import { useForm } from 'react-hook-form';
import type { Category, CreateFoodItemForm, FoodItemWithCategory, StorageLocation } from '../types';
import { STORAGE_LOCATION_LABELS } from '../utils/expiryHelpers';

interface Props {
  categories: Category[];
  initialData?: FoodItemWithCategory;
  onSubmit: (data: CreateFoodItemForm & { id?: string }) => void;
  onCancel: () => void;
}

export default function FoodItemForm({ categories, initialData, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFoodItemForm>({
    defaultValues: initialData
      ? {
          name: initialData.name,
          category_id: initialData.category_id,
          quantity: initialData.quantity,
          unit: initialData.unit,
          expiry_date: initialData.expiry_date?.split('T')[0],
          storage_location: initialData.storage_location,
          notes: initialData.notes,
        }
      : {
          quantity: 1,
        },
  });

  const handleFormSubmit = (data: CreateFoodItemForm) => {
    if (initialData) {
      onSubmit({ ...data, id: initialData.id });
    } else {
      onSubmit(data);
    }
  };

  const storageLocations: StorageLocation[] = ['refrigerator', 'freezer', 'pantry', 'other'];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="food-item-form">
      <div className="form-group">
        <label htmlFor="name">食材名 *</label>
        <input
          id="name"
          type="text"
          {...register('name', { required: '食材名を入力してください' })}
          placeholder="例: 牛乳"
        />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quantity">数量 *</label>
          <input
            id="quantity"
            type="number"
            min="0"
            step="0.1"
            {...register('quantity', {
              required: '数量を入力してください',
              min: { value: 0, message: '0以上を入力してください' },
              valueAsNumber: true,
            })}
          />
          {errors.quantity && <span className="field-error">{errors.quantity.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="unit">単位</label>
          <input
            id="unit"
            type="text"
            {...register('unit')}
            placeholder="例: 本、パック"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="category_id">カテゴリ</label>
        <select id="category_id" {...register('category_id')}>
          <option value="">選択してください</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="storage_location">保存場所</label>
        <select id="storage_location" {...register('storage_location')}>
          <option value="">選択してください</option>
          {storageLocations.map((location) => (
            <option key={location} value={location}>
              {STORAGE_LOCATION_LABELS[location]}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="expiry_date">賞味期限</label>
        <input
          id="expiry_date"
          type="date"
          {...register('expiry_date')}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">メモ</label>
        <textarea
          id="notes"
          {...register('notes')}
          placeholder="メモを入力"
          rows={3}
        />
      </div>

      <div className="modal-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          キャンセル
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? '保存中...' : initialData ? '更新' : '追加'}
        </button>
      </div>
    </form>
  );
}
