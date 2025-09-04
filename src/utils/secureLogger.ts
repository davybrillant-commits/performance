/**
 * Utilitaire de logging sécurisé qui masque automatiquement les données sensibles
 * Empêche l'exposition de mots de passe, tokens et autres informations critiques
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enableConsoleLog: boolean;
  enableProductionLogs: boolean;
  logLevel: LogLevel;
}

class SecureLogger {
  private static config: LogConfig = {
    enableConsoleLog: import.meta.env.DEV || import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
    enableProductionLogs: import.meta.env.VITE_ENABLE_PRODUCTION_LOGS === 'true',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info'
  };

  // Mots-clés sensibles à masquer
  private static sensitiveKeys = [
    'password', 'pwd', 'pass', 'secret', 'token', 'key', 'auth',
    'credential', 'session', 'cookie', 'authorization', 'bearer',
    'api_key', 'apikey', 'private', 'confidential', 'hash'
  ];

  // Patterns pour détecter des données sensibles
  private static sensitivePatterns = [
    /password[\s]*[:=][\s]*['"]?([^'"\s,}]+)/gi,
    /token[\s]*[:=][\s]*['"]?([^'"\s,}]+)/gi,
    /key[\s]*[:=][\s]*['"]?([^'"\s,}]+)/gi,
    /secret[\s]*[:=][\s]*['"]?([^'"\s,}]+)/gi,
    /auth[\s]*[:=][\s]*['"]?([^'"\s,}]+)/gi,
    // Pattern pour les hashes bcrypt
    /\$2[aby]\$\d+\$[./A-Za-z0-9]{53}/g,
    // Pattern pour les tokens JWT
    /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g
  ];

  /**
   * Masque les données sensibles dans un objet ou une chaîne
   */
  private static maskSensitiveData(data: any): any {
    if (typeof data === 'string') {
      return this.maskSensitiveString(data);
    }

    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.maskSensitiveData(item));
      }

      const masked: any = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        
        // Vérifier si la clé contient un mot sensible
        const isSensitiveKey = this.sensitiveKeys.some(sensitiveKey => 
          lowerKey.includes(sensitiveKey)
        );

        if (isSensitiveKey) {
          masked[key] = this.maskValue(value);
        } else {
          masked[key] = this.maskSensitiveData(value);
        }
      }
      return masked;
    }

    return data;
  }

  /**
   * Masque les données sensibles dans une chaîne de caractères
   */
  private static maskSensitiveString(str: string): string {
    let maskedStr = str;
    
    // Appliquer tous les patterns de masquage
    this.sensitivePatterns.forEach(pattern => {
      maskedStr = maskedStr.replace(pattern, (match, captured) => {
        if (captured && captured.length > 0) {
          return match.replace(captured, this.maskValue(captured));
        }
        return '***MASKED***';
      });
    });

    return maskedStr;
  }

  /**
   * Masque une valeur en gardant quelques caractères visibles
   */
  private static maskValue(value: any): string {
    if (value === null || value === undefined) {
      return '***NULL***';
    }

    const str = String(value);
    if (str.length <= 2) {
      return '***';
    }
    
    if (str.length <= 6) {
      return str.charAt(0) + '***' + str.charAt(str.length - 1);
    }
    
    return str.substring(0, 2) + '***' + str.substring(str.length - 2);
  }

  /**
   * Vérifie si le logging est activé pour le niveau donné
   */
  private static shouldLog(level: LogLevel): boolean {
    if (import.meta.env.PROD && !this.config.enableProductionLogs) {
      return false;
    }

    if (!this.config.enableConsoleLog) {
      return false;
    }

    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Log de debug (masqué en production)
   */
  static debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.log(`🔍 [DEBUG] ${this.maskSensitiveString(message)}`, ...maskedArgs);
    }
  }

  /**
   * Log d'information
   */
  static info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.log(`ℹ️ [INFO] ${this.maskSensitiveString(message)}`, ...maskedArgs);
    }
  }

  /**
   * Log d'avertissement
   */
  static warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.warn(`⚠️ [WARN] ${this.maskSensitiveString(message)}`, ...maskedArgs);
    }
  }

  /**
   * Log d'erreur
   */
  static error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.error(`❌ [ERROR] ${this.maskSensitiveString(message)}`, ...maskedArgs);
    }
  }

  /**
   * Log sécurisé pour l'authentification
   */
  static auth(message: string, username?: string, success?: boolean): void {
    if (this.shouldLog('info')) {
      const status = success ? '✅' : '❌';
      const maskedUsername = username ? this.maskValue(username) : 'unknown';
      console.log(`🔐 [AUTH] ${status} ${message} (user: ${maskedUsername})`);
    }
  }

  /**
   * Log pour les opérations système
   */
  static system(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.log(`🔧 [SYSTEM] ${this.maskSensitiveString(message)}`, ...maskedArgs);
    }
  }

  /**
   * Configuration du logger
   */
  static configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtenir la configuration actuelle
   */
  static getConfig(): LogConfig {
    return { ...this.config };
  }
}

export default SecureLogger;
export { LogLevel, LogConfig };
