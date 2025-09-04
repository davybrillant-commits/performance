import React, { useState, useEffect } from 'react';
import { X, User, Shield, Calendar, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { UsersService } from '../services/usersService';
import { useAuth } from '../contexts/AuthContext';
import SecureLogger from '../utils/secureLogger';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  const { logout, isAgent } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name,
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Empêcher les agents de modifier leur profil
    if (isAgent) {
      setError('Les agents ne peuvent pas modifier leur profil. Contactez votre manager.');
      return;
    }
    
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation des mots de passe
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        throw new Error('Les nouveaux mots de passe ne correspondent pas');
      }

      if (formData.newPassword && formData.newPassword.length < 6) {
        throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      }

      // Vérifier le mot de passe actuel si un nouveau mot de passe est fourni
      if (formData.newPassword && formData.currentPassword) {
        const isValidPassword = await UsersService.validatePassword(user.username, formData.currentPassword);
        if (!isValidPassword) {
          throw new Error('Mot de passe actuel incorrect');
        }
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        name: formData.name,
        email: formData.email
      };

      // Ajouter le nouveau mot de passe si fourni
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      // Mettre à jour l'utilisateur
      await UsersService.updateUser(user.id, updateData);

      setSuccess('Profil mis à jour avec succès !');
      
      // Réinitialiser les champs de mot de passe
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Si le mot de passe a été changé, déconnecter l'utilisateur
      if (formData.newPassword) {
        setTimeout(() => {
          logout();
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      SecureLogger.error('Erreur lors de la mise à jour du profil', error);
      setError(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'agent':
        return <User className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'agent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <User className="w-5 h-5 mr-2" />
            Mon Profil
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Informations utilisateur */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{user.username}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                </span>
                {user.createdAt && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Depuis {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message pour les agents */}
        {isAgent && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                En tant qu'agent, vous ne pouvez pas modifier votre profil. Contactez votre manager pour toute modification.
              </p>
            </div>
          </div>
        )}
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          {/* Informations personnelles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              disabled={isAgent}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              disabled={isAgent}
            />
          </div>

          {/* Changement de mot de passe */}
          {!isAgent && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Changer le mot de passe
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Requis pour changer le mot de passe"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Laisser vide pour ne pas changer"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Confirmer le nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              Annuler
            </button>
            {!isAgent && (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Sauvegarder</span>
            </button>
            )}
          </div>

          {formData.newPassword && !isAgent && (
            <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
              ⚠️ Vous serez déconnecté après le changement de mot de passe
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;