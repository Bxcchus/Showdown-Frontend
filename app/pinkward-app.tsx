'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  communityMessages,
  matches,
  notifications,
  party,
  readyPlayers,
  redTeam,
  roles,
  rooms,
  type Match,
  type Player,
  type Tone,
} from './mock-data';

type PageId = 'home' | 'play' | 'matches' | 'community' | 'events' | 'profile' | 'settings' | 'lobby';
type QueueState = 'idle' | 'searching' | 'found' | 'ready' | 'lobby';

const pageLabels: Record<PageId, string> = {
  home: 'ACCUEIL', play: 'JOUER', matches: 'MATCHS', community: 'COMMUNAUTÉ', events: 'ÉVÉNEMENTS', profile: 'PROFIL', settings: 'PARAMÈTRES', lobby: 'LOBBY',
};

function Crest({ compact = false }: { compact?: boolean }) {
  return <span className={`crest${compact ? ' crest--compact' : ''}`} aria-hidden="true">P</span>;
}

function Avatar({ tone, label, size = 'normal' }: { tone: Tone; label: string; size?: 'small' | 'normal' | 'large' }) {
  return <span className={`avatar avatar--${tone} avatar--${size}`} aria-hidden="true">{label.slice(0, 1)}</span>;
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function PanelHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="panel-heading"><span>{children}</span>{action}</div>;
}

function Status({ children, tone = 'muted' }: { children: ReactNode; tone?: 'success' | 'danger' | 'warning' | 'muted' }) {
  return <span className={`status status--${tone}`}><i />{children}</span>;
}

function PlayerRow({ player, status }: { player: Player; status?: string }) {
  const state = status ?? player.status;
  return (
    <div className="player-row">
      <Avatar tone={player.tone} label={player.name} />
      <span className="player-identity"><strong>{player.name}</strong><small>{player.riotId}</small></span>
      <span className="role-tag">{player.role}</span>
      <span className="player-rank">{player.rank}</span>
      <Status tone={state === 'Prêt' || state === 'En ligne' || state === 'En groupe' ? 'success' : 'muted'}>{state}</Status>
    </div>
  );
}

function Header({ page, onNavigate, onNotifications, unread }: { page: PageId; onNavigate: (page: PageId) => void; onNotifications: () => void; unread: number }) {
  const primary: PageId[] = ['home', 'play', 'matches', 'community', 'events'];
  return (
    <header className="topbar">
      <button className="brand" onClick={() => onNavigate('home')} aria-label="Pinkward — Accueil"><Crest /><span>PINKWARD</span></button>
      <nav className="main-nav" aria-label="Navigation principale">
        {primary.map((item) => <button key={item} className={`nav-link${page === item ? ' active' : ''}`} onClick={() => onNavigate(item)}>{pageLabels[item]}</button>)}
      </nav>
      <div className="user-context">
        <button className="icon-button" aria-label="Rechercher">⌕</button>
        <button className="icon-button notification" onClick={onNotifications} aria-label={`Notifications, ${unread} non lues`}>♢{unread > 0 && <span>{unread}</span>}</button>
        <Avatar tone="rose" label="P" />
        <button className="user-copy user-button" onClick={() => onNavigate('profile')}><strong>PinkWard</strong><small><i /> En ligne</small></button>
        <button className="icon-button" onClick={() => onNavigate('settings')} aria-label="Ouvrir les paramètres">≡</button>
      </div>
    </header>
  );
}

function PartyRail({ onPlay }: { onPlay: () => void }) {
  return (
    <aside className="party-rail" aria-label="Votre groupe">
      <Panel className="quick-panel">
        <div className="panel-label">PARTIE RAPIDE</div>
        <button className="queue-choice"><span className="mode-mark">V</span><span><strong>Solo / Duo</strong><small>Summoner&apos;s Rift</small></span><b>⌄</b></button>
        <button className="primary-button" onClick={onPlay}>JOUER MAINTENANT</button>
      </Panel>
      <Panel className="party-panel">
        <PanelHeading action={<b>3 / 5</b>}>VOTRE GROUPE</PanelHeading>
        <div className="party-list">
          {party.map((member) => (
            <div className="party-member" key={member.name}>
              <Avatar tone={member.tone} label={member.name} />
              <span><strong>{member.name}</strong><small>{member.role} · {member.status}</small></span><i aria-label="En ligne" />
            </div>
          ))}
        </div>
        <button className="secondary-button full">＋ INVITER UN JOUEUR</button>
      </Panel>
      <Panel className="connection-panel">
        <span><i /> SERVICES CONNECTÉS</span><small>Données de démonstration locales</small>
      </Panel>
    </aside>
  );
}

function RankRail({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <aside className="rank-rail">
      <Panel className="rank-panel">
        <div className="panel-label">RANG ACTUEL</div><div className="rank-emblem" aria-hidden="true">Ⅲ</div>
        <h2>DIAMANT III</h2><p>75 LP</p><div className="rank-progress"><span /></div>
        <div className="rank-facts"><span><strong>68%</strong><small>TAUX DE VICTOIRE</small></span><span><strong>42</strong><small>V — 20 D</small></span></div>
        <button className="secondary-button full" onClick={() => onNavigate('profile')}>VOIR LE PROFIL</button>
      </Panel>
      <Panel className="mission-panel">
        <PanelHeading action={<b>2 / 3</b>}>OBJECTIF DU JOUR</PanelHeading>
        <h3>Gagner 3 parties classées</h3><p>Une victoire avant la fin.</p><div className="mission-progress"><span /></div><small>Réinitialisation dans 6 h 12</small>
      </Panel>
    </aside>
  );
}

function MatchRow({ match, onSelect, detailed = false }: { match: Match; onSelect?: () => void; detailed?: boolean }) {
  const won = match.result === 'VICTOIRE';
  return (
    <button className={`match-row${detailed ? ' match-row--detailed' : ''}`} onClick={onSelect} aria-label={`${match.result}, ${match.mode}, ${match.score}`}>
      <span className={`result-mark ${won ? 'win' : 'loss'}`}>{won ? '▲' : '▼'}</span>
      <strong className={won ? 'success' : 'danger'}>{match.result}</strong>
      <span>{match.mode}</span>{detailed && <span className="role-tag">{match.role}</span>}<span className="score">{match.score}</span>
      {detailed && <span>{match.duration}</span>}<b className={match.lp.startsWith('+') ? 'success' : 'danger'}>{match.lp}</b><small>{match.time}</small><span className="row-chevron">›</span>
    </button>
  );
}

function HomePage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <div className="home-grid page-enter" id="home">
      <PartyRail onPlay={() => onNavigate('play')} />
      <section className="main-stage">
        <Panel className="season-panel">
          <div className="season-copy"><div className="eyebrow">SAISON 2025 — SPLIT 2</div><h1>PINKWARD OPEN III</h1><p>Le tournoi communautaire revient. Montez votre escouade et imposez votre jeu.</p><div className="event-meta"><span>17 MAI — 25 MAI</span><b>INSCRIPTIONS OUVERTES</b></div><button className="text-action" onClick={() => onNavigate('events')}>VOIR L&apos;ÉVÉNEMENT <span>→</span></button></div>
          <div className="season-emblem" aria-hidden="true"><span>III</span></div>
          <div className="season-stats" aria-label="Progression de l'événement"><div><strong>05</strong><small>JOURS</small></div><div><strong>12</strong><small>HEURES</small></div><div><strong>47</strong><small>MIN</small></div></div>
        </Panel>
        <div className="content-row">
          <Panel className="recent-panel"><PanelHeading action={<button className="text-link" onClick={() => onNavigate('matches')}>TOUT VOIR →</button>}>ACTIVITÉ RÉCENTE</PanelHeading><div className="match-list">{matches.slice(0, 4).map((match) => <MatchRow match={match} key={match.id} onSelect={() => onNavigate('matches')} />)}</div></Panel>
          <Panel className="queue-panel"><PanelHeading action={<b className="status-idle">HORS FILE</b>}>ACTIVITÉ</PanelHeading><div className="queue-graphic" aria-hidden="true"><Crest /></div><h2>PRÊT À JOUER ?</h2><p>Solo / Duo · EUW</p><div className="roles"><span>MID</span><span>JUNGLE</span></div><button className="primary-button" onClick={() => onNavigate('play')}>TROUVER UNE PARTIE</button></Panel>
        </div>
      </section>
      <RankRail onNavigate={onNavigate} />
    </div>
  );
}

function RoleSelector({ label, value, disabled, onChange }: { label: string; value: string; disabled?: string; onChange: (role: string) => void }) {
  const marks: Record<string, string> = { TOP: '◇', JUNGLE: '♢', MID: '╱', ADC: '⌁', SUPPORT: '✣' };
  return (
    <fieldset className="role-fieldset"><legend>{label}</legend><div className="role-selector">{roles.map((role) => <button type="button" key={role} disabled={disabled === role} className={value === role ? 'selected' : ''} onClick={() => onChange(role)}><b>{marks[role]}</b><span>{role}</span></button>)}</div></fieldset>
  );
}

function PlayPage({ queue, setQueue }: { queue: QueueState; setQueue: (state: QueueState) => void }) {
  const [mode, setMode] = useState('SOLO / DUO'); const [primary, setPrimary] = useState('MID'); const [secondary, setSecondary] = useState('JUNGLE');
  const searching = queue === 'searching';
  return (
    <div className="play-layout page-enter">
      <aside className="mode-rail panel"><div className="page-kicker">MODE DE JEU</div>{['SOLO / DUO', 'FLEX 5V5', 'TOURNOIS', 'ARAM'].map((item) => <button key={item} className={mode === item ? 'active' : ''} onClick={() => !searching && setMode(item)}><span className="mode-mark">{item.slice(0, 1)}</span><span><strong>{item}</strong><small>{item === 'SOLO / DUO' ? 'Compétitif' : item === 'ARAM' ? 'Fun' : 'Communauté'}</small></span></button>)}</aside>
      <Panel className={`play-main${searching ? ' searching' : ''}`}>
        <div className="page-title-row"><div><span className="page-index">02</span><h1>{searching ? 'RECHERCHE EN COURS' : `${mode} — COMPÉTITIF`}</h1><p>{searching ? 'Nous recherchons des joueurs de niveau comparable.' : 'Affrontez d’autres joueurs et progressez dans le classement.'}</p></div>{searching && <Status tone="success">FILE ACTIVE</Status>}</div>
        {searching ? <SearchingSurface mode={mode} primary={primary} secondary={secondary} onCancel={() => setQueue('idle')} onFound={() => setQueue('found')} /> : <div className="play-form"><div className="form-section"><label>RÉGION</label><button className="select-control"><span>EUW — Europe Ouest</span><b>CHANGER ›</b></button></div><RoleSelector label="RÔLE PRINCIPAL" value={primary} disabled={secondary} onChange={setPrimary} /><RoleSelector label="RÔLE SECONDAIRE" value={secondary} disabled={primary} onChange={setSecondary} /><div className="find-row"><span><small>CONFIGURATION</small><strong>{mode} · EUW · {primary}/{secondary}</strong></span><button className="primary-button large" onClick={() => setQueue('searching')}>TROUVER UNE PARTIE</button></div></div>}
      </Panel>
      <aside className="play-party"><Panel><PanelHeading action={<b>3 / 5</b>}>GROUPE</PanelHeading><div className="compact-players">{party.map((player) => <PlayerRow player={player} key={player.name} />)}</div><button className="secondary-button full">＋ INVITER</button></Panel><Panel className="party-size"><div className="panel-label">TAILLE DU GROUPE</div><div>{[1, 2, 3, 5].map((size) => <button className={size === 3 ? 'active' : ''} key={size}>{size}</button>)}</div><p>CLASSEMENT</p><strong>DIAMANT III <small>— 75 LP</small></strong></Panel></aside>
    </div>
  );
}

function SearchingSurface({ mode, primary, secondary, onCancel, onFound }: { mode: string; primary: string; secondary: string; onCancel: () => void; onFound: () => void }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer); }, []);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <div className="search-surface"><div className="scanner" aria-hidden="true"><span /><Crest /></div><span className="search-label">RECHERCHE D&apos;UNE PARTIE</span><strong className="search-time">{time}</strong><div className="search-facts"><span><small>MODE</small><b>{mode}</b></span><span><small>RÉGION</small><b>EUW</b></span><span><small>RÔLES</small><b>{primary} / {secondary}</b></span><span><small>GROUPE</small><b>3 / 5</b></span></div><div className="search-actions"><button className="secondary-button" onClick={onCancel}>ANNULER LA RECHERCHE</button><button className="ghost-button" onClick={onFound}>SIMULER UN MATCH TROUVÉ →</button></div></div>;
}

function MatchesPage() {
  const [filter, setFilter] = useState('TOUS'); const [selected, setSelected] = useState<Match | null>(null);
  const visible = useMemo(() => matches.filter((match) => filter === 'TOUS' || match.mode.toUpperCase().includes(filter)), [filter]);
  return <div className="wide-page page-enter"><div className="page-title-row"><div><span className="page-index">03</span><h1>HISTORIQUE DES MATCHS</h1><p>Vos dernières parties et leur impact sur votre classement.</p></div><div className="segmented">{['TOUS', 'SOLO', 'FLEX', 'TOURNOI'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div><Panel className="history-panel"><div className="history-head"><span>RÉSULTAT</span><span>MODE</span><span>RÔLE</span><span>KDA</span><span>DURÉE</span><span>GAIN / PERTE</span><span>DATE</span></div>{visible.map((match) => <div key={match.id}><MatchRow match={match} detailed onSelect={() => setSelected(selected?.id === match.id ? null : match)} />{selected?.id === match.id && <MatchDetail match={match} />}</div>)}</Panel></div>;
}

function MatchDetail({ match }: { match: Match }) {
  return <div className="match-detail"><div><span className="page-kicker">MATCH {match.id}</span><h3 className={match.result === 'VICTOIRE' ? 'success' : 'danger'}>{match.result}</h3><p>{match.mode} · {match.duration} · {match.role}</p></div><div className="team-strip">{match.teammates.map((name, index) => <span key={name}><Avatar tone={(['rose', 'violet', 'blue', 'amber'] as Tone[])[index]} label={name} /><small>{name}</small></span>)}</div><button className="secondary-button">VOIR LE RAPPORT</button></div>;
}

function CommunityPage() {
  const [room, setRoom] = useState(rooms[1].name); const [messages, setMessages] = useState(communityMessages); const [draft, setDraft] = useState('');
  function submit(event: FormEvent) { event.preventDefault(); if (!draft.trim()) return; setMessages([...messages, { author: 'PinkWard', time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), text: draft.trim(), tone: 'rose' }]); setDraft(''); }
  return <div className="community-page page-enter"><aside className="rooms-panel panel"><div className="page-kicker">SALONS</div>{rooms.map((item) => <button key={item.name} className={room === item.name ? 'active' : ''} onClick={() => setRoom(item.name)}><span>#</span><strong>{item.name}</strong><small>{item.online}</small></button>)}<div className="room-note"><Crest compact /><span><strong>MODÉRATION ACTIVE</strong><small>Respectez les autres joueurs.</small></span></div></aside><Panel className="chat-panel"><div className="chat-head"><div><span className="page-index">04</span><h1>{room.toUpperCase()}</h1><p>{rooms.find((item) => item.name === room)?.online} joueurs en ligne</p></div><button className="icon-button">•••</button></div><div className="messages">{messages.map((message, index) => <div className="message" key={`${message.author}-${index}`}><Avatar tone={message.tone} label={message.author} /><span><strong>{message.author}<time>{message.time}</time></strong><p>{message.text}</p></span></div>)}</div><form className="message-form" onSubmit={submit}><label className="sr-only" htmlFor="message">Écrire un message</label><input id="message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Écrire dans #${room.toLowerCase()}…`} /><button type="submit" aria-label="Envoyer le message">➤</button></form></Panel><aside className="members-panel panel"><PanelHeading action={<b>5 EN LIGNE</b>}>MEMBRES</PanelHeading><div className="compact-players">{[...party, redTeam[0], redTeam[2]].map((player) => <PlayerRow player={player} key={player.name} />)}</div><button className="secondary-button full">CRÉER UNE ANNONCE LFG</button></aside></div>;
}

function EventsPage() {
  const challenges = [{ label: 'Gagner 10 parties classées', value: 10, max: 10 }, { label: 'Atteindre Diamant', value: 1, max: 1 }, { label: 'Gagner 50 parties', value: 42, max: 50 }, { label: 'Participer à 1 tournoi', value: 0, max: 1 }];
  return <div className="wide-page events-page page-enter"><div className="page-title-row"><div><span className="page-index">05</span><h1>SAISON / ÉVÉNEMENTS</h1><p>Votre progression compétitive et les rendez-vous communautaires.</p></div><Status tone="warning">SPLIT EN COURS</Status></div><div className="events-grid"><Panel className="season-rank-card"><div className="page-kicker">SAISON 2025 — SPLIT 2</div><div className="rank-emblem">Ⅲ</div><h2>DIAMANT III</h2><p>75 LP</p><div className="rank-progress"><span /></div><small>Prochain palier : Diamant II</small></Panel><Panel className="challenge-panel"><PanelHeading>PROGRESSION DE SAISON</PanelHeading>{challenges.map((item) => <div className="challenge" key={item.label}><span>{item.value >= item.max ? '✓' : '○'}</span><div><strong>{item.label}</strong><div className="mission-progress"><i style={{ width: `${(item.value / item.max) * 100}%` }} /></div></div><b>{item.value} / {item.max}</b></div>)}</Panel><Panel className="event-feature"><div className="event-trophy">III</div><div><span className="page-kicker">ÉVÉNEMENT À LA UNE</span><h2>PINKWARD OPEN III</h2><p>Tournoi 5v5 · Élimination directe</p><button className="primary-button">S&apos;INSCRIRE</button></div></Panel></div></div>;
}

function ProfilePage() {
  return <div className="profile-page page-enter"><aside className="profile-sidebar"><Avatar tone="rose" label="PinkWard" size="large" /><h1>PinkWard</h1><p>@EUW</p><Status tone="success">EN LIGNE</Status><nav>{['APERÇU', 'HISTORIQUE DES MATCHS', 'CHAMPIONS', 'RANGS', 'HIGHLIGHTS', 'STATS'].map((item, index) => <button className={index === 0 ? 'active' : ''} key={item}>{item}</button>)}</nav></aside><div className="profile-content"><Panel className="identity-stats"><div><span className="page-kicker">RANG ACTUEL</span><strong>DIAMANT III</strong><small>75 LP</small></div><div><span className="page-kicker">MEILLEUR RANG</span><strong>DIAMANT II</strong><small>32 LP</small></div><div><span className="page-kicker">TAUX DE VICTOIRE</span><strong>68%</strong><small>42 V — 20 D</small></div><div><span className="page-kicker">ELO PERSONNEL</span><strong>1 842</strong><small>Top 7%</small></div></Panel><Panel className="preferred-roles"><PanelHeading>RÔLES PRÉFÉRÉS</PanelHeading><div>{roles.map((role, index) => <span key={role}><b>{['╱', '♢', '◇', '⌁', '✣'][index]}</b><strong>{role}</strong><small>{[68, 62, 54, 44, 48][index]}%</small></span>)}</div></Panel><Panel className="profile-matches"><PanelHeading>DERNIERS MATCHS</PanelHeading>{matches.slice(0, 4).map((match) => <MatchRow key={match.id} match={match} />)}</Panel></div></div>;
}

function SettingsPage() {
  const [section, setSection] = useState('COMPANION'); const [toggles, setToggles] = useState({ overlay: true, post: true, alerts: true, lfg: false });
  const flip = (key: keyof typeof toggles) => setToggles({ ...toggles, [key]: !toggles[key] });
  return <div className="settings-page page-enter"><aside className="settings-nav"><span className="page-kicker">PARAMÈTRES</span>{['COMPTE', 'CONFIDENTIALITÉ', 'NOTIFICATIONS', 'JEU', 'RACCOURCIS', 'APPARENCE', 'COMPANION', 'SÉCURITÉ'].map((item) => <button className={section === item ? 'active' : ''} key={item} onClick={() => setSection(item)}>{item}</button>)}</aside><Panel className="settings-main"><div className="page-title-row"><div><span className="page-index">08</span><h1>{section === 'COMPANION' ? 'PINKWARD COMPANION' : section}</h1><p>{section === 'COMPANION' ? 'Votre lien sécurisé avec le client League.' : 'Préférences enregistrées sur cet appareil.'}</p></div></div>{section === 'COMPANION' ? <div className="companion-grid"><div className="setting-list">{[{ key: 'overlay', title: 'Overlay en jeu', text: 'Statuts, timers et notifications en temps réel.' }, { key: 'post', title: 'Analyse post-game', text: 'Rapport détaillé après chaque partie.' }, { key: 'alerts', title: 'Notifications intelligentes', text: 'Match, tournoi et amis en temps réel.' }, { key: 'lfg', title: 'Recherche de groupe', text: 'Recevoir des alertes LFG compatibles.' }].map((item) => <button className="setting-row" key={item.key} onClick={() => flip(item.key as keyof typeof toggles)}><span className="setting-icon">{item.key === 'overlay' ? '⌘' : item.key === 'post' ? '⌁' : item.key === 'alerts' ? '♢' : '♙'}</span><span><strong>{item.title}</strong><small>{item.text}</small></span><i className={`switch${toggles[item.key as keyof typeof toggles] ? ' on' : ''}`}><b /></i></button>)}</div><div className="companion-preview"><div className="window-bar"><Crest compact /><strong>PINKWARD</strong><span>— □ ×</span></div><div className="companion-player"><Avatar tone="rose" label="P" size="large" /><span><strong>VICTOIRE</strong><small>PinkWard#EUW · MID</small></span></div><div className="mini-stats"><span><b>68%</b><small>WIN RATE</small></span><span><b>2.8</b><small>KDA</small></span><span><b>7.6</b><small>CS/MIN</small></span></div><Status tone="success">COMPANION CONNECTÉ</Status></div></div> : <EmptySettings section={section} />}</Panel></div>;
}

function EmptySettings({ section }: { section: string }) { return <div className="empty-settings"><div className="setting-icon">◇</div><h2>{section}</h2><p>Les réglages de cette section seront synchronisés avec votre compte Pinkward.</p><button className="secondary-button">GÉRER LES PRÉFÉRENCES</button></div>; }

function LobbyPage() {
  return <div className="lobby-page page-enter"><div className="lobby-head"><div><span className="page-index">07</span><h1>LOBBY COMPÉTITIF</h1><p>Solo / Duo · EUW · Faille de l&apos;invocateur</p></div><Status tone="success">LOBBY PRÊT</Status><button className="secondary-button">PARAMÈTRES⌄</button></div><div className="lobby-grid"><TeamPanel title="ÉQUIPE BLEUE" players={readyPlayers} tone="blue" /><Panel className="lobby-center"><span className="page-kicker">PRÊT ?</span><div className="ready-ring"><strong>00:18</strong><small>10 / 10 PRÊTS</small></div><Status tone="success">TOUS LES JOUEURS SONT PRÊTS</Status><div className="spectators"><span>SPECTATEURS (2)</span><small>Spectateur01</small><small>Spectateur02</small></div></Panel><TeamPanel title="ÉQUIPE ROUGE" players={redTeam} tone="red" /></div><div className="lobby-actions"><button className="secondary-button">INVITER</button><button className="danger-button">QUITTER LE LOBBY</button><button className="primary-button">OUVRIR LE COMPANION</button></div></div>;
}

function TeamPanel({ title, players, tone }: { title: string; players: Player[]; tone: 'blue' | 'red' }) { return <Panel className={`team-panel team-panel--${tone}`}><PanelHeading>{title}</PanelHeading>{players.map((player) => <PlayerRow key={player.name} player={player} status="Prêt" />)}</Panel>; }

function NotificationDrawer({ open, onClose, onReadAll }: { open: boolean; onClose: () => void; onReadAll: () => void }) {
  return <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}><div className="drawer-head"><div><span className="page-kicker">CENTRE</span><h2>NOTIFICATIONS</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer">×</button></div><div className="notification-list">{notifications.map((item, index) => <div className="notification-item" key={`${item.title}-${index}`}><span className={`notice-mark notice-mark--${item.type}`}>{item.type === 'success' ? '✓' : item.type === 'warning' ? '!' : 'i'}</span><div><strong>{item.title}</strong><p>{item.text}</p><small>{item.time}</small></div><button>{item.action}</button></div>)}</div><button className="secondary-button full" onClick={onReadAll}>TOUT MARQUER COMME LU</button></aside>;
}

function MatchmakingBar({ queue, seconds, onAction }: { queue: QueueState; seconds: number; onAction: () => void }) {
  if (queue === 'idle') return null;
  const config = queue === 'searching' ? { title: 'RECHERCHE', meta: '5V5 · MID / JUNGLE', action: 'ANNULER' } : queue === 'found' ? { title: 'MATCH TROUVÉ', meta: 'SOLO / DUO · EUW', action: 'ACCEPTER' } : queue === 'ready' ? { title: 'READY CHECK', meta: '4 / 5 PRÊTS', action: 'OUVRIR' } : { title: 'LOBBY PRÊT', meta: '10 / 10 JOUEURS', action: 'OUVRIR' };
  return <div className={`matchmaking-bar matchmaking-bar--${queue}`} role="status"><Crest compact /><strong>{config.title}</strong><span>{config.meta}</span>{queue === 'searching' && <time>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</time>}<button onClick={onAction}>{config.action}</button></div>;
}

function CriticalOverlay({ queue, setQueue, onNavigate }: { queue: QueueState; setQueue: (state: QueueState) => void; onNavigate: (page: PageId) => void }) {
  const [accepted, setAccepted] = useState(false);
  if (queue !== 'found' && queue !== 'ready') return null;
  if (queue === 'found') return <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="match-found-title"><div className="match-found"><span className="overlay-rule" /><Crest /><span className="page-kicker">UNE ÉQUIPE VOUS ATTEND</span><h2 id="match-found-title">MATCH TROUVÉ</h2><p>Solo / Duo · 5V5 · EUW</p><div className="accept-timer">00:24</div><button className="accept-button" onClick={() => setQueue('ready')}>ACCEPTER</button><button className="ghost-button" onClick={() => setQueue('idle')}>REFUSER</button><span className="overlay-rule" /></div></div>;
  return <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="ready-title"><div className="ready-dialog"><div className="ready-head"><div><span className="page-kicker">SOLO / DUO · EUW</span><h2 id="ready-title">READY CHECK</h2></div><div className="ready-countdown"><strong>00:17</strong><small>EN ATTENTE</small></div></div><div className="ready-list">{readyPlayers.map((player, index) => <PlayerRow key={player.name} player={player} status={accepted || index < 4 ? 'Prêt' : 'En attente'} />)}</div><div className="ready-actions">{!accepted ? <button className="accept-button" onClick={() => setAccepted(true)}>JE SUIS PRÊT</button> : <button className="primary-button large" onClick={() => { setQueue('lobby'); onNavigate('lobby'); }}>OUVRIR LE LOBBY</button>}<button className="ghost-button" onClick={() => setQueue('idle')}>QUITTER</button></div></div></div>;
}

export default function PinkwardApp() {
  const [page, setPage] = useState<PageId>('home'); const [queue, setQueue] = useState<QueueState>('idle'); const [seconds, setSeconds] = useState(0); const [drawer, setDrawer] = useState(false); const [unread, setUnread] = useState(3);
  useEffect(() => { if (queue !== 'searching') return; const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer); }, [queue]);
  const navigate = (next: PageId) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const changeQueue = (next: QueueState) => { if (next === 'searching') setSeconds(0); setQueue(next); };
  const queueAction = () => { if (queue === 'searching') changeQueue('idle'); else if (queue === 'found') changeQueue('ready'); else if (queue === 'ready') changeQueue('ready'); else navigate('lobby'); };
  return <main className="app-shell"><Header page={page} onNavigate={navigate} onNotifications={() => setDrawer(!drawer)} unread={unread} />{page === 'home' && <HomePage onNavigate={navigate} />}{page === 'play' && <PlayPage queue={queue} setQueue={changeQueue} />}{page === 'matches' && <MatchesPage />}{page === 'community' && <CommunityPage />}{page === 'events' && <EventsPage />}{page === 'profile' && <ProfilePage />}{page === 'settings' && <SettingsPage />}{page === 'lobby' && <LobbyPage />}<NotificationDrawer open={drawer} onClose={() => setDrawer(false)} onReadAll={() => setUnread(0)} /><MatchmakingBar queue={queue} seconds={seconds} onAction={queueAction} /><CriticalOverlay key={queue} queue={queue} setQueue={changeQueue} onNavigate={navigate} /></main>;
}
