import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Award, Zap, DollarSign } from 'lucide-react';

interface PrimeData {
  palier: number;
  ventesMin: number;
  ventesMax: number;
  primeParVente: number;
  description: string;
}

const primeData: PrimeData[] = [
  { palier: 1, ventesMin: 12, ventesMax: 15, primeParVente: 5000, description: "Débutant" },
  { palier: 2, ventesMin: 16, ventesMax: 20, primeParVente: 6000, description: "Confirmé" },
  { palier: 3, ventesMin: 21, ventesMax: 25, primeParVente: 7000, description: "Senior" },
  { palier: 4, ventesMin: 26, ventesMax: 30, primeParVente: 8000, description: "Expert" },
  { palier: 5, ventesMin: 31, ventesMax: 39, primeParVente: 9000, description: "Elite" },
  { palier: 6, ventesMin: 40, ventesMax: 999, primeParVente: 10000, description: "Champion" }
];

const PrimePage: React.FC = () => {
  const [ventesValidees, setVentesValidees] = useState<number>(12);
  const [primeCalculee, setPrimeCalculee] = useState<number>(0);
  const [palierActuel, setPalierActuel] = useState<PrimeData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const calculerPrime = (nbVentes: number): { prime: number; palier: PrimeData | null } => {
    if (nbVentes < 12) {
      return { prime: 0, palier: null };
    }

    const palier = primeData.find(p => nbVentes >= p.ventesMin && nbVentes <= p.ventesMax);
    if (!palier) {
      // Si plus de 40 ventes, utiliser le palier 6
      const palier6 = primeData[5];
      return { prime: nbVentes * palier6.primeParVente, palier: palier6 };
    }

    return { prime: nbVentes * palier.primeParVente, palier };
  };

  const handleCalcul = () => {
    setIsAnimating(true);
    setShowResult(false);
    
    setTimeout(() => {
      const { prime, palier } = calculerPrime(ventesValidees);
      setPrimeCalculee(prime);
      setPalierActuel(palier);
      setShowResult(true);
      setIsAnimating(false);
    }, 1000);
  };

  useEffect(() => {
    const { prime, palier } = calculerPrime(ventesValidees);
    setPrimeCalculee(prime);
    setPalierActuel(palier);
  }, [ventesValidees]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPalierColor = (palier: number): string => {
    const colors = [
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300',
      'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300'
    ];
    return colors[palier - 1] || colors[0];
  };

  const getPalierBgColor = (palier: number): string => {
    const bgColors = [
      'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10',
      'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10',
      'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10',
      'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10',
      'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10',
      'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10'
    ];
    return bgColors[palier - 1] || bgColors[0];
  };

  return (
    <div className="p-6 space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Système de Primes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Découvrez votre potentiel de gains selon vos performances
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tableau des primes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Barème des Primes
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Palier
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Ventes
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Prime/Vente
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Niveau
                  </th>
                </tr>
              </thead>
              <tbody>
                {primeData.map((item) => (
                  <tr 
                    key={item.palier} 
                    className={`border-b border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md ${
                      palierActuel?.palier === item.palier 
                        ? `${getPalierBgColor(item.palier)} shadow-sm` 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                        getPalierColor(item.palier)
                      }`}>
                        {item.palier}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">
                      {item.ventesMax === 999 ? `${item.ventesMin}+` : `${item.ventesMin}-${item.ventesMax}`}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatCurrency(item.primeParVente)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {item.description}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Comment ça marche ?
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Votre prime = Nombre de ventes activées × Prime par vente du palier correspondant.
                  Minimum 12 ventes activées pour toucher une prime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simulateur */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <div className="flex items-center mb-6">
            <Calculator className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Simulateur de Prime
            </h2>
          </div>

          <div className="space-y-5">
            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de ventes activées
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ventesValidees}
                  onChange={(e) => setVentesValidees(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold"
                  placeholder="Entrez le nombre de ventes"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="0"
                max="50"
                value={ventesValidees}
                onChange={(e) => setVentesValidees(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0</span>
                <span>25</span>
                <span>50+</span>
              </div>
            </div>

            {/* Bouton de calcul animé */}
            <button
              onClick={handleCalcul}
              disabled={isAnimating}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-300 transform ${
                isAnimating 
                  ? 'bg-gray-400 cursor-not-allowed scale-95' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isAnimating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Calcul en cours...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculer ma prime
                </div>
              )}
            </button>

            {/* Résultat */}
            <div className={`transition-all duration-500 transform ${
              showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {ventesValidees >= 12 && palierActuel ? (
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-blue-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-blue-900/20 rounded-xl p-5 border-2 border-green-300 dark:border-green-600 shadow-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-green-500 rounded-full p-3 animate-pulse">
                        <DollarSign className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Votre prime totale
                        </p>
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400 animate-bounce">
                          {formatCurrency(primeCalculee)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400">Palier</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                            getPalierColor(palierActuel.palier)
                          }`}>
                            {palierActuel.palier} - {palierActuel.description}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400">Prime/vente</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(palierActuel.primeParVente)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        Calcul: {ventesValidees} ventes × {formatCurrency(palierActuel.primeParVente)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Minimum 12 ventes activées requis
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Il vous manque {12 - ventesValidees} vente(s) pour débloquer les primes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimePage;