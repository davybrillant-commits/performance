import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, SortAsc, SortDesc, Users, TrendingUp, Target, Award, Zap, Activity, ShoppingCart, Wifi, WifiOff, Grid3X3, List, Table, Calendar, BarChart3, Download } from 'lucide-react';
import { Telemarketer, SortOption, SortDirection, ViewMode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TelemarkerCard from './TelemarkerCard';
import TelemarkerListView from './TelemarkerListView';
import { TelemarkerTableView } from './TelemarkerTableView';
import TelemarkerModal from './TelemarkerModal';
import PerformanceCharts from './PerformanceCharts';
import { TelemarketersService } from '../services/telemarketersService';
import { UsersService } from '../services/usersService';
import { ExportUtils } from '../utils/exportUtils';
import { User } from '../types';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { isManager, user } = useAuth();
  const [telemarketers, setTelemarketers] = useState<Telemarketer[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('performance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showModal, setShowModal] = useState(false);
  const [editingTelemarketer, setEditingTelemarketer] = useState<Telemarketer | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [selectedManager, setSelectedManager] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Commencer par le mois actuel, mais sera ajusté après le chargement des données
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });


  // Initialiser et charger les données
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setConnectionStatus('checking');
        
        // Vérifier la connexion Firebase
        const isConnected = await TelemarketersService.checkConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        
        if (isConnected) {
          // Migrer les données depuis localStorage si nécessaire
          await TelemarketersService.migrateFromLocalStorage();
          
          // Initialiser les données de démonstration si nécessaire
          await TelemarketersService.initializeDemoData();
          
          // Charger les managers
          const usersData = await UsersService.getAllUsers();
          const managersList = usersData.filter(u => u.role === 'manager' && u.isActive !== false);
          
          // Éliminer les doublons par ID et nom
          const uniqueManagers = managersList.filter((manager, index, self) => 
            index === self.findIndex(m => m.id === manager.id && m.name === manager.name)
          );
          
          setManagers(uniqueManagers);
          
          // S'abonner aux changements en temps réel
          const unsubscribe = TelemarketersService.subscribeToTelemarketers((data) => {
            setTelemarketers(data);
            
            // Ajuster le mois sélectionné si aucune donnée n'est disponible pour le mois actuel
            const currentSelectedMonth = selectedMonth;
            const hasDataForCurrentMonth = data.some(t => t.performanceMonth === currentSelectedMonth);
            
            if (!hasDataForCurrentMonth && data.length > 0) {
              // Trouver le mois le plus récent avec des données
              const availableMonths = [...new Set(data.map(t => t.performanceMonth))].sort().reverse();
              if (availableMonths.length > 0) {
                setSelectedMonth(availableMonths[0]);
              }
            }
            
            setLoading(false);
          });

          return unsubscribe;
        } else {
          setLoading(false);
          console.error('Impossible de se connecter à Firebase');
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setLoading(false);
        setConnectionStatus('disconnected');
      }
    };

    const unsubscribePromise = initializeData();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  // Filtrer les télévendeurs par mois sélectionné
  const filteredByMonth = useMemo(() => {
    let filtered = telemarketers.filter(t => t.performanceMonth === selectedMonth);
    
    // Filtrer par manager si un manager est sélectionné
    if (selectedManager !== 'all') {
      filtered = filtered.filter(t => t.managerId === selectedManager);
    }
    
    // Si l'utilisateur connecté est un manager ou un agent, ne montrer que les télévendeurs de son équipe
    if (user?.role === 'manager') {
      filtered = filtered.filter(t => t.managerId === user.id);
    } else if (user?.role === 'agent') {
      // L'agent ne voit que les télévendeurs de son manager (même équipe)
      filtered = filtered.filter(t => t.managerId === user.teamId);
    }
    
    return filtered;
  }, [telemarketers, selectedMonth, selectedManager, user]);

  // Calculs des statistiques globales pour le mois sélectionné
  const stats = useMemo(() => {
    const monthData = filteredByMonth;
    const totalValidated = monthData.reduce((sum, t) => sum + t.validatedSales, 0);
    const totalPending = monthData.reduce((sum, t) => sum + t.pendingSales, 0);
    const totalSales = totalValidated + totalPending;
    const totalTarget = monthData.reduce((sum, t) => sum + t.target, 0);
    const avgPerformance = totalTarget > 0 ? (totalValidated / totalTarget) * 100 : 0;

    return {
      totalTeam: monthData.length,
      totalValidated,
      totalPending,
      totalSales,
      avgPerformance: Math.round(avgPerformance)
    };
  }, [filteredByMonth]);

  // Filtrage et tri des télévendeurs
  const filteredAndSortedTelemarketers = useMemo(() => {
    let filtered = filteredByMonth.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'performance':
          comparison = a.validatedSales - b.validatedSales;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'performanceMonth':
          comparison = a.performanceMonth.localeCompare(b.performanceMonth);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [filteredByMonth, searchTerm, sortOption, sortDirection]);

  // Obtenir la liste des mois disponibles
  const availableMonths = useMemo(() => {
    // Générer les 12 derniers mois
    const months: string[] = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthStr);
    }
    
    // Ajouter les mois qui ont des données mais qui ne sont pas dans les 12 derniers mois
    const dataMonths = [...new Set(telemarketers.map(t => t.performanceMonth))];
    dataMonths.forEach(month => {
      if (!months.includes(month)) {
        months.push(month);
      }
    });
    
    return months.sort().reverse();
  }, [telemarketers]);

  const handleSort = (option: SortOption) => {
    if (sortOption === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(option);
      setSortDirection('desc');
    }
  };

  const handleAddTelemarketer = () => {
    setEditingTelemarketer(null);
    setShowModal(true);
  };

  const handleEditTelemarketer = (telemarketer: Telemarketer) => {
    setEditingTelemarketer(telemarketer);
    setShowModal(true);
  };

  const handleSaveTelemarketer = async (telemarkerData: Omit<Telemarketer, 'id'> | Telemarketer) => {
    try {
      if (editingTelemarketer && 'id' in telemarkerData) {
        // Mise à jour
        await TelemarketersService.updateTelemarketer(telemarkerData.id, telemarkerData);
        toast.success(`Les informations de ${telemarkerData.name} ont été mises à jour.`);
      } else {
        // Ajout - utiliser le mois sélectionné par défaut
        const dataWithMonth = {
          ...telemarkerData,
          performanceMonth: selectedMonth
        };
        await TelemarketersService.addTelemarketer(dataWithMonth as Omit<Telemarketer, 'id'>);
        toast.success(`${telemarkerData.name} a été ajouté à l'équipe.`);
      }
      setShowModal(false);
      setEditingTelemarketer(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Impossible de sauvegarder. Vérifiez votre connexion.');
    }
  };

  const handleDeleteTelemarketer = async (id: string) => {
    try {
      const telemarketer = telemarketers.find(t => t.id === id);
      await TelemarketersService.deleteTelemarketer(id);
      toast.success(`${telemarketer?.name || 'Le télévendeur'} a été retiré de l'équipe.`);
      setShowModal(false);
      setEditingTelemarketer(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Impossible de supprimer. Vérifiez votre connexion.');
    }
  };


const handleExportExcel = () => {
  console.log("Utilisateur connecté :", user); // <== pour vérifier ce qu'on reçoit

  if (!user) {
    toast.error("Utilisateur non connecté.");
    return;
  }

  if (user.role === 'agent') {
    toast.error("Vous n'êtes pas autorisé à exporter ce rapport.");
    return;
  }

  try {
    ExportUtils.exportTelemarketersToExcel(filteredByMonth, selectedMonth);
    toast.success("Le rapport Excel a été téléchargé avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'export Excel:", error);
    toast.error("Impossible de générer le rapport Excel.");
  }
};





  const getViewIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'cards':
        return <Grid3X3 className="w-4 h-4" />;
      case 'list':
        return <List className="w-4 h-4" />;
      case 'table':
        return <Table className="w-4 h-4" />;
      case 'charts':
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getViewLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'cards':
        return 'Cartes';
      case 'list':
        return 'Liste';
      case 'table':
        return 'Tableau';
      case 'charts':
        return 'Graphiques';
    }
  };

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };



  // Couleurs pour différencier les managers
  const getManagerColor = (managerId?: string) => {
    if (!managerId) return 'gray';
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo', 'teal', 'red'];
    const index = managers.findIndex(m => m.id === managerId);
    return colors[index % colors.length] || 'gray';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <Activity className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">
            {connectionStatus === 'checking' ? 'Connexion à Firebase...' : 'Synchronisation des données...'}
          </p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <WifiOff className="w-16 h-16 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connexion Firebase échouée
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Impossible de se connecter à la base de données. Vérifiez votre connexion internet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Indicateur de connexion et filtre par mois */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {connectionStatus === 'connected' ? (
              <span className="flex items-center">
                <Wifi className="w-3 h-3 mr-1" />
                Connecté
              </span>
            ) : (
              <span className="flex items-center">
                <WifiOff className="w-3 h-3 mr-1" />
                Hors ligne
              </span>
            )}
          </span>
        </div>

        {/* Filtre par mois */}
        <div className="flex items-center space-x-3">
          {/* Filtre par manager (seulement pour admin et super_admin, pas pour manager ni agent) */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && managers.length > 0 && (
            <>
              <Users className="w-5 h-5 text-gray-400 transition-colors duration-200" />
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 hover:shadow-md cursor-pointer"
              >
                <option value="all">Tous les managers</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </>
          )}
          
          <Calendar className="w-5 h-5 text-gray-400 transition-colors duration-200" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 hover:shadow-md cursor-pointer"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* En-tête avec statistiques animées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Équipe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white animate-countUp">{stats.totalTeam}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full animate-slideIn" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total ventes</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 animate-countUp">{stats.totalSales}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                <span className="text-green-600 dark:text-green-400">{stats.totalValidated} validées</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
                <span className="text-gray-500">{stats.totalPending} en attente</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventes validées</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 animate-countUp">{stats.totalValidated}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <Zap className="w-3 h-3 text-green-500 mr-1 animate-pulse" />
            <span className="text-xs text-green-600 dark:text-green-400"> Validées</span>
          </div>
        </div>

        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold text-gray-500 dark:text-gray-400 animate-countUp">{stats.totalPending}</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Target className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">En traitement</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transform hover:scale-105 transition-all duration-300 hover:shadow-lg group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Performance moy.</p>
              <p className={`text-2xl font-bold animate-countUp ${
                stats.avgPerformance >= 100 ? 'text-green-600 dark:text-green-400' : 
                stats.avgPerformance >= 80 ? 'text-orange-500' : 'text-red-500'
              }`}>
                {stats.avgPerformance}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                  stats.avgPerformance >= 100 ? 'bg-green-500' : 
                  stats.avgPerformance >= 80 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(stats.avgPerformance, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils avec animations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 animate-slideUp">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un télévendeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Sélecteur de vue */}
            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
              {(['cards', 'list', 'table', 'charts'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={getViewLabel(mode)}
                >
                  {getViewIcon(mode)}
                  <span className="hidden sm:inline">{getViewLabel(mode)}</span>
                </button>
              ))}
            </div>

            {/* Boutons d'export/import */}
            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
              {user?.role !== 'agent' && (
                <>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                    title="Exporter en Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  

                  

                </>
              )}
            </div>
            


            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortOption}
                onChange={(e) => handleSort(e.target.value as SortOption)}
                className="border-0 bg-transparent text-gray-900 dark:text-white text-sm focus:ring-0 cursor-pointer"
              >
                <option value="performance">Performance</option>
                <option value="name">Nom</option>
                <option value="performanceMonth">Mois de performance</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                {sortDirection === 'asc' ? 
                  <SortAsc className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : 
                  <SortDesc className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                }
              </button>
            </div>

            {isManager && (
              <button
                onClick={handleAddTelemarketer}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu selon la vue sélectionnée */}
      {viewMode === 'charts' && (
        <div className="animate-slideUp">
          <PerformanceCharts
            telemarketers={filteredAndSortedTelemarketers}
            selectedMonth={selectedMonth}
          />
        </div>
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedTelemarketers.map((telemarketer, index) => (
            <div 
              key={telemarketer.id}
              className="animate-slideUp transform hover:scale-[1.02] transition-all duration-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <TelemarkerCard
                telemarketer={telemarketer}
                rank={index + 1}
                onEdit={isManager ? handleEditTelemarketer : undefined}
                managerColor={getManagerColor(telemarketer.managerId)}
              />
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="animate-slideUp">
          <TelemarkerListView
            telemarketers={filteredAndSortedTelemarketers}
            onEdit={isManager ? handleEditTelemarketer : undefined}
          />
        </div>
      )}

      {viewMode === 'table' && (
        <div className="animate-slideUp">
          <TelemarkerTableView
            telemarketers={filteredAndSortedTelemarketers}
            onEdit={isManager ? handleEditTelemarketer : undefined}
          />
        </div>
      )}

      {filteredAndSortedTelemarketers.length === 0 && (
        <div className="text-center py-12 animate-fadeIn">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Users className="w-16 h-16 text-gray-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun télévendeur trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {stats.totalTeam === 0 
              ? `Aucune donnée pour ${formatMonthLabel(selectedMonth)}`
              : 'Essayez de modifier vos critères de recherche'
            }
          </p>
        </div>
      )}

      {/* Modal d'ajout/édition */}
      <TelemarkerModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTelemarketer(null);
        }}
        telemarketer={editingTelemarketer}
        onSave={handleSaveTelemarketer}
        onDelete={isManager ? handleDeleteTelemarketer : undefined}
        isEditing={!!editingTelemarketer}
        defaultMonth={selectedMonth}
      />
    </div>
  );
};

export default Dashboard;