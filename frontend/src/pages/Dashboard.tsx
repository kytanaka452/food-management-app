import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFoodItems } from '../hooks/useFoodItems';
import { useCategories } from '../hooks/useCategories';
import Layout from '../components/Layout';
import FoodItemCard from '../components/FoodItemCard';
import FoodItemForm from '../components/FoodItemForm';
import type { FoodItemWithCategory, StorageLocation, CreateFoodItemForm } from '../types';
import { foodItemService } from '../services/foodItemService';
import { getExpiryStatus, STORAGE_LOCATION_LABELS } from '../utils/expiryHelpers';

type TabType = 'all' | StorageLocation;

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentGroup } = useAuth();
  const { foodItems, loading, error, reload } = useFoodItems(currentGroup?.id ?? null);
  const { categories } = useCategories();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItemWithCategory | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentGroup) {
      navigate('/groups');
    }
  }, [currentGroup, navigate]);

  if (!currentGroup) {
    return null;
  }

  const filteredItems = foodItems.filter((item) => {
    const tabMatch = activeTab === 'all' || item.storage_location === activeTab;
    const categoryMatch = selectedCategory === 'all' || item.category_id === selectedCategory;
    return tabMatch && categoryMatch;
  });

  const expiringItems = foodItems.filter((item) => {
    const status = getExpiryStatus(item.expiry_date);
    return status === 'expired' || status === 'warning';
  });

  const handleSubmit = async (data: CreateFoodItemForm & { id?: string }) => {
    setFormError(null);
    try {
      if (data.id) {
        await foodItemService.updateFoodItem({ ...data, id: data.id });
        setEditingItem(null);
      } else {
        await foodItemService.createFoodItem(currentGroup.id, data);
        setShowForm(false);
      }
      reload();
    } catch {
      setFormError(data.id ? '食材の更新に失敗しました' : '食材の追加に失敗しました');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('この食材を削除しますか？')) return;
    try {
      await foodItemService.deleteFoodItem(id);
      reload();
    } catch {
      alert('削除に失敗しました');
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'refrigerator', label: STORAGE_LOCATION_LABELS.refrigerator },
    { key: 'freezer', label: STORAGE_LOCATION_LABELS.freezer },
    { key: 'pantry', label: STORAGE_LOCATION_LABELS.pantry },
    { key: 'other', label: STORAGE_LOCATION_LABELS.other },
  ];

  return (
    <Layout>
      <div className="dashboard">
        {expiringItems.length > 0 && (
          <div className="expiry-alert">
            <h3>期限切れ・期限間近の食材</h3>
            <div className="expiry-items">
              {expiringItems.map((item) => (
                <div key={item.id} className={`expiry-item ${getExpiryStatus(item.expiry_date)}`}>
                  <span className="item-name">{item.name}</span>
                  <span className="item-expiry">
                    {item.expiry_date
                      ? new Date(item.expiry_date).toLocaleDateString('ja-JP')
                      : '未設定'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dashboard-header">
          <h2>食材一覧</h2>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            食材を追加
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="tab-count">
                {tab.key === 'all'
                  ? foodItems.length
                  : foodItems.filter((i) => i.storage_location === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        <div className="filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">すべてのカテゴリ</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>食材がありません</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              食材を追加する
            </button>
          </div>
        ) : (
          <div className="food-items-grid">
            {filteredItems.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onEdit={() => setEditingItem(item)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {(showForm || editingItem) && (
          <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingItem(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingItem ? '食材を編集' : '食材を追加'}</h2>
              {formError && <div className="error-message">{formError}</div>}
              <FoodItemForm
                categories={categories}
                initialData={editingItem ?? undefined}
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingItem(null); }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
