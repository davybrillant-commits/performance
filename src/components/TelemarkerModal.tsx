import React, { useState, useEffect } from 'react';
import { X, User, Target, TrendingUp, Calendar, Save, Trash2 } from 'lucide-react';
import { Telemarketer } from '../types';
import { UsersService } from '../services/usersService';
import { User as UserType } from '../types';

interface TelemarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemarketer?: Telemarketer | null;
  onSave: (telemarketer: Omit<Telemarketer, 'id'> | Telemarketer) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isEditing: boolean;
  defaultMonth?: string;
}

const TelemarkerModal: React.FC<TelemarkerModalProps> = ({
  isOpen,
  onClose,
  telemarketer,
  onSave,
  onDelete,
  isEditing,
  defaultMonth
}) => {
  const [formData, setFormData] = useState({
    name: '',
    validatedSales: 0,
    pendingSales: 0,
    target: 0,
    performanceMonth: defaultMonth || new Date().toISOString().slice(0, 7), // Format YYYY-MM
    managerId: '',
    joinDate: new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [managers, setManagers] = useState<UserType[]>([]);

  useEffect(() => {
    // Charger la liste des managers
    const loadManagers = async () => {
      try {
        const users = await UsersService.getAllUsers();
        const managersList = users.filter(user => user.role === 'manager' && user.isActive !== false);
        
        // Éliminer les doublons par ID et nom
        const uniqueManagers = managersList.filter((manager, index, self) => 
          index === self.findIndex(m => m.id === manager.id && m.name === manager.name)
        );
        
        setManagers(uniqueManagers);
      } catch (error) {
        console.error('Erreur lors du chargement des managers:', error);
      }
    };

    if (isOpen) {
      loadManagers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (telemarketer && isEditing) {
      setFormData({
        name: telemarketer.name,
        validatedSales: telemarketer.validatedSales,
        pendingSales: telemarketer.pendingSales,
        target: telemarketer.target,
        performanceMonth: telemarketer.performanceMonth,
        managerId: telemarketer.managerId || '',
        joinDate: telemarketer.joinDate
      });
    } else {
      setFormData({
        name: '',
        validatedSales: 0,
        pendingSales: 0,
        target: 0,
        performanceMonth: defaultMonth || new Date().toISOString().slice(0, 7),
        managerId: '',
        joinDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [telemarketer, isEditing, isOpen, defaultMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && telemarketer) {
        await onSave({ ...telemarketer, ...formData });
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (telemarketer && onDelete) {
      setLoading(true);
      try {
        await onDelete(telemarketer.id);
        onClose();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Modifier le télévendeur' : 'Ajouter un télévendeur'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <User className="w-4 h-4 inline mr-2" />
              Nom complet
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              placeholder="Nom du télévendeur"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="w-4 h-4 inline mr-2" />
              Mois de performance
            </label>
            <input
              type="month"
              value={formData.performanceMonth}
              onChange={(e) => setFormData({ ...formData, performanceMonth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Actuellement: {formatMonthLabel(formData.performanceMonth)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <User className="w-4 h-4 inline mr-2" />
              Manager responsable
            </label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              required
            >
              <option value="">Sélectionner un manager</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Ventes validées
              </label>
              <input
                type="number"
                min="0"
                value={formData.validatedSales}
                onChange={(e) => setFormData({ ...formData, validatedSales: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                En attente
              </label>
              <input
                type="number"
                min="0"
                value={formData.pendingSales}
                onChange={(e) => setFormData({ ...formData, pendingSales: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Target className="w-4 h-4 inline mr-2" />
              Objectif
            </label>
            <input
              type="number"
              min="1"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            )}

            <div className="flex items-center space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                Annuler
              </button>
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
                <span>{isEditing ? 'Modifier' : 'Ajouter'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Êtes-vous sûr de vouloir supprimer ce télévendeur ? Cette action est irréversible.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelemarkerModal;