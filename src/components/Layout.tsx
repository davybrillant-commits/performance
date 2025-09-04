import React, { useState } from 'react';
import { LogOut, Moon, Sun, Users, BarChart, Settings, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ProfileModal from './ProfileModal';
import ManagementPanel from './ManagementPanel';
import UserManagement from './UserManagement';

import ConfigAgent from './ConfigAgent';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'team' | 'management' | 'users' | 'config'>('team');
  const [showProfile, setShowProfile] = useState(false);

  // Vérification de sécurité supplémentaire
  if (!user) {
    return null; // Ne rien afficher si pas d'utilisateur
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <BarChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Dashboard Télévendeurs
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Suivi des performances en temps réel
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={isDark ? 'Mode clair' : 'Mode sombre'}
              >
                {isDark ? 
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : 
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                }
              </button>

              <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setShowProfile(true)}
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <span className="text-white text-sm font-medium">
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </span>
                </button>
                <div>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                  >
                    {user?.name}
                  </button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6">
          <div className="flex space-x-8">
            <button 
              onClick={() => setActiveTab('team')}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'team' 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Équipe</span>
            </button>
            {(isAdmin || isSuperAdmin) && (
              <>
                <button 
                  onClick={() => setActiveTab('management')}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                    activeTab === 'management' 
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Gestion</span>
                </button>
                {(isSuperAdmin || isAdmin) && (
                  <>
                    <button 
                      onClick={() => setActiveTab('config')}
                      className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                        activeTab === 'config' 
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <UserCog className="w-5 h-5" />
                      <span>Config Agent</span>
                    </button>
                  </>
                )}
                {(isSuperAdmin) && (
                  <button 
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                      activeTab === 'users' 
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <UserCog className="w-5 h-5" />
                    <span>Utilisateurs</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {activeTab === 'team' && children}
        {activeTab === 'management' && <ManagementPanel />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'config' && <ConfigAgent />}
      </main>

      {/* Modal de profil */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />
    </div>
  );
};

export default Layout;