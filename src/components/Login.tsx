import React, { useState } from 'react';
import { LogIn, User, Lock, Eye, EyeOff, Shield, Zap, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Vérifier que les champs ne sont pas vides
    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setError('Identifiants invalides');
      // Nettoyer les champs en cas d'échec
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className={"absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"}></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        {/* Header with tech elements */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl w-full h-full flex items-center justify-center">
              <Database className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
            TOP GUN
          </h1>
          <p className="text-blue-200/80 text-sm">
            Performance
          </p>
          
          {/* Status indicators */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2 text-xs text-green-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Système actif</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-blue-300">
              <Shield className="w-3 h-3" />
              <span>Sécurisé</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="group">
              <label className="block text-sm font-medium text-blue-200 mb-2 transition-colors group-focus-within:text-white">
                Identifiant d'accès
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 transition-colors group-focus-within:text-white" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-blue-200/60 transition-all duration-300 hover:bg-white/15"
                  placeholder="Entrez votre identifiant"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-blue-200 mb-2 transition-colors group-focus-within:text-white">
                Code d'authentification
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300 transition-colors group-focus-within:text-white" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-blue-200/60 transition-all duration-300 hover:bg-white/15"
                  placeholder="Entrez votre code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm animate-shake">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:from-blue-400 disabled:to-cyan-400 text-white font-medium py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Accéder au système</span>
              </>
            )}
          </button>
        </form>

        {/* Demo accounts with tech styling */}
        <div className="mt-8 p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <p className="text-sm text-cyan-200 font-medium">
              Comptes de démonstration
            </p>
          </div>
          <div className="space-y-2 text-xs text-blue-200/80">
            <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
              <span className="font-mono">MANAGER</span>
              <span className="font-mono text-cyan-300">••••••</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
              <span className="font-mono">AGENT</span>
              <span className="font-mono text-cyan-300">••••••</span>
            </div>
          </div>
        </div>

        {/* Footer tech elements */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-1 text-xs text-blue-300/60">
            <span>v2.1.0</span>
            <span>•</span>
            <span>Sécurisé SSL</span>
            <span>•</span>
            <span>Temps réel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;