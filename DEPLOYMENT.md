# Guide de Déploiement - Application Clems

## Configuration Netlify

### 1. Variables d'environnement

Dans l'interface Netlify (Site settings > Environment variables), configurez les variables suivantes :

```
VITE_FIREBASE_API_KEY=votre_clé_api_firebase
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_id_projet
VITE_FIREBASE_STORAGE_BUCKET=votre_projet.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_FIREBASE_MEASUREMENT_ID=votre_measurement_id
```

### 2. Configuration de build

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18

### 3. Déploiement

1. Connectez votre repository GitHub à Netlify
2. Configurez les variables d'environnement
3. Déclenchez un nouveau déploiement

### 4. Vérifications post-déploiement

- [ ] L'application se charge correctement
- [ ] L'authentification Firebase fonctionne
- [ ] Les routes React Router fonctionnent (pas d'erreur 404)
- [ ] Les données Firebase sont accessibles
- [ ] Le mode sombre/clair fonctionne
- [ ] Les permissions utilisateur sont respectées

### 5. Sécurité

Le fichier `netlify.toml` inclut :
- Headers de sécurité (CSP, XSS Protection, etc.)
- Configuration de cache pour les assets
- Redirections SPA pour React Router

### 6. Monitoring

- URL de statut : https://api.netlify.com/api/v1/badges/4810767a-9ab1-4a72-8bd1-56af6906e155/deploy-status
- Dashboard : https://app.netlify.com/projects/clems/deploys

## Troubleshooting

### Erreur 404 sur les routes
- Vérifiez que le fichier `_redirects` est présent dans `public/`
- Vérifiez la configuration `[[redirects]]` dans `netlify.toml`

### Erreur de connexion Firebase
- Vérifiez que toutes les variables d'environnement sont configurées
- Vérifiez que les domaines sont autorisés dans Firebase Console

### Erreur de build
- Vérifiez que la version Node.js est compatible (18+)
- Vérifiez les dépendances dans `package.json`