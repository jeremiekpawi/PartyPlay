# PartyPlay

Plateforme de mini-jeux multijoueurs en temps réel accessible depuis navigateur Web et installable sur Android en tant que Progressive Web App (PWA), avec lobby 3D stylisé et premier mini-jeu **Dessine et Devine**.

## Architecture du MVP (Next.js App Router + Socket.IO)

- **Frontend Next.js (prêt pour Vercel)** : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/postcss`), Three.js + React Three Fiber (`@react-three/fiber` v9, `@react-three/drei` v10), Socket.IO Client, PWA native (`app/manifest.ts` + `public/sw.js`).
- **Backend autoritaire Socket.IO** : Node.js, TypeScript, Socket.IO Server — séparation stricte entre gestion des salles (`server/rooms/roomManager.ts`), moteur autoritaire de mini-jeu (`server/games/drawGuess.ts`) et contrats partagés (`src/shared/`).
- **Double mode d'exécution** :
  1. **Mode unifié (`server.ts`)** : Next.js + Express + Socket.IO sur le même port `3000` (développement local, preview, ou hébergement Node complet).
  2. **Mode Vercel + Serveur Socket.IO dédié (`server/standalone.ts`)** : Frontend Next.js déployé sur **Vercel**, connecté via `NEXT_PUBLIC_SOCKET_URL` au serveur temps réel `server/standalone.ts` hébergé sur Render, Railway ou Fly.io (nécessaire car les Serverless Functions Vercel ne maintiennent pas de WebSockets persistants ni d'état de salle en mémoire).

## Structure des dossiers

```text
partyplay/
├── app/
│   ├── layout.tsx              # Polices Next.js, métadonnées SEO/PWA & viewport
│   ├── globals.css             # Tailwind CSS v4 + tokens typographiques
│   ├── manifest.ts             # Web App Manifest natif Next.js
│   ├── page.tsx                # Point d'entrée de l'application client
│   └── api/health/route.ts     # Endpoint de santé Vercel
├── public/
│   ├── sw.js                   # Service Worker PWA (cache statique, réseau-only /socket.io)
│   ├── images/                 # Aperçus optimisés lobby 3D & Dessine et Devine
│   └── *.png / icon.svg        # Icônes PWA (192x192, 512x512, maskable, apple-touch-icon)
├── server.ts                   # Serveur unifié Next.js + Express + Socket.IO (port 3000)
├── next.config.ts              # Configuration Next.js (transpilePackages three, headers SW)
├── vercel.json                 # Configuration Vercel (headers Service Worker)
├── src/
│   ├── App.tsx                 # Routeur client, session Socket.IO et cycle de jeu
│   ├── i18n/                   # Dictionnaires de traduction (fr par défaut)
│   ├── components/             # Composants UI réutilisables (TopBar, PWA)
│   ├── features/
│   │   ├── home/               # Page d'accueil et présentation du MVP
│   │   ├── identity/           # Pseudo, avatar, couleur (mode invité)
│   │   ├── room/               # Création, code d'invitation, lobby temps réel
│   │   ├── lobby3d/            # Scène Three.js / R3F + mode performance réduite
│   │   └── draw-guess/         # Canvas de dessin, chat de propositions, scores
│   ├── services/
│   │   └── socket.ts           # Client Socket.IO (same-origin ou NEXT_PUBLIC_SOCKET_URL)
│   └── shared/                 # Contrats partagés Frontend / Backend
│       ├── events.ts           # Schémas Zod et événements Socket.IO
│       ├── types.ts            # Modèles Room, Player, Stroke, GameState
│       └── constants.ts        # Limites (2-6 joueurs, timers, seuils)
└── server/
    ├── index.ts                # Configuration Socket.IO, CORS, rate limiting, validation
    ├── standalone.ts           # Serveur Socket.IO autonome pour accompagnement Vercel
    ├── rooms/                  # Gestion du cycle de vie des salles & reconnexion
    └── games/                  # Moteur autoritaire Dessine et Devine + dictionnaire FR
```

## Lancement local (mode unifié)

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env

# 3. Lancer Next.js + Socket.IO en développement (port 3000)
npm run dev

# 4. Vérification TypeScript et build Next.js de production
npm run lint
npm run build
npm run start
```

## Déploiement sur Vercel + Socket.IO

1. **Déployer le backend temps réel** (`npm run start:socket` via Node 22+ sur Render, Railway ou Fly.io) avec `ALLOWED_ORIGIN=https://votre-app.vercel.app`.
2. **Déployer le frontend Next.js sur Vercel** en configurant la variable d'environnement `NEXT_PUBLIC_SOCKET_URL=https://votre-serveur-socket.onrender.com`.
3. Vercel détecte automatiquement Next.js (`next build`) et sert le manifeste PWA (`/manifest.webmanifest`) ainsi que `/sw.js`.
