import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { UsersService } from '../services/usersService';
import SecureLogger from '../utils/secureLogger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isManager: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAgent: boolean;
  canManageUsers: boolean;
  canManageTeams: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Durée d'inactivité en millisecondes (40 minutes)
  const INACTIVITY_TIMEOUT = 40 * 60 * 1000;

  // Générer un token de session unique
  const generateSessionToken = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Mettre à jour la dernière activité
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Déconnecter l'utilisateur pour inactivité
  const logoutForInactivity = useCallback(() => {
    console.log('🕐 Déconnexion automatique pour inactivité');
    setUser(null);
    setSessionToken(null);
    sessionStorage.clear();
    
    // Afficher une notification à l'utilisateur
    if (typeof window !== 'undefined') {
      alert('Votre session a expiré en raison d\'une inactivité prolongée. Veuillez vous reconnecter.');
    }
  }, []);

  // Gérer le timer d'inactivité
  const resetInactivityTimer = useCallback(() => {
    // Nettoyer le timer existant
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    // Créer un nouveau timer
    const newTimer = setTimeout(() => {
      logoutForInactivity();
    }, INACTIVITY_TIMEOUT);
    
    setInactivityTimer(newTimer);
  }, [inactivityTimer, logoutForInactivity, INACTIVITY_TIMEOUT]);

  // Écouter les événements d'activité utilisateur
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
      resetInactivityTimer();
    };

    // Ajouter les écouteurs d'événements
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Démarrer le timer initial
    resetInactivityTimer();

    // Nettoyer les écouteurs à la désactivation
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [user, updateActivity, resetInactivityTimer, inactivityTimer]);
  // Vérifier la validité de la session
  const isValidSession = useCallback(() => {
    const storedToken = sessionStorage.getItem('session_token');
    const storedExpiry = sessionStorage.getItem('session_expiry');
    const storedUser = sessionStorage.getItem('current_user');
    const storedLastActivity = sessionStorage.getItem('last_activity');
    
    if (!storedToken || !storedExpiry || !storedUser || !storedLastActivity) {
      return false;
    }
    
    const now = Date.now();
    const expiry = parseInt(storedExpiry);
    const lastActivityTime = parseInt(storedLastActivity);
    
    // Session expirée après 8 heures
    if (now > expiry) {
      sessionStorage.removeItem('session_token');
      sessionStorage.removeItem('session_expiry');
      sessionStorage.removeItem('current_user');
      sessionStorage.removeItem('last_activity');
      return false;
    }
    
    // Vérifier l'inactivité (20 minutes)
    if (now - lastActivityTime > INACTIVITY_TIMEOUT) {
      sessionStorage.clear();
      return false;
    }
    
    return true;
  }, []);

  // Restaurer la session au démarrage
  useEffect(() => {
    const restoreSession = () => {
      try {
        if (isValidSession()) {
          const storedUser = sessionStorage.getItem('current_user');
          const storedToken = sessionStorage.getItem('session_token');
          const storedLastActivity = sessionStorage.getItem('last_activity');
          
          if (storedUser && storedToken && storedLastActivity) {
            setUser(JSON.parse(storedUser));
            setSessionToken(storedToken);
            setLastActivity(parseInt(storedLastActivity));
          }
        }
      } catch (error) {
        SecureLogger.error('Erreur lors de la restauration de session', error);
        // Nettoyer en cas d'erreur
        sessionStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [isValidSession]);

  // Nettoyer la session quand l'onglet se ferme
  useEffect(() => {
    const handleBeforeUnload = () => {
      // La session sera automatiquement nettoyée car on utilise sessionStorage
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [inactivityTimer]);
  
  // Initialiser les utilisateurs au démarrage de l'application
  useEffect(() => {
    const initializeUsers = async () => {
      try {
        SecureLogger.system('Initialisation du système d\'authentification...');
        const isConnected = await UsersService.checkConnection();
        SecureLogger.system('Connexion Firebase', { connected: isConnected });
        
        if (isConnected) {
          await UsersService.migrateFromLocalStorage();
          await UsersService.initializeDefaultUsers();
          SecureLogger.system('Système d\'authentification initialisé');
        } else {
          SecureLogger.warn('Fonctionnement en mode dégradé (hors ligne)');
        }
      } catch (error) {
        SecureLogger.error('Erreur lors de l\'initialisation des utilisateurs', error);
      }
    };
    
    initializeUsers();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      SecureLogger.auth('Tentative de connexion', username);
      
      // Récupérer tous les utilisateurs
      const users = await UsersService.getAllUsers();
      SecureLogger.debug('Utilisateurs disponibles', { count: users.length });
      
      // Trouver l'utilisateur par nom d'utilisateur
      const foundUser = users.find(u => u.username === username);
      
      if (!foundUser) {
        SecureLogger.auth('Utilisateur non trouvé', username, false);
        return false;
      }
      
      SecureLogger.debug('Utilisateur trouvé', { name: foundUser.name, role: foundUser.role });
      
      // Vérifier si le compte est actif
      if (foundUser.isActive === false) {
        SecureLogger.auth('Compte désactivé', username, false);
        return false;
      }
      
      // Vérifier le mot de passe
      const isValidPassword = await UsersService.validatePassword(username, password);
      
      if (isValidPassword) {
        const token = generateSessionToken();
        const expiry = Date.now() + (8 * 60 * 60 * 1000); // 8 heures
        
        setUser(foundUser);
        setSessionToken(token);
        
        // Utiliser sessionStorage au lieu de localStorage pour plus de sécurité
        sessionStorage.setItem('current_user', JSON.stringify(foundUser));
        sessionStorage.setItem('session_token', token);
        sessionStorage.setItem('session_expiry', expiry.toString());
        sessionStorage.setItem('last_activity', Date.now().toString());
        
        SecureLogger.auth('Connexion réussie', username, true);
        return true;
      } else {
        SecureLogger.auth('Mot de passe incorrect', username, false);
      }
      
      return false;
    } catch (error) {
      SecureLogger.error('Erreur lors de la connexion', error);
      return false;
    }
  };

  const logout = () => {
    // Nettoyer le timer d'inactivité
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
    
    setUser(null);
    setSessionToken(null);
    // Nettoyer complètement la session
    sessionStorage.clear();
    
    // Optionnel: nettoyer aussi localStorage au cas où
    localStorage.removeItem('current_user');
  };

  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isAgent = user?.role === 'agent';
  const canManageUsers = isSuperAdmin || isAdmin || isManager;
  const canManageTeams = isSuperAdmin || isAdmin;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      login, 
      logout, 
      isManager, 
      isAdmin, 
      isSuperAdmin, 
      isAgent,
      canManageUsers, 
      canManageTeams 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};