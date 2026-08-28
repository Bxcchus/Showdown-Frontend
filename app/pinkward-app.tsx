'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';

type Page = 'home' | 'play' | 'searching' | 'ready' | 'lobby' | 'matches' | 'leaderboard' | 'profile' | 'settings';
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
  const nav: Array<[Page, string]> = [['home', 'HOME'], ['play', 'PLAY'], ['matches', 'MATCHES'], ['leaderboard', 'LEADERBOARD']];
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
  return <div className="page home-page"><div className="home-top"><Card className="season-card"><span className="eyebrow">CURRENT SEASON</span><h1>ASCENSION // SPLIT 02</h1><p>Competitive matchmaking for League of Legends.</p><Button onClick={() => go('play')}>FIND MATCH</Button><small>Season ends in 24d 14h</small></Card><Card className="rank-card"><span className="eyebrow">YOUR RANK</span><h2>EMERALD II</h2><b>1482 MMR</b><div className="progress"><i /></div><p>56% WIN RATE&nbsp;&nbsp;•&nbsp;&nbsp;128 MATCHES</p></Card></div><div className="home-bottom"><div><h3 className="section-label">YOUR PARTY</h3><Card className="party-card"><PartyRows /><button className="text-button">+ INVITE PLAYER</button></Card></div><div><h3 className="section-label">RECENT MATCHES</h3><Card className="recent-card">{matches.slice(0, 3).map((m) => <div className="recent-row" key={`${m[0]}${m[3]}`}><b className={m[0] === 'VICTORY' ? 'positive' : 'negative'}>{m[0]}</b><span>{m[1].startsWith('5V5') ? '5V5' : '1V1'}</span><strong>{m[2]}</strong><span>{m[3]}</span><b className={m[4].startsWith('+') ? 'positive' : 'negative'}>{m[4]}</b></div>)}<button className="text-button align-right" onClick={() => go('matches')}>VIEW ALL MATCHES</button></Card></div></div><Card className="queue-strip"><span><small>NOT IN QUEUE</small><strong>5V5 · EUW · MID / JUNGLE</strong></span><Button onClick={() => go('play')}>FIND MATCH</Button></Card></div>;
}

function RolePicker({ label, value, blocked, onChange }: { label: string; value: Role; blocked: Role; onChange: (role: Role) => void }) {
  const roles: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
  const icons: Record<Role, string> = { TOP: 'top', JUNGLE: 'jungle', MID: 'mid', ADC: 'adc', SUPPORT: 'support' };
  return <fieldset><legend>{label}</legend><div className="role-picker">{roles.map((role) => <button type="button" key={role} disabled={role === blocked} className={value === role ? 'selected' : ''} onClick={() => onChange(role)} aria-pressed={value === role}><Image src={`/role-icons/${icons[role]}.svg`} alt="" aria-hidden="true" width={28} height={28} /><span>{role}</span></button>)}</div></fieldset>;
}

function Play({ go }: { go: (page: Page) => void }) {
  const [mode, setMode] = useState('5V5'); const [primary, setPrimary] = useState<Role>('MID'); const [secondary, setSecondary] = useState<Role>('JUNGLE');
  return <div className="page play-page"><PageTitle title="PLAY / MATCHMAKING" text="Configure your queue in one pass." /><div className="play-grid"><section className="play-form"><fieldset><legend>MODE</legend><div className="mode-picker">{['1V1', '5V5', 'CUSTOM'].map((item) => <button type="button" key={item} className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{item}</button>)}</div></fieldset><label className="input-label">REGION<span className="select-box">EUW — Europe West</span></label><RolePicker label="PRIMARY ROLE" value={primary} blocked={secondary} onChange={setPrimary} /><RolePicker label="SECONDARY ROLE" value={secondary} blocked={primary} onChange={setSecondary} /></section><Card className="party-card play-party"><h3>PARTY 3 / 5</h3><PartyRows /><button className="text-button">+ INVITE PLAYER</button></Card></div><Card className="queue-strip queue-strip--active"><span><strong>{mode} · EUW · {primary} / {secondary}</strong><small>Estimated wait 01:45</small></span><Button onClick={() => go('searching')}>FIND MATCH</Button></Card></div>;
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
  const [filter, setFilter] = useState('1V1 GLICKO-2');
  return <div className="page matches-page"><PageTitle title="MATCH HISTORY" text="Your recent competitive matches." /><div className="tabs">{['1V1 GLICKO-2', '5V5 TRUESKILL'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><div className="match-table"><div className="match-head"><span>RESULT</span><span>MODE</span><span>ROLE</span><span>DURATION</span><span>MMR</span><span>DATE</span></div>{matches.filter((m) => m[1].toUpperCase() === filter).map((m) => <div className="match-line" key={`${m[0]}${m[3]}`}><b className={m[0] === 'VICTORY' ? 'positive' : 'negative'}>{m[0]}</b><span>{m[1]}</span><strong>{m[2]}</strong><span>{m[3]}</span><b className={m[4].startsWith('+') ? 'positive' : 'negative'}>{m[4]}</b><span>{m[5]}</span></div>)}</div></div>;
}

function Profile() { return <div className="page profile-page"><PageTitle title="PROFILE" /><Card className="profile-hero"><h1>NYXARA #EUW</h1><p className="positive">Emerald II&nbsp;&nbsp;•&nbsp;&nbsp;MID main&nbsp;&nbsp;•&nbsp;&nbsp;Online</p><div><span><b>128</b> MATCHES</span><span><b>56%</b> WIN RATE</span><span><b>1482</b> MMR</span></div></Card><div className="tabs"><button className="active">OVERVIEW</button><button>MATCHES</button><button>STATISTICS</button><button>RIOT</button></div><div className="profile-grid"><Card><h3>SEASON STATISTICS</h3>{[['Matches', '128'], ['Win rate', '56%'], ['KDA', '2.8'], ['Avg. duration', '31:42'], ['Positive MMR', '+164']].map(([a,b]) => <div className="stat-row" key={a}><span>{a}</span><b className={a === 'Positive MMR' ? 'positive' : ''}>{b}</b></div>)}</Card><Card><h3>ROLE PROFILE</h3>{[['MID', 48], ['JUNGLE', 28], ['SUPPORT', 14], ['TOP', 6], ['ADC', 4]].map(([role, value]) => <div className="role-stat" key={role}><b>{role}</b><div><i style={{width:`${value}%`}} /></div><span>{value}%</span></div>)}</Card></div></div>; }

const leaderboard = {
  '1V1 GLICKO-2': [['Nyxara', '1 842', '42 — 20', '68%'], ['Rivenous', '1 798', '38 — 24', '61%'], ['Khaelis', '1 754', '35 — 22', '61%'], ['Luneth', '1 709', '31 — 25', '55%'], ['Zyph', '1 681', '29 — 26', '53%']],
  '5V5 TRUESKILL': [['Khaelis', '31.8', '51 — 27', '65%'], ['Nyxara', '30.6', '48 — 28', '63%'], ['Rivenous', '29.9', '44 — 31', '59%'], ['Zyph', '28.7', '39 — 33', '54%'], ['Luneth', '27.9', '36 — 35', '51%']],
} as const;

function Leaderboard() {
  const [category, setCategory] = useState<keyof typeof leaderboard>('1V1 GLICKO-2');
  return <div className="page leaderboard-page"><PageTitle title="LEADERBOARD" text="The highest-rated Pinkward competitors." /><div className="tabs">{(Object.keys(leaderboard) as Array<keyof typeof leaderboard>).map((item) => <button className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><div className="leaderboard-table"><div className="leaderboard-head"><span>#</span><span>PLAYER</span><span>{category === '1V1 GLICKO-2' ? 'RATING' : 'SKILL'}</span><span>RECORD</span><span>WIN RATE</span></div>{leaderboard[category].map(([name, rating, record, winRate], index) => <div className={`leaderboard-row${name === 'Nyxara' ? ' is-you' : ''}`} key={name}><b>{String(index + 1).padStart(2, '0')}</b><strong>{name}{name === 'Nyxara' && <small>YOU</small>}</strong><span>{rating}</span><span>{record}</span><b className="positive">{winRate}</b></div>)}</div></div>;
}

function Settings() {
  const [settings, setSettings] = useState([true, true, false, true]); const labels = ['Real-time match notifications', 'Automatic lobby handoff', 'In-game overlay', 'Start with Windows'];
  return <div className="page settings-page"><PageTitle title="SETTINGS" /><div className="settings-grid"><Card className="settings-nav">{['ACCOUNT', 'RIOT', 'MATCHMAKING', 'NOTIFICATIONS', 'PRIVACY', 'APPEARANCE', 'DESKTOP COMPANION', 'SECURITY'].map((item) => <button className={item === 'DESKTOP COMPANION' ? 'active' : ''} key={item}>{item}</button>)}</Card><Card className="settings-card"><h2>DESKTOP COMPANION</h2><p>Connect Pinkward Web to the desktop companion and League Client.</p><div className="companion-status"><span><small>COMPANION STATUS</small><strong className="positive">CONNECTED</strong></span><b>Windows 11 · v2.4.1</b></div>{labels.map((label, index) => <button className="setting-row" key={label} onClick={() => setSettings((old) => old.map((v, i) => i === index ? !v : v))}><span>{label}</span><i className={settings[index] ? 'on' : ''}>{settings[index] ? 'ON' : 'OFF'}</i></button>)}<div className="settings-actions"><Button kind="outline">RECONNECT</Button><Button>DOWNLOAD WINDOWS</Button></div></Card></div></div>;
}

export default function PinkwardApp() {
  const [page, setPage] = useState<Page>('home');
  return <Shell page={page} setPage={setPage}>{page === 'home' && <Home go={setPage} />}{page === 'play' && <Play go={setPage} />}{page === 'searching' && <Searching go={setPage} />}{page === 'ready' && <Ready go={setPage} />}{page === 'lobby' && <Lobby />}{page === 'matches' && <Matches />}{page === 'leaderboard' && <Leaderboard />}{page === 'profile' && <Profile />}{page === 'settings' && <Settings />}</Shell>;
}
