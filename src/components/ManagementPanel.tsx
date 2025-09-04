import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Settings, Wifi, WifiOff } from 'lucide-react';
import { Telemarketer } from '../types';
import { TelemarketersService } from '../services/telemarketersService';
import { useAuth } from '../contexts/AuthContext';

const ManagementPanel: React.FC = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [telemarketers, setTelemarketers] = useState<Telemarketer[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Vérification de sécurité : seuls les admins peuvent accéder à cette page
  if (!user || (!isAdmin && !isSuperAdmin)) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Settings className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Accès non autorisé
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Seuls les administrateurs peuvent accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const initializeData = async () => {
      try {
        setConnectionStatus('checking');
        
        // Vérifier la connexion Firebase
        const isConnected = await TelemarketersService.checkConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        
        if (isConnected) {
          const unsubscribe = TelemarketersService.subscribeToTelemarketers((data) => {
            setTelemarketers(data);
            setLoading(false);
          });
          return unsubscribe;
        } else {
          setLoading(false);
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



  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce télévendeur ?')) {
      try {
        await TelemarketersService.deleteTelemarketer(id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression. Vérifiez votre connexion.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {connectionStatus === 'checking' ? 'Connexion à Firebase...' : 'Chargement des données...'}
          </p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connexion Firebase échouée
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Impossible de se connecter à la base de données.
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
    <div className="p-6 space-y-6">
      {/* Indicateur de connexion */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {connectionStatus === 'connected' ? (
              <span className="flex items-center">
                <Wifi className="w-3 h-3 mr-1" />
                Connecté à Firebase
              </span>
            ) : (
              <span className="flex items-center">
                <WifiOff className="w-3 h-3 mr-1" />
                Hors ligne
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Gestion des télévendeurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Modifiez les informations et performances de votre équipe
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Télévendeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ventes validées
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  En attente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Objectif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {telemarketers.map((telemarketer) => (
                <tr key={telemarketer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {telemarketer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {telemarketer.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(telemarketer.joinDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      {telemarketer.validatedSales}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {telemarketer.pendingSales}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {telemarketer.target}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const performance = (telemarketer.validatedSales / telemarketer.target) * 100;
                      return (
                        <div className="flex items-center">
                          <div className={`text-sm font-medium ${
                            performance >= 100 ? 'text-green-600' : 
                            performance >= 80 ? 'text-orange-500' : 'text-red-500'
                          }`}>
                            {Math.round(performance)}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                performance >= 100 ? 'bg-green-500' : 
                                performance >= 80 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(performance, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDelete(telemarketer.id)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
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
      </div>
    </div>
  );
};

export default ManagementPanel;