import React, { useState, useEffect } from 'react';
import { Shield, Users, Plus, Edit, Trash2, Save, X, UserCheck, Lock, Unlock } from 'lucide-react';
import { User, Permission } from '../types';
import { UsersService } from '../services/usersService';
import { PermissionsService } from '../services/permissionsService';
import { useAuth } from '../contexts/AuthContext';

const PermissionsManagement: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    resource: '',
    actions: [] as string[],
    conditions: {}
  });

  const resources = [
    'users', 'telemarketers', 'teams', 'permissions', 'dashboard', 'reports'
  ];

  const actions = [
    'create', 'read', 'update', 'delete', 'manage'
  ];

  useEffect(() => {
    if (!isSuperAdmin) return;
    initializeData();
  }, [isSuperAdmin]);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      const [userData, permissionsData] = await Promise.all([
        UsersService.getAllUsers(),
        PermissionsService.getAllPermissions()
      ]);
      
      // Filtrer pour ne montrer que les utilisateurs non-cachés
      const filteredUsers = userData.filter(u => !u.isHidden || u.role === 'super_admin');
      setUsers(filteredUsers);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserPermissions = (userId: string) => {
    return permissions.filter(p => p.userId === userId);
  };

  const handleAddPermission = (userId: string) => {
    setSelectedUser(userId);
    setEditingPermission(null);
    setFormData({
      resource: '',
      actions: [],
      conditions: {}
    });
    setShowModal(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedUser(permission.userId);
    setEditingPermission(permission);
    setFormData({
      resource: permission.resource,
      actions: permission.actions,
      conditions: permission.conditions || {}
    });
    setShowModal(true);
  };

  const handleSavePermission = async () => {
    try {
      if (editingPermission) {
        await PermissionsService.updatePermission(editingPermission.id, {
          resource: formData.resource,
          actions: formData.actions,
          conditions: formData.conditions
        });
      } else {
        await PermissionsService.createPermission({
          userId: selectedUser,
          resource: formData.resource,
          actions: formData.actions,
          conditions: formData.conditions
        });
      }
      
      setShowModal(false);
      await initializeData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la permission');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      try {
        await PermissionsService.deletePermission(permissionId);
        await initializeData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la permission');
      }
    }
  };

  const toggleAction = (action: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter(a => a !== action)
        : [...prev.actions, action]
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'manager':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'agent':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-gray-600" />;
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

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center">
        <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Accès refusé
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Seul le super administrateur peut gérer les permissions.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Gestion des Permissions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez les autorisations détaillées pour chaque utilisateur
              </p>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs et leurs permissions */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => {
            const userPermissions = getUserPermissions(user.id);
            
            return (
              <div key={user.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAddPermission(user.id)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter permission</span>
                  </button>
                </div>

                {/* Permissions de l'utilisateur */}
                <div className="space-y-2">
                  {userPermissions.length > 0 ? (
                    userPermissions.map((permission) => (
                      <div key={permission.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {permission.resource}
                              </span>
                              <div className="flex items-center space-x-1">
                                {permission.actions.map((action) => (
                                  <span
                                    key={action}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                                  >
                                    {action}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {permission.conditions && Object.keys(permission.conditions).length > 0 && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Conditions: {JSON.stringify(permission.conditions)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditPermission(permission)}
                              className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePermission(permission.id)}
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <Unlock className="w-8 h-8 mx-auto mb-2" />
                      <p>Aucune permission personnalisée</p>
                      <p className="text-xs">Utilise les permissions par défaut du rôle</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal d'ajout/édition de permission */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPermission ? 'Modifier la permission' : 'Nouvelle permission'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSavePermission(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ressource
                </label>
                <select
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Sélectionner une ressource</option>
                  {resources.map(resource => (
                    <option key={resource} value={resource}>{resource}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Actions autorisées
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {actions.map(action => (
                    <label key={action} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.actions.includes(action)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleAction(action);
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {action}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPermission ? 'Modifier' : 'Créer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManagement;