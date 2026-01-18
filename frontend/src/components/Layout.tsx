import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { groupService } from '../services/groupService';
import type { Group } from '../types';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate();
  const { user, currentGroup, setCurrentGroup } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await groupService.getUserGroups();
        setGroups(data);
      } catch {
        console.error('グループの取得に失敗しました');
      }
    };
    loadGroups();
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentGroup(null);
    navigate('/login');
  };

  const handleGroupChange = (group: Group) => {
    setCurrentGroup(group);
    setShowDropdown(false);
  };

  return (
    <div className="layout">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">食材管理</h1>
          {currentGroup && (
            <div className="group-selector">
              <button
                className="group-selector-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {currentGroup.name}
                <span className="dropdown-arrow">▼</span>
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      className={`dropdown-item ${group.id === currentGroup.id ? 'active' : ''}`}
                      onClick={() => handleGroupChange(group)}
                    >
                      {group.name}
                    </button>
                  ))}
                  <hr />
                  <button
                    className="dropdown-item"
                    onClick={() => navigate('/groups')}
                  >
                    グループ管理
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-right">
          {user && (
            <span className="user-email">{user.email}</span>
          )}
          <button onClick={handleLogout} className="btn-secondary">
            ログアウト
          </button>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
