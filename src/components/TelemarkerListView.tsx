import React from 'react';
import { Calendar, TrendingUp, Target, Edit, Star, Zap, User } from 'lucide-react';
import { Telemarketer } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TelemarkerListViewProps {
  telemarketers: Telemarketer[];
  onEdit?: (telemarketer: Telemarketer) => void;
}

const TelemarkerListView: React.FC<TelemarkerListViewProps> = ({ telemarketers, onEdit }) => {
  const { isManager } = useAuth();

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-blue-500 to-blue-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Star className="w-4 h-4 text-white" />;
    return <span className="text-white font-bold text-sm">{rank}</span>;
  };

  const getPerformanceLevel = (progress: number) => {
    if (progress >= 100) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' };
    if (progress >= 80) return { text: 'Bon', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' };
    return { text: 'À améliorer', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
  };

  return (
    <div className="space-y-3">
      {telemarketers.map((telemarketer, index) => {
        const rank = index + 1;
        const totalSales = telemarketer.validatedSales + telemarketer.pendingSales;
        const targetProgress = (telemarketer.validatedSales / telemarketer.target) * 100;
        const performance = getPerformanceLevel(targetProgress);

        return (
          <div 
            key={telemarketer.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 p-4 group hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              {/* Rang et informations principales */}
              <div className="flex items-center space-x-4 flex-1">
                <div className={`w-10 h-10 rounded-full ${getRankColor(rank)} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                  {getRankIcon(rank)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {telemarketer.name}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${performance.bg} ${performance.color}`}>
                      {performance.text}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Depuis {new Date(telemarketer.joinDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>Objectif: {telemarketer.target}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {telemarketer.validatedSales}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Validées</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                    {telemarketer.pendingSales}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">En attente</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    targetProgress >= 100 ? 'text-green-600' : 
                    targetProgress >= 80 ? 'text-orange-500' : 'text-red-500'
                  }`}>
                    {Math.round(targetProgress)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Performance</div>
                </div>
              </div>

              {/* Barre de progression et actions */}
              <div className="flex items-center space-x-4 ml-8">
                <div className="w-32">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        targetProgress >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                        targetProgress >= 80 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
                        'bg-gradient-to-r from-red-400 to-red-500'
                      }`}
                      style={{ width: `${Math.min(targetProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {isManager && (
                  <button
                    onClick={() => onEdit?.(telemarketer)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transform hover:scale-110"
                  >
                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TelemarkerListView;