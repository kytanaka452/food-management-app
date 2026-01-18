import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { User, Group } from '../types';

interface AuthContextType {
  user: User | null;
  currentGroup: Group | null;
  setCurrentGroup: (group: Group | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then(setUser).finally(() => setLoading(false));

    const { data: { subscription } } = authService.onAuthStateChange(setUser);

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, currentGroup, setCurrentGroup, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
