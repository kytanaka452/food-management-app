import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShoppingLists, useShoppingListItems } from '../hooks/useShoppingList';
import { useCategories } from '../hooks/useCategories';
import Layout from '../components/Layout';
import type { Category } from '../types';

function AddItemForm({
  onAdd,
  categories,
}: {
  onAdd: (name: string, quantity?: string, categoryId?: string) => Promise<void>;
  categories: Category[];
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd(name.trim(), quantity.trim() || undefined, categoryId || undefined);
      setName('');
      setQuantity('');
      setCategoryId('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <div className="form-row">
        <input
          type="text"
          placeholder="アイテム名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="item-name-input"
          disabled={isSubmitting}
        />
        <input
          type="text"
          placeholder="数量"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="item-quantity-input"
          disabled={isSubmitting}
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="item-category-select"
          disabled={isSubmitting}
        >
          <option value="">カテゴリなし</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!name.trim() || isSubmitting}>
          {isSubmitting ? '追加中...' : '追加'}
        </button>
      </div>
    </form>
  );
}

function ShoppingListItem({
  item,
  onToggle,
  onDelete,
}: {
  item: any;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`shopping-item ${item.is_purchased ? 'purchased' : ''}`}>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={item.is_purchased}
          onChange={onToggle}
        />
        <span className="item-name">{item.name}</span>
        {item.quantity && <span className="item-quantity">({item.quantity})</span>}
      </label>
      {item.category && (
        <span className="item-category">
          {item.category.icon} {item.category.name}
        </span>
      )}
      <button
        className="delete-btn"
        onClick={handleDelete}
        disabled={isDeleting}
        title="削除"
      >
        {isDeleting ? '...' : '×'}
      </button>
    </div>
  );
}

function CreateListModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate(name.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>新しい買い物リストを作成</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>リスト名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 今週の買い物"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              キャンセル
            </button>
            <button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ShoppingList() {
  const { currentGroup } = useAuth();
  const { lists, createList, deleteList } = useShoppingLists(currentGroup?.id || null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    items,
    loading: itemsLoading,
    addItem,
    togglePurchased,
    deleteItem,
    clearPurchased,
    markAllPurchased,
  } = useShoppingListItems(selectedListId);

  const { categories } = useCategories();

  const selectedList = lists.find((l) => l.id === selectedListId);
  const unpurchasedCount = items.filter((i) => !i.is_purchased).length;
  const purchasedCount = items.filter((i) => i.is_purchased).length;

  // 最初のリストを自動選択
  if (lists.length > 0 && !selectedListId) {
    setSelectedListId(lists[0].id);
  }

  if (!currentGroup) {
    return (
      <Layout>
        <div className="empty-state">
          <p>グループを選択してください</p>
        </div>
      </Layout>
    );
  }

  const handleCreateList = async (name: string) => {
    const newList = await createList(name);
    setSelectedListId(newList.id);
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('このリストを削除しますか？')) return;
    await deleteList(listId);
    if (selectedListId === listId) {
      setSelectedListId(lists.find((l) => l.id !== listId)?.id || null);
    }
  };

  const handleAddItem = async (name: string, quantity?: string, categoryId?: string) => {
    await addItem({ name, quantity, category_id: categoryId });
  };

  return (
    <Layout>
      <div className="shopping-list-page">
        <div className="page-header">
          <h1>買い物リスト</h1>
          <button onClick={() => setShowCreateModal(true)} className="create-btn">
            + 新しいリスト
          </button>
        </div>

        {lists.length === 0 ? (
          <div className="empty-state">
            <p>買い物リストがありません</p>
            <button onClick={() => setShowCreateModal(true)}>
              最初のリストを作成
            </button>
          </div>
        ) : (
          <div className="shopping-list-container">
            {/* リスト選択タブ */}
            <div className="list-tabs">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className={`list-tab ${selectedListId === list.id ? 'active' : ''}`}
                >
                  <button
                    className="tab-btn"
                    onClick={() => setSelectedListId(list.id)}
                  >
                    {list.name}
                  </button>
                  <button
                    className="tab-delete"
                    onClick={() => handleDeleteList(list.id)}
                    title="リストを削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {selectedList && (
              <div className="list-content">
                {/* アイテム追加フォーム */}
                <AddItemForm onAdd={handleAddItem} categories={categories} />

                {/* アクションボタン */}
                {items.length > 0 && (
                  <div className="list-actions">
                    <span className="item-count">
                      未購入: {unpurchasedCount} / 購入済み: {purchasedCount}
                    </span>
                    <div className="action-buttons">
                      {unpurchasedCount > 0 && (
                        <button onClick={markAllPurchased} className="action-btn">
                          全て購入済みに
                        </button>
                      )}
                      {purchasedCount > 0 && (
                        <button onClick={clearPurchased} className="action-btn danger">
                          購入済みをクリア
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* アイテムリスト */}
                {itemsLoading ? (
                  <div className="loading">読み込み中...</div>
                ) : items.length === 0 ? (
                  <div className="empty-items">
                    <p>アイテムがありません</p>
                    <p className="hint">上のフォームからアイテムを追加してください</p>
                  </div>
                ) : (
                  <div className="items-list">
                    {/* 未購入アイテム */}
                    {items
                      .filter((item) => !item.is_purchased)
                      .map((item) => (
                        <ShoppingListItem
                          key={item.id}
                          item={item}
                          onToggle={() => togglePurchased(item.id)}
                          onDelete={() => deleteItem(item.id)}
                        />
                      ))}

                    {/* 購入済みアイテム */}
                    {purchasedCount > 0 && (
                      <>
                        <div className="purchased-divider">
                          <span>購入済み ({purchasedCount})</span>
                        </div>
                        {items
                          .filter((item) => item.is_purchased)
                          .map((item) => (
                            <ShoppingListItem
                              key={item.id}
                              item={item}
                              onToggle={() => togglePurchased(item.id)}
                              onDelete={() => deleteItem(item.id)}
                            />
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showCreateModal && (
          <CreateListModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateList}
          />
        )}
      </div>
    </Layout>
  );
}
