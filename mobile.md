# Notes techniques — App Mobile Ryzer (Expo)

Ce document résume les bugs d'environnement rencontrés et leurs solutions, pour les futurs agents qui travaillent sur ce projet.

---

## 1. Bug d'URL Expo sur Replit (port proxy fixe)

### Symptôme
Le QR code généré par Metro pointe vers une URL incorrecte, ou l'app ne se connecte pas au bundler après scan.

### Cause
Replit expose un domaine public pour Expo via `$REPLIT_EXPO_DEV_DOMAIN`. Ce domaine est **hardcodé pour proxier le port 22479**. Si Metro tourne sur un autre port, le proxy ne fonctionne pas.

### Solution
- Le workflow "App Mobile" doit impérativement passer `PORT=22479` : `PORT=22479 pnpm --filter @workspace/ryzer-app dev`
- Le script `dev` dans `package.json` set les bonnes variables :
  ```
  EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN
  REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN
  ```
- Le script `scripts/start-dev.sh` lance Metro sur ce port : `pnpm exec expo start . --port $EXPO_PORT`

---

## 2. Erreur "Failed to download remote update"

### Symptôme
Au démarrage dans Expo Go, l'app affiche "Failed to download remote update" et refuse de lancer.

### Cause
Expo Go tente de télécharger une mise à jour OTA depuis les serveurs Expo, ce qui échoue car l'app n'est pas publiée sur EAS.

### Solution
Ajouter dans `app.config.js` :
```js
updates: {
  enabled: false,
},
```

---

## 3. Variable d'environnement Clerk non transmise à Metro

### Symptôme
Clerk affiche une erreur de clé invalide ou `isLoaded` reste `false`.

### Cause
`EXPO_PUBLIC_*` variables sont baked dans le bundle au moment où Metro démarre. Si la variable n'est pas dans l'environnement au moment du lancement, elle sera vide dans le bundle.

### Solution
Le script `dev` substitue la variable au moment du lancement :
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
```
`CLERK_PUBLISHABLE_KEY` est défini dans `[userenv.shared]` dans `.replit` — il est disponible dans l'environnement shell lors du lancement du workflow.

---

## 4. Import Clerk incompatible avec React Compiler (SignInSignalValue)

### Symptôme
Erreurs TypeScript :
```
Property 'setActive' does not exist on type 'SignInSignalValue'
Property 'isLoaded' does not exist on type 'SignInSignalValue'
```

### Cause
`@clerk/expo` v3 avec React Compiler activé expose `useSignIn` / `useSignUp` sous forme de **signals** (nouvelle API). Ces hooks ne retournent pas `{ signIn, setActive, isLoaded }` mais un type signal incompatible.

### Solution
Importer depuis le sous-path **legacy** qui expose l'API traditionnelle :
```ts
// ❌ Ne pas faire
import { useSignIn } from "@clerk/expo";

// ✅ Correct
import { useSignIn } from "@clerk/expo/legacy";
import { useSignUp } from "@clerk/expo/legacy";
```
Le sous-path `@clerk/expo/legacy` re-exporte depuis `@clerk/react/legacy` et retourne bien `{ signIn, setActive, isLoaded }`.

---

## 5. Résumé des variables d'environnement clés

| Variable | Où définie | Rôle |
|---|---|---|
| `CLERK_PUBLISHABLE_KEY` | `.replit` `[userenv.shared]` | Clé publique Clerk, injectée dans le bundle via `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `CLERK_SECRET_KEY` | Secret Replit | Clé secrète Clerk (API server uniquement) |
| `JWT_SECRET` | Secret Replit | Signature JWT admin |
| `ADMIN_PASSWORD` | Secret Replit | Mot de passe admin |

---

## 6. Architecture des écrans auth

- Les écrans `(auth)/sign-in` et `(auth)/sign-up` sont des **modals** (`presentation: "modal"`) définis dans `app/_layout.tsx`
- Le guard `AuthAndSetupGuard` dans `app/(tabs)/_layout.tsx` redirige vers `/(auth)/sign-in` si non connecté, avec un timeout de 6s pour éviter les blocages si Clerk est lent
- Après connexion : `router.replace("/")`
- Après inscription : `router.replace("/(setup)/profile-setup")`
