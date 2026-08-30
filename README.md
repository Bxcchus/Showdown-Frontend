# Pinkward Web

Interface web SSR de Showdown V2. Le dépôt contient l'expérience joueur,
l'authentification OAuth 2.1/PKCE via routes de session serveur, l'i18n FR/EN,
les parcours 1v1/5v5, le Watcher, l'historique, le classement et les pages
légales.

## Vérification locale

~~~powershell
npm ci
npm audit --audit-level=high
npm run lint
npm test
npm run build
npm run test:e2e
~~~

Le Watcher Windows n'est volontairement pas distribué depuis `public/` tant
que son exécutable n'est pas signé.

Après création du dépôt distant et premier push sur `main`, rendre la CI
obligatoire avec :

~~~powershell
.\scripts\configure-branch-protection.ps1 -Repository organisation/pinkward-web
~~~
