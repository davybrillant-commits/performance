import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Team } from '../types';

class FirebaseTeamsService {
  private static COLLECTION_NAME = 'teams';

  // Vérifier la connexion Firebase
  static async checkConnection(): Promise<boolean> {
    try {
      await getDocs(collection(db, this.COLLECTION_NAME));
      return true;
    } catch (error) {
      console.error('Erreur de connexion Firebase (Teams):', error);
      return false;
    }
  }

  // Récupérer toutes les équipes
  static async getAllTeams(): Promise<Team[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const teams: Team[] = [];
      
      querySnapshot.forEach((doc) => {
        teams.push({
          id: doc.id,
          ...doc.data()
        } as Team);
      });
      
      return teams;
    } catch (error) {
      console.error('Erreur lors de la récupération des équipes:', error);
      return this.getDefaultTeams();
    }
  }

  // S'abonner aux changements en temps réel
  static subscribeToTeams(callback: (teams: Team[]) => void) {
    return onSnapshot(collection(db, this.COLLECTION_NAME), (querySnapshot) => {
      const teams: Team[] = [];
      querySnapshot.forEach((doc) => {
        teams.push({
          id: doc.id,
          ...doc.data()
        } as Team);
      });
      callback(teams);
    }, (error) => {
      console.error('Erreur lors de l\'écoute des équipes:', error);
    });
  }

  // Créer une équipe
  static async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...teamData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de l\'équipe:', error);
      throw error;
    }
  }

  // Mettre à jour une équipe
  static async updateTeam(id: string, updates: Partial<Team>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'équipe:', error);
      throw error;
    }
  }

  // Supprimer une équipe
  static async deleteTeam(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'équipe:', error);
      throw error;
    }
  }

  // Initialiser les équipes par défaut
  static async initializeDefaultTeams(): Promise<void> {
    try {
      const existingTeams = await this.getAllTeams();
      
      if (existingTeams.length === 0) {
        console.log('Initialisation des équipes par défaut...');
        
        const batch = writeBatch(db);
        const defaultTeams = this.getDefaultTeams();

        for (const team of defaultTeams) {
          const teamRef = doc(collection(db, this.COLLECTION_NAME));
          batch.set(teamRef, {
            ...team,
            createdAt: new Date().toISOString(),
            updatedAt: new Date()
          });
        }

        await batch.commit();
        console.log('Équipes par défaut initialisées avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des équipes:', error);
      throw error;
    }
  }

  private static getDefaultTeams(): Omit<Team, 'id'>[] {
    return [
      {
        name: 'Équipe Alpha',
        description: 'Équipe de télévendeurs expérimentés'
      },
      {
        name: 'Équipe Beta',
        description: 'Équipe de nouveaux télévendeurs'
      },
      {
        name: 'Équipe Gamma',
        description: 'Équipe spécialisée produits premium'
      }
    ];
  }
}

export const TeamsService = FirebaseTeamsService;