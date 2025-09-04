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
import { Permission } from '../types';
import SecureLogger from '../utils/secureLogger';

class FirebasePermissionsService {
  private static COLLECTION_NAME = 'permissions';

  // Vérifier la connexion Firebase
  static async checkConnection(): Promise<boolean> {
    try {
      await getDocs(collection(db, this.COLLECTION_NAME));
      return true;
    } catch (error) {
      SecureLogger.error('Erreur de connexion Firebase (Permissions)', error);
      return false;
    }
  }

  // Récupérer toutes les permissions
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const permissions: Permission[] = [];
      
      querySnapshot.forEach((doc) => {
        permissions.push({
          id: doc.id,
          ...doc.data()
        } as Permission);
      });
      
      return permissions;
    } catch (error) {
      SecureLogger.error('Erreur lors de la récupération des permissions', error);
      return [];
    }
  }

  // Récupérer les permissions d'un utilisateur
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const permissions: Permission[] = [];
      
      querySnapshot.forEach((doc) => {
        permissions.push({
          id: doc.id,
          ...doc.data()
        } as Permission);
      });
      
      return permissions;
    } catch (error) {
      SecureLogger.error('Erreur lors de la récupération des permissions utilisateur', error);
      return [];
    }
  }

  // S'abonner aux changements en temps réel
  static subscribeToPermissions(callback: (permissions: Permission[]) => void) {
    return onSnapshot(collection(db, this.COLLECTION_NAME), (querySnapshot) => {
      const permissions: Permission[] = [];
      querySnapshot.forEach((doc) => {
        permissions.push({
          id: doc.id,
          ...doc.data()
        } as Permission);
      });
      callback(permissions);
    }, (error) => {
      SecureLogger.error('Erreur lors de l\'écoute des permissions', error);
    });
  }

  // Créer une permission
  static async createPermission(permissionData: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...permissionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      SecureLogger.error('Erreur lors de la création de la permission', error);
      throw error;
    }
  }

  // Mettre à jour une permission
  static async updatePermission(id: string, updates: Partial<Permission>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      SecureLogger.error('Erreur lors de la mise à jour de la permission', error);
      throw error;
    }
  }

  // Supprimer une permission
  static async deletePermission(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      SecureLogger.error('Erreur lors de la suppression de la permission', error);
      throw error;
    }
  }

  // Supprimer toutes les permissions d'un utilisateur
  static async deleteUserPermissions(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      SecureLogger.error('Erreur lors de la suppression des permissions utilisateur', error);
      throw error;
    }
  }

  // Vérifier si un utilisateur a une permission spécifique
  static async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.some(permission => 
        permission.resource === resource && 
        permission.actions.includes(action)
      );
    } catch (error) {
      SecureLogger.error('Erreur lors de la vérification des permissions', error);
      return false;
    }
  }

  // Initialiser les permissions par défaut
  static async initializeDefaultPermissions(): Promise<void> {
    try {
      const existingPermissions = await this.getAllPermissions();
      
      if (existingPermissions.length === 0) {
        SecureLogger.info('Initialisation des permissions par défaut');
        
        const batch = writeBatch(db);
        const defaultPermissions = this.getDefaultPermissions();

        for (const permission of defaultPermissions) {
          const permissionRef = doc(collection(db, this.COLLECTION_NAME));
          batch.set(permissionRef, {
            ...permission,
            createdAt: new Date().toISOString(),
            updatedAt: new Date()
          });
        }

        await batch.commit();
        SecureLogger.info('Permissions par défaut initialisées avec succès');
      }
    } catch (error) {
      SecureLogger.error('Erreur lors de l\'initialisation des permissions', error);
      throw error;
    }
  }

  private static getDefaultPermissions(): Omit<Permission, 'id'>[] {
    return [
      // Permissions par défaut pour les rôles
      {
        userId: 'default_super_admin',
        resource: '*',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: {}
      },
      {
        userId: 'default_admin',
        resource: 'users',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: { excludeRoles: ['super_admin'] }
      },
      {
        userId: 'default_manager',
        resource: 'telemarketers',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: { ownTeamOnly: true }
      },
      {
        userId: 'default_agent',
        resource: 'telemarketers',
        actions: ['read'],
        conditions: { ownTeamOnly: true }
      }
    ];
  }
}

export const PermissionsService = FirebasePermissionsService;