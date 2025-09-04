import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Telemarketer } from '../types';

class FirebaseTelemarketersService {
  private static COLLECTION_NAME = 'telemarketers';
  private static listeners: ((data: Telemarketer[]) => void)[] = [];
  private static unsubscribeSnapshot: (() => void) | null = null;

  // Données par défaut pour l'initialisation
  private static async getDefaultData(): Promise<Omit<Telemarketer, 'id'>[]> {
    const currentMonth = new Date().toISOString().slice(0, 7); // Format YYYY-MM
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    // Récupérer les managers pour obtenir leurs IDs réels
    let managerIds: string[] = [];
    try {
      const { UsersService } = await import('../services/usersService');
      const users = await UsersService.getAllUsers();
      const managers = users.filter(user => user.role === 'manager');
      managerIds = managers.map(manager => manager.id);
    } catch (error) {
      console.warn('Impossible de récupérer les managers, utilisation sans managerId:', error);
    }

    // Fonction pour assigner un manager de manière cyclique
    const getManagerId = (index: number) => {
      if (managerIds.length === 0) return undefined;
      return managerIds[index % managerIds.length];
    };

    return [
      // Données du mois actuel
      {
        name: 'Marie Dupont',
        validatedSales: 85,
        pendingSales: 23,
        performanceMonth: currentMonth,
        target: 100,
        managerId: getManagerId(0)
      },
      {
        name: 'Jean Laurent',
        validatedSales: 78,
        pendingSales: 15,
        performanceMonth: currentMonth,
        target: 90,
        managerId: getManagerId(1)
      },
      {
        name: 'Sarah Moreau',
        validatedSales: 92,
        pendingSales: 28,
        performanceMonth: currentMonth,
        target: 110,
        managerId: getManagerId(2)
      },
      {
        name: 'Lucas Petit',
        validatedSales: 67,
        pendingSales: 12,
        performanceMonth: currentMonth,
        target: 80,
        managerId: getManagerId(0)
      },
      {
        name: 'Emma Leroy',
        validatedSales: 73,
        pendingSales: 19,
        performanceMonth: currentMonth,
        target: 85,
        managerId: getManagerId(1)
      },
      {
        name: 'Antoine Roux',
        validatedSales: 88,
        pendingSales: 31,
        performanceMonth: currentMonth,
        target: 95,
        managerId: getManagerId(2)
      },
      // Données du mois précédent
      {
        name: 'Marie Dupont',
        validatedSales: 72,
        pendingSales: 18,
        performanceMonth: lastMonthStr,
        target: 100,
        managerId: getManagerId(0)
      },
      {
        name: 'Jean Laurent',
        validatedSales: 65,
        pendingSales: 22,
        performanceMonth: lastMonthStr,
        target: 90,
        managerId: getManagerId(1)
      },
      {
        name: 'Sarah Moreau',
        validatedSales: 89,
        pendingSales: 15,
        performanceMonth: lastMonthStr,
        target: 110,
        managerId: getManagerId(2)
      },
      {
        name: 'Lucas Petit',
        validatedSales: 58,
        pendingSales: 25,
        performanceMonth: lastMonthStr,
        target: 80,
        managerId: getManagerId(0)
      },
      {
        name: 'Emma Leroy',
        validatedSales: 81,
        pendingSales: 12,
        performanceMonth: lastMonthStr,
        target: 85,
        managerId: getManagerId(1)
      },
      {
        name: 'Antoine Roux',
        validatedSales: 76,
        pendingSales: 19,
        performanceMonth: lastMonthStr,
        target: 95,
        managerId: getManagerId(2)
      }
    ];
  }

  // Récupérer tous les télévendeurs
  static async getAllTelemarketers(): Promise<Telemarketer[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('performanceMonth', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const telemarketers: Telemarketer[] = [];
      querySnapshot.forEach((doc) => {
        telemarketers.push({
          id: doc.id,
          ...doc.data()
        } as Telemarketer);
      });
      
      return telemarketers;
    } catch (error) {
      console.error('Erreur lors de la récupération des télévendeurs:', error);
      throw error;
    }
  }

  // S'abonner aux changements en temps réel
  static subscribeToTelemarketers(callback: (telemarketers: Telemarketer[]) => void) {
    // Ajouter le callback à la liste des listeners
    this.listeners.push(callback);
    
    // Si c'est le premier listener, créer l'abonnement Firestore
    if (this.listeners.length === 1) {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('performanceMonth', 'desc')
      );
      
      this.unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
        const telemarketers: Telemarketer[] = [];
        querySnapshot.forEach((doc) => {
          telemarketers.push({
            id: doc.id,
            ...doc.data()
          } as Telemarketer);
        });
        
        // Notifier tous les listeners
        this.listeners.forEach(listener => listener(telemarketers));
      }, (error) => {
        console.error('Erreur lors de l\'écoute des changements:', error);
      });
    } else {
      // Si l'abonnement existe déjà, récupérer les données actuelles
      this.getAllTelemarketers().then(callback).catch(console.error);
    }
    
    // Retourner une fonction de désabonnement
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
      
      // Si plus de listeners, arrêter l'abonnement Firestore
      if (this.listeners.length === 0 && this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
        this.unsubscribeSnapshot = null;
      }
    };
  }

  // Ajouter un télévendeur
  static async addTelemarketer(telemarketer: Omit<Telemarketer, 'id'>): Promise<string> {
    try {
      // Vérifier qu'un managerId est fourni
      if (!telemarketer.managerId) {
        throw new Error('Un télévendeur doit être associé à un manager');
      }
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...telemarketer,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du télévendeur:', error);
      throw error;
    }
  }

  // Mettre à jour un télévendeur
  static async updateTelemarketer(id: string, updates: Partial<Telemarketer>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du télévendeur:', error);
      throw error;
    }
  }

  // Supprimer un télévendeur
  static async deleteTelemarketer(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du télévendeur:', error);
      throw error;
    }
  }

  // Initialiser les données de démonstration
  static async initializeDemoData(): Promise<void> {
    try {
      // Vérifier si des données existent déjà
      const existingData = await this.getAllTelemarketers();
      
      if (existingData.length === 0) {
        console.log('Initialisation des données de démonstration...');
        
        // Utiliser un batch pour ajouter toutes les données en une seule transaction
        const batch = writeBatch(db);
        const defaultData = await this.getDefaultData();
        
        defaultData.forEach((telemarketer) => {
          const docRef = doc(collection(db, this.COLLECTION_NAME));
          batch.set(docRef, {
            ...telemarketer,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
        
        await batch.commit();
        console.log('Données de démonstration initialisées avec succès');
      } else {
        console.log('Données existantes trouvées, pas d\'initialisation nécessaire');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des données:', error);
      throw error;
    }
  }

  // Migrer les données depuis localStorage (utile pour la transition)
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      const localData = localStorage.getItem('telemarketers_data');
      if (localData) {
        const parsedData: any[] = JSON.parse(localData);
        
        if (parsedData.length > 0) {
          console.log('Migration des données depuis localStorage...');
          
          // Vérifier si Firebase est vide
          const existingData = await this.getAllTelemarketers();
          if (existingData.length === 0) {
            const batch = writeBatch(db);
            const currentMonth = new Date().toISOString().slice(0, 7);
            
            parsedData.forEach((telemarketer) => {
              const { id, joinDate, ...telemarkerData } = telemarketer;
              const docRef = doc(collection(db, this.COLLECTION_NAME));
              batch.set(docRef, {
                ...telemarkerData,
                // Convertir joinDate en performanceMonth si nécessaire
                performanceMonth: telemarketer.performanceMonth || currentMonth,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            });
            
            await batch.commit();
            console.log('Migration terminée avec succès');
            
            // Nettoyer localStorage après migration réussie
            localStorage.removeItem('telemarketers_data');
            localStorage.removeItem('telemarketers_initialized');
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
    }
  }

  // Réinitialiser toutes les données (utile pour le développement)
  static async resetAllData(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('Toutes les données ont été supprimées');
      
      // Réinitialiser avec les données par défaut
      await this.initializeDemoData();
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }

  // Vérifier la connexion Firebase
  static async checkConnection(): Promise<boolean> {
    try {
      await getDocs(collection(db, this.COLLECTION_NAME));
      return true;
    } catch (error) {
      console.error('Erreur de connexion Firebase:', error);
      return false;
    }
  }
}

export const TelemarketersService = FirebaseTelemarketersService;