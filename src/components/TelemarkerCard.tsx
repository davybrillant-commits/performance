import React from 'react';
import { User, Target, TrendingUp, Calendar, Edit, Star, Zap } from 'lucide-react';
import { Telemarketer } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TelemarkerCardProps {
  telemarketer: Telemarketer;
  rank: number;
  onEdit?: (telemarketer: Telemarketer) => void;
  managerColor?: string;
}

const TelemarkerCard: React.FC<TelemarkerCardProps> = ({ telemarketer, rank, onEdit, managerColor = 'blue' }) => {
  const { isManager } = useAuth();
  const totalSales = telemarketer.validatedSales + telemarketer.pendingSales;
  const validatedPercentage = totalSales > 0 ? (telemarketer.validatedSales / totalSales) * 100 : 0;
  const pendingPercentage = totalSales > 0 ? (telemarketer.pendingSales / totalSales) * 100 : 0;
  const targetProgress = (telemarketer.validatedSales / telemarketer.target) * 100;

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

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  const performance = getPerformanceLevel(targetProgress);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 border-l-4 border-${managerColor}-500 border-r border-t border-b border-gray-100 dark:border-gray-700 overflow-hidden group transform hover:scale-[1.02] hover:-translate-y-1`}>
      {/* Header avec rang et effet de brillance */}
      <div className="relative p-6 pb-4 overflow-hidden">
        {/* Effet de brillance au hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${getRankColor(rank)} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
              {getRankIcon(rank)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {telemarketer.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatMonthLabel(telemarketer.performanceMonth)}
              </p>
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

        {/* Statistiques principales avec animations */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg transform group-hover:scale-105 transition-transform duration-300">
            <div className="text-xl font-bold text-green-600 dark:text-green-400 animate-countUp">
              {telemarketer.validatedSales}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Ventes validées
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg transform group-hover:scale-105 transition-transform duration-300">
            <div className="text-xl font-bold text-gray-500 dark:text-gray-400 animate-countUp">
              {telemarketer.pendingSales}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <Target className="w-3 h-3 mr-1" />
              En attente
            </div>
          </div>
        </div>

        {/* Barre de progression des ventes avec animation */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span className="flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              Répartition des ventes
            </span>
            <span className="font-medium">{totalSales} total</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
            <div className="h-full flex">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${validatedPercentage}%` }}
              ></div>
              <div 
                className="bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-1000 ease-out delay-300"
                style={{ width: `${pendingPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              {validatedPercentage.toFixed(0)}% validées
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-gray-500 rounded-full mr-1"></div>
              {pendingPercentage.toFixed(0)}% en attente
            </span>
          </div>
        </div>

        {/* Objectif avec animation de progression */}
        <div className="mb-1">
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span className="flex items-center font-medium">
              <Target className="w-3 h-3 mr-1" />
              Objectif: {telemarketer.target}
            </span>
            <span className={`font-bold ${targetProgress >= 100 ? 'text-green-600' : targetProgress >= 80 ? 'text-orange-500' : 'text-red-500'}`}>
              {targetProgress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                targetProgress >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                targetProgress >= 80 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
                'bg-gradient-to-r from-red-400 to-red-500'
              }`}
              style={{ width: `${Math.min(targetProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Footer avec performance et animations */}
      <div className={`px-4 py-3 ${performance.bg} transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Performance</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              targetProgress >= 100 ? 'bg-green-500' : 
              targetProgress >= 80 ? 'bg-orange-500' : 'bg-red-500'
            }`}></div>
            <TrendingUp className={`w-4 h-4 ${performance.color} transform group-hover:scale-110 transition-transform duration-300`} />
            <span className={`text-sm font-bold ${performance.color}`}>
              {performance.text}
            </span>
          </div>
        </div>
        
        {/* Indicateur de tendance */}
        <div className="mt-1 flex items-center justify-end">
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Zap className="w-3 h-3" />
            <span>Mise à jour en temps réel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemarkerCard;