import bcrypt from 'bcryptjs';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hasher un mot de passe
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Erreur lors du hashage du mot de passe:', error);
      throw new Error('Erreur lors du chiffrement du mot de passe');
    }
  }

  /**
   * Vérifier un mot de passe
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      return false;
    }
  }

  /**
   * Générer un mot de passe temporaire sécurisé
   */
  static generateTemporaryPassword(length: number = 12): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Valider la force d'un mot de passe
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Le mot de passe doit contenir au moins 8 caractères');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Ajoutez au moins une lettre minuscule');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Ajoutez au moins une lettre majuscule');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Ajoutez au moins un chiffre');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Ajoutez au moins un caractère spécial');
    } else {
      score += 1;
    }

    return {
      isValid: score >= 3,
      score,
      feedback
    };
  }
}