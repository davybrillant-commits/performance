import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, UserPlus, Shield, User as UserIcon, Mail, Calendar, Eye, EyeOff, AlertCircle, BarChart3, TrendingUp, Target, Search, Filter, Download } from 'lucide-react';
import { User } from '../types';
import { UsersService } from '../services/usersService';
import { ExportUtils } from '../utils/exportUtils';
import { PasswordUtils } from '../utils/encryption';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{
    isValid: boolean;
    score: number;
    feedback: string[];
  }>({ isValid: false, score: 0, feedback: [] });
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'agent' as 'super_admin' | 'admin' | 'manager' | 'agent',
    isActive: true,
    teamId: ''
  });

  useEffect(() => {
    const loadData = async () => {
      await initializeAndLoadUsers();
      // Charger aussi les managers pour les équipes
      const userData = await UsersService.getAllUsers();
      const managersList = userData.filter(u => u.role === 'manager' && u.isActive !== false);
      setTeams(managersList.map(manager => ({
        id: manager.id,
        name: `Équipe ${manager.name}`,
        description: `Équipe dirigée par ${manager.name}`,
        managerId: manager.id
      })));
    };
    loadData();
  }, []);

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Statistiques
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive !== false).length,
    managers: users.filter(u => u.role === 'manager').length,
    agents: users.filter(u => u.role === 'agent').length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length
  };

  const initializeAndLoadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement de la gestion des utilisateurs...');
      
      // Vérifier la connexion Firebase
      const isConnected = await UsersService.checkConnection();
      if (!isConnected) {
        console.error('❌ Impossible de se connecter à Firebase');
        setLoading(false);
        return;
      }
      console.log('✅ Connexion Firebase établie');
      
      // Migrer depuis localStorage si nécessaire
      await UsersService.migrateFromLocalStorage();
      
      // Initialiser les utilisateurs par défaut si nécessaire
      await UsersService.initializeDefaultUsers();
      
      // Charger les utilisateurs
      const userData = await UsersService.getAllUsers();
      // Ne montrer que les utilisateurs non cachés pour les non-super_admin
      const filteredUsers = userData.filter(u => !u.isHidden);
      setUsers(filteredUsers);
      console.log('✅ Utilisateurs chargés:', userData.length);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setSaveError('');
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'agent',
      isActive: true,
      teamId: ''
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setSaveError('');
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role,
      isActive: user.isActive ?? true,
      teamId: user.teamId || ''
    });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    try {
      setSaveError('');
      
      // Validation du mot de passe pour les nouveaux utilisateurs
      if (!editingUser && formData.password) {
        const strength = PasswordUtils.validatePasswordStrength(formData.password);
        if (!strength.isValid) {
          setSaveError(`Mot de passe trop faible: ${strength.feedback.join(', ')}`);
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setSaveError('Les mots de passe ne correspondent pas');
          return;
        }
      }
      
      if (editingUser) {
        // Mise à jour
        await UsersService.updateUser(editingUser.id, {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          teamId: formData.teamId,
          ...(formData.password && { password: formData.password })
        });
        toast.success('Utilisateur modifié avec succès');
      } else {
        // Création
        await UsersService.createUser({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive,
          teamId: formData.teamId
        });
        toast.success('Utilisateur créé avec succès');
      }
      
      setShowModal(false);
      await initializeAndLoadUsers();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveError(error.message || 'Erreur lors de la sauvegarde de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await UsersService.deleteUser(userId);
        toast.success('Utilisateur supprimé avec succès');
        await initializeAndLoadUsers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await UsersService.updateUser(userId, { isActive: !currentStatus });
      toast.success(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
      await initializeAndLoadUsers();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'Aucune équipe';
    // Si teamId correspond à un manager, afficher "Équipe [Nom du manager]"
    const manager = users.find(u => u.id === teamId && u.role === 'manager');
    if (manager) {
      return `Équipe ${manager.name}`;
    }
    
    return 'Équipe inconnue';
  };

  const handleExportExcel = () => {
    try {
      ExportUtils.exportUsersToExcel(filteredUsers);
      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (password) {
      const strength = PasswordUtils.validatePasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ isValid: false, score: 0, feedback: [] });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des utilisateurs...</p>
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
                <Users className="w-6 h-6 mr-2" />
                Gestion des Utilisateurs & Dashboard Admin
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Vue globale et gestion complète des utilisateurs du système
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Boutons d'export */}
              <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                  title="Exporter en Excel"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
              </div>
              
              <button
                onClick={handleAddUser}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
              >
                <UserPlus className="w-5 h-5" />
                <span>Nouvel utilisateur</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.managers}</p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                  <UserIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Agents</p>
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.agents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Tous les rôles</option>
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Identifiant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Équipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === 'manager' ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        <span className="text-white text-sm font-medium">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {user.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'super_admin'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : user.role === 'manager' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {user.role === 'super_admin' ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Super Admin
                        </>
                      ) : user.role === 'admin' ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </>
                      ) : user.role === 'manager' ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Manager
                        </>
                      ) : (
                        <>
                          <UserIcon className="w-3 h-3 mr-1" />
                          Agent
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive ?? true)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        user.isActive !== false
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        user.isActive !== false ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      {user.isActive !== false ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {getTeamName(user.teamId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>

      {/* Modal d'ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="p-4 space-y-3">
              {/* Error message display */}
              {saveError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Identifiant de connexion
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Indicateur de force du mot de passe */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score >= 4 ? 'bg-green-500' :
                            passwordStrength.score >= 3 ? 'bg-yellow-500' :
                            passwordStrength.score >= 2 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score >= 4 ? 'text-green-600' :
                        passwordStrength.score >= 3 ? 'text-yellow-600' :
                        passwordStrength.score >= 2 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {passwordStrength.score >= 4 ? 'Fort' :
                         passwordStrength.score >= 3 ? 'Moyen' :
                         passwordStrength.score >= 2 ? 'Faible' : 'Très faible'}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {passwordStrength.feedback.map((feedback, index) => (
                          <li key={index}>• {feedback}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    required
                  />
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'super_admin' | 'admin' | 'manager' | 'agent' })}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {formData.role === 'agent' ? 'Manager/Équipe (obligatoire)' : 'Équipe (optionnel)'}
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  required={formData.role === 'agent'}
                >
                  <option value="">{formData.role === 'agent' ? 'Sélectionner un manager...' : 'Aucune équipe'}</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                {formData.role === 'agent' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    L'agent sera automatiquement associé à l'équipe du manager sélectionné
                  </p>
                )}
              </div>
<div className="flex items-center space-x-2">
  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
    Compte actif
  </label>
  <button
    type="button"
    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
      formData.isActive ? 'bg-blue-600' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
        formData.isActive ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
</div>



              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!editingUser && formData.password && !passwordStrength.isValid}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? 'Modifier' : 'Créer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;