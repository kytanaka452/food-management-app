import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { groupService } from '../services/groupService';
import { authService } from '../services/authService';
import CreateGroupModal from '../components/CreateGroupModal';
import type { Group } from '../types';

export default function Groups() {
  const navigate = useNavigate();
  const { setCurrentGroup } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await groupService.getUserGroups();
      setGroups(data);
    } catch {
      setError('グループの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = (group: Group) => {
    setCurrentGroup(group);
    navigate('/dashboard');
  };

  const handleGroupCreated = (newGroup: Group) => {
    setGroups((prev) => [newGroup, ...prev]);
    setShowModal(false);
    handleSelectGroup(newGroup);
  };

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="groups-container">
      <header className="groups-header">
        <h1>グループ選択</h1>
        <button onClick={handleLogout} className="btn-secondary">
          ログアウト
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="groups-content">
        <button onClick={() => setShowModal(true)} className="btn-primary create-group-btn">
          新規グループ作成
        </button>

        {groups.length === 0 ? (
          <div className="empty-state">
            <p>まだグループがありません。</p>
            <p>新しいグループを作成して始めましょう。</p>
          </div>
        ) : (
          <div className="groups-list">
            {groups.map((group) => (
              <div
                key={group.id}
                className="group-card"
                onClick={() => handleSelectGroup(group)}
              >
                <h3>{group.name}</h3>
                <span className="group-date">
                  作成日: {new Date(group.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
