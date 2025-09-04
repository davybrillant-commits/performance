import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Save, RefreshCw, UserCog, Shield, TrendingUp, Calendar, Info, AlertTriangle } from 'lucide-react';
import { User, Telemarketer } from '../types';
import { UsersService } from '../services/usersService';
import { TelemarketersService } from '../services/telemarketersService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ConfigAgent: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [telemarketers, setTelemarketers] = useState<Telemarketer[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTelemarketer, setSelectedTelemarketer] = useState<string>('');
  const [targetManager, setTargetManager] = useState<string>('');
  const [changes, setChanges] = useState<{[telemarketerId: string]: string}>({});
  const [selectedTelemarketers, setSelectedTelemarketers] = useState<Set<string>>(new Set());
  const [bulkTargetManager, setBulkTargetManager] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      const [telemarketersData, usersData] = await Promise.all([
        TelemarketersService.getAllTelemarketers(),
        UsersService.getAllUsers()
      ]);
      
      // Filtrer les managers actifs
      const managersList = usersData.filter(u => u.role === 'manager' && u.isActive !== false);
      
      setTelemarketers(telemarketersData);
      setManagers(managersList);
      
      // Générer la liste des mois disponibles
      const months = [...new Set(telemarketersData.map(t => t.performanceMonth))].sort().reverse();
      setAvailableMonths(months);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleManagerChange = (telemarketerId: string, newManagerId: string) => {
    setChanges(prev => ({
      ...prev,
      [telemarketerId]: newManagerId
    }));
  };

  const handleQuickMove = async () => {
    if (!selectedTelemarketer || !targetManager) return;
    
    try {
      setSaving(true);
      await TelemarketersService.updateTelemarketer(selectedTelemarketer, { managerId: targetManager });
      
      // Mettre à jour l'état local
      setTelemarketers(prev => prev.map(telemarketer => 
        telemarketer.id === selectedTelemarketer 
          ? { ...telemarketer, managerId: targetManager }
          : telemarketer
      ));
      
      setSelectedTelemarketer('');
      setTargetManager('');
      toast.success('Télévendeur réassigné avec succès !');
    } catch (error) {
      console.error('Erreur lors de la réassignation:', error);
      toast.error('Erreur lors de la réassignation du télévendeur');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllChanges = async () => {
    if (Object.keys(changes).length === 0) return;
    
    try {
      setSaving(true);
      
      // Sauvegarder tous les changements
      const promises = Object.entries(changes).map(([telemarketerId, managerId]) =>
        TelemarketersService.updateTelemarketer(telemarketerId, { managerId })
      );
      
      await Promise.all(promises);
      
      // Mettre à jour l'état local
      setTelemarketers(prev => prev.map(telemarketer => 
        changes[telemarketer.id] 
          ? { ...telemarketer, managerId: changes[telemarketer.id] }
          : telemarketer
      ));
      
      setChanges({});
      toast.success('Tous les changements ont été sauvegardés !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des changements');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkMove = async () => {
    if (selectedTelemarketers.size === 0 || !bulkTargetManager) return;
    
    try {
      setSaving(true);
      
      const selectedIds = Array.from(selectedTelemarketers);
      const promises = selectedIds.map(telemarketerId =>
        TelemarketersService.updateTelemarketer(telemarketerId, { managerId: bulkTargetManager })
      );
      
      await Promise.all(promises);
      
      // Mettre à jour l'état local
      setTelemarketers(prev => prev.map(telemarketer => 
        selectedTelemarketers.has(telemarketer.id)
          ? { ...telemarketer, managerId: bulkTargetManager }
          : telemarketer
      ));
      
      setSelectedTelemarketers(new Set());
      setBulkTargetManager('');
      toast.success(`${selectedIds.length} télévendeurs réassignés avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la réassignation en lot:', error);
      toast.error('Erreur lors de la réassignation en lot');
    } finally {
      setSaving(false);
    }
  };

  const handleTelemarkerSelection = (telemarketerId: string, isChecked: boolean) => {
    const newSelection = new Set(selectedTelemarketers);
    if (isChecked) {
      newSelection.add(telemarketerId);
    } else {
      newSelection.delete(telemarketerId);
    }
    setSelectedTelemarketers(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTelemarketers.size === filteredTelemarketers.length) {
      // Désélectionner tout
      setSelectedTelemarketers(new Set());
    } else {
      // Sélectionner tout
      const allIds = new Set(filteredTelemarketers.map(t => t.id));
      setSelectedTelemarketers(allIds);
    }
  };

  // Filtrer les télévendeurs par mois sélectionné
  const filteredTelemarketers = telemarketers.filter(t => t.performanceMonth === selectedMonth);

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'Aucun manager';
    const manager = managers.find(m => m.id === managerId);
    return manager?.name || 'Manager inconnu';
  };

  const getPerformanceColor = (telemarketer: Telemarketer) => {
    const performance = (telemarketer.validatedSales / telemarketer.target) * 100;
    if (performance >= 100) return 'text-green-600';
    if (performance >= 80) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPerformanceText = (telemarketer: Telemarketer) => {
    const performance = (telemarketer.validatedSales / telemarketer.target) * 100;
    return `${Math.round(performance)}%`;
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <UserCog className="w-6 h-6 mr-2" />
                Configuration des Agents
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gérez l'affectation des utilisateurs aux équipes
              </p>
            </div>
            
            {/* Sélecteur de mois */}
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </div>
            
            {Object.keys(changes).length > 0 && (
              <button
                onClick={handleSaveAllChanges}
                disabled={saving}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Sauvegarder ({Object.keys(changes).length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Explication détaillée */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium mb-1"> Gestion mensuelle :</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Chaque télévendeur a des données par mois</li>
                      <li>• Utilisez le sélecteur de mois pour filtrer</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1"> Réassignation :</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Sélectionnez un ou plusieurs télévendeurs</li>
                      <li>• Choisissez le nouveau manager</li>
                      <li>• La réassignation s'applique au mois sélectionné</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerte si pas de données pour le mois */}
        {filteredTelemarketers.length === 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Aucun télévendeur trouvé pour {formatMonthLabel(selectedMonth)}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Sélectionnez un autre mois ou ajoutez des télévendeurs pour ce mois.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sélection multiple et réassignation en lot */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          
          <div className="flex items-center space-x-4 mb-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <Users className="w-4 h-4" />
              <span>
                {selectedTelemarketers.size === filteredTelemarketers.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </span>
            </button>
            
            {selectedTelemarketers.size > 0 && (
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {selectedTelemarketers.size} télévendeur(s) sélectionné(s)
              </span>
            )}
          </div>
          
          {selectedTelemarketers.size > 0 && (
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <select
                  value={bulkTargetManager}
                  onChange={(e) => setBulkTargetManager(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Choisir un manager de destination...</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                  <option value="">Aucun manager</option>
                </select>
              </div>
              
              <button
                onClick={handleBulkMove}
                disabled={!bulkTargetManager || saving}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-lg transition-colors text-sm"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Réassigner ({selectedTelemarketers.size})</span>
              </button>
            </div>
          )}
        </div>

        {/* Déplacement rapide */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Réassignation Rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sélectionner un télévendeur
              </label>
              <select
                value={selectedTelemarketer}
                onChange={(e) => setSelectedTelemarketer(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Choisir un télévendeur...</option>
                {filteredTelemarketers.map(telemarketer => (
                  <option key={telemarketer.id} value={telemarketer.id}>
                    {telemarketer.name} - {getManagerName(telemarketer.managerId)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Manager de destination
              </label>
              <select
                value={targetManager}
                onChange={(e) => setTargetManager(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Choisir un manager...</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
                <option value="">Aucun manager</option>
              </select>
            </div>

            <div>
              <button
                onClick={handleQuickMove}
                disabled={!selectedTelemarketer || !targetManager || saving}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg transition-colors text-sm w-full"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Réassigner</span>
              </button>
            </div>
          </div>
        </div>

        {/* Liste des télévendeurs avec modification en lot */}
  <div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead className="bg-gray-50 dark:bg-gray-700">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <button
            type="button"
            onClick={handleSelectAll}
            className="w-10 h-5 rounded-full bg-gray-300 relative transition-all duration-200 ease-in-out"
          >
            <span
              className={`absolute left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-transform ${
                selectedTelemarketers.size === filteredTelemarketers.length ? 'translate-x-5' : ''
              }`}
            ></span>
          </button>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Télévendeur
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Performance
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Manager Actuel
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Nouveau Manager
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Statut
        </th>
      </tr>
    </thead>
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {filteredTelemarketers.map((telemarketer) => (
        <tr
          key={telemarketer.id}
          className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
            selectedTelemarketers.has(telemarketer.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
        >
          <td className="px-4 py-4 whitespace-nowrap">
            <button
              type="button"
              onClick={() =>
                handleTelemarkerSelection(
                  telemarketer.id,
                  !selectedTelemarketers.has(telemarketer.id)
                )
              }
              className={`w-10 h-5 rounded-full relative transition-all duration-200 ease-in-out ${
                selectedTelemarketers.has(telemarketer.id)
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-transform ${
                  selectedTelemarketers.has(telemarketer.id)
                    ? 'translate-x-5'
                    : ''
                }`}
              ></span>
            </button>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {telemarketer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {telemarketer.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {telemarketer.validatedSales} ventes - {formatMonthLabel(telemarketer.performanceMonth)}
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
              <span
                className={`text-sm font-medium ${getPerformanceColor(telemarketer)}`}
              >
                {getPerformanceText(telemarketer)}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900 dark:text-white">
              {getManagerName(telemarketer.managerId)}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <select
              value={changes[telemarketer.id] || telemarketer.managerId || ''}
              onChange={(e) =>
                handleManagerChange(telemarketer.id, e.target.value)
              }
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-[120px]"
            >
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
              <option value="">Aucun manager</option>
            </select>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {changes[telemarketer.id] &&
            changes[telemarketer.id] !== telemarketer.managerId ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                <RefreshCw className="w-3 h-3 mr-1" />
                Modifié
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                Inchangé
              </span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


        {filteredTelemarketers.length === 0 && (
          <div className="text-center py-8">
            <UserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Aucun télévendeur pour {formatMonthLabel(selectedMonth)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sélectionnez un autre mois ou ajoutez des télévendeurs pour cette période
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigAgent;