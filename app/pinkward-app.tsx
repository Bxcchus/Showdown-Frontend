'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';

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
  const current = page === 'searching' || page === 'ready' || page === 'lobby' ? 'play' : page;
  const nav: Array<[Page, string]> = [['home', 'HOME'], ['play', 'PLAY'], ['matches', 'HISTORY'], ['leaderboard', 'LEADERBOARD'], ['profile', 'PROFILE'], ['download', 'DOWNLOAD']];
  return <div className="app-shell"><header className="topbar"><button className="wordmark" onClick={() => setPage('home')}>PINKWARD</button><nav aria-label="Primary navigation">{nav.map(([id, label]) => <button key={id} className={current === id ? 'active' : ''} onClick={() => setPage(id)}>{label}</button>)}</nav><div className="account-links"><button onClick={() => setPage('profile')}>NYXARA</button><button className="online" onClick={() => setPage('settings')}>EUW · ONLINE</button></div></header><main>{children}</main></div>;
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

function RolePicker({ label, value, blocked, onChange }: { label: string; value: Role; blocked: Role; onChange: (role: Role) => void }) {
  const roles: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  const icons: Record<Role, string> = { TOP: 'top', JUNGLE: 'jungle', MID: 'mid', ADC: 'adc', SUPPORT: 'support' };
  return <fieldset><legend>{label}</legend><div className="role-picker">{roles.map((role) => <button type="button" key={role} disabled={role === blocked} className={value === role ? 'selected' : ''} onClick={() => onChange(role)} aria-pressed={value === role}><Image src={`/role-icons/${icons[role]}.svg`} alt="" aria-hidden="true" width={28} height={28} /><span>{role}</span></button>)}</div></fieldset>;
}

function Play({ go }: { go: (page: Page) => void }) {
  const [mode, setMode] = useState('1V1'); const [primary, setPrimary] = useState<Role>('MID'); const [secondary, setSecondary] = useState<Role>('JUNGLE'); const [groupSize, setGroupSize] = useState(2);
  const modes = [{ id: '1V1', label: '1V1', subtitle: 'ARAM · Glicko-2', title: 'ARAM', icon: '/mode-icons/aram.png', activeIcon: '/mode-icons/aram-active.png' }, { id: '5V5', label: '5V5', subtitle: "SUMMONER'S RIFT · TrueSkill", title: "SUMMONER'S RIFT", icon: '/mode-icons/summoners-rift.png', activeIcon: '/mode-icons/summoners-rift-active.png' }] as const;
  const selectedMode = modes.find((item) => item.id === mode) ?? modes[0];
  return <div className="page play-page"><div className="play-shell-grid"><Card className="play-config"><div className="play-config-head"><span className="eyebrow">COMPETITIVE QUEUE</span><h1>{selectedMode.title}</h1><p>Match with players near your rating and preferred role.</p></div><div className="central-mode-picker" aria-label="Game mode">{modes.map((item) => <button type="button" key={item.id} className={mode === item.id ? 'selected' : ''} onClick={() => setMode(item.id)}><span className="mode-icon" aria-hidden="true"><Image className="mode-icon-idle" src={item.icon} alt="" width={42} height={42} /><Image className="mode-icon-active" src={item.activeIcon} alt="" width={42} height={42} /></span><span><strong>{item.label}</strong><small>{item.subtitle}</small></span></button>)}</div><label className="play-region"><span>REGION</span><strong>EUW — Europe West</strong><button type="button">CHANGE →</button></label><RolePicker label="PRIMARY ROLE" value={primary} blocked={secondary} onChange={setPrimary} /><RolePicker label="SECONDARY ROLE" value={secondary} blocked={primary} onChange={setSecondary} /><div className="play-actions"><Button onClick={() => go('searching')}>FIND MATCH</Button><button className="queue-settings" type="button" aria-label="Queue settings">⚙</button></div></Card><Card className="play-side"><h3>PARTY</h3><PartyRows compact /><button className="invite-row" type="button"><span>+</span> INVITE PLAYER <b>›</b></button><div className="group-size"><h3>GROUP SIZE</h3><div>{[1, 2, 3, 5].map((size) => <button type="button" className={groupSize === size ? 'selected' : ''} onClick={() => setGroupSize(size)} key={size}>{size}</button>)}</div></div><div className="play-rank"><Image src="/rank-icons/emerald.png" alt="Emerald rank" width={78} height={78} /><span><small>RANK</small><strong>EMERALD II</strong><b>75 LP</b></span></div></Card></div></div>;
}

function Searching({ go }: { go: (page: Page) => void }) {
  const [seconds, setSeconds] = useState(102);
  useEffect(() => { const tick = window.setInterval(() => setSeconds((v) => v + 1), 1000); const found = window.setTimeout(() => go('ready'), 9000); return () => { clearInterval(tick); clearTimeout(found); }; }, [go]);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <div className="page search-page"><PageTitle eyebrow="QUEUE ACTIVE" title="SEARCHING FOR MATCH" text="Stay in Pinkward while matchmaking continues." /><div className="search-grid"><Card className="search-card"><div className="search-stats"><span><strong>5V5</strong><small>EUW</small></span><span><b>MID</b><small>PRIMARY</small></span><span><b>JUNGLE</b><small>SECONDARY</small></span><span className="timer"><strong>{time}</strong><small>elapsed</small></span></div><div className="progress search-progress"><i /></div><p>Searching nearby MMR brackets.</p><Button kind="danger" onClick={() => go('play')}>CANCEL SEARCH</Button></Card><Card className="party-card searching-party"><h3>PARTY 3 / 5</h3><PartyRows /><p>Queue stays active across navigation.</p></Card></div><Card className="queue-strip search-strip"><b>SEARCHING</b><strong>5V5 · MID/JUNGLE · EUW</strong><time>{time}</time><button onClick={() => go('play')}>CANCEL</button></Card></div>;
}

function Ready({ go }: { go: (page: Page) => void }) {
  return <div className="page ready-page"><PageTitle eyebrow="MATCH FOUND" title="READY CHECK" text="Your match is ready. Confirm before the timer expires." /><Card className="ready-card"><h2>5V5</h2><b>MID · EUW</b><strong>00:24</strong><small>4 / 5 PLAYERS READY</small><div className="progress ready-progress"><i /></div><div><Button kind="success" onClick={() => go('lobby')}>ACCEPT</Button><Button kind="danger" onClick={() => go('play')}>DECLINE</Button></div></Card><Card className="ready-players">{['Nyxara READY', 'Khaelis READY', 'Rivenous READY', 'Luneth READY', 'Zyph WAITING'].map((p) => <span className={p.includes('READY') ? 'positive' : ''} key={p}>{p}</span>)}</Card></div>;
}

const blue = [['TOP', 'Nyxara', 'READY'], ['JUNGLE', 'Khaelis', 'READY'], ['MID', 'Rivenous', 'READY'], ['ADC', 'Luneth', 'READY'], ['SUPPORT', 'Zyph', 'READY']];
const red = [['TOP', 'CrimsonFang', 'READY'], ['JUNGLE', 'IronTide', 'READY'], ['MID', 'ShadowReign', 'READY'], ['ADC', 'AquaSplash', 'WAITING'], ['SUPPORT', 'BloodMoon', 'WAITING']];
function Team({ title, players }: { title: string; players: string[][] }) { return <Card className="team-card"><h3>{title}</h3>{players.map(([role, name, status]) => <div className="team-row" key={name}><b>{role}</b><strong>{name}</strong><span className={status === 'READY' ? 'positive' : ''}>{status}</span></div>)}</Card>; }
function Lobby() { return <div className="page lobby-page"><PageTitle title="MATCH LOBBY" text="Custom 5v5 · EUW · Lobby ready" /><div className="lobby-grid"><Team title="BLUE TEAM" players={blue} /><div className="lobby-status"><Card><small>READY</small><strong>8/10</strong><b>00:17</b></Card><Button>OPEN</Button></div><Team title="RED TEAM" players={red} /></div></div>; }

function Matches() {
  const [filter, setFilter] = useState('ALL');
  return <div className="page matches-page"><PageTitle title="HISTORY" text="Your recent competitive matches." /><div className="tabs">{['ALL', '1V1 GLICKO-2', '5V5 TRUESKILL'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><div className="match-table"><div className="match-head"><span>RESULT</span><span>MODE</span><span>ROLE</span><span>DURATION</span><span>MMR</span><span>DATE</span></div>{matches.filter((m) => filter === 'ALL' || m[1].toUpperCase() === filter).map((m) => <div className="match-line" key={`${m[0]}${m[3]}`}><b className={m[0] === 'VICTORY' ? 'positive' : 'negative'}>{m[0]}</b><span>{m[1]}</span><strong>{m[2]}</strong><span>{m[3]}</span><b className={m[4].startsWith('+') ? 'positive' : 'negative'}>{m[4]}</b><span>{m[5]}</span></div>)}</div></div>;
}

function Profile() {
  const roles = [['MID', '68%'], ['JUNGLE', '62%'], ['TOP', '54%'], ['SUPPORT', '48%'], ['ADC', '44%']] as const;
  const champions = [['LeBlanc', 'leblanc', '73%', '58 games'], ['Zed', 'zed', '67%', '52 games'], ['Akali', 'akali', '65%', '40 games'], ['Sylas', 'sylas', '62%', '39 games'], ['Orianna', 'orianna', '58%', '31 games']] as const;
  const recentChampionIcons = ['sylas', 'zed', 'orianna'] as const;
  return <div className="page profile-page"><PageTitle eyebrow="PLAYER PROFILE" title="PROFILE / OVERVIEW" text="Rank, roles and champion performance for the current split." /><div className="profile-layout"><aside className="profile-sidebar"><div className="profile-identity"><div className="profile-avatar"><Image className="profile-avatar-image" src="/champion-icons/akali.png" alt="Akali" width={112} height={112} /><span>128</span></div><h2>NYXARA</h2><b>#EUW</b><small className="positive">ONLINE</small></div><nav aria-label="Profile sections">{['OVERVIEW', 'MATCH HISTORY', 'CHAMPIONS', 'RANKS', 'HIGHLIGHTS', 'STATS'].map((item) => <button className={item === 'OVERVIEW' ? 'active' : ''} key={item}>{item}</button>)}</nav></aside><div className="profile-main"><Card className="profile-ranks"><div className="rank-overview"><span className="rank-emblem"><Image src="/rank-icons/emerald.png" alt="Emerald rank" width={132} height={132} /></span><div><small>CURRENT RANK</small><strong>EMERALD II</strong><b>75 LP</b></div></div><div className="rank-overview"><span className="rank-emblem"><Image src="/rank-icons/diamond.png" alt="Diamond rank" width={132} height={132} /></span><div><small>BEST RANK</small><strong>DIAMOND III</strong><b>32 LP</b></div></div><div className="rank-number"><small>WIN RATE</small><strong>68%</strong><b>42W — 20L</b></div><div className="rank-number"><small>PERSONAL ELO</small><strong>1 842</strong><b>TOP 7%</b></div></Card><div className="profile-content"><div className="profile-center"><Card className="preferred-roles"><h3>PREFERRED ROLES</h3><div>{roles.map(([role, value]) => <span key={role}><Image src={`/role-icons/${role.toLowerCase()}.svg`} alt="" aria-hidden="true" width={30} height={30} /><b>{role}</b><strong>{value}</strong></span>)}</div><button className="text-button">VIEW MORE STATS →</button></Card><Card className="top-champions"><h3>MOST PLAYED CHAMPIONS</h3><div>{champions.map(([name, icon, winRate, games]) => <article key={name}><Image className="champion-portrait" src={`/champion-icons/${icon}.png`} alt={name} width={66} height={66} /><strong>{name}</strong><b>{winRate}</b><small>{games}</small></article>)}</div></Card></div><Card className="recent-summary"><h3>RECENT SUMMARY</h3>{matches.slice(0, 3).map((match, index) => <article key={`${match[0]}${match[3]}`}><Image className="champion-portrait" src={`/champion-icons/${recentChampionIcons[index]}.png`} alt="" aria-hidden="true" width={52} height={52} /><span><strong>{match[2]} · {match[3]}</strong><b className={match[0] === 'VICTORY' ? 'positive' : 'negative'}>{match[0]}</b><small>{match[5]}</small></span></article>)}<button className="text-button">VIEW MATCH HISTORY →</button></Card></div></div></div></div>;
}

const leaderboard = {
  '1V1 GLICKO-2': [['Nyxara', '1 842', '42 — 20', '68%'], ['Rivenous', '1 798', '38 — 24', '61%'], ['Khaelis', '1 754', '35 — 22', '61%'], ['Luneth', '1 709', '31 — 25', '55%'], ['Zyph', '1 681', '29 — 26', '53%'], ['Valkyra', '1 642', '27 — 27', '50%'], ['Ashen', '1 617', '25 — 28', '47%'], ['Seraphyne', '1 589', '23 — 30', '43%']],
  '5V5 TRUESKILL': [['Khaelis', '31.8', '51 — 27', '65%'], ['Nyxara', '30.6', '48 — 28', '63%'], ['Rivenous', '29.9', '44 — 31', '59%'], ['Zyph', '28.7', '39 — 33', '54%'], ['Luneth', '27.9', '36 — 35', '51%'], ['Valkyra', '27.1', '34 — 36', '49%'], ['Ashen', '26.4', '31 — 38', '45%'], ['Seraphyne', '25.8', '29 — 40', '42%']],
} as const;

const leaderboardPlayers = {
  Nyxara: ['akali', 'Emerald II'], Rivenous: ['zed', 'Diamond IV'], Khaelis: ['leblanc', 'Diamond IV'], Luneth: ['sylas', 'Emerald I'], Zyph: ['orianna', 'Emerald II'], Valkyra: ['leblanc', 'Emerald III'], Ashen: ['zed', 'Emerald III'], Seraphyne: ['orianna', 'Emerald IV'],
} as const;

function Leaderboard() {
  const [category, setCategory] = useState<keyof typeof leaderboard>('1V1 GLICKO-2');
  const myPosition = leaderboard[category].findIndex(([name]) => name === 'Nyxara') + 1;
  const myEntry = leaderboard[category][myPosition - 1];
  return <div className="page leaderboard-page"><PageTitle eyebrow="SEASON 2025 · SPLIT 02" title="LEADERBOARD" text="The highest-rated Pinkward competitors across EUW." /><div className="leaderboard-overview"><Card className="leaderboard-position"><Image src="/rank-icons/emerald.png" alt="Emerald rank" width={104} height={104} /><span><small>YOUR POSITION</small><strong>#{String(myPosition).padStart(2, '0')}</strong><b>TOP 0.8% · EUW</b></span></Card><Card className="leaderboard-stats"><span><small>CURRENT {category === '1V1 GLICKO-2' ? 'RATING' : 'SKILL'}</small><strong>{myEntry[1]}</strong><b>+42 THIS WEEK</b></span><span><small>SEASON RECORD</small><strong>{myEntry[2]}</strong><b>128 MATCHES</b></span><span><small>WIN RATE</small><strong>{myEntry[3]}</strong><b className="positive">+4.2%</b></span></Card><Card className="leaderboard-season"><small>LADDER STATUS</small><strong>4 728</strong><span>ACTIVE COMPETITORS</span><div className="progress"><i /></div><b>RESET IN 24 DAYS</b></Card></div><div className="tabs">{(Object.keys(leaderboard) as Array<keyof typeof leaderboard>).map((item) => <button className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><div className="leaderboard-table"><div className="leaderboard-head"><span>#</span><span>PLAYER</span><span>{category === '1V1 GLICKO-2' ? 'RATING' : 'SKILL'}</span><span>RECORD</span><span>WIN RATE</span></div>{leaderboard[category].map(([name, rating, record, winRate], index) => { const [portrait, tier] = leaderboardPlayers[name]; return <div className={`leaderboard-row${name === 'Nyxara' ? ' is-you' : ''}`} key={name}><b>{String(index + 1).padStart(2, '0')}</b><div className="leaderboard-player"><Image src={`/champion-icons/${portrait}.png`} alt="" aria-hidden="true" width={40} height={40} /><span><strong>{name}{name === 'Nyxara' && <small>YOU</small>}</strong><b>{tier} · EUW</b></span></div><span>{rating}</span><span>{record}</span><b className="positive">{winRate}</b></div>; })}</div></div>;
}

function Download() {
  return <div className="page download-page"><PageTitle eyebrow="DESKTOP AGENT" title="SHOWDOWN WATCHER" text="Connect Pinkward to League and validate every duel automatically." /><Card className="download-hero"><div className="download-copy"><span className="release-label"><i />LATEST RELEASE&nbsp;&nbsp;•&nbsp;&nbsp;V0.1.0</span><h2>YOUR DUELS.<br />VERIFIED LOCALLY.</h2><p>Showdown Watcher runs beside the League Client, prepares your duel lobby and reports match objectives to Pinkward in real time.</p><div className="download-actions"><a className="button download-cta" href="/downloads/showdown-watcher-v0.1.0-windows-x64.exe" download>DOWNLOAD FOR WINDOWS</a><span><strong>WINDOWS 10 / 11 · X64</strong><small>5.2 MB&nbsp;&nbsp;•&nbsp;&nbsp;Portable executable</small></span></div></div><div className="watcher-console" aria-label="Watcher connection preview"><div className="console-bar"><span>PINKWARD / WATCHER</span><b>_</b><b>□</b><b>×</b></div><div className="console-body"><small>STATUS</small><strong><i /> WATCHER ONLINE</strong><span><b>LOCAL ENDPOINT</b>127.0.0.1:43991</span><span><b>LEAGUE CLIENT</b>CONNECTED</span><span><b>ACTIVE DUEL</b>WAITING</span><p>&gt; Ready to receive a Pinkward duel.</p></div></div></Card><section className="watcher-features"><Card><b>01</b><h3>LOCAL BY DESIGN</h3><p>The agent only listens on your computer. No public port and no background account access.</p></Card><Card><b>02</b><h3>LEAGUE CONNECTED</h3><p>Uses the local League Client and Live Client Data APIs to follow the lobby and match.</p></Card><Card><b>03</b><h3>FAIR PLAY FIRST</h3><p>No memory reading and no code injection. Only official local game data surfaces are observed.</p></Card></section><Card className="install-card"><div><span className="eyebrow">QUICK INSTALL</span><h2>READY IN THREE STEPS</h2></div><ol><li><b>01</b><span><strong>DOWNLOAD</strong><small>Save the Windows executable.</small></span></li><li><b>02</b><span><strong>OPEN LEAGUE</strong><small>Sign in to the League Client.</small></span></li><li><b>03</b><span><strong>RUN THE WATCHER</strong><small>Keep it open while playing on Pinkward.</small></span></li></ol><p>SHA-256&nbsp;&nbsp;752A27147B63B4B5…ADF76B37289E65</p></Card></div>;
}

function Settings({ go }: { go: (page: Page) => void }) {
  const [settings, setSettings] = useState([true, true, false, true]); const labels = ['Real-time match notifications', 'Automatic lobby handoff', 'In-game overlay', 'Start with Windows'];
  return <div className="page settings-page"><PageTitle title="SETTINGS" /><div className="settings-grid"><Card className="settings-nav">{['ACCOUNT', 'RIOT', 'MATCHMAKING', 'NOTIFICATIONS', 'PRIVACY', 'APPEARANCE', 'DESKTOP COMPANION', 'SECURITY'].map((item) => <button className={item === 'DESKTOP COMPANION' ? 'active' : ''} key={item}>{item}</button>)}</Card><Card className="settings-card"><h2>DESKTOP COMPANION</h2><p>Connect Pinkward Web to the desktop companion and League Client.</p><div className="companion-status"><span><small>COMPANION STATUS</small><strong className="positive">CONNECTED</strong></span><b>Windows 11 · v0.1.0</b></div>{labels.map((label, index) => <button className="setting-row" key={label} onClick={() => setSettings((old) => old.map((v, i) => i === index ? !v : v))}><span>{label}</span><i className={settings[index] ? 'on' : ''}>{settings[index] ? 'ON' : 'OFF'}</i></button>)}<div className="settings-actions"><Button kind="outline">RECONNECT</Button><Button onClick={() => go('download')}>DOWNLOAD WINDOWS</Button></div></Card></div></div>;
}

export default function PinkwardApp() {
  const [page, setPage] = useState<Page>('home');
  return <Shell page={page} setPage={setPage}>{page === 'home' && <Home go={setPage} />}{page === 'play' && <Play go={setPage} />}{page === 'searching' && <Searching go={setPage} />}{page === 'ready' && <Ready go={setPage} />}{page === 'lobby' && <Lobby />}{page === 'matches' && <Matches />}{page === 'leaderboard' && <Leaderboard />}{page === 'download' && <Download />}{page === 'profile' && <Profile />}{page === 'settings' && <Settings go={setPage} />}</Shell>;
}
