import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Telemarketer, User } from '../types';
import SecureLogger from './secureLogger';


export class ExportUtils {
  /**
   * Exporter les données des télévendeurs en Excel
   */
  static exportTelemarketersToExcel(telemarketers: Telemarketer[], month: string): void {
    const monthLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    // Préparer les données
    const data = telemarketers.map((telemarketer, index) => ({
      'Rang': index + 1,
      'Nom': telemarketer.name,
      'Ventes Validées': telemarketer.validatedSales,
      'Ventes en Attente': telemarketer.pendingSales,
      'Total Ventes': telemarketer.validatedSales + telemarketer.pendingSales,
      'Objectif': telemarketer.target,
      'Performance (%)': ((telemarketer.validatedSales / telemarketer.target) * 100).toFixed(1),
      'Mois': monthLabel
    }));
    
    // Statistiques globales
    const totalValidated = telemarketers.reduce((sum, t) => sum + t.validatedSales, 0);
    const totalPending = telemarketers.reduce((sum, t) => sum + t.pendingSales, 0);
    const totalTarget = telemarketers.reduce((sum, t) => sum + t.target, 0);
    const avgPerformance = totalTarget > 0 ? (totalValidated / totalTarget) * 100 : 0;
    
    const summaryData = [
      { 'Statistique': 'Nombre de télévendeurs', 'Valeur': telemarketers.length },
      { 'Statistique': 'Total ventes validées', 'Valeur': totalValidated },
      { 'Statistique': 'Total ventes en attente', 'Valeur': totalPending },
      { 'Statistique': 'Total objectifs', 'Valeur': totalTarget },
      { 'Statistique': 'Performance moyenne (%)', 'Valeur': avgPerformance.toFixed(1) }
    ];
    
    // Créer le workbook
    const wb = XLSX.utils.book_new();
    
    // Feuille des données détaillées
    const ws1 = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Détails');
    
    // Feuille des statistiques
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Résumé');
    
    // Sauvegarder
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `rapport-telemarketers-${month}.xlsx`);
  }
  
  /**
   * Exporter les utilisateurs en PDF
   */
  /**
   * Exporter les utilisateurs en Excel
   */
  static exportUsersToExcel(users: User[]): void {
    const data = users.map(user => ({
      'Nom': user.name,
      'Identifiant': user.username,
      'Rôle': user.role,
      'Email': user.email || 'N/A',
      'Statut': user.isActive !== false ? 'Actif' : 'Inactif',
      'Créé le': user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'liste-utilisateurs.xlsx');
  }
}

export class ImportUtils {
  /**
   * Importer des télévendeurs depuis un fichier Excel
   */
  static async importTelemarketersFromExcel(file: File, defaultMonth: string, currentUserId?: string): Promise<Omit<Telemarketer, 'id'>[]> {
    console.log('Début de l\'importation Excel');
    console.log('Fichier:', file.name, 'Taille:', file.size, 'Type:', file.type);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log('Fichier lu avec succès');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          console.log('Feuilles disponibles:', workbook.SheetNames);
          
          // Lire la première feuille
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('Données extraites:', jsonData);
          console.log('Nombre de lignes:', jsonData.length);
          
          if (jsonData.length === 0) {
            reject(new Error('Le fichier Excel est vide ou ne contient pas de données valides'));
            return;
          }
          
          const telemarketers: Omit<Telemarketer, 'id'>[] = [];
          const errors: string[] = [];
          
          jsonData.forEach((row: any, index: number) => {
            try {
              console.log(`Traitement ligne ${index + 1}:`, row);
              
              // Validation des champs requis
              if (!row['Nom'] || typeof row['Nom'] !== 'string') {
                throw new Error(`Ligne ${index + 1}: Le nom est requis et doit être une chaîne de caractères`);
              }
              
              const validatedSales = this.parseNumber(row['Ventes Validées'] || row['Ventes Validees'], `Ventes Validées`);
              const pendingSales = this.parseNumber(row['Ventes en Attente'] || row['Ventes en attente'], `Ventes en Attente`);
              const totalVentes = this.parseNumber(row['Total Ventes'], `Total Ventes`);
              const target = this.parseNumber(row['Objectif'], `Objectif`);
              
              // Validation: Total Ventes doit être égal à Ventes Validées + Ventes en Attente
              const calculatedTotal = validatedSales + pendingSales;
              if (totalVentes !== calculatedTotal) {
                throw new Error(`Ligne ${index + 1}: Total Ventes (${totalVentes}) ne correspond pas à la somme Ventes Validées + Ventes en Attente (${calculatedTotal})`);
              }
              
              const telemarketer: Omit<Telemarketer, 'id'> = {
                name: row['Nom'].toString().trim(),
                validatedSales,
                pendingSales,
                target,
                performanceMonth: defaultMonth,
                managerId: currentUserId // Utiliser l'ID de l'utilisateur connecté
              };
              
              SecureLogger.debug('Télévendeur créé', { name: telemarketer.name });
              telemarketers.push(telemarketer);
            } catch (error) {
              const errorMessage = `Ligne ${index + 2}: ${error instanceof Error ? error.message : 'Données invalides'}`;
              SecureLogger.error('Erreur de validation ligne', { line: index + 2, error: errorMessage });
              errors.push(errorMessage);
            }
          });
          
          // Si il y a des erreurs, les signaler
          if (errors.length > 0) {
            const errorSummary = `Erreurs détectées dans ${errors.length} ligne(s):\n${errors.join('\n')}`;
            SecureLogger.error('Erreurs d\'importation détectées', { errorCount: errors.length });
            reject(new Error(errorSummary));
            return;
          }
          
          if (telemarketers.length === 0) {
            reject(new Error('Aucun télévendeur valide trouvé dans le fichier'));
            return;
          }
          
          SecureLogger.info('Import terminé avec succès', { count: telemarketers.length });
          resolve(telemarketers);
        } catch (error) {
          SecureLogger.error('Erreur lors du traitement du fichier', error);
          reject(error instanceof Error ? error : new Error('Erreur lors de la lecture du fichier'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Valider le format du fichier Excel
   */
  static validateExcelFile(file: File): { isValid: boolean; error?: string } {
    // Vérifier l'extension
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: 'Format de fichier non supporté. Veuillez utiliser un fichier Excel (.xlsx ou .xls)'
      };
    }
    
    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Le fichier est trop volumineux. Taille maximale autorisée: 10MB'
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Générer un template Excel pour l'import
   */
  static generateImportTemplate(): void {
    const templateData = [
      {
        'Nom': 'Salimata FAYE',
        'Ventes Validées': 2,
        'Ventes en Attente': 0,
        'Total Ventes': 2,
        'Objectif': 12
      },
      {
        'Nom': 'LKIBI',
        'Ventes Validées': 0,
        'Ventes en Attente': 0,
        'Total Ventes': 0,
        'Objectif': 12
      },
      {
        'Nom': 'Thierry YACKOISSET',
        'Ventes Validées': 2,
        'Ventes en Attente': 3,
        'Total Ventes': 5,
        'Objectif': 12
      }
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Ajouter des commentaires/instructions
    const instructions = [
      { 'Instructions': 'Format d\'importation des télévendeurs:' },
      { 'Instructions': '' },
      { 'Instructions': 'Colonnes requises:' },
      { 'Instructions': '- Nom: Nom complet du télévendeur (obligatoire)' },
      { 'Instructions': '- Ventes Validées: Nombre de ventes confirmées (obligatoire)' },
      { 'Instructions': '- Ventes en Attente: Nombre de ventes en cours (obligatoire)' },
      { 'Instructions': '- Total Ventes: Somme des ventes validées et en attente (obligatoire)' },
      { 'Instructions': '- Objectif: Objectif de ventes mensuel (obligatoire)' },
      { 'Instructions': '' },
      { 'Instructions': 'Notes importantes:' },
      { 'Instructions': '- La colonne Performance est calculée automatiquement' },
      { 'Instructions': '- Supprimez cette feuille d\'instructions avant l\'import' },
      { 'Instructions': '- Les valeurs numériques doivent être des nombres entiers' },
      { 'Instructions': '- Le mois sera défini automatiquement lors de l\'import' },
      { 'Instructions': '- Total Ventes = Ventes Validées + Ventes en Attente' }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'template-import-telemarketers.xlsx');
  }
  
  /**
   * Utilitaire pour parser les nombres
   */
  private static parseNumber(value: any, context: string): number {
    console.log(`parseNumber - ${context}:`, value, typeof value);
    
    if (value === null || value === undefined || value === '') {
      throw new Error(`${context}: Valeur manquante (reçu: ${value})`);
    }
    
    let num: number;
    if (typeof value === 'number') {
      num = value;
    } else {
      const stringValue = value.toString().replace(',', '.');
      num = parseFloat(stringValue);
      console.log(`Conversion de "${stringValue}" en nombre:`, num);
    }
    
    if (isNaN(num)) {
      throw new Error(`${context}: "${value}" n'est pas un nombre valide`);
    }
    
    if (num < 0) {
      throw new Error(`${context}: Doit être un nombre positif (reçu: ${num})`);
    }
    
    const result = Math.floor(num);
    console.log(`Résultat final pour ${context}:`, result);
    return result;
  }
}