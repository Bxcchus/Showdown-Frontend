'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import { BackendProvider, useBackend, type ApiRole } from './lib/backend';

type Page = 'home' | 'play' | 'searching' | 'ready' | 'lobby' | 'matches' | 'leaderboard' | 'download' | 'profile' | 'settings';
type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

const party = [
  ['Nyxara', 'MID', 'READY'],
  ['Khaelis', 'JUNGLE', 'READY'],
  ['Rivenous', 'SUPPORT', 'ONLINE'],
] as const;

const matches = [
  ['VICTORY', '5V5 TrueSkill', 'MID', '31:42', '+21', '2h ago'],
  ['DEFEAT', '1V1 Glicko-2', 'TOP', '12:18', '-16', '5h ago'],
  ['VICTORY', '5V5 TrueSkill', 'JUNGLE', '29:04', '+18', '1d ago'],
  ['VICTORY', '1V1 Glicko-2', 'MID', '09:11', '+12', '2d ago'],
  ['DEFEAT', '5V5 TrueSkill', 'ADC', '24:06', '-19', '3d ago'],
  ['VICTORY', '5V5 TrueSkill', 'SUPPORT', '33:20', '+16', '4d ago'],
] as const;

function Shell({ page, setPage, children }: { page: Page; setPage: (page: Page) => void; children: ReactNode }) {
  const backend = useBackend();
  const current = page === 'searching' || page === 'ready' || page === 'lobby' ? 'play' : page;
  const nav: Array<[Page, string]> = [['home', 'HOME'], ['play', 'PLAY'], ['matches', 'HISTORY'], ['leaderboard', 'LEADERBOARD'], ['profile', 'PROFILE'], ['download', 'DOWNLOAD']];
  const accountName = backend.profile?.displayName ?? backend.session?.username ?? 'SIGN IN';
  const accountAction = () => backend.session ? setPage('profile') : void backend.login();
  return <div className="app-shell"><header className="topbar"><button className="wordmark" onClick={() => setPage('home')}>PINKWARD</button><nav aria-label="Primary navigation">{nav.map(([id, label]) => <button key={id} className={current === id ? 'active' : ''} onClick={() => setPage(id)}>{label}</button>)}</nav><div className="account-links"><button onClick={accountAction}>{accountName.toUpperCase()}</button><button className={backend.backendOnline ? 'online' : ''} onClick={() => backend.session ? setPage('settings') : void backend.login()}>{backend.profile?.region ?? 'EUW'} · {backend.backendOnline ? (backend.session ? 'ONLINE' : 'API READY') : 'OFFLINE'}</button>{backend.session && <button className="logout-link" onClick={() => void backend.logout()}>LOG OUT</button>}</div></header><main>{children}</main>{backend.error && <div className="backend-toast" role="status">{backend.error}</div>}</div>;
}

function Button({ children, onClick, kind = 'primary' }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'outline' | 'danger' | 'success' }) {
  return <button className={`button button--${kind}`} onClick={onClick}>{children}</button>;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function PageTitle({ eyebrow, title, text, action }: { eyebrow?: string; title: string; text?: string; action?: ReactNode }) {
  return <div className="page-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{text && <p>{text}</p>}</div>{action}</div>;
}

function PartyRows({ compact = false }: { compact?: boolean }) {
  return <div className={`party-rows${compact ? ' compact' : ''}`}>{party.map(([name, role, status]) => <div className="party-row" key={name}><strong>{name}</strong><span>{role}</span><b className={status === 'READY' ? 'positive' : ''}>{status}</b></div>)}</div>;
}

function Home({ go }: { go: (page: Page) => void }) {
  const partyPortraits = ['akali', 'leblanc', 'zed'] as const;
  const recentPortraits = ['sylas', 'zed', 'akali', 'orianna'] as const;
  return <div className="page home-page home-dashboard"><aside className="home-rail"><Card className="quick-play-card"><h3>QUICK PLAY</h3><button className="queue-preset" type="button" onClick={() => go('play')}><Image src="/mode-icons/summoners-rift-active.png" alt="" aria-hidden="true" width={38} height={38} /><span><strong>SUMMONER&apos;S RIFT</strong><small>5V5 · TrueSkill</small></span><b>⌄</b></button><Button onClick={() => go('play')}>PLAY NOW</Button></Card><Card className="home-party-card"><h3>YOUR PARTY</h3><div>{party.map(([name, role, status], index) => <button type="button" className="home-party-member" key={name}><Image src={`/champion-icons/${partyPortraits[index]}.png`} alt="" aria-hidden="true" width={42} height={42} /><span><strong>{name}</strong><small>{role} · {status}</small></span><b>{index === 1 ? '⌄' : ''}</b></button>)}</div><button className="home-invite" type="button">+&nbsp;&nbsp; INVITE PLAYER</button></Card></aside><section className="home-stage"><div className="home-hero-row"><Card className="season-card"><div className="season-copy"><span className="eyebrow">SEASON 2025 — SPLIT 02</span><h1>PINKWARD OPEN III</h1><p>Community competitive tournament</p><strong>17 MAY — 25 MAY</strong><b>REGISTERED</b><div className="season-countdown"><span><strong>05</strong><small>DAYS</small></span><span><strong>12</strong><small>HOURS</small></span><span><strong>47</strong><small>MIN</small></span></div></div></Card><Card className="home-rank-card"><span className="eyebrow">CURRENT RANK</span><Image src="/rank-icons/diamond.png" alt="Diamond rank" width={94} height={94} /><h2>DIAMOND III</h2><b>75 LP</b><strong>68% <small>WIN RATE</small></strong><p>42W — 20L</p><Button kind="outline" onClick={() => go('leaderboard')}>VIEW RANKING</Button></Card></div><div className="home-activity-row"><Card className="home-recent-card"><header><h3>RECENT ACTIVITY</h3><button type="button" onClick={() => go('matches')}>VIEW ALL →</button></header><div>{matches.slice(0, 4).map((match, index) => <button type="button" className="home-activity-line" key={`${match[0]}${match[3]}`} onClick={() => go('matches')}><Image src={`/champion-icons/${recentPortraits[index]}.png`} alt="" aria-hidden="true" width={34} height={34} /><b className={match[0] === 'VICTORY' ? 'positive' : 'negative'}>{match[0]}</b><span>{match[1]}</span><strong>{match[2]} · {match[3]}</strong><b className={match[4].startsWith('+') ? 'positive' : 'negative'}>{match[4]}</b><small>{match[5]}</small></button>)}</div></Card><Card className="home-queue-card"><header><h3>IN PROGRESS</h3><span>›</span></header><div className="queue-status"><Image src="/mode-icons/summoners-rift-active.png" alt="" aria-hidden="true" width={48} height={48} /><span><strong>MATCHMAKING 5V5</strong><small>Estimated: 1:45</small><small>Elapsed: 0:47</small></span></div><Button kind="outline" onClick={() => go('searching')}>VIEW MATCHMAKING</Button></Card></div></section></div>;
}

function RolePicker({ label, value, onChange }: { label: string; value: Role; onChange: (role: Role) => void }) {
  const roles: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  const icons: Record<Role, string> = { TOP: 'top', JUNGLE: 'jungle', MID: 'mid', ADC: 'adc', SUPPORT: 'support' };
  return <fieldset><legend>{label}</legend><div className="role-picker">{roles.map((role) => <button type="button" key={role} className={value === role ? 'selected' : ''} onClick={() => onChange(role)} aria-pressed={value === role}><Image src={`/role-icons/${icons[role]}.svg`} alt="" aria-hidden="true" width={28} height={28} /><span>{role}</span></button>)}</div></fieldset>;
}

function Play({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const [mode, setMode] = useState('1V1'); const [primary, setPrimary] = useState<Role>('MID'); const [secondary, setSecondary] = useState<Role>('JUNGLE'); const [groupSize, setGroupSize] = useState(2);
  const modes = [{ id: '1V1', label: '1V1', subtitle: 'HOWLING ABYSS · Glicko-2', title: 'HOWLING ABYSS', icon: '/mode-icons/aram.png', activeIcon: '/mode-icons/aram-active.png' }, { id: '5V5', label: '5V5', subtitle: "SUMMONER'S RIFT · TrueSkill", title: "SUMMONER'S RIFT", icon: '/mode-icons/summoners-rift.png', activeIcon: '/mode-icons/summoners-rift-active.png' }] as const;
  const selectedMode = modes.find((item) => item.id === mode) ?? modes[0];
  const choosePrimary = (role: Role) => { if (role === secondary) { setSecondary(primary); } setPrimary(role); };
  const chooseSecondary = (role: Role) => { if (role === primary) { setPrimary(secondary); } setSecondary(role); };
  const apiRole = (role: Role): ApiRole => role === 'ADC' ? 'BOT' : role;
  const findMatch = async () => {
    const joined = await backend.joinQueue(mode === '1V1' ? 'ONE_V_ONE' : 'FIVE_V_FIVE', apiRole(primary), apiRole(secondary));
    if (joined) go('searching');
  };
  const members = backend.party?.members;
  const liveParty = members?.length ? <div className="party-rows compact">{members.map((member) => <div className="party-row" key={member.playerId}><strong>{member.displayName}</strong><span>{member.primaryRole === 'BOT' ? 'ADC' : member.primaryRole}</span><b className={member.ready ? 'positive' : ''}>{member.ready ? 'READY' : member.online ? 'ONLINE' : 'OFFLINE'}</b></div>)}</div> : <PartyRows compact />;
  const rank = backend.statistics?.rank ?? 'EMERALD II';
  return <div className="page play-page"><div className="play-shell-grid"><Card className="play-config"><div className="play-config-head"><span className="eyebrow">COMPETITIVE QUEUE</span><h1>{selectedMode.title}</h1><p>{mode === '1V1' ? 'Match with players near your rating.' : 'Match with players near your rating and preferred role.'}</p></div><div className="central-mode-picker" aria-label="Game mode">{modes.map((item) => <button type="button" key={item.id} className={mode === item.id ? 'selected' : ''} onClick={() => setMode(item.id)}><span className="mode-icon" aria-hidden="true"><Image className="mode-icon-idle" src={item.icon} alt="" width={42} height={42} /><Image className="mode-icon-active" src={item.activeIcon} alt="" width={42} height={42} /></span><span><strong>{item.label}</strong><small>{item.subtitle}</small></span></button>)}</div>{mode === '5V5' ? <><RolePicker label="PRIMARY ROLE" value={primary} onChange={choosePrimary} /><RolePicker label="SECONDARY ROLE" value={secondary} onChange={chooseSecondary} /></> : null}<div className="play-actions"><Button onClick={() => void findMatch()}>{backend.busy ? 'CONNECTING…' : backend.session ? 'FIND MATCH' : 'SIGN IN TO PLAY'}</Button><button className="queue-settings" type="button" aria-label="Queue settings">⚙</button></div></Card><Card className="play-side"><h3>PARTY</h3>{liveParty}<button className="invite-row" type="button"><span>+</span> INVITE PLAYER <b>›</b></button><div className="group-size"><h3>GROUP SIZE</h3><div>{[1, 2, 3, 5].map((size) => <button type="button" className={groupSize === size ? 'selected' : ''} onClick={() => setGroupSize(size)} key={size}>{size}</button>)}</div></div><div className="play-rank"><Image src="/rank-icons/emerald.png" alt="Emerald rank" width={78} height={78} /><span><small>RANK</small><strong>{rank}</strong><b>{backend.statistics?.progression ?? 75} LP</b></span></div></Card></div></div>;
}

function Searching({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const [seconds, setSeconds] = useState(() => backend.queue ? Math.max(0, Math.floor((Date.now() - new Date(backend.queue.joinedAt).getTime()) / 1000)) : 0);
  useEffect(() => { const tick = window.setInterval(() => setSeconds((v) => v + 1), 1000); return () => clearInterval(tick); }, []);
  useEffect(() => { if (backend.lobby) go('lobby'); else if (backend.match?.status === 'READY_CHECK') go('ready'); }, [backend.lobby, backend.match, go]);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const queue = backend.queue;
  const mode = queue?.mode === 'ONE_V_ONE' ? '1V1' : '5V5';
  const cancel = async () => { await backend.leaveQueue(); go('play'); };
  return <div className="page search-page"><PageTitle eyebrow="QUEUE ACTIVE" title="SEARCHING FOR MATCH" text="Stay in Pinkward while matchmaking continues." /><div className="search-grid"><Card className="search-card"><div className="search-stats"><span><strong>{mode}</strong><small>{queue?.region ?? 'EUW'}</small></span><span><b>{queue?.primaryRole === 'BOT' ? 'ADC' : queue?.primaryRole ?? 'MID'}</b><small>PRIMARY</small></span><span><b>{queue?.secondaryRole === 'BOT' ? 'ADC' : queue?.secondaryRole ?? 'JUNGLE'}</b><small>SECONDARY</small></span><span className="timer"><strong>{time}</strong><small>elapsed</small></span></div><div className="progress search-progress"><i /></div><p>{queue ? `Searching nearby ${queue.mmr} MMR brackets.` : 'Synchronizing queue status…'}</p><Button kind="danger" onClick={() => void cancel()}>CANCEL SEARCH</Button></Card><Card className="party-card searching-party"><h3>PARTY {backend.party?.members.length ?? 1} / {backend.party?.capacity ?? 5}</h3>{backend.party ? <div className="party-rows">{backend.party.members.map((member) => <div className="party-row" key={member.playerId}><strong>{member.displayName}</strong><span>{member.primaryRole}</span><b className={member.ready ? 'positive' : ''}>{member.ready ? 'READY' : 'WAITING'}</b></div>)}</div> : <PartyRows />}<p>Queue stays active across navigation.</p></Card></div><Card className="queue-strip search-strip"><b>SEARCHING</b><strong>{mode} · {queue?.primaryRole ?? 'MID'}/{queue?.secondaryRole ?? 'JUNGLE'} · {queue?.region ?? 'EUW'}</strong><time>{time}</time><button onClick={() => void cancel()}>CANCEL</button></Card></div>;
}

function Ready({ go }: { go: (page: Page) => void }) {
  const backend = useBackend();
  const [seconds, setSeconds] = useState(() => backend.match ? Math.max(0, Math.ceil((new Date(backend.match.readyDeadline).getTime() - Date.now()) / 1000)) : 0);
  useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (backend.lobby) go('lobby'); }, [backend.lobby, go]);
  const current = backend.match?.players.find((player) => player.playerId === backend.session?.playerId);
  const accept = async () => { await backend.answerReady(true); if (backend.lobby) go('lobby'); };
  const decline = async () => { await backend.answerReady(false); go('play'); };
  const accepted = backend.match?.players.filter((player) => player.readyState === 'ACCEPTED').length ?? 0;
  return <div className="page ready-page"><PageTitle eyebrow="MATCH FOUND" title="READY CHECK" text="Your match is ready. Confirm before the timer expires." /><Card className="ready-card"><h2>{backend.match?.mode === 'ONE_V_ONE' ? '1V1' : '5V5'}</h2><b>{current?.assignedRole === 'BOT' ? 'ADC' : current?.assignedRole ?? 'MID'} · {backend.match?.region ?? 'EUW'}</b><strong>00:{String(seconds).padStart(2, '0')}</strong><small>{accepted} / {backend.match?.players.length ?? 5} PLAYERS READY</small><div className="progress ready-progress"><i /></div><div><Button kind="success" onClick={() => void accept()}>ACCEPT</Button><Button kind="danger" onClick={() => void decline()}>DECLINE</Button></div></Card><Card className="ready-players">{(backend.match?.players ?? []).map((player) => <span className={player.readyState === 'ACCEPTED' ? 'positive' : ''} key={player.playerId}>{player.bot ? 'BOT' : player.playerId.slice(0, 8)} {player.readyState}</span>)}</Card></div>;
}

const blue = [['TOP', 'Nyxara', 'READY'], ['JUNGLE', 'Khaelis', 'READY'], ['MID', 'Rivenous', 'READY'], ['ADC', 'Luneth', 'READY'], ['SUPPORT', 'Zyph', 'READY']];
const red = [['TOP', 'CrimsonFang', 'READY'], ['JUNGLE', 'IronTide', 'READY'], ['MID', 'ShadowReign', 'READY'], ['ADC', 'AquaSplash', 'WAITING'], ['SUPPORT', 'BloodMoon', 'WAITING']];
function Team({ title, players }: { title: string; players: string[][] }) { return <Card className="team-card"><h3>{title}</h3>{players.map(([role, name, status]) => <div className="team-row" key={name}><b>{role}</b><strong>{name}</strong><span className={status === 'READY' ? 'positive' : ''}>{status}</span></div>)}</Card>; }
function Lobby() {
  const backend = useBackend();
  const lobby = backend.lobby;
  const toRows = (team: 'BLUE' | 'RED') => lobby?.players.filter((player) => player.team === team).map((player) => [player.assignedRole === 'BOT' ? 'ADC' : player.assignedRole, player.bot ? 'PINKWARD BOT' : player.playerId.slice(0, 8), player.readyState === 'ACCEPTED' ? 'READY' : player.readyState]) ?? (team === 'BLUE' ? blue : red);
  const ready = lobby?.players.filter((player) => player.readyState === 'ACCEPTED').length ?? 8;
  const total = lobby?.players.length ?? 10;
  return <div className="page lobby-page"><PageTitle title="MATCH LOBBY" text={`${lobby?.mode === 'ONE_V_ONE' ? 'Custom 1v1' : 'Custom 5v5'} · ${lobby?.region ?? 'EUW'} · Lobby ready`} /><div className="lobby-grid"><Team title="BLUE TEAM" players={toRows('BLUE')} /><div className="lobby-status"><Card><small>READY</small><strong>{ready}/{total}</strong><b>{lobby?.lobbyName ?? 'LOBBY'}</b>{lobby?.lobbyPassword && <small>PASSWORD · {lobby.lobbyPassword}</small>}</Card><Button>OPEN</Button></div><Team title="RED TEAM" players={toRows('RED')} /></div></div>;
}

function Matches() {
  const backend = useBackend();
  const [filter, setFilter] = useState('ALL');
  const live = backend.history.map((entry) => [entry.outcome, entry.mode === 'ONE_V_ONE' ? '1V1 Glicko-2' : '5V5 TrueSkill', entry.role === 'BOT' ? 'ADC' : entry.role, '—', `${entry.mmrDelta >= 0 ? '+' : ''}${entry.mmrDelta}`, new Date(entry.playedAt).toLocaleDateString()] as const);
  const rows = backend.session ? live : matches;
  return <div className="page matches-page"><PageTitle title="HISTORY" text={backend.session ? `${backend.history.length} matches loaded from Pinkward.` : 'Sign in to load your competitive matches.'} action={!backend.session ? <Button onClick={() => void backend.login()}>SIGN IN</Button> : undefined} /><div className="tabs">{['ALL', '1V1 GLICKO-2', '5V5 TRUESKILL'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><div className="match-table"><div className="match-head"><span>RESULT</span><span>MODE</span><span>ROLE</span><span>DURATION</span><span>MMR</span><span>DATE</span></div>{rows.filter((m) => filter === 'ALL' || m[1].toUpperCase() === filter).map((m, index) => <div className="match-line" key={`${m[0]}${m[5]}${index}`}><b className={m[0] === 'VICTORY' ? 'positive' : 'negative'}>{m[0]}</b><span>{m[1]}</span><strong>{m[2]}</strong><span>{m[3]}</span><b className={m[4].startsWith('+') ? 'positive' : 'negative'}>{m[4]}</b><span>{m[5]}</span></div>)}</div></div>;
}

function Profile() {
  const backend = useBackend();
  const displayName = backend.profile?.displayName ?? 'NYXARA';
  const region = backend.profile?.region ?? 'EUW';
  const rank = backend.statistics?.rank ?? 'EMERALD II';
  const winRate = backend.statistics ? `${Math.round(backend.statistics.winRate)}%` : '68%';
  const record = backend.statistics ? `${backend.statistics.wins}W — ${backend.statistics.losses}L` : '42W — 20L';
  const mmr = backend.duelStatistics?.mmr ?? backend.statistics?.mmr ?? 1842;
  const roles = [['MID', '68%'], ['JUNGLE', '62%'], ['TOP', '54%'], ['SUPPORT', '48%'], ['ADC', '44%']] as const;
  const champions = [['LeBlanc', 'leblanc', '73%', '58 games'], ['Zed', 'zed', '67%', '52 games'], ['Akali', 'akali', '65%', '40 games'], ['Sylas', 'sylas', '62%', '39 games'], ['Orianna', 'orianna', '58%', '31 games']] as const;
  const recentChampionIcons = ['sylas', 'zed', 'orianna'] as const;
  return <div className="page profile-page"><PageTitle eyebrow="PLAYER PROFILE" title="PROFILE / OVERVIEW" text="Rank, roles and champion performance for the current split." action={!backend.session ? <Button onClick={() => void backend.login()}>SIGN IN</Button> : undefined} /><div className="profile-layout"><aside className="profile-sidebar"><div className="profile-identity"><div className="profile-avatar"><Image className="profile-avatar-image" src="/champion-icons/akali.png" alt="Akali" width={112} height={112} /><span>128</span></div><h2>{displayName.toUpperCase()}</h2><b>#{region}</b><small className={backend.profile?.online ? 'positive' : ''}>{backend.profile?.online ? 'ONLINE' : 'OFFLINE'}</small></div><nav aria-label="Profile sections">{['OVERVIEW', 'MATCH HISTORY', 'CHAMPIONS', 'RANKS', 'HIGHLIGHTS', 'STATS'].map((item) => <button className={item === 'OVERVIEW' ? 'active' : ''} key={item}>{item}</button>)}</nav></aside><div className="profile-main"><Card className="profile-ranks"><div className="rank-overview"><span className="rank-emblem"><Image src="/rank-icons/emerald.png" alt="Emerald rank" width={132} height={132} /></span><div><small>CURRENT RANK</small><strong>{rank}</strong><b>{backend.statistics?.progression ?? 75} LP</b></div></div><div className="rank-overview"><span className="rank-emblem"><Image src="/rank-icons/diamond.png" alt="Diamond rank" width={132} height={132} /></span><div><small>BEST RANK</small><strong>DIAMOND III</strong><b>32 LP</b></div></div><div className="rank-number"><small>WIN RATE</small><strong>{winRate}</strong><b>{record}</b></div><div className="rank-number"><small>PERSONAL ELO</small><strong>{mmr.toLocaleString()}</strong><b>LIVE MMR</b></div></Card><div className="profile-content"><div className="profile-center"><Card className="preferred-roles"><h3>PREFERRED ROLES</h3><div>{roles.map(([role, value]) => <span key={role}><Image src={`/role-icons/${role.toLowerCase()}.svg`} alt="" aria-hidden="true" width={30} height={30} /><b>{role}</b><strong>{value}</strong></span>)}</div><button className="text-button">VIEW MORE STATS →</button></Card><Card className="top-champions"><h3>MOST PLAYED CHAMPIONS</h3><div>{champions.map(([name, icon, rate, games]) => <article key={name}><Image className="champion-portrait" src={`/champion-icons/${icon}.png`} alt={name} width={66} height={66} /><strong>{name}</strong><b>{rate}</b><small>{games}</small></article>)}</div></Card></div><Card className="recent-summary"><h3>RECENT SUMMARY</h3>{matches.slice(0, 3).map((match, index) => <article key={`${match[0]}${match[3]}`}><Image className="champion-portrait" src={`/champion-icons/${recentChampionIcons[index]}.png`} alt="" aria-hidden="true" width={52} height={52} /><span><strong>{match[2]} · {match[3]}</strong><b className={match[0] === 'VICTORY' ? 'positive' : 'negative'}>{match[0]}</b><small>{match[5]}</small></span></article>)}<button className="text-button">VIEW MATCH HISTORY →</button></Card></div></div></div></div>;
}

const leaderboard = {
  '1V1 GLICKO-2': [['Nyxara', '1 842', '42 — 20', '68%'], ['Rivenous', '1 798', '38 — 24', '61%'], ['Khaelis', '1 754', '35 — 22', '61%'], ['Luneth', '1 709', '31 — 25', '55%'], ['Zyph', '1 681', '29 — 26', '53%'], ['Valkyra', '1 642', '27 — 27', '50%'], ['Ashen', '1 617', '25 — 28', '47%'], ['Seraphyne', '1 589', '23 — 30', '43%']],
  '5V5 TRUESKILL': [['Khaelis', '31.8', '51 — 27', '65%'], ['Nyxara', '30.6', '48 — 28', '63%'], ['Rivenous', '29.9', '44 — 31', '59%'], ['Zyph', '28.7', '39 — 33', '54%'], ['Luneth', '27.9', '36 — 35', '51%'], ['Valkyra', '27.1', '34 — 36', '49%'], ['Ashen', '26.4', '31 — 38', '45%'], ['Seraphyne', '25.8', '29 — 40', '42%']],
} as const;

const leaderboardPlayers = {
  Nyxara: ['akali', 'Emerald II'], Rivenous: ['zed', 'Diamond IV'], Khaelis: ['leblanc', 'Diamond IV'], Luneth: ['sylas', 'Emerald I'], Zyph: ['orianna', 'Emerald II'], Valkyra: ['leblanc', 'Emerald III'], Ashen: ['zed', 'Emerald III'], Seraphyne: ['orianna', 'Emerald IV'],
} as const;

function Leaderboard() {
  const backend = useBackend();
  const [category, setCategory] = useState<keyof typeof leaderboard>('1V1 GLICKO-2');
  const apiEntries = category === '1V1 GLICKO-2' ? backend.duelLeaderboard : backend.fiveLeaderboard;
  const rows = backend.session && apiEntries.length ? apiEntries.map((entry) => ({
    id: entry.playerId,
    name: backend.playerNames[entry.playerId] ?? `Player ${entry.playerId.slice(0, 6)}`,
    rating: entry.mmr.toLocaleString(),
    record: `${entry.wins} — ${Math.max(0, entry.games - entry.wins)}`,
    winRate: `${Math.round(entry.winRate)}%`,
    position: entry.position,
    tier: entry.rank ?? 'Glicko-2',
  })) : leaderboard[category].map(([name, rating, record, winRate], index) => ({ id: name, name, rating, record, winRate, position: index + 1, tier: leaderboardPlayers[name][1] }));
  const myIndex = rows.findIndex((row) => row.id === backend.session?.playerId || row.name === 'Nyxara');
  const myPosition = myIndex >= 0 ? rows[myIndex].position : 0;
  const myEntry = myIndex >= 0 ? rows[myIndex] : rows[0];
  const isMe = (id: string, name: string) => id === backend.session?.playerId || (!backend.session && name === 'Nyxara');
  return <div className="page leaderboard-page"><PageTitle eyebrow="SEASON 2025 · SPLIT 02" title="LEADERBOARD" text="The highest-rated Pinkward competitors across EUW." action={!backend.session ? <Button onClick={() => void backend.login()}>SIGN IN FOR LIVE DATA</Button> : undefined} /><div className="leaderboard-overview"><Card className="leaderboard-position"><Image src="/rank-icons/emerald.png" alt="Emerald rank" width={104} height={104} /><span><small>YOUR POSITION</small><strong>#{myPosition ? String(myPosition).padStart(2, '0') : '—'}</strong><b>{backend.profile?.region ?? 'EUW'} · LIVE LADDER</b></span></Card><Card className="leaderboard-stats"><span><small>CURRENT {category === '1V1 GLICKO-2' ? 'RATING' : 'SKILL'}</small><strong>{myEntry?.rating ?? '—'}</strong><b>LIVE</b></span><span><small>SEASON RECORD</small><strong>{myEntry?.record ?? '—'}</strong><b>{backend.statistics?.games ?? 0} MATCHES</b></span><span><small>WIN RATE</small><strong>{myEntry?.winRate ?? '—'}</strong><b className="positive">CURRENT</b></span></Card><Card className="leaderboard-season"><small>LADDER STATUS</small><strong>{rows.length}</strong><span>RANKED COMPETITORS</span><div className="progress"><i /></div><b>SEASON ACTIVE</b></Card></div><div className="tabs">{(Object.keys(leaderboard) as Array<keyof typeof leaderboard>).map((item) => <button className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><div className="leaderboard-table"><div className="leaderboard-head"><span>#</span><span>PLAYER</span><span>{category === '1V1 GLICKO-2' ? 'RATING' : 'SKILL'}</span><span>RECORD</span><span>WIN RATE</span></div>{rows.map((row, index) => { const portrait = ['akali', 'zed', 'leblanc', 'sylas', 'orianna'][index % 5]; return <div className={`leaderboard-row${isMe(row.id, row.name) ? ' is-you' : ''}`} key={row.id}><b>{String(row.position).padStart(2, '0')}</b><div className="leaderboard-player"><Image src={`/champion-icons/${portrait}.png`} alt="" aria-hidden="true" width={40} height={40} /><span><strong>{row.name}{isMe(row.id, row.name) && <small>YOU</small>}</strong><b>{row.tier} · {backend.profile?.region ?? 'EUW'}</b></span></div><span>{row.rating}</span><span>{row.record}</span><b className="positive">{row.winRate}</b></div>; })}</div></div>;
}

function Download() {
  return <div className="page download-page"><PageTitle eyebrow="DESKTOP AGENT" title="SHOWDOWN WATCHER" text="Connect Pinkward to League and validate every duel automatically." /><Card className="download-hero"><div className="download-copy"><span className="release-label"><i />LATEST RELEASE&nbsp;&nbsp;•&nbsp;&nbsp;V0.1.0</span><h2>YOUR DUELS.<br />VERIFIED LOCALLY.</h2><p>Showdown Watcher runs beside the League Client, prepares your duel lobby and reports match objectives to Pinkward in real time.</p><div className="download-actions"><a className="button download-cta" href="/downloads/showdown-watcher-v0.1.0-windows-x64.exe" download>DOWNLOAD FOR WINDOWS</a><span><strong>WINDOWS 10 / 11 · X64</strong><small>5.2 MB&nbsp;&nbsp;•&nbsp;&nbsp;Portable executable</small></span></div></div><div className="watcher-console" aria-label="Watcher connection preview"><div className="console-bar"><span>PINKWARD / WATCHER</span><b>_</b><b>□</b><b>×</b></div><div className="console-body"><small>STATUS</small><strong><i /> WATCHER ONLINE</strong><span><b>LOCAL ENDPOINT</b>127.0.0.1:43991</span><span><b>LEAGUE CLIENT</b>CONNECTED</span><span><b>ACTIVE DUEL</b>WAITING</span><p>&gt; Ready to receive a Pinkward duel.</p></div></div></Card><section className="watcher-features"><Card><b>01</b><h3>LOCAL BY DESIGN</h3><p>The agent only listens on your computer. No public port and no background account access.</p></Card><Card><b>02</b><h3>LEAGUE CONNECTED</h3><p>Uses the local League Client and Live Client Data APIs to follow the lobby and match.</p></Card><Card><b>03</b><h3>FAIR PLAY FIRST</h3><p>No memory reading and no code injection. Only official local game data surfaces are observed.</p></Card></section><Card className="install-card"><div><span className="eyebrow">QUICK INSTALL</span><h2>READY IN THREE STEPS</h2></div><ol><li><b>01</b><span><strong>DOWNLOAD</strong><small>Save the Windows executable.</small></span></li><li><b>02</b><span><strong>OPEN LEAGUE</strong><small>Sign in to the League Client.</small></span></li><li><b>03</b><span><strong>RUN THE WATCHER</strong><small>Keep it open while playing on Pinkward.</small></span></li></ol><p>SHA-256&nbsp;&nbsp;752A27147B63B4B5…ADF76B37289E65</p></Card></div>;
}

function Settings({ go }: { go: (page: Page) => void }) {
  const [settings, setSettings] = useState([true, true, false, true]); const labels = ['Real-time match notifications', 'Automatic lobby handoff', 'In-game overlay', 'Start with Windows'];
  return <div className="page settings-page"><PageTitle title="SETTINGS" /><div className="settings-grid"><Card className="settings-nav">{['ACCOUNT', 'RIOT', 'MATCHMAKING', 'NOTIFICATIONS', 'PRIVACY', 'APPEARANCE', 'DESKTOP COMPANION', 'SECURITY'].map((item) => <button className={item === 'DESKTOP COMPANION' ? 'active' : ''} key={item}>{item}</button>)}</Card><Card className="settings-card"><h2>DESKTOP COMPANION</h2><p>Connect Pinkward Web to the desktop companion and League Client.</p><div className="companion-status"><span><small>COMPANION STATUS</small><strong className="positive">CONNECTED</strong></span><b>Windows 11 · v0.1.0</b></div>{labels.map((label, index) => <button className="setting-row" key={label} onClick={() => setSettings((old) => old.map((v, i) => i === index ? !v : v))}><span>{label}</span><i className={settings[index] ? 'on' : ''}>{settings[index] ? 'ON' : 'OFF'}</i></button>)}<div className="settings-actions"><Button kind="outline">RECONNECT</Button><Button onClick={() => go('download')}>DOWNLOAD WINDOWS</Button></div></Card></div></div>;
}

export default function PinkwardApp() {
  return <BackendProvider><PinkwardExperience /></BackendProvider>;
}

function PinkwardExperience() {
  const [page, setPage] = useState<Page>('home');
  const backend = useBackend();
  const activePage: Page = backend.lobby ? 'lobby' : backend.match?.status === 'READY_CHECK' ? 'ready' : backend.queue && page === 'play' ? 'searching' : page;
  return <Shell page={activePage} setPage={setPage}>{activePage === 'home' && <Home go={setPage} />}{activePage === 'play' && <Play go={setPage} />}{activePage === 'searching' && <Searching go={setPage} />}{activePage === 'ready' && <Ready go={setPage} />}{activePage === 'lobby' && <Lobby />}{activePage === 'matches' && <Matches />}{activePage === 'leaderboard' && <Leaderboard />}{activePage === 'download' && <Download />}{activePage === 'profile' && <Profile />}{activePage === 'settings' && <Settings go={setPage} />}</Shell>;
}
