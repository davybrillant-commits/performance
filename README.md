# Dashboard Télévendeurs - Sécurité

## Configuration de sécurité Firestore

### Règles de sécurité implémentées

1. **Authentification obligatoire** : Tous les accès nécessitent une authentification
2. **Contrôle d'accès basé sur les rôles** (RBAC)
3. **Sessions sécurisées** avec expiration automatique
4. **Isolation des données sensibles** (mots de passe dans une collection séparée)

### Rôles et permissions

- **Super Admin** : Accès complet à toutes les fonctionnalités
- **Admin** : Gestion des utilisateurs (sauf super_admin), télévendeurs, équipes
- **Manager** : Gestion des télévendeurs, lecture des utilisateurs
- **Agent** : Lecture seule des télévendeurs de son équipe

### Sécurité des sessions

- **SessionStorage** utilisé au lieu de localStorage
- **Expiration automatique** après 8 heures d'inactivité
- **Token de session unique** généré à chaque connexion
- **Nettoyage automatique** à la fermeture de l'onglet

### Déploiement des règles Firestore

1. Installez Firebase CLI : `npm install -g firebase-tools`
2. Connectez-vous : `firebase login`
3. Initialisez le projet : `firebase init firestore`
4. Déployez les règles : `firebase deploy --only firestore:rules`

### Comptes de démonstration

- **Super Admin** : `super_admin1` / ``
- **Admin** : `admin2` / ``
- **Manager** : `manager` / ``
- **Agent** : `agent` / `demo123`

### Bonnes pratiques de sécurité

1. **Changez les mots de passe par défaut** en production
2. **Activez l'authentification à deux facteurs** sur Firebase
3. **Surveillez les logs d'accès** régulièrement
4. **Mettez à jour les dépendances** fréquemment
5. **Utilisez HTTPS** en production (automatique avec Netlify)

### Tests de sécurité

- Testez la déconnexion automatique après fermeture d'onglet
- Vérifiez que les sessions expirent après 8 heures
- Confirmez que les rôles limitent correctement l'accès aux fonctionnalités
- Assurez-vous qu'aucune donnée sensible n'est exposée côté client
