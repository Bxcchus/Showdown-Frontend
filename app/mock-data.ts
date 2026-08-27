export type Tone = 'rose' | 'violet' | 'blue' | 'amber' | 'green' | 'red';

export type Player = {
  name: string;
  riotId: string;
  role: string;
  rank: string;
  status: string;
  tone: Tone;
};

export type Match = {
  id: string;
  result: 'VICTOIRE' | 'DÉFAITE';
  mode: string;
  score: string;
  role: string;
  duration: string;
  lp: string;
  time: string;
  teammates: string[];
};

export const currentPlayer: Player = {
  name: 'PinkWard', riotId: 'PinkWard#EUW', role: 'MID', rank: 'Diamant III', status: 'En ligne', tone: 'rose',
};

export const party: Player[] = [
  currentPlayer,
  { name: 'LeBlancMains', riotId: 'MainDiff#EUW', role: 'JUNGLE', rank: 'Diamant IV', status: 'En groupe', tone: 'violet' },
  { name: 'Kaze', riotId: 'Windstep#EUW', role: 'TOP', rank: 'Platine I', status: 'En groupe', tone: 'blue' },
];

export const matches: Match[] = [
  { id: 'PW-8842', result: 'VICTOIRE', mode: 'Solo / Duo', score: '22 / 6 / 8', role: 'MID', duration: '28:34', lp: '+24 LP', time: 'il y a 2 h', teammates: ['LeBlancMains', 'Kaze', 'Vortex', 'Zephir'] },
  { id: 'PW-8811', result: 'DÉFAITE', mode: 'Flex 5v5', score: '4 / 7 / 10', role: 'JUNGLE', duration: '32:11', lp: '-18 LP', time: 'il y a 5 h', teammates: ['SilentStep', 'Noct', 'Mira', 'Torin'] },
  { id: 'PW-8797', result: 'VICTOIRE', mode: 'Solo / Duo', score: '18 / 3 / 6', role: 'MID', duration: '25:10', lp: '+22 LP', time: 'il y a 1 j', teammates: ['Akaliplayer', 'TryHard', 'Zephir', 'RiverPlayer'] },
  { id: 'PW-8744', result: 'VICTOIRE', mode: 'Tournoi', score: '9 / 1 / 12', role: 'SUPPORT', duration: '19:45', lp: '+20 LP', time: 'il y a 2 j', teammates: ['LeBlancMains', 'Kaze', 'Vortex', 'Zephir'] },
  { id: 'PW-8690', result: 'DÉFAITE', mode: 'Solo / Duo', score: '3 / 8 / 5', role: 'TOP', duration: '27:02', lp: '-15 LP', time: 'il y a 3 j', teammates: ['RivenPlayer', 'Noct', 'SupportGod', 'Dragon'] },
  { id: 'PW-8641', result: 'VICTOIRE', mode: 'Flex 5v5', score: '11 / 2 / 9', role: 'ADC', duration: '21:36', lp: '+20 LP', time: 'il y a 4 j', teammates: ['Mira', 'Vortex', 'Zephir', 'Kaze'] },
];

export const readyPlayers = [
  ...party,
  { name: 'Vortex', riotId: 'Vortex#EUW', role: 'ADC', rank: 'Diamant IV', status: 'Prêt', tone: 'amber' as const },
  { name: 'Zephir', riotId: 'Zephir#EUW', role: 'SUPPORT', rank: 'Platine II', status: 'En attente', tone: 'green' as const },
];

export const redTeam: Player[] = [
  { name: 'RivenPlayer', riotId: 'Blade#EUW', role: 'TOP', rank: 'Diamant II', status: 'Prêt', tone: 'red' },
  { name: 'Dragon', riotId: 'Smite#EUW', role: 'JUNGLE', rank: 'Diamant IV', status: 'Prêt', tone: 'amber' },
  { name: 'SilentStep', riotId: 'Quiet#EUW', role: 'MID', rank: 'Platine I', status: 'Prêt', tone: 'violet' },
  { name: 'Noct', riotId: 'Night#EUW', role: 'ADC', rank: 'Diamant IV', status: 'Prêt', tone: 'blue' },
  { name: 'SupportGod', riotId: 'Peel#EUW', role: 'SUPPORT', rank: 'Platine II', status: 'Prêt', tone: 'green' },
];

export const notifications = [
  { type: 'success', title: 'Match trouvé', text: 'Solo / Duo · EUW', time: 'il y a 2 min', action: 'Ouvrir' },
  { type: 'warning', title: 'Tournoi bientôt', text: 'Pinkward Open III dans 15 minutes', time: 'il y a 15 min', action: 'Voir' },
  { type: 'info', title: 'LeBlancMains est en ligne', text: 'Invitez-le dans votre groupe.', time: 'il y a 30 min', action: 'Inviter' },
  { type: 'success', title: 'Challenge terminé', text: '10 parties classées jouées', time: 'il y a 2 h', action: 'Détails' },
];

export const rooms = [
  { name: 'Général', online: 284 }, { name: 'Recherche de groupe', online: 96 }, { name: 'EUW compétitif', online: 153 }, { name: 'Tournois', online: 41 },
];

export const communityMessages = [
  { author: 'Vortex', time: '18:42', text: 'Flex Diamant+, on cherche un support pour 20 h.', tone: 'amber' as const },
  { author: 'Akaliplayer', time: '18:44', text: 'Dispo mid/adc, vocal et bonne ambiance.', tone: 'blue' as const },
  { author: 'LeBlancMains', time: '18:45', text: 'Notre groupe a deux places. Objectif sérieusement classé.', tone: 'violet' as const },
];

export const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const;
