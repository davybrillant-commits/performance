import React, { useState, useEffect } from 'react';
import { Telemarketer, User } from '../types';
import { TrendingUp, Target, Users, Award, Trophy, Star, BarChart } from 'lucide-react';
import { UsersService } from '../services/usersService';

interface PerformanceChartsProps {
  telemarketers: Telemarketer[];
  selectedMonth: string;
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ telemarketers, selectedMonth }) => {
  // État pour stocker les managers (équipes)
  const [managers, setManagers] = useState<User[]>([]);
  
  // Récupérer la liste des managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        // Récupérer tous les utilisateurs
        const users = await UsersService.getAllUsers();
        // Filtrer pour ne garder que les managers
        // Pas de restriction d'accès - tous les utilisateurs peuvent voir toutes les équipes
        const managersList = users.filter(user => user.role === 'manager');
        
        // Éliminer les doublons par ID et nom
        const uniqueManagers = managersList.filter((manager, index, self) => 
          index === self.findIndex(m => m.id === manager.id && m.name === manager.name)
        );
        
        setManagers(uniqueManagers);
      } catch (error) {
        console.error('Erreur lors de la récupération des managers:', error);
      }
    };
    
    fetchManagers();
  }, []);
  // Données pour le graphique en barres des performances
  const performanceData = telemarketers.map(t => ({
    name: t.name.split(' ')[0], // Prénom seulement
    validées: t.validatedSales,
    attente: t.pendingSales,
    objectif: t.target,
    performance: ((t.validatedSales / t.target) * 100).toFixed(1)
  })).slice(0, 10); // Top 10

  // Données pour le graphique circulaire de répartition
  const totalValidated = telemarketers.reduce((sum, t) => sum + t.validatedSales, 0);
  const totalPending = telemarketers.reduce((sum, t) => sum + t.pendingSales, 0);
  
  const pieData = [
    { name: 'Ventes Validées', value: totalValidated, color: '#10b981' },
    { name: 'Ventes en Attente', value: totalPending, color: '#f59e0b' }
  ];

  // Top 5 des meilleurs télévendeurs
  const topPerformers = telemarketers
    .map(t => ({
      name: t.name,
      performance: ((t.validatedSales / t.target) * 100),
      validatedSales: t.validatedSales,
      target: t.target
    }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 5)
    .map((t, index) => ({
      ...t,
      rank: index + 1,
      medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`
    }));

  // Répartition par niveau de performance
  const performanceLevels = telemarketers.reduce((acc, t) => {
    const perf = (t.validatedSales / t.target) * 100;
    if (perf >= 100) acc.excellent++;
    else if (perf >= 80) acc.bon++;
    else acc.ameliorer++;
    return acc;
  }, { excellent: 0, bon: 0, ameliorer: 0 });

  const levelData = [
    { name: 'Excellent (≥100%)', value: performanceLevels.excellent, color: '#10b981' },
    { name: 'Bon (80-99%)', value: performanceLevels.bon, color: '#f59e0b' },
    { name: 'À améliorer (<80%)', value: performanceLevels.ameliorer, color: '#ef4444' }
  ];

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  // Vérification si aucune donnée n'est disponible
  if (!telemarketers || telemarketers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune donnée disponible
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Aucun télévendeur trouvé pour {formatMonthLabel(selectedMonth)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              Analyses de Performance
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Graphiques détaillés pour {formatMonthLabel(selectedMonth)}
            </p>
          </div>
        </div>

        {/* Métriques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Équipe</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{telemarketers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Performer</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {telemarketers.length > 0 ? telemarketers[0]?.name.split(' ')[0] : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de Transformation</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {telemarketers.length > 0 ? 
                    Math.round((totalValidated / (totalValidated + totalPending)) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Perf. Moyenne</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {telemarketers.length > 0 ? 
                    Math.round((totalValidated / telemarketers.reduce((sum, t) => sum + t.target, 0)) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualisations alternatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance par Télévendeur - Tableau avec barres de progression */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance par Télévendeur
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Télévendeur</th>
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Validées</th>
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">En attente</th>
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Objectif</th>
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Performance</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{item.validées}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{item.attente}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{item.objectif}</td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="w-full max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${parseFloat(item.performance) >= 100 ? 'bg-green-500' : parseFloat(item.performance) >= 80 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(parseFloat(item.performance), 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${parseFloat(item.performance) >= 100 ? 'text-green-500' : parseFloat(item.performance) >= 80 ? 'text-orange-500' : 'text-red-500'}`}>
                          {item.performance}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Répartition des Ventes - Diagramme circulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-500" />
            Répartition des Ventes
          </h3>
          
          <div className="flex flex-col lg:flex-row items-center justify-center space-y-6 lg:space-y-0 lg:space-x-12">
            {/* Diagramme circulaire CSS */}
             <div className="relative">
               <div className="w-56 h-56 rounded-full relative overflow-hidden shadow-2xl">
                {(() => {
                  const total = totalValidated + totalPending;
                  if (total === 0) {
                    return (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Aucune donnée</span>
                      </div>
                    );
                  }
                  
                  const validatedPercentage = (totalValidated / total) * 100;
                  const pendingPercentage = (totalPending / total) * 100;
                  
                  return (
                    <>
                      {/* Segment des ventes validées */}
                      <div 
                        className="absolute inset-0 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          background: `conic-gradient(#10b981 0deg ${validatedPercentage * 3.6}deg, transparent ${validatedPercentage * 3.6}deg)`
                        }}
                      ></div>
                      
                      {/* Segment des ventes en attente */}
                      <div 
                        className="absolute inset-0 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          background: `conic-gradient(transparent 0deg ${validatedPercentage * 3.6}deg, #f59e0b ${validatedPercentage * 3.6}deg ${(validatedPercentage + pendingPercentage) * 3.6}deg, transparent ${(validatedPercentage + pendingPercentage) * 3.6}deg)`
                        }}
                      ></div>
                      
                      {/* Centre du diagramme */}
                      <div className="absolute inset-7 bg-white dark:bg-gray-800 rounded-full shadow-inner flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{total}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Total</div>
                        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 mb-2"></div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {totalValidated > 0 && (totalValidated + totalPending) > 0 ? 
                            Math.round((totalValidated / (totalValidated + totalPending)) * 100) : 0}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Validé</div>
                      </div>
                      
                      {/* Effet de brillance */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"></div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Légende et statistiques */}
            <div className="space-y-6">
              {/* Légende */}
              <div className="space-y-4">
                {pieData.map((item, index) => {
                  const percentage = Math.round((item.value / (totalValidated + totalPending)) * 100);
                  return (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.value} ventes ({percentage}%)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: item.color }}>
                          {item.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Statistiques supplémentaires */}
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total des ventes</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalValidated + totalPending}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Taux de validation</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {totalValidated > 0 && (totalValidated + totalPending) > 0 ? 
                        Math.round((totalValidated / (totalValidated + totalPending)) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 des meilleurs télévendeurs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Top 5 des Meilleurs Télévendeurs
          </h3>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index < 3 ? (
                      index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                    ) : (
                      <Star className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {performer.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {performer.validatedSales} / {performer.target} ventes
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    performer.performance >= 100 ? 'text-green-600' : 
                    performer.performance >= 80 ? 'text-orange-500' : 'text-red-500'
                  }`}>
                    {Math.round(performer.performance)}%
                  </div>
                  <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${
                        performer.performance >= 100 ? 'bg-green-500' : 
                        performer.performance >= 80 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(performer.performance, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par niveau de performance - Jauges circulaires */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Award className="w-5 h-5 mr-2 text-indigo-500" />
            Répartition par Niveau de Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {levelData.map((level, index) => {
              const percentage = telemarketers.length > 0 
                ? Math.round((level.value / telemarketers.length) * 100) 
                : 0;
              
              // Définir les icônes et styles pour chaque niveau
               const levelConfig: Record<number, { icon: string; gradient: string; ring: string }> = {
                 0: { icon: '🏆', gradient: 'from-green-400 to-emerald-600', ring: 'ring-green-200 dark:ring-green-800' },
                 1: { icon: '👍', gradient: 'from-yellow-400 to-orange-500', ring: 'ring-yellow-200 dark:ring-yellow-800' },
                 2: { icon: '🎯', gradient: 'from-red-400 to-pink-600', ring: 'ring-red-200 dark:ring-red-800' }
               };
              
              const config = levelConfig[index as number] || levelConfig[2];
              
              return (
                <div key={index} className="group relative">
                  {/* Carte principale avec effet de survol */}
                  <div className={`relative bg-gradient-to-br ${config.gradient} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${config.ring} ring-4 ring-opacity-20`}>
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent rounded-2xl"></div>
                    
                    {/* Contenu de la carte */}
                    <div className="relative z-10">
                      {/* Jauge circulaire */}
                      <div className="flex justify-center mb-4">
                        <div className="relative w-24 h-24">
                          {/* Cercle de fond */}
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="8"
                              fill="none"
                            />
                            {/* Cercle de progression avec animation */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="white"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                              className="transition-all duration-1000 ease-out"
                              style={{
                                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))'
                              }}
                            />
                          </svg>
                          
                          {/* Valeur au centre */}
                           <div className="absolute inset-0 flex items-center justify-center">
                             <div className="text-2xl font-bold text-white">{level.value}</div>
                           </div>
                        </div>
                      </div>
                      
                      {/* Informations textuelles */}
                      <div className="text-center text-white">
                        <h4 className="font-bold text-lg mb-2 drop-shadow-sm">
                          {level.name.split(' ')[0]}
                        </h4>
                        <p className="text-sm opacity-90 mb-3">
                          {level.name.includes('(') ? level.name.split('(')[1].replace(')', '') : ''}
                        </p>
                        
                        {/* Pourcentage avec animation */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                          <span className="text-xl font-bold">{percentage}%</span>
                          <span className="text-sm ml-1 opacity-80">de l'équipe</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Particules décoratives */}
                    <div className="absolute top-2 right-2 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-4 left-3 w-1 h-1 bg-white/30 rounded-full animate-ping"></div>
                  </div>
                  
                  {/* Ombre portée animée */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 -z-10`}></div>
                </div>
              );
            })}
          </div>
          
          {/* Statistiques résumées */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{telemarketers.length}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">Total télévendeurs</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-xl border border-green-200 dark:border-green-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{performanceLevels.excellent}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">Excellents</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{performanceLevels.bon}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">Bons</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20 rounded-xl border border-red-200 dark:border-red-700">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{performanceLevels.ameliorer}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">À améliorer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nouvelle section Tendance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <BarChart className="w-5 h-5 mr-2 text-blue-500" />
          Tendance
        </h3>
        <div className="mt-4">
          {/* Regrouper les télévendeurs par équipe (manager) */}
          {(() => {
            // Créer un mapping des managers
            const managerMap = new Map();
            managers.forEach(manager => {
              managerMap.set(manager.id, manager.name);
            });
            
            // Regrouper les télévendeurs par managerId
            const teamData: Record<string, { managerName: string; totalSales: number; validatedSales: number }> = telemarketers.reduce((acc, t) => {
              const managerId = t.managerId || 'sans_equipe';
              if (!acc[managerId]) {
                // Utiliser le nom réel du manager ou "Direction" pour les télévendeurs sans manager
                const managerName = managerId === 'sans_equipe' ? 'Direction' : managerMap.get(managerId) || `Manager ${managerId}`;
                acc[managerId] = {
                  managerName: managerName,
                  totalSales: 0,
                  validatedSales: 0
                };
              }
              acc[managerId].totalSales += (t.validatedSales + t.pendingSales);
              acc[managerId].validatedSales += t.validatedSales;
              return acc;
            }, {} as Record<string, { managerName: string; totalSales: number; validatedSales: number }>);
            
            // Convertir en tableau pour l'affichage
            const teamArray = Object.entries(teamData).map(([id, data]) => ({
              id,
              name: data.managerName,
              totalSales: data.totalSales,
              validatedSales: data.validatedSales
            }));
            
            // S'assurer qu'il y a au moins une équipe à afficher
            if (teamArray.length === 0) {
              // Créer des données fictives pour chaque manager si aucun télévendeur n'est associé
              managers.forEach(manager => {
                teamArray.push({
                  id: manager.id,
                  name: manager.name,
                  totalSales: 0,
                  validatedSales: 0
                });
              });
              
              // Ajouter une équipe avec le nom du manager si aucun manager n'est disponible
              if (teamArray.length === 0) {
                teamArray.push({
                  id: 'sans_equipe',
                  name: 'Direction', // Nom plus approprié pour l'équipe sans manager
                  totalSales: 0,
                  validatedSales: 0
                });
              }
            }
            
            // Trouver la valeur maximale pour dimensionner les barres
            // Utiliser 1 comme minimum pour éviter la division par zéro
            const maxValue = Math.max(
              1,
              ...teamArray.map(team => Math.max(team.totalSales, team.validatedSales))
            );
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamArray.map(team => (
                  <div key={team.id} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300">
                    {/* En-tête de la carte */}
                    <div className="text-center mb-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{team.name || 'Équipe de direction'}</h4>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        <Trophy className="w-3 h-3 mr-1" />
                        {team.totalSales} ventes totales
                      </div>
                    </div>
                    
                    {/* Graphique à barres verticales */}
                    <div className="flex items-end justify-center space-x-8 h-40 mb-4">
                      {/* Barre Total */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-12 h-32 bg-gray-200 dark:bg-gray-600 rounded-t-lg overflow-hidden">
                          <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-700 ease-out" 
                            style={{ height: `${Math.max(8, (team.totalSales / maxValue) * 100)}%` }}
                          ></div>
                          <div className="absolute inset-0 bg-blue-500/10 rounded-t-lg"></div>
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{team.totalSales}</div>
                        </div>
                      </div>
                      
                      {/* Barre Validées */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-12 h-32 bg-gray-200 dark:bg-gray-600 rounded-t-lg overflow-hidden">
                          <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-700 ease-out" 
                            style={{ height: `${Math.max(8, (team.validatedSales / maxValue) * 100)}%` }}
                          ></div>
                          <div className="absolute inset-0 bg-green-500/10 rounded-t-lg"></div>
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Validées</div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">{team.validatedSales}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Taux de conversion */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Taux de transformation</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {team.totalSales > 0 ? Math.round((team.validatedSales / team.totalSales) * 100) : 0}%
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${team.totalSales > 0 ? (team.validatedSales / team.totalSales) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()} 
        </div>


      </div>
    </div>
  );
};

export default PerformanceCharts;


