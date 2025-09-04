import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';
import { PasswordUtils } from '../utils/encryption';
import SecureLogger from '../utils/secureLogger';

class FirebaseUsersService {
  private static COLLECTION_NAME = 'users';
  private static PASSWORDS_COLLECTION = 'user_passwords';

  // Vérifier la connexion Firebase
  static async checkConnection(): Promise<boolean> {
    try {
      await getDocs(collection(db, this.COLLECTION_NAME));
      return true;
    } catch (error) {
      SecureLogger.error('Erreur de connexion Firebase', error);
      return false;
    }
  }

  // Récupérer tous les utilisateurs
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔍 Récupération des utilisateurs depuis Firebase...');
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        } as User);
      });
      
      console.log('✅ Utilisateurs récupérés:', users.length);
      return users;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      // Fallback vers les utilisateurs par défaut en cas d'erreur
      return this.getDefaultUsers();
    }
  }

  // Valider le mot de passe
  static async validatePassword(username: string, password: string): Promise<boolean> {
    try {
      SecureLogger.debug('Validation du mot de passe', { username });
      
      const q = query(
        collection(db, this.PASSWORDS_COLLECTION),
        where('username', '==', username)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const passwordDoc = querySnapshot.docs[0];
        const storedHashedPassword = passwordDoc.data().password;
        
        // Vérifier si le mot de passe est déjà hashé (commence par $2a$ ou $2b$)
        if (storedHashedPassword.startsWith('$2')) {
          const isValid = await PasswordUtils.verifyPassword(password, storedHashedPassword);
          SecureLogger.debug('Mot de passe hashé validé depuis Firebase', { username, valid: isValid });
          return isValid;
        } else {
          // Ancien format (plain text) - migrer vers hash
          const isValid = storedHashedPassword === password;
          if (isValid) {
            // Migrer vers hash
            const hashedPassword = await PasswordUtils.hashPassword(password);
            await updateDoc(passwordDoc.ref, {
              password: hashedPassword,
              updatedAt: new Date()
            });
            SecureLogger.info('Mot de passe migré vers hash', { username });
          }
          SecureLogger.debug('Mot de passe plain text validé et migré', { username, valid: isValid });
          return isValid;
        }
      }
      
      SecureLogger.warn('Aucun mot de passe trouvé dans Firebase, utilisation du fallback', { username });
      // Fallback pour les comptes par défaut
      const defaultPasswords: { [key: string]: string } = {
        'super_admin1': 'XABCZ-1',
        'admin2': 'XABCZ-2',
        'manager': 'XABCZ',
        'CARLY': 'XABCZ-2',
        'agent': 'demo123'
      };
      
      const isValid = defaultPasswords[username] === password;
      SecureLogger.debug('Mot de passe validé (fallback)', { username, valid: isValid });
      return isValid;
    } catch (error) {
      SecureLogger.error('Erreur lors de la validation du mot de passe', error);
      SecureLogger.warn('Tentative avec fallback en cas d\'erreur', { username });
      
      // Fallback en cas d'erreur Firebase
      const defaultPasswords: { [key: string]: string } = {
        'super_admin1': 'XABCZ-1',
        'admin2': 'XABCZ-2',
        'manager': 'XABCZ',
        'agent': 'demo123'
      };
      
      return defaultPasswords[username] === password;
    }
  }

  // Sauvegarder le mot de passe
  private static async savePassword(username: string, password: string): Promise<void> {
    try {
      // Hasher le mot de passe avant de le sauvegarder
      const hashedPassword = await PasswordUtils.hashPassword(password);
      
      // Vérifier si le mot de passe existe déjà
      const q = query(
        collection(db, this.PASSWORDS_COLLECTION),
        where('username', '==', username)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Mettre à jour le mot de passe existant
        const passwordDoc = querySnapshot.docs[0];
        await updateDoc(passwordDoc.ref, {
          password: hashedPassword,
          updatedAt: new Date()
        });
      } else {
        // Créer un nouveau document de mot de passe
        await addDoc(collection(db, this.PASSWORDS_COLLECTION), {
          username: username,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du mot de passe:', error);
      throw error;
    }
  }

  // Créer un utilisateur
  static async createUser(userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<string> {
    try {
      // Si c'est un agent, il doit avoir un teamId (manager)
      if (userData.role === 'agent' && !userData.teamId) {
        throw new Error('Un agent doit être associé à une équipe (manager)');
      }
      
      // Vérifier si l'identifiant existe déjà
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('username', '==', userData.username)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Cet identifiant existe déjà');
      }

      // Créer l'utilisateur
      const { password, ...userDataWithoutPassword } = userData;
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...userDataWithoutPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date()
      });

      // Sauvegarder le mot de passe séparément
      await this.savePassword(userData.username, password);
      
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  // Mettre à jour un utilisateur
  static async updateUser(id: string, updates: Partial<User> & { password?: string }): Promise<void> {
    try {
      const users = await this.getAllUsers();
      const currentUser = users.find(u => u.id === id);
      
      if (!currentUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier si le nouvel identifiant n'existe pas déjà (si modifié)
      if (updates.username && updates.username !== currentUser.username) {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          where('username', '==', updates.username)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          throw new Error('Cet identifiant existe déjà');
        }
      }

      // Mettre à jour l'utilisateur
      const { password, ...userUpdates } = updates;
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...userUpdates,
        updatedAt: new Date()
      });

      // Mettre à jour le mot de passe si fourni
      if (password) {
        const newUsername = updates.username || currentUser.username;
        await this.savePassword(newUsername, password); // Le hashage est fait dans savePassword
      }

      // Si le nom d'utilisateur a changé, mettre à jour le document de mot de passe
      if (updates.username && updates.username !== currentUser.username) {
        // Supprimer l'ancien document de mot de passe
        const oldPasswordQuery = query(
          collection(db, this.PASSWORDS_COLLECTION),
          where('username', '==', currentUser.username)
        );
        const oldPasswordSnapshot = await getDocs(oldPasswordQuery);
        
        if (!oldPasswordSnapshot.empty) {
          const oldPasswordDoc = oldPasswordSnapshot.docs[0];
          const oldPassword = oldPasswordDoc.data().password;
          
          // Supprimer l'ancien document
          await deleteDoc(oldPasswordDoc.ref);
          
          // Créer le nouveau document avec le nouveau nom d'utilisateur (garder le hash existant)
          await addDoc(collection(db, this.PASSWORDS_COLLECTION), {
            username: updates.username,
            password: oldPassword, // Garder le hash existant
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      SecureLogger.error('Erreur lors de la mise à jour de l\'utilisateur', error);
      throw error;
    }
  }

  // Supprimer un utilisateur
  static async deleteUser(id: string): Promise<void> {
    try {
      const users = await this.getAllUsers();
      const userToDelete = users.find(u => u.id === id);
      
      if (!userToDelete) {
        throw new Error('Utilisateur non trouvé');
      }

      // Supprimer l'utilisateur
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);

      // Supprimer aussi le mot de passe
      const passwordQuery = query(
        collection(db, this.PASSWORDS_COLLECTION),
        where('username', '==', userToDelete.username)
      );
      const passwordSnapshot = await getDocs(passwordQuery);
      
      if (!passwordSnapshot.empty) {
        const passwordDoc = passwordSnapshot.docs[0];
        await deleteDoc(passwordDoc.ref);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  // Initialiser les utilisateurs par défaut
  static async initializeDefaultUsers(): Promise<void> {
    try {
      console.log('🚀 Vérification de l\'initialisation des utilisateurs...');
      const existingUsers = await this.getAllUsers();
      
      if (existingUsers.length === 0) {
        console.log('Initialisation des utilisateurs par défaut...');
        
        const batch = writeBatch(db);
        const defaultUsers = this.getDefaultUsers();
        const defaultPasswords: { [key: string]: string } = {
          'super_admin1': 'XABCZ-1',
          'admin2': 'XABCZ-2',
          'manager': 'XABCZ',
          'CARLY': 'XABCZ-2',
          'agent': 'demo123'
        };

        // Créer les utilisateurs
        for (const user of defaultUsers) {
          const userRef = doc(collection(db, this.COLLECTION_NAME));
          batch.set(userRef, {
            ...user,
            createdAt: new Date().toISOString(),
            updatedAt: new Date()
          });

          // Créer le document de mot de passe hashé
          const hashedPassword = await PasswordUtils.hashPassword(
            defaultPasswords[user.username as keyof typeof defaultPasswords]
          );
          const passwordRef = doc(collection(db, this.PASSWORDS_COLLECTION));
          batch.set(passwordRef, {
            username: user.username,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        await batch.commit();
        SecureLogger.system('Utilisateurs par défaut initialisés avec succès');
        SecureLogger.info('Comptes créés', { count: 5, accounts: ['super_admin1', 'admin2', 'manager', 'CARLY', 'agent'] });
      } else {
        SecureLogger.system('Utilisateurs existants trouvés, pas d\'initialisation nécessaire');
        
        // Vérifier si les nouveaux comptes admin existent
        const superAdmin = existingUsers.find(u => u.username === 'super_admin1');
        const admin = existingUsers.find(u => u.username === 'admin2');
        
        if (!superAdmin || !admin) {
          SecureLogger.system('Ajout des comptes admin manquants...');
          await this.addMissingAdminAccounts();
        }
      }
    } catch (error) {
      SecureLogger.error('Erreur lors de l\'initialisation des utilisateurs', error);
      throw error;
    }
  }

  // Ajouter les comptes admin manquants
  static async addMissingAdminAccounts(): Promise<void> {
    try {
      const existingUsers = await this.getAllUsers();
      const batch = writeBatch(db);
      
      const adminAccounts = [
        {
          username: 'super_admin1',
          role: 'super_admin' as const,
          name: 'Super Administrateur',
          email: 'super.admin@company.com',
          isActive: true,
          isHidden: true,
          password: 'XABCZ-1'
        },
        {
          username: 'admin2',
          role: 'admin' as const,
          name: 'Administrateur Principal',
          email: 'admin@company.com',
          isActive: true,
          isHidden: true,
          password: 'XABCZ-2'
        }
      ];
      
      for (const account of adminAccounts) {
        const userExists = existingUsers.find(u => u.username === account.username);
        
        if (!userExists) {
          console.log(`➕ Création du compte ${account.username}`);
          
          // Créer l'utilisateur
          const { password, ...userData } = account;
          const userRef = doc(collection(db, this.COLLECTION_NAME));
          batch.set(userRef, {
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date()
          });
          
          // Créer le mot de passe hashé
          const hashedPassword = await PasswordUtils.hashPassword(password);
          const passwordRef = doc(collection(db, this.PASSWORDS_COLLECTION));
          batch.set(passwordRef, {
            username: account.username,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      await batch.commit();
      SecureLogger.system('Comptes admin ajoutés avec succès');
    } catch (error) {
      SecureLogger.error('Erreur lors de l\'ajout des comptes admin', error);
      throw error;
    }
  }
  // Migrer depuis localStorage (pour la transition)
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('🔄 Vérification de la migration depuis localStorage...');
      const localUsers = localStorage.getItem('users_data');
      
      if (localUsers) {
        const users: User[] = JSON.parse(localUsers);
        
        // Vérifier si Firebase est vide
        const existingUsers = await this.getAllUsers();
        if (existingUsers.length === 0 && users.length > 0) {
          console.log('Migration des utilisateurs depuis localStorage...');
          
          const batch = writeBatch(db);
          
          for (const user of users) {
            const { id, ...userData } = user;
            const userRef = doc(collection(db, this.COLLECTION_NAME));
            batch.set(userRef, {
              ...userData,
              updatedAt: new Date()
            });

            // Créer les mots de passe par défaut pour la migration
            const defaultPasswords = {
              'manager': 'XABCZ',
              'agent': 'demo123'
            };
            
            const hashedPassword = await PasswordUtils.hashPassword(
              defaultPasswords[user.username as keyof typeof defaultPasswords] || 'demo123'
            );
            const passwordRef = doc(collection(db, this.PASSWORDS_COLLECTION));
            batch.set(passwordRef, {
              username: user.username,
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }

          await batch.commit();
          console.log('Migration terminée avec succès');
          
          // Nettoyer localStorage après migration réussie
          localStorage.removeItem('users_data');
          localStorage.removeItem('users_initialized');
        } else {
          console.log('✅ Pas de migration nécessaire');
        }
      } else {
        console.log('✅ Aucune donnée localStorage à migrer');
      }
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
    }
  }

  private static getDefaultUsers(): User[] {
    return [
      {
        id: 'default_super_admin1',
        username: 'super_admin1',
        role: 'super_admin',
        name: 'Super Administrateur',
        email: 'super.admin@company.com',
        isActive: true,
        isHidden: true
      },
      {
        id: 'default_admin2',
        username: 'admin2',
        role: 'admin',
        name: 'Administrateur Principal',
        email: 'admin@company.com',
        isActive: true,
        isHidden: true
      },
      {
        id: 'default_manager',
        username: 'manager',
        role: 'manager',
        name: 'CLEMENT',
        email: 'sophie.martin@company.com',
        isActive: true,
        teamId: 'team1'
      },
      {
        id: 'default_carly',
        username: 'CARLY',
        role: 'manager',
        name: 'CARLY',
        email: 'carly@company.com',
        isActive: true,
        teamId: 'team2'
      },
      {
        id: 'default_agent',
        username: 'agent',
        role: 'agent',
        name: 'Pierre Dubois',
        email: 'pierre.dubois@company.com',
        isActive: true,
        teamId: 'team1'
      }
    ];
  }
}

export const UsersService = FirebaseUsersService;