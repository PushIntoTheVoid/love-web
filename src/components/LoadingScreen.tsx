import React, { useState, useEffect, useRef } from 'react';
import { Heart, Cpu, ArrowRight, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from '../i18n/TranslationContext';

interface LoadingScreenProps {
  onComplete: () => void;
}

interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isTarget: boolean;
  block: number;
}

interface StaticEdge {
  from: number;
  to: number;
}

const DESKTOP_RANDOM_NAMES = [
  'Zoe', 'Lucas', 'Ava', 'Daniel', 'Maya', 'Leo', 'Chloe', 'Ryan',
  'Sophia', 'Liam', 'Emma', 'Noah', 'Isabella', 'James', 'Mia', 'Ethan',
];

const DESKTOP_COORDS = [
  { x: 150, y: 120 }, { x: 220, y: 80 }, { x: 110, y: 200 }, { x: 250, y: 220 },
  { x: 80, y: 320 }, { x: 180, y: 250 }, { x: 210, y: 380 }, { x: 120, y: 450 },
  { x: 320, y: 140 }, { x: 350, y: 280 }, { x: 450, y: 100 }, { x: 520, y: 240 },
  { x: 480, y: 380 }, { x: 620, y: 150 }, { x: 580, y: 320 }, { x: 680, y: 80 },
  { x: 750, y: 200 }, { x: 880, y: 150 }, { x: 820, y: 100 }, { x: 720, y: 280 },
];

const MOBILE_RANDOM_NAMES = [
  'Zoe', 'Lucas', 'Ava', 'Daniel', 'Maya', 'Leo', 'Chloe', 'Ryan',
  'Sophia', 'Liam', 'Emma', 'Noah', 'Isabella', 'James', 'Mia', 'Ethan'
];

const MOBILE_COORDS = [
  { x: 120, y: 90 }, { x: 280, y: 90 }, { x: 200, y: 130 }, { x: 100, y: 170 },
  { x: 300, y: 170 }, { x: 200, y: 210 }, { x: 70, y: 250 }, { x: 330, y: 250 },
  { x: 120, y: 350 }, { x: 280, y: 350 }, { x: 200, y: 390 }, { x: 100, y: 430 },
  { x: 300, y: 430 }, { x: 200, y: 470 }, { x: 140, y: 510 }, { x: 260, y: 510 },
  { x: 150, y: 120 }, { x: 220, y: 80 }, { x: 110, y: 200 }, { x: 250, y: 220 },
  { x: 80, y: 320 }, { x: 180, y: 250 }, { x: 210, y: 380 }, { x: 120, y: 450 }
];

// Helper to get network nodes list based on viewport aspect ratio
const getNetworkNodesList = (n1: string, n2: string, isMobile: boolean): GraphNode[] => {
  const target1 = n1.trim() || 'Partner A';
  const target2 = n2.trim() || 'Partner B';

  if (isMobile) {
    const list: GraphNode[] = [
      { id: '0', name: target1, x: 60, y: 300, isTarget: true, block: 0 },
      { id: '1', name: target2, x: 340, y: 300, isTarget: true, block: 1 },
    ];
    MOBILE_COORDS.forEach((coord, idx) => {
      let block = 2;
      if (coord.x < 180) block = 0;
      else if (coord.x > 220) block = 1;
      list.push({
        id: String(idx + 2),
        name: MOBILE_RANDOM_NAMES[idx] || `Node_${idx}`,
        x: coord.x,
        y: coord.y,
        isTarget: false,
        block,
      });
    });
    return list;
  } else {
    const list: GraphNode[] = [
      { id: '0', name: target1, x: 150, y: 300, isTarget: true, block: 0 },
      { id: '1', name: target2, x: 850, y: 300, isTarget: true, block: 1 },

    ];
    DESKTOP_COORDS.forEach((coord, idx) => {
      let block = 2;
      if (coord.x < 350) block = 0;
      else if (coord.x > 650) block = 1;
      list.push({
        id: String(idx + 2),
        name: DESKTOP_RANDOM_NAMES[idx] || `Node_${idx}`,
        x: coord.x,
        y: coord.y,
        isTarget: false,
        block,
      });
    });
    return list;
  }
};

// Automatically calculate proximity edges in the graph
const calculateProximityEdges = (nodesList: GraphNode[], threshold: number): StaticEdge[] => {
  const edges: StaticEdge[] = [];
  for (let i = 0; i < nodesList.length; i++) {
    for (let j = i + 1; j < nodesList.length; j++) {
      if (i === 0 && j === 1) continue; // Skip target direct connection
      const dx = nodesList[i].x - nodesList[j].x;
      const dy = nodesList[i].y - nodesList[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < threshold) {
        edges.push({ from: i, to: j });
      }
    }
  }
  return edges;
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  // Input Names
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Loading sequence steps: 'form' | 'graph' | 'orbit' | 'collision' | 'done'
  const [step, setStep] = useState<'form' | 'graph' | 'orbit' | 'collision' | 'done'>('form');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [staticEdges, setStaticEdges] = useState<StaticEdge[]>([]);
  const [activeEdge, setActiveEdge] = useState<{ source: number; target: number; isTarget: boolean } | null>(null);
  const [tickerMessage, setTickerMessage] = useState('');
  const [collisionFlash, setCollisionFlash] = useState(false);

  const timerRefs = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  // Resize listener to adapt visual nodes viewports dynamically
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-fill names from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sweetheart_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name1) setName1(parsed.name1);
        if (parsed.name2) setName2(parsed.name2);
      } catch (e) {
        console.error('Failed to pre-fill names in loading screen', e);
      }
    }
  }, []);

  const clearAllTimers = () => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name1.trim() || !name2.trim()) return;

    // Save profile configurations or update existing ones
    const saved = localStorage.getItem('sweetheart_profile');
    let currentProfile = saved ? JSON.parse(saved) : null;
    if (!currentProfile) {
      currentProfile = {
        name1: name1.trim(),
        name2: name2.trim(),
        anniversaryDate: '2024-02-14',
        theme: 'aurora',
        isHeartsEnabled: true,
        bgStyle: 'gradient',
        spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX7rOY2tEV667',
      };
    } else {
      currentProfile.name1 = name1.trim();
      currentProfile.name2 = name2.trim();
    }
    localStorage.setItem('sweetheart_profile', JSON.stringify(currentProfile));

    // Initialize Network Nodes based on current viewport aspect ratio
    const nodesList = getNetworkNodesList(name1.trim(), name2.trim(), isMobile);
    const edgesList = calculateProximityEdges(nodesList, isMobile ? 120 : 150);

    setNodes(nodesList);
    setStaticEdges(edgesList);
    setStep('graph');
    setTickerMessage(t('loading.tickerInitializing'));

    // SBM Cluster Logs Ticker
    const t1 = setTimeout(() => {
      setTickerMessage(t('loading.tickerCommunities'));
    }, 600);

    // Filter edges to only include those connected to target 0 (Partner 1) or target 1 (Partner 2)
    const targetRelatedEdges = edgesList.filter(
      (edge) => edge.from === 0 || edge.to === 0 || edge.from === 1 || edge.to === 1
    );

    // Multi-armed bandit testing edges (slower, centered on the couple, lasting 5+ seconds)
    const t2 = setTimeout(() => {
      setTickerMessage(t('loading.tickerTesting'));

      let pullCount = 1;
      intervalRef.current = setInterval(() => {
        if (pullCount > 15) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        const listToSample = targetRelatedEdges.length > 0 ? targetRelatedEdges : edgesList;
        const randomEdgeIndex = Math.floor(Math.random() * listToSample.length);
        const edge = listToSample[randomEdgeIndex];
        if (edge) {
          setActiveEdge({ source: edge.from, target: edge.to, isTarget: false });
          setTickerMessage(t('loading.tickerPullArm', {
            pullCount,
            n1: nodesList[edge.from].name,
            n2: nodesList[edge.to].name,
            reward: (0.05 + Math.random() * 0.38).toFixed(4)
          }));
        }
        pullCount++;
      }, 350) as unknown as number;
    }, 1200);

    // Convergence (at 6.6s, after 15 pulls * 350ms = 5.25s of active sampling)
    const t3 = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setActiveEdge({ source: 0, target: 1, isTarget: true });
      setTickerMessage(t('loading.tickerConverged', {
        n1: name1.trim(),
        n2: name2.trim()
      }));
    }, 6600);

    // Transition to 3D Orbit (at 8.0s)
    const t4 = setTimeout(() => {
      setStep('orbit');
      setActiveEdge(null);
    }, 8000);

    // Collision (at 12.0s, which is 8.0s + 4.0s for the orbit duration)
    const t5 = setTimeout(() => {
      setStep('collision');
      setCollisionFlash(true);

      // Trigger explosion confetti
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#fda4af', '#f43f5e', '#fbbf24', '#38bdf8', '#34d399'],
      });

      const tFlash = setTimeout(() => {
        setCollisionFlash(false);
        setStep('done');
      }, 350) as unknown as number;
      timerRefs.current.push(tFlash);

    }, 12000);

    timerRefs.current = [t1, t2, t3, t4, t5] as unknown as number[];
  };

  const renderedStaticEdges = staticEdges.map((edge) => {
    const src = nodes[edge.from];
    const tgt = nodes[edge.to];
    if (!src || !tgt) return null;
    return { x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y };
  }).filter(Boolean);

  const activeCoords = activeEdge && nodes[activeEdge.source] && nodes[activeEdge.target] ? {
    x1: nodes[activeEdge.source].x,
    y1: nodes[activeEdge.source].y,
    x2: nodes[activeEdge.target].x,
    y2: nodes[activeEdge.target].y,
    isTarget: activeEdge.isTarget,
  } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-canvas)] overflow-hidden">
      {/* Background soft ambient particles */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-[var(--accent-border)]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-[var(--accent-gold)]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Collision overlay flash */}
      {collisionFlash && (
        <div className="absolute inset-0 bg-white/90 dark:bg-white z-50 animate-fade-in transition-all duration-200"></div>
      )}

      {/* STEP 1: Name Entry Form */}
      {step === 'form' && (
        <div className="glass p-8 rounded-3xl max-w-md w-full text-center relative mx-4 animate-scale-up shadow-2xl z-20">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-[var(--bg-canvas)] border border-[var(--accent-border)]/40 flex items-center justify-center shadow-lg">
            <Heart className="w-10 h-10 text-[var(--accent-gold)] fill-[var(--accent-gold)] animate-heart-pulse" />
          </div>

          <h2 className="text-3xl font-serif font-bold text-[var(--text-main)] mt-8 mb-2">
            {t('loading.appName')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            {t('loading.formDesc')}
          </p>

          <form onSubmit={handleUnlock} className="space-y-5 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {t('settings.nameOne')}
              </label>
              <input
                type="text"
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                placeholder={t('loading.placeholderOne')}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)] shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {t('settings.nameTwo')}
              </label>
              <input
                type="text"
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                placeholder={t('loading.placeholderTwo')}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)] shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold shadow-md transition-all duration-300 transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm font-sans"
            >
              {t('loading.btnUnlock')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Full-screen Graph community and Link prediction simulation */}
      {step === 'graph' && (
        <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-8 z-10 animate-fade-in">
          {/* Top Hud Header */}
          <div className="z-20 text-left">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2.5">
              <Cpu className="w-5.5 h-5.5 text-[var(--accent-gold)] animate-spin" style={{ animationDuration: '6s' }} />
              {t('loading.hudTitle')}
            </h3>
            <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-mono tracking-wide mt-1 select-none">
              {t('loading.hudDesc')}
            </p>
          </div>

          {/* Full Screen SVG Graph Visualizer */}
          <svg
            viewBox={isMobile ? '0 0 400 600' : '0 0 1000 600'}
            className="absolute inset-0 w-full h-full z-0 opacity-80"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* SBM Communities backgrounds */}
            {isMobile ? (
              <>
                <circle cx="110" cy="300" r="100" fill="var(--accent-gold)" fillOpacity="0.012" stroke="var(--accent-gold)" strokeOpacity="0.04" strokeDasharray="3,3" />
                <circle cx="290" cy="300" r="100" fill="var(--accent-green)" fillOpacity="0.012" stroke="var(--accent-green)" strokeOpacity="0.04" strokeDasharray="3,3" />
              </>
            ) : (
              <>
                <circle cx="250" cy="300" r="220" fill="var(--accent-gold)" fillOpacity="0.012" stroke="var(--accent-gold)" strokeOpacity="0.04" strokeDasharray="4,4" />
                <circle cx="750" cy="300" r="220" fill="var(--accent-green)" fillOpacity="0.012" stroke="var(--accent-green)" strokeOpacity="0.04" strokeDasharray="4,4" />
              </>
            )}

            {/* Static nodes connections */}
            {renderedStaticEdges.map((edge, idx) => (
              <line
                key={idx}
                x1={edge?.x1}
                y1={edge?.y1}
                x2={edge?.x2}
                y2={edge?.y2}
                stroke="var(--text-muted)"
                strokeOpacity="0.11"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}

            {/* Sampling edge flash */}
            {activeCoords && (
              <line
                x1={activeCoords.x1}
                y1={activeCoords.y1}
                x2={activeCoords.x2}
                y2={activeCoords.y2}
                stroke={activeCoords.isTarget ? 'var(--accent-gold)' : 'var(--accent-green)'}
                strokeWidth={activeCoords.isTarget ? '4.5' : '2'}
                style={{
                  filter: activeCoords.isTarget
                    ? 'drop-shadow(0 0 10px var(--accent-gold))'
                    : 'drop-shadow(0 0 4px var(--accent-green))',
                }}
              />
            )}

            {/* Final predicted optimal edge (drawn when converged) */}
            {activeEdge?.isTarget && (
              <line
                x1={nodes[0]?.x}
                y1={nodes[0]?.y}
                x2={nodes[1]?.x}
                y2={nodes[1]?.y}
                stroke="var(--accent-gold)"
                strokeWidth="4"
                // className="animate-pulse"
                style={{
                  filter: 'drop-shadow(0 0 12px var(--accent-gold))',
                }}
              />
            )}

            {/* Render nodes */}
            {nodes.map((node) => (
              <g key={node.id} className="transition-all">
                {/* Ping rings on active evaluations */}
                {activeEdge && (Number(node.id) === activeEdge.source || Number(node.id) === activeEdge.target) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.isTarget ? '24' : '15'}
                    fill="none"
                    stroke={activeEdge.isTarget ? 'var(--accent-gold)' : 'var(--accent-green)'}
                    strokeWidth="1.5"
                  // className="animate-ping"
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.isTarget ? 13 : 8}
                  fill={node.isTarget ? 'var(--accent-gold)' : 'var(--bg-canvas)'}
                  stroke={node.isTarget ? 'var(--bg-canvas)' : 'var(--accent-border)'}
                  strokeWidth={node.isTarget ? '2.5' : '1.5'}
                  style={{
                    filter: node.isTarget ? 'drop-shadow(0 0 5px var(--accent-gold))' : 'none',
                  }}
                />

                {/* Heart inside targets */}
                {node.isTarget && (
                  <path
                    d={`M ${node.x} ${node.y + 4.5} C ${node.x - 5} ${node.y - 1} ${node.x - 5} ${node.y - 5.5} ${node.x} ${node.y - 3} C ${node.x + 5} ${node.y - 5.5} ${node.x + 5} ${node.y - 1} ${node.x} ${node.y + 4.5} Z`}
                    fill="var(--bg-canvas)"
                  />
                )}

                {/* Node label text */}
                <text
                  x={node.x}
                  y={node.isTarget ? node.y - 18 : node.y - 12}
                  textAnchor="middle"
                  className={`text-[8.5px] font-semibold tracking-wide fill-[var(--text-main)] ${node.isTarget ? 'font-serif text-[10px] font-bold fill-[var(--accent-gold)]' : 'font-sans opacity-60 text-[8px]'
                    }`}
                >
                  {node.name}
                </text>
              </g>
            ))}
          </svg>

          {/* Bottom HUD Ticker Message */}
          <div className="z-20 text-left font-mono text-[10px] md:text-xs text-[var(--accent-gold)] animate-pulse select-none bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl max-w-xl shadow-lg">
            {tickerMessage}
          </div>
        </div>
      )}

      {/* STEP 3: 3D Hearts spiraling perspective orbit */}
      {step === 'orbit' && (
        <div className="flex flex-col items-center justify-center text-center px-4 animate-fade-in relative">
          <div className="absolute -top-20 z-10">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-[var(--text-main)] uppercase tracking-widest animate-pulse">
              {t('loading.convergenceTitle')}
            </h3>
            <p className="text-xs text-[var(--text-muted)] italic font-serif mt-1 max-w-xs">
              {t('loading.convergenceQuote')}
            </p>
          </div>

          {/* Orbit space tilted in 3D */}
          <div className="orbit-space z-0">
            <div className="orbit-system-left">
              <div className="orbit-heart-left">
                <Heart className="w-14 h-14 text-rose-500 fill-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.65)] animate-pulse" />
              </div>
            </div>

            <div className="orbit-system-right">
              <div className="orbit-heart-right">
                <Heart className="w-14 h-14 text-[var(--accent-gold)] fill-[var(--accent-gold)] drop-shadow-[0_0_12px_var(--accent-gold)] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Merged big heart and unlock trigger */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in max-w-md z-20">
          {/* Merged pulsating heart */}
          <div className="relative animate-heart-pulse select-none flex items-center justify-center">
            {/* Glowing radial circles */}
            <div className="absolute inset-0 -m-8 animate-pulse-slow rounded-full bg-[var(--accent-gold)]/15 blur-2xl pointer-events-none"></div>

            <svg
              className="w-full h-full text-[var(--accent-gold)] drop-shadow-[0_0_20px_rgba(212,175,55,0.45)]"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>

            {/* Centered names in romantic font */}
            <div className="absolute inset-0 flex items-center justify-center flex-col p-4 text-center mt-2">
              <span className="font-romantic text-3xl text-[var(--bg-canvas)] font-bold select-none leading-tight max-w-[140px] truncate">
                {name1}
              </span>
              <span className="text-lg text-[var(--bg-canvas)]/70 font-semibold uppercase tracking-widest leading-none my-0.5">&</span>
              <span className="font-romantic text-3xl text-[var(--bg-canvas)] font-bold select-none leading-tight max-w-[140px] truncate">
                {name2}
              </span>
            </div>
          </div>

          <h2 className="mt-8 font-serif text-3xl font-bold tracking-wide text-[var(--text-main)]">
            {t('loading.convergenceCompleted')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] italic font-serif mt-1.5 max-w-xs">
            {t('loading.convergenceSubtext')}
          </p>

          <button
            onClick={onComplete}
            className="mt-8 flex items-center gap-2 px-8 py-3 rounded-full bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 transform cursor-pointer text-sm animate-bounce"
            style={{ animationDuration: '3s' }}
          >
            <Play className="w-4 h-4 fill-current" />
            {t('loading.btnEnter')}
          </button>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
