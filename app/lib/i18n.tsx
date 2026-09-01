"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { intlLocale, type Language } from "./i18n-shared";

export type { Language } from "./i18n-shared";

export const englishTranslations: Readonly<Record<string, string>> = {
  "Accueil · GYMS.LOL": "Home · GYMS.LOL",
  "Jouer · GYMS.LOL": "Play · GYMS.LOL",
  "Recherche · GYMS.LOL": "Searching · GYMS.LOL",
  "Confirmation · GYMS.LOL": "Ready check · GYMS.LOL",
  "Lobby du match · GYMS.LOL": "Match lobby · GYMS.LOL",
  "Watcher · GYMS.LOL": "Watcher · GYMS.LOL",
  "Historique · GYMS.LOL": "Match history · GYMS.LOL",
  "Classement · GYMS.LOL": "Leaderboard · GYMS.LOL",
  "Profil · GYMS.LOL": "Profile · GYMS.LOL",
  "Téléchargement · GYMS.LOL": "Download · GYMS.LOL",
  "Paramètres · GYMS.LOL": "Settings · GYMS.LOL",
  "Mentions légales · GYMS.LOL": "Legal notice · GYMS.LOL",
  "Confidentialité · GYMS.LOL": "Privacy · GYMS.LOL",
  "Conditions d’utilisation · GYMS.LOL": "Terms of use · GYMS.LOL",
  "Page introuvable · GYMS.LOL": "Page not found · GYMS.LOL",
  Accueil: "Home",
  Jouer: "Play",
  Recherche: "Searching",
  Confirmation: "Ready check",
  "Lobby du match": "Match lobby",
  Historique: "Match history",
  Classement: "Leaderboard",
  Téléchargement: "Download",
  Profil: "Profile",
  Paramètres: "Settings",
  ACCUEIL: "HOME",
  JOUER: "PLAY",
  HISTORIQUE: "MATCH HISTORY",
  CLASSEMENT: "LEADERBOARD",
  PROFIL: "PROFILE",
  TÉLÉCHARGER: "DOWNLOAD",
  PARAMÈTRES: "SETTINGS",
  "SE CONNECTER": "SIGN IN",
  "CHOISIR UN PSEUDO": "CHOOSE A NICKNAME",
  DÉCONNEXION: "SIGN OUT",
  "API PRÊTE": "API READY",
  RÉESSAYER: "RETRY",
  "EN LIGNE": "ONLINE",
  "HORS LIGNE": "OFFLINE",
  "VÉRIFICATION…": "CHECKING…",
  "ALLER AU CONTENU": "SKIP TO CONTENT",
  "PARTIE RAPIDE": "QUICK PLAY",
  "Mode de partie rapide": "Quick play mode",
  "JOUER MAINTENANT": "PLAY NOW",
  "RECHERCHE…": "SEARCHING…",
  "ABÎME HURLANT": "HOWLING ABYSS",
  "SHOWDOWN CLASSÉ": "RANKED SHOWDOWN",
  "FAILLE DE L'INVOCATEUR": "SUMMONER'S RIFT",
  "TON GROUPE": "YOUR PARTY",
  "Aucun groupe": "No party",
  "Crée un groupe pour inviter des coéquipiers.":
    "Create a party to invite teammates.",
  "Connecte-toi pour afficher ton groupe.": "Sign in to view your party.",
  "CRÉER UN GROUPE": "CREATE PARTY",
  "GÉRER LE GROUPE": "MANAGE PARTY",
  "CLASSEMENT ACTUEL": "CURRENT RANK",
  "Classement actuel": "Current rank",
  "Classement 5v5": "5v5 rank",
  "Classement 1v1": "1v1 rank",
  "CLASSÉ 5V5": "RANKED 5V5",
  "DUEL CLASSÉ 1V1": "RANKED 1V1 DUEL",
  "CLASSEMENT ACTIF": "ACTIVE LADDER",
  "SERVICES EN LIGNE": "SERVICES ONLINE",
  "CONNEXION…": "CONNECTING…",
  "VOIR LE CLASSEMENT": "VIEW LEADERBOARD",
  VICTOIRES: "WINS",
  VICTOIRE: "VICTORY",
  DÉFAITE: "DEFEAT",
  DÉFAITES: "LOSSES",
  "ACTIVITÉ RÉCENTE": "RECENT ACTIVITY",
  "TOUT VOIR →": "VIEW ALL →",
  "Aucun match enregistré": "No matches recorded",
  "Lance une recherche pour commencer ton historique.":
    "Start matchmaking to begin your match history.",
  "TROUVER UN MATCH": "FIND A MATCH",
  "ÉTAT EN DIRECT": "LIVE STATUS",
  "LOBBY PRÊT": "LOBBY READY",
  CONFIRMATION: "READY CHECK",
  "RECHERCHE EN COURS": "SEARCHING",
  "HORS FILE": "NOT IN QUEUE",
  "Choisis un mode pour commencer.": "Choose a mode to begin.",
  "OUVRIR LE MATCH": "OPEN MATCH",
  "FILE COMPÉTITIVE": "COMPETITIVE QUEUE",
  "Ton rôle principal reste prioritaire avant l’élargissement de la recherche.":
    "Your primary role stays prioritized until matchmaking expands.",
  "Un duel vérifié décidé au premier sang, aux 100 CS ou à la première tourelle.":
    "A verified duel decided by first blood, 100 CS or first turret.",
  RÉGION: "REGION",
  "MODE DE TEST": "TEST MODE",
  "BOT APRÈS 5 S": "BOT AFTER 5 S",
  "BOT LOCAL SI ACTIVÉ": "LOCAL BOT WHEN ENABLED",
  SOLO: "SOLO",
  GROUPE: "PARTY",
  PRÊTS: "READY",
  "CONDITIONS DE VICTOIRE": "VICTORY CONDITIONS",
  "PREMIER OBJECTIF GAGNANT": "FIRST OBJECTIVE WINS",
  "PREMIER SANG": "FIRST BLOOD",
  "Obtenir la première élimination.": "Secure the first champion kill.",
  "100 CS EN PREMIER": "FIRST TO 100 CS",
  "Atteindre cent sbires en premier.": "Reach one hundred minions first.",
  "PREMIÈRE TOURELLE": "FIRST TURRET",
  "Détruire la première tourelle ennemie.": "Destroy the first enemy turret.",
  "SE CONNECTER POUR JOUER": "SIGN IN TO PLAY",
  "LIER TON RIOT ID": "LINK YOUR RIOT ID",
  "Paramètres de la file": "Queue settings",
  PRINCIPAL: "PRIMARY",
  AVANT: "BEFORE",
  ANNULER: "CANCEL",
  "Crée un groupe pour inviter des joueurs et lancer une recherche commune.":
    "Create a party to invite players and queue together.",
  "FORME RÉCENTE": "RECENT FORM",
  "AUCUN MATCH": "NO MATCHES",
  "NON CLASSÉ": "UNRANKED",
  "RÔLE PRINCIPAL": "PRIMARY ROLE",
  "RÔLE SECONDAIRE": "SECONDARY ROLE",
  "RECHERCHE DE MATCH": "MATCHMAKING",
  "RECHERCHE EN COURS…": "SEARCHING…",
  "ANNULER LA RECHERCHE": "CANCEL SEARCH",
  "La recherche continue même si tu changes de page.":
    "Matchmaking continues while you browse other pages.",
  "MATCH TROUVÉ": "MATCH FOUND",
  "Ton match est prêt. Confirme avant la fin du compte à rebours.":
    "Your match is ready. Confirm before the countdown ends.",
  ACCEPTER: "ACCEPT",
  REFUSER: "DECLINE",
  "JOUEURS PRÊTS": "PLAYERS READY",
  "MATCH CONFIRMÉ": "MATCH CONFIRMED",
  CONFIRMÉ: "CONFIRMED",
  REFUSÉ: "DECLINED",
  "Équipes et rôles attribués": "Assigned teams and roles",
  "Le résultat est envoyé automatiquement par le Watcher après le premier sang, 100 CS ou la première tourelle.":
    "The Watcher automatically submits the result after first blood, 100 CS or first turret.",
  "Le Watcher vérifie les joueurs, suit le lancement et transmet le résultat final du match 5v5.":
    "The Watcher verifies the players, follows game launch and submits the final 5v5 result.",
  "ÉQUIPE BLEUE": "BLUE TEAM",
  "ÉQUIPE ROUGE": "RED TEAM",
  "NOM DU LOBBY": "LOBBY NAME",
  "MOT DE PASSE": "PASSWORD",
  "OUVRIR LEAGUE": "OPEN LEAGUE",
  "CENTRE DE CONTRÔLE DU WATCHER": "WATCHER CONTROL CENTER",
  "PROCESSUS WATCHER": "WATCHER PROCESS",
  "Connexion locale, identité Riot et sécurité du compagnon Windows.":
    "Local connection, Riot identity and Windows companion security.",
  "ACTUALISER L’ÉTAT": "REFRESH STATUS",
  "WATCHER LOCAL": "LOCAL WATCHER",
  "COMPTE SHOWDOWN": "SHOWDOWN ACCOUNT",
  "MODE DU WATCHER": "WATCHER MODE",
  "LOCAL UNIQUEMENT": "LOCAL ONLY",
  "VÉRIFICATION DE LA CONNEXION": "CONNECTION CHECK",
  "PRÊT À SURVEILLER ?": "READY TO WATCH?",
  "Session Showdown": "Showdown session",
  "Compte authentifié et prêt.": "Account authenticated and ready.",
  "Détecté sur cet ordinateur.": "Detected on this computer.",
  "Actualiser le Riot ID": "Refresh Riot ID",
  "Vérifier à nouveau": "Check again",
  "ACTIVITÉ DU WATCHER": "WATCHER ACTIVITY",
  PROCESSUS: "PROCESS",
  ÉTAT: "STATE",
  DÉTAIL: "DETAIL",
  "DERNIER OBJECTIF": "LAST OBJECTIVE",
  "DERNIER RÉSULTAT": "LAST OUTCOME",
  "OBJECTIFS 1V1 SURVEILLÉS": "MONITORED 1V1 OBJECTIVES",
  "ÉTAT DU MATCH": "MATCH STATUS",
  "SUIVI 5V5": "5V5 MONITORING",
  "JOUEURS VÉRIFIÉS": "PLAYERS VERIFIED",
  "LANCEMENT SUIVI": "LAUNCH MONITORED",
  "RÉSULTAT TRANSMIS": "RESULT SUBMITTED",
  "Connecte le client League et vérifie automatiquement les objectifs des duels 1v1.":
    "Connect the League Client and automatically verify 1v1 objectives.",
  "Connecte le client League, vérifie les duels 1v1 et accompagne les matchs 5v5.":
    "Connect the League Client, verify 1v1 duels and support 5v5 matches.",
  "Connecte-toi pour charger tes parties compétitives.":
    "Sign in to load your competitive matches.",
  "BIENVENUE SUR GYMS.LOL": "WELCOME TO GYMS.LOL",
  "CHOISIS TON PSEUDO": "CHOOSE YOUR NICKNAME",
  "Ce nom sera visible par les autres joueurs dans les groupes, les matchs et le classement.":
    "This name will be visible to other players in parties, matches and the leaderboard.",
  "Ton adresse e-mail reste privée et ne sera jamais utilisée comme pseudo public.":
    "Your email address stays private and will never be used as your public nickname.",
  "PSEUDO PUBLIC": "PUBLIC NICKNAME",
  "3 à 24 caractères · lettres, chiffres, espaces, _ . -":
    "3 to 24 characters · letters, numbers, spaces, _ . -",
  "Ex. JungleDiff": "E.g. JungleDiff",
  CONTINUER: "CONTINUE",
  "Aucun match trouvé": "No matches found",
  "Mode de l’historique": "Match history mode",
  "Classé 5v5 · TrueSkill": "Ranked 5v5 · TrueSkill",
  GAIN: "GAIN",
  PERTE: "LOSS",
  "Filtres de l’historique": "Match history filters",
  TOUTES: "ALL",
  "Modifie le filtre ou termine un nouveau match classé.":
    "Change the filter or finish a new ranked match.",
  TOUS: "ALL",
  RÉSULTAT: "RESULT",
  MODE: "MODE",
  RÔLE: "ROLE",
  DATE: "DATE",
  COÉQUIPIERS: "TEAMMATES",
  ADVERSAIRES: "OPPONENTS",
  "DÉTAIL DU MATCH": "MATCH DETAILS",
  "RETOUR À L’HISTORIQUE": "BACK TO MATCH HISTORY",
  "Ton identité Showdown et tes classements de la saison en cours.":
    "Your Showdown identity and current-season ratings.",
  "Icône du profil Riot": "Riot profile icon",
  "Profil réservé aux membres": "Profile available to members",
  "Connecte-toi pour retrouver tes duels, tes équipes et ton évolution MMR.":
    "Sign in to view your duels, teams and MMR progression.",
  "COMPTE ET IDENTITÉ": "ACCOUNT AND IDENTITY",
  "NOM D’AFFICHAGE": "DISPLAY NAME",
  "ENREGISTRER LE PROFIL": "SAVE PROFILE",
  "LIER DEPUIS LE WATCHER": "LINK FROM WATCHER",
  "Aucun match récent": "No recent matches",
  "Tes cinq derniers résultats apparaîtront ici.":
    "Your five latest results will appear here.",
  "RÉSUMÉ RÉCENT": "RECENT SUMMARY",
  "TA POSITION": "YOUR POSITION",
  "ÉVALUATION ACTUELLE": "CURRENT RATING",
  "BILAN DE SAISON": "SEASON RECORD",
  SAISON: "SEASON",
  PLACEMENTS: "PLACEMENTS",
  "RÉINITIALISATION PARTIELLE :": "PARTIAL RESET:",
  "% CONSERVÉS": "% RETAINED",
  "JOUEURS CLASSÉS ·": "RANKED PLAYERS ·",
  ACTUEL: "CURRENT",
  "TAUX DE VICTOIRE": "WIN RATE",
  "JOUEURS CLASSÉS": "RANKED PLAYERS",
  "Aucun joueur classé": "No ranked players",
  "Type de classement": "Leaderboard category",
  "Classement régional": "Regional leaderboard",
  "Le classement se remplira dès que des matchs classés seront terminés.":
    "The leaderboard will populate after ranked matches are completed.",
  "Classement réservé aux membres": "Leaderboard available to members",
  "Connecte-toi pour charger le classement régional en direct.":
    "Sign in to load the live regional leaderboard.",
  JOUEUR: "PLAYER",
  BILAN: "RECORD",
  "AGENT WINDOWS": "WINDOWS AGENT",
  "APPLICATION WINDOWS": "WINDOWS APPLICATION",
  "APPLICATION LOCALE": "LOCAL APPLICATION",
  "Connecte GYMS.LOL à League et valide automatiquement chaque duel.":
    "Connect GYMS.LOL to League and automatically verify every duel.",
  "DERNIÈRE VERSION": "LATEST RELEASE",
  "Exécutable portable": "Portable executable",
  "TÉLÉCHARGER POUR WINDOWS": "DOWNLOAD FOR WINDOWS",
  "BIENTÔT DISPONIBLE": "COMING SOON",
  "DISTRIBUTION EN PRÉPARATION • SIGNATURE WINDOWS REQUISE":
    "RELEASE IN PREPARATION • WINDOWS SIGNATURE REQUIRED",
  "L’exécutable public sera signé et publié avec son empreinte":
    "The public executable will be signed and published with its checksum",
  "Aucun exécutable non signé n’est distribué depuis le site.":
    "No unsigned executable is distributed from this site.",
  "CONCEPTION LOCALE": "LOCAL BY DESIGN",
  "CONNECTÉ À LEAGUE": "LEAGUE CONNECTED",
  "FAIR-PLAY AVANT TOUT": "FAIR PLAY FIRST",
  "INSTALLATION RAPIDE": "QUICK INSTALL",
  "Aucune lecture mémoire et aucune injection de code. Seules les interfaces locales officielles du jeu sont observées.":
    "No memory reading and no code injection. Only the game's official local interfaces are observed.",
  "PRÊT EN TROIS ÉTAPES": "READY IN THREE STEPS",
  "TÉLÉCHARGER LE WATCHER": "DOWNLOAD THE WATCHER",
  "LANCER LE WATCHER": "RUN THE WATCHER",
  "PARAMÈTRES DU WATCHER": "WATCHER SETTINGS",
  "Télécharge puis lance le Watcher Windows.":
    "Download and run the Windows Watcher.",
  "Connecte-toi à ton compte web.": "Sign in to your web account.",
  "Ouvre League puis lie ton identité.":
    "Open League, then link your identity.",
  ACTUALISER: "REFRESH",
  "ACTUALISER LE RIOT ID": "REFRESH RIOT ID",
  "ACTUALISER LE WATCHER": "REFRESH WATCHER",
  "ADRESSE LOCALE": "LOCAL ENDPOINT",
  "Action requise": "Action required",
  "Aperçu de la connexion du Watcher": "Watcher connection preview",
  "CLIENT LEAGUE": "LEAGUE CLIENT",
  COMPTE: "ACCOUNT",
  "CONFIGURER LE WATCHER": "SET UP WATCHER",
  CONNECTÉ: "CONNECTED",
  "Connecte-toi au client League.": "Sign in to the League Client.",
  "Connecte-toi pour afficher ton profil": "Sign in to view your profile",
  "DUEL ACTIF": "ACTIVE DUEL",
  "Duel classé · Glicko-2": "Ranked duel · Glicko-2",
  "Duel surveillé": "Monitored duel",
  "EN ATTENTE": "WAITING",
  "EN ATTENTE DE RÉSULTATS": "WAITING FOR RESULTS",
  "EN DIRECT": "LIVE",
  "Enregistre l’exécutable Windows.": "Save the Windows executable.",
  "Prêt à recevoir un duel GYMS.LOL.": "Ready to receive a GYMS.LOL duel.",
  "FILE ACTIVE": "QUEUE ACTIVE",
  "GROUPE NON PRÊT": "PARTY NOT READY",
  "Garde-le ouvert pendant tes matchs GYMS.LOL.":
    "Keep it open during your GYMS.LOL matches.",
  "LIER LE RIOT ID": "LINK RIOT ID",
  "LOBBY DU MATCH": "MATCH LOBBY",
  "LOCAL PAR CONCEPTION": "LOCAL BY DESIGN",
  "La recherche continue lorsque tu navigues sur le site.":
    "Matchmaking continues while you browse the site.",
  "Lance le Watcher pour connecter le client League.":
    "Run the Watcher to connect the League Client.",
  "Le KDA et les objets apparaîtront lorsque le watcher ou Riot fournira ces données.":
    "KDA and items will appear when the Watcher or Riot provides this data.",
  "Le Watcher attend un duel à vérifier.":
    "The Watcher is waiting for a duel to verify.",
  "Le Watcher consulte uniquement les interfaces locales officielles du client League et de Live Client Data. Il ne lit pas la mémoire du jeu et n’injecte aucun code.":
    "The Watcher only uses the official local League Client and Live Client Data interfaces. It does not read game memory or inject code.",
  "Le Watcher prépare la partie League.":
    "The Watcher is preparing the League game.",
  "Le dernier contrôle du Watcher a échoué.":
    "The latest Watcher check failed.",
  "Le watcher ne trouve pas le client League.":
    "The Watcher cannot find the League Client.",
  "Les objectifs du duel sont surveillés en temps réel.":
    "Duel objectives are monitored in real time.",
  "Lie d’abord ton Riot ID via le watcher.":
    "Link your Riot ID through the Watcher first.",
  "Lobby League prêt": "League lobby ready",
  "L’application écoute uniquement sur ton ordinateur. Aucun port public et aucun accès permanent au compte.":
    "The application only listens on your computer. No public port and no permanent account access.",
  MATCHS: "MATCHES",
  AUCUN: "NONE",
  PAGE: "PAGE",
  NIVEAU: "LEVEL",
  ÉVALUATION: "RATING",
  ÉQUIPE: "TEAM",
  INVITATIONS: "INVITATIONS",
  INVITER: "INVITE",
  "MEILLEUR MMR": "PEAK MMR",
  "Matchs 5v5 compétitifs et duels 1v1 vérifiés.":
    "Competitive 5v5 matches and verified 1v1 duels.",
  "Mode de jeu": "Game mode",
  "NIVEAU ACTUEL": "CURRENT LEVEL",
  "NON CONNECTÉ": "SIGNED OUT",
  "NON LIÉ": "NOT LINKED",
  "ORDRE DES RÔLES": "ROLE ORDER",
  "OUVRIR LE WATCHER": "OPEN WATCHER",
  "PARCOURS COMPÉTITIF": "COMPETITIVE FLOW",
  "PAS PRÊT": "NOT READY",
  "PASSERELLE LEAGUE LOCALE": "LOCAL LEAGUE BRIDGE",
  "Partie personnalisée 1v1": "Custom 1v1 game",
  "Partie personnalisée 5v5": "Custom 5v5 game",
  "Passerelle locale entre GYMS.LOL Web et le client League pour vérifier les duels 1v1.":
    "Local bridge between GYMS.LOL Web and the League Client for verifying 1v1 duels.",
  "PROFIL JOUEUR": "PLAYER PROFILE",
  "ENREGISTREMENT…": "SAVING…",
  PRÉCÉDENT: "PREVIOUS",
  PSEUDO: "DISPLAY NAME",
  "Pseudo Showdown": "Showdown name",
  "Pseudo du joueur": "Player name",
  "QUITTER LE GROUPE": "LEAVE PARTY",
  RECHERCHE: "SEARCHING",
  "RECHERCHE D’UN MATCH": "SEARCHING FOR A MATCH",
  "Recherche en solo": "Solo queue",
  "Reste sur GYMS.LOL pendant la recherche de joueurs.":
    "Stay on GYMS.LOL while searching for players.",
  "RÉSULTAT MMR": "MMR RESULT",
  "Résultat détecté": "Result detected",
  "Rôle attribué": "Assigned role",
  Objectif: "Objective",
  victoire: "victory",
  défaite: "defeat",
  "SAISON ACTIVE": "SEASON ACTIVE",
  "SAISON EN COURS": "CURRENT SEASON",
  "SE CONNECTER POUR LES DONNÉES EN DIRECT": "SIGN IN FOR LIVE DATA",
  SECONDAIRE: "SECONDARY",
  "SESSION SHOWDOWN": "SHOWDOWN SESSION",
  "SUIVI EN DIRECT": "LIVE MONITOR",
  SUIVANT: "NEXT",
  "Showdown Watcher accompagne le client League, prépare le lobby du duel et transmet les objectifs à GYMS.LOL en temps réel.":
    "Showdown Watcher runs alongside the League Client, prepares the duel lobby and reports objectives to GYMS.LOL in real time.",
  "Synchronisation de la file…": "Synchronizing queue…",
  "TES DUELS.": "YOUR DUELS.",
  TOI: "YOU",
  PLUS: "MORE",
  "Ton historique t’attend": "Your match history is waiting",
  "Ton pseudo, ton Riot ID et tes classements resteront associés à ton compte.":
    "Your display name, Riot ID and ratings will remain linked to your account.",
  "Utilise les API locales du client League et de Live Client Data pour suivre le lobby et la partie.":
    "Uses the local League Client and Live Client Data APIs to follow the lobby and game.",
  "VÉRIFIER À NOUVEAU": "CHECK AGAIN",
  "VÉRIFIÉS LOCALEMENT.": "VERIFIED LOCALLY.",
  "WATCHER EN LIGNE": "WATCHER ONLINE",
  "ÉTAT DU CLASSEMENT": "LEADERBOARD STATUS",
  "ÉTAT DU DUEL": "DUEL STATUS",
  "État du duel League": "League duel status",
  "Hors ligne": "Offline",
  Prêt: "Ready",
  "0 partie": "0 matches",
  CLASSÉ: "RANKED",
  écoulé: "elapsed",
  "Action impossible.": "Action unavailable.",
  "Action refusée.": "Action denied.",
  "Ce joueur n’a pas encore lié son Riot ID.":
    "This player has not linked their Riot ID yet.",
  "Cette action n’est pas autorisée pour ton compte.":
    "This action is not allowed for your account.",
  "Connexion impossible.": "Unable to connect.",
  "Connexion impossible. Vérifie que le backend local et Docker sont démarrés.":
    "Unable to connect. Check that the local backend and Docker are running.",
  "Création refusée.": "Creation denied.",
  "Détail indisponible.": "Details unavailable.",
  "Historique indisponible.": "Match history unavailable.",
  "ACTUALISATION DE L’HISTORIQUE…": "UPDATING MATCH HISTORY…",
  "Impossible de créer le groupe.": "Unable to create the party.",
  "Impossible de lancer le watcher.": "Unable to start the Watcher.",
  "Impossible de lier le Riot ID.": "Unable to link the Riot ID.",
  "Impossible de modifier le profil.": "Unable to update the profile.",
  "Impossible de quitter la file.": "Unable to leave the queue.",
  "Impossible de quitter le groupe.": "Unable to leave the party.",
  "Impossible de rejoindre la file.": "Unable to join the queue.",
  "Impossible de retirer ce joueur.": "Unable to remove this player.",
  "Invitation impossible.": "Unable to send the invitation.",
  "Invitation refusée.": "Invitation denied.",
  "Jeton watcher refusé.": "Watcher token denied.",
  "Joueur Showdown introuvable.": "Showdown player not found.",
  "Lance Showdown Watcher pour créer automatiquement le lobby League.":
    "Run Showdown Watcher to automatically create the League lobby.",
  "Le backend ne répond pas.": "The backend is not responding.",
  "Le match du duel n’est pas prêt.": "The duel match is not ready.",
  "Le watcher local ne répond pas.": "The local Watcher is not responding.",
  "Liaison Riot refusée.": "Riot linking denied.",
  "Profil refusé.": "Profile update denied.",
  "Recherche du groupe refusée.": "Party matchmaking denied.",
  "Quitte le groupe pour lancer une recherche 1v1.":
    "Leave the party before starting 1v1 matchmaking.",
  "Seul le chef du groupe peut lancer la recherche.":
    "Only the party leader can start matchmaking.",
  "Réponse au ready-check refusée.": "Ready-check response denied.",
  "Réponse impossible.": "Unable to respond.",
  "Réponse à l’invitation refusée.": "Invitation response denied.",
  "Statut impossible.": "Unable to update status.",
  "Statut refusé.": "Status update denied.",
  "Classement indisponible.": "Leaderboard unavailable.",
  "Chargement du classement": "Loading leaderboard",
  "Classement indisponible": "Leaderboard unavailable",
  "Réessaie dans quelques instants.": "Try again in a moment.",
  "Ta session a expiré. Reconnecte-toi pour continuer.":
    "Your session has expired. Sign in again to continue.",
  "Tous les membres du groupe doivent être prêts.":
    "All party members must be ready.",
  "Trop de demandes ont été envoyées. GYMS.LOL réessaiera automatiquement dans quelques secondes.":
    "Too many requests were sent. GYMS.LOL will retry automatically in a few seconds.",
  "Navigation principale": "Main navigation",
  "Navigation mobile": "Mobile navigation",
  "Navigation supplémentaire": "Additional navigation",
  "Menu mobile": "Mobile menu",
  FERMER: "CLOSE",
  "Fermer le menu": "Close menu",
  "Raccourcis de jeu": "Game shortcuts",
  "Pseudo du joueur à inviter": "Player name to invite",
  "Recherche d’un match en cours": "Match search in progress",
  Victoire: "Victory",
  Défaite: "Defeat",
  du: "on",
  "COMPTE CONNECTÉ": "SIGNED-IN ACCOUNT",
  SESSION: "SESSION",
  "DÉCONNEXION…": "SIGNING OUT…",
  "Langue / Language": "Language",
  "Fermer l’erreur": "Dismiss error",
  "Fermer la confirmation": "Dismiss confirmation",
  "Connexion au temps réel…": "Connecting to live updates…",
  "Temps réel interrompu. Reconnexion en cours…":
    "Live updates interrupted. Reconnecting…",
  "Temps réel indisponible. Actualisation en mode dégradé.":
    "Live updates unavailable. Using fallback refreshes.",
  "MODE DÉGRADÉ": "FALLBACK MODE",
  "TEMPS RÉEL": "LIVE",
  "RECONNEXION…": "RECONNECTING…",
  "PRÉPARATION DE TA SESSION": "PREPARING YOUR SESSION",
  "Connexion sécurisée et synchronisation des données en cours…":
    "Secure sign-in and data synchronization in progress…",
  "DÉLAI EXPIRÉ": "TIME EXPIRED",
  "TU AS ACCEPTÉ": "YOU ACCEPTED",
  "MATCH REFUSÉ": "MATCH DECLINED",
  "En attente des autres joueurs.": "Waiting for the other players.",
  "Synchronisation avec le serveur…": "Synchronizing with the server…",
  "Retourne à la sélection du mode.": "Return to game mode selection.",
  "RETOUR À JOUER": "BACK TO PLAY",
  "ENVOI…": "SENDING…",
  "1V1 EN SOLO UNIQUEMENT": "1V1 SOLO ONLY",
  "EN ATTENTE DU CHEF": "WAITING FOR PARTY LEADER",
  CHEF: "LEADER",
  RETIRER: "REMOVE",
  "INVITATIONS EN ATTENTE": "PENDING INVITATIONS",
  "Seul le chef du groupe peut inviter et lancer la recherche.":
    "Only the party leader can invite players and start matchmaking.",
  "Recherche lancée.": "Matchmaking started.",
  "Recherche annulée.": "Matchmaking cancelled.",
  "Match accepté.": "Match accepted.",
  "Match refusé.": "Match declined.",
  "Profil enregistré.": "Profile saved.",
  "Riot ID lié au profil.": "Riot ID linked to your profile.",
  "Groupe créé.": "Party created.",
  "Invitation envoyée.": "Invitation sent.",
  "Tu es prêt.": "You are ready.",
  "Tu n’es plus prêt.": "You are no longer ready.",
  "Groupe quitté.": "Party left.",
  "Invitation acceptée.": "Invitation accepted.",
  "Invitation déclinée.": "Invitation declined.",
  "Joueur retiré du groupe.": "Player removed from the party.",
  "La session locale a été supprimée, mais sa révocation distante a échoué.":
    "The local session was cleared, but remote revocation failed.",
  "Rafraîchissement impossible.": "Unable to refresh the session.",
  "Requête incomplète.": "Incomplete request.",
  "Redirection refusée.": "Redirect denied.",
  "Origine refusée.": "Origin denied.",
  "Backend non configuré.": "Backend not configured.",
  "Échange OAuth2 refusé.": "OAuth2 exchange denied.",
  "Révocation OAuth2 refusée.": "OAuth2 revocation denied.",
  "Le domaine HTTPS de l’API GYMS.LOL doit être configuré avant la connexion publique.":
    "The GYMS.LOL API HTTPS domain must be configured before public sign-in.",
  "Jeton d’accès invalide.": "Invalid access token.",
  "Joueur GYMS.LOL": "GYMS.LOL player",
  "Portée OAuth2 incomplète.": "Incomplete OAuth2 scope.",
  "Connexion refusée": "Sign-in denied",
  "Réponse OAuth2 incomplète.": "Incomplete OAuth2 response.",
  "État OAuth2 invalide.": "Invalid OAuth2 state.",
  "Échange du code OAuth2 refusé.": "OAuth2 code exchange denied.",
  "Connexion requise.": "Sign-in required.",
  "Session locale du Watcher refusée.": "Local Watcher session denied.",
  "Session locale du Watcher invalide.": "Invalid local Watcher session.",
  "Session absente.": "No session found.",
  "Route publique inexistante.": "Public route not found.",
  "> Prêt à recevoir un duel GYMS.LOL.": "> Ready to receive a GYMS.LOL duel.",
  PRÊT: "READY",
  "ERREUR 404": "ERROR 404",
  "PAGE INTROUVABLE": "PAGE NOT FOUND",
  "Cette page n’existe pas ou a été déplacée. Reviens à l’accueil ou ouvre directement la file compétitive.":
    "This page does not exist or has moved. Return home or open the competitive queue.",
  "RETOUR À L’ACCUEIL": "BACK HOME",
};

type DynamicTranslation = readonly [
  pattern: RegExp,
  translate: (match: RegExpMatchArray) => string,
];

const countLabel = (value: string, singular: string, plural: string) =>
  `${value} ${Number(value) === 1 ? singular : plural}`;

const dynamicTranslations: DynamicTranslation[] = [
  [
    /^(\d+) matchs? chargés? depuis GYMS\.LOL\.$/,
    ([, count]) =>
      `${countLabel(count, "match", "matches")} loaded from GYMS.LOL.`,
  ],
  [/^Page (\d+) sur (\d+)$/, ([, page, total]) => `Page ${page} of ${total}`],
  [
    /^(\d+) \/ (\d+) confirmés$/,
    ([, ready, total]) => `${ready} / ${total} confirmed`,
  ],
  [
    /^Recherche autour de (.+) MMR\.$/,
    ([, mmr]) => `Searching near ${mmr} MMR.`,
  ],
  [/^RÉGION (.+)$/, ([, region]) => `REGION ${region}`],
  [/^(\d+) matchs?$/, ([, count]) => countLabel(count, "match", "matches")],
  [/^(\d+) joueurs?$/, ([, count]) => countLabel(count, "player", "players")],
  [/^NIVEAU (\d+)$/, ([, level]) => `LEVEL ${level}`],
  [
    /^(\d+) \/ (\d+) PRÊTS?$/,
    ([, ready, total]) => `${ready} / ${total} READY`,
  ],
  [
    /^(\d+) \/ (\d+) JOUEURS PRÊTS$/,
    ([, ready, total]) => `${ready} / ${total} PLAYERS READY`,
  ],
  [/^\/ (\d+) PRÊTS$/, ([, total]) => `/ ${total} READY`],
  [/^Classement (.+)$/, ([, rank]) => `Rank ${translateFrench(rank)}`],
  [
    /^(\d+) secondes restantes$/,
    ([, count]) => `${countLabel(count, "second", "seconds")} remaining`,
  ],
  [
    /^(\d+) secondes écoulées$/,
    ([, count]) => `${countLabel(count, "second", "seconds")} elapsed`,
  ],
  [
    /^(\d+) parties enregistrées par GYMS\.LOL\.$/,
    ([, count]) =>
      `${countLabel(count, "match", "matches")} recorded by GYMS.LOL.`,
  ],
  [
    /^Les meilleurs joueurs GYMS\.LOL de la région (.+)\.$/,
    ([, region]) => `The highest-rated GYMS.LOL players in ${region}.`,
  ],
  [/^Joueur (.+)$/, ([, id]) => `Player ${id}`],
  [
    /^Retirer (.+) du groupe$/,
    ([, player]) => `Remove ${player} from the party`,
  ],
  [/^· CLASSEMENT ACTIF$/, () => "· ACTIVE LADDER"],
  [/^(\d+) V — (\d+) D$/, ([, wins, losses]) => `${wins} W — ${losses} L`],
  [/^(\d+) restante\(s\)$/, ([, count]) => `${count} remaining`],
  [/^(\d+) partie$/, ([, count]) => countLabel(count, "match", "matches")],
  [/^(.+) · victoire$/, ([, objective]) => `${objective} · victory`],
  [/^(.+) · défaite$/, ([, objective]) => `${objective} · defeat`],
  [
    /^(Partie personnalisée 1v1|Partie personnalisée 5v5) · (.+) · Équipes et rôles attribués$/,
    ([, mode, region]) =>
      `${mode === "Partie personnalisée 1v1" ? "Custom 1v1 game" : "Custom 5v5 game"} · ${region} · Assigned teams and roles`,
  ],
  [/^DERNIÈRE VERSION • (.+)$/, ([, release]) => `LATEST RELEASE • ${release}`],
  [
    /^(\d+),(\d+) Mo • Exécutable portable$/,
    ([, whole, decimal]) => `${whole}.${decimal} MB • Portable executable`,
  ],
  [
    /^Impossible de rejoindre la file \((\d+)\)\.$/,
    ([, status]) => `Unable to join the queue (${status}).`,
  ],
];

export function translateFrench(source: string) {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  const value = source.trim();
  const normalized = value.replace(/\s+/g, " ");
  if (!value) return source;
  const exact = englishTranslations[normalized];
  if (exact) return `${leading}${exact}${trailing}`;
  for (const [pattern, translate] of dynamicTranslations) {
    const match = normalized.match(pattern);
    if (match) return `${leading}${translate(match)}${trailing}`;
  }
  return source;
}

type LanguageContextValue = {
  language: Language;
  changeLanguage: (language: Language) => Promise<void>;
  t: (source: string) => string;
  formatDate: (value: Date | string) => string;
  formatTime: (value: Date | string) => string;
  formatNumber: (value: number) => string;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage: Language;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const changeLanguage = useCallback(
    async (nextLanguage: Language) => {
      if (nextLanguage === language) return;
      const form = new URLSearchParams({ locale: nextLanguage });
      const response = await fetch("/api/locale", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: form,
      });
      if (!response.ok) throw new Error("Impossible de changer la langue.");
      setLanguage(nextLanguage);
    },
    [language],
  );
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const value = useMemo<LanguageContextValue>(() => {
    const locale = intlLocale(language);
    const t = (source: string) =>
      language === "en" ? translateFrench(source) : source;
    return {
      language,
      changeLanguage,
      t,
      formatDate: (source) =>
        new Date(source).toLocaleDateString(locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "Europe/Paris",
        }),
      formatTime: (source) =>
        new Date(source).toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Paris",
        }),
      formatNumber: (source) => source.toLocaleString(locale),
    };
  }, [changeLanguage, language]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

const translatableProps = ["aria-label", "placeholder", "title", "alt"];

function localizeNode(
  node: ReactNode,
  t: (source: string) => string,
): ReactNode {
  if (typeof node === "string") return t(node);
  if (Array.isArray(node))
    return Children.toArray(node).map((child) => localizeNode(child, t));
  if (!isValidElement(node)) return node;
  const props = node.props as Record<string, unknown> & {
    children?: ReactNode;
  };
  const translated: Record<string, unknown> = {};
  for (const key of translatableProps) {
    if (typeof props[key] === "string") translated[key] = t(props[key]);
  }
  if ("children" in props)
    translated.children = Children.toArray(props.children).map((child) =>
      localizeNode(child, t),
    );
  return cloneElement(node, translated);
}

/**
 * Declarative migration boundary for legacy JSX. Text is translated while the
 * React tree is built; the DOM is never observed or modified after rendering.
 */
export function Localized({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return <>{localizeNode(children, t)}</>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
