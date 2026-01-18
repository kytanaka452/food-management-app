import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { groupService } from '../services/groupService';
import type { Group, CreateGroupForm } from '../types';

interface Props {
  onClose: () => void;
  onCreated: (group: Group) => void;
}

export default function CreateGroupModal({ onClose, onCreated }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupForm>();

  const onSubmit = async (data: CreateGroupForm) => {
    setError(null);
    setLoading(true);

    try {
      const group = await groupService.createGroup(data);
      onCreated(group);
    } catch (err: unknown) {
      console.error('グループ作成エラー:', JSON.stringify(err, null, 2));
      const errorObj = err as { message?: string; code?: string; details?: string };
      const message = errorObj?.message || errorObj?.details || JSON.stringify(err);
      setError(`グループの作成に失敗しました: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>新規グループ作成</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="name">グループ名</label>
            <input
              id="name"
              type="text"
              {...register('name', {
                required: 'グループ名を入力してください',
                maxLength: {
                  value: 50,
                  message: 'グループ名は50文字以内で入力してください',
                },
              })}
              placeholder="例: 我が家の冷蔵庫"
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
