import React, { useState, useEffect, useRef } from 'react';
import { Flame, Terminal, Cpu, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from '../i18n/TranslationContext';

interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isTarget: boolean;
  block: number; // Block membership (0, 1, 2)
}

interface ActiveEdge {
  source: number;
  target: number;
  reward: number;
  isTarget: boolean;
}

const SAMPLE_NAMES = ['Chloe', 'Lucas', 'Ava', 'Daniel', 'Maya', 'Leo', 'Sophia', 'Liam', 'Zoe', 'Ryan',];

const STATIC_EDGES_LIST = [
  { from: 0, to: 2 }, // Target 1 - Random 1
  { from: 0, to: 5 }, // Target 1 - Random 4
  { from: 1, to: 3 }, // Target 2 - Random 2
  { from: 1, to: 6 }, // Target 2 - Random 5
  { from: 4, to: 2 }, // Random 3 - Random 1
  { from: 4, to: 3 }, // Random 3 - Random 2
  { from: 4, to: 5 }, // Random 3 - Random 4
  { from: 4, to: 6 }, // Random 3 - Random 5
  { from: 7, to: 5 }, // Random 6 - Random 4
  { from: 7, to: 6 }, // Random 6 - Random 5
];

const SAMPLEABLE_EDGES = [
  [0, 2], [0, 4], [0, 5], [0, 7],
  [1, 3], [1, 4], [1, 6], [1, 7],
  [2, 3], [2, 4], [2, 5], [2, 7],
  [3, 4], [3, 6], [3, 7],
  [4, 5], [4, 6], [4, 7],
  [5, 6], [5, 7],
  [6, 7]
];

const getPlaceholderNodes = (n1: string, n2: string, placeholder1: string = 'Partner A', placeholder2: string = 'Partner B'): GraphNode[] => [
  { id: '0', name: n1.trim() || placeholder1, x: 80, y: 175, isTarget: true, block: 0 },
  { id: '1', name: n2.trim() || placeholder2, x: 420, y: 175, isTarget: true, block: 1 },
  { id: '2', name: 'Chloe', x: 180, y: 80, isTarget: false, block: 0 },
  { id: '3', name: 'Lucas', x: 320, y: 80, isTarget: false, block: 1 },
  { id: '4', name: 'Ava', x: 250, y: 130, isTarget: false, block: 2 },
  { id: '5', name: 'Daniel', x: 180, y: 270, isTarget: false, block: 0 },
  { id: '6', name: 'Maya', x: 320, y: 270, isTarget: false, block: 1 },
  { id: '7', name: 'Leo', x: 250, y: 220, isTarget: false, block: 2 },
];

export const InteractiveWidgets: React.FC = () => {
  const { t } = useTranslation();
  // Input Names
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [verdict, setVerdict] = useState('');
  const [calculating, setCalculating] = useState(false);

  // Live Machine Learning Simulation States
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeEdge, setActiveEdge] = useState<ActiveEdge | null>(null);
  const [simStep, setSimStep] = useState<'idle' | 'clustering' | 'sampling' | 'converging' | 'done'>('idle');

  const terminalRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  // Update target node names in real time as the user types
  useEffect(() => {
    if (simStep === 'idle') {
      setNodes(getPlaceholderNodes(name1, name2, t('widgets.partnerAPlaceholder'), t('widgets.partnerBPlaceholder')));
    }
  }, [name1, name2, simStep, t]);

  // Auto scroll console logs to the bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

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

  const handlePredictAlignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name1.trim() || !name2.trim()) return;

    // Calculate match score (consistent hash based on names)
    const combined = (name1.trim() + name2.trim()).toLowerCase();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = 70 + Math.abs(hash % 31);

    // Pick 6 random nodes names
    const shuffled = [...SAMPLE_NAMES].sort(() => 0.5 - Math.random());
    const selectedNames = shuffled.slice(0, 6);

    const initialNodes: GraphNode[] = [
      { id: '0', name: name1.trim(), x: 80, y: 175, isTarget: true, block: 0 },
      { id: '1', name: name2.trim(), x: 420, y: 175, isTarget: true, block: 1 },
      { id: '2', name: selectedNames[0], x: 180, y: 80, isTarget: false, block: 0 },
      { id: '3', name: selectedNames[1], x: 320, y: 80, isTarget: false, block: 1 },
      { id: '4', name: selectedNames[2], x: 250, y: 130, isTarget: false, block: 2 },
      { id: '5', name: selectedNames[3], x: 180, y: 270, isTarget: false, block: 0 },
      { id: '6', name: selectedNames[4], x: 320, y: 270, isTarget: false, block: 1 },
      { id: '7', name: selectedNames[5], x: 250, y: 220, isTarget: false, block: 2 },
    ];

    clearAllTimers();
    setNodes(initialNodes);
    setCalculating(true);
    setResult(null);
    setSimStep('clustering');
    setLogs([t('widgets.logInit')]);

    // SBM block assignment
    const t1 = setTimeout(() => {
      setLogs((prev) => [...prev, t('widgets.logPartitioning')]);
    }, 400);

    const t2 = setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        t('widgets.logAssignComplete'),
        t('widgets.logBlock0', { n1: name1.trim(), n2: selectedNames[0], n3: selectedNames[3] }),
        t('widgets.logBlock1', { n1: name2.trim(), n2: selectedNames[1], n3: selectedNames[4] }),
        t('widgets.logBlock2', { n1: selectedNames[2], n2: selectedNames[5] }),
      ]);
    }, 900);

    // Multi-armed bandit sampling
    const t3 = setTimeout(() => {
      setSimStep('sampling');
      setLogs((prev) => [
        ...prev,
        t('widgets.logBanditInit'),
        t('widgets.logBanditTesting'),
      ]);

      let pullCount = 1;
      intervalRef.current = setInterval(() => {
        if (pullCount > 8) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        const randomEdgeIndex = Math.floor(Math.random() * SAMPLEABLE_EDGES.length);
        const [sourceIdx, targetIdx] = SAMPLEABLE_EDGES[randomEdgeIndex];
        const reward = 0.05 + Math.random() * 0.35;

        setActiveEdge({ source: sourceIdx, target: targetIdx, reward, isTarget: false });
        setLogs((prev) => [
          ...prev,
          t('widgets.logBanditPull', {
            pullCount,
            n1: initialNodes[sourceIdx].name,
            n2: initialNodes[targetIdx].name,
            reward: reward.toFixed(4)
          }),
        ]);
        pullCount++;
      }, 350) as unknown as number;
    }, 1600);

    // Link Prediction Convergence
    const t4 = setTimeout(() => {
      setSimStep('converging');
      setActiveEdge(null);
      setLogs((prev) => [
        ...prev,
        t('widgets.logDenseComplete'),
      ]);
    }, 1600 + 8 * 350 + 200);

    const t5 = setTimeout(() => {
      setActiveEdge({ source: 0, target: 1, reward: score / 100, isTarget: true });
      setLogs((prev) => [
        ...prev,
        t('widgets.logTargetPull', {
          n1: name1.trim(),
          n2: name2.trim(),
          reward: (score / 100).toFixed(4)
        }),
        t('widgets.logPredictConverged', {
          reward: (score / 100).toFixed(4)
        }),
      ]);
    }, 1600 + 8 * 350 + 700);

    const t6 = setTimeout(() => {
      setSimStep('done');
      setCalculating(false);
      setResult(score);
      setActiveEdge(null);

      // Verbiage based on score
      let localVerdict = '';
      if (score >= 95) {
        localVerdict = t('widgets.verdictSoulmates');
        confetti({
          particleCount: 80,
          spread: 70,
          colors: ['#fda4af', '#f43f5e', '#a855f7'],
        });
      } else if (score >= 85) {
        localVerdict = t('widgets.verdictPassion');
        confetti({
          particleCount: 50,
          spread: 60,
          colors: ['#fbbf24', '#f43f5e'],
        });
      } else {
        localVerdict = t('widgets.verdictCozy');
      }
      setVerdict(localVerdict);
    }, 1600 + 8 * 350 + 1700);

    timerRefs.current = [t1, t2, t3, t4, t5, t6] as unknown as number[];
  };

  const resetCalculator = () => {
    clearAllTimers();
    setName1('');
    setName2('');
    setResult(null);
    setVerdict('');
    setCalculating(false);
    setSimStep('idle');
    setActiveEdge(null);
    setLogs([]);
    setNodes(getPlaceholderNodes('', '', t('widgets.partnerAPlaceholder'), t('widgets.partnerBPlaceholder')));
  };

  const getActiveEdgeCoords = () => {
    if (!activeEdge) return null;
    const sourceNode = nodes[activeEdge.source];
    const targetNode = nodes[activeEdge.target];
    if (!sourceNode || !targetNode) return null;
    return {
      x1: sourceNode.x,
      y1: sourceNode.y,
      x2: targetNode.x,
      y2: targetNode.y,
      isTarget: activeEdge.isTarget,
      reward: activeEdge.reward,
    };
  };

  const activeCoords = getActiveEdgeCoords();

  const getStaticEdges = () => {
    return STATIC_EDGES_LIST.map((edge) => {
      const sourceNode = nodes[edge.from];
      const targetNode = nodes[edge.to];
      if (!sourceNode || !targetNode) return null;
      return {
        x1: sourceNode.x,
        y1: sourceNode.y,
        x2: targetNode.x,
        y2: targetNode.y,
      };
    }).filter(Boolean);
  };

  const renderedStaticEdges = getStaticEdges();

  const renderLogLine = (log: string, index: number) => {
    let colorClass = 'text-slate-400';
    if (log.startsWith('[Stochastic Block Model]')) {
      colorClass = 'text-amber-400';
    } else if (log.startsWith('[Multi-Armed Bandit]')) {
      colorClass = 'text-cyan-400';
    } else if (log.startsWith('[Link Prediction]')) {
      colorClass = 'text-[var(--accent-gold)]';
    } else if (log.includes('Optimal Link!') || log.includes('converged:')) {
      colorClass = 'text-emerald-400 font-semibold';
    }
    return (
      <div key={index} className={`font-mono text-[10px] leading-relaxed ${colorClass}`}>
        {log}
      </div>
    );
  };

  return (
    <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[85vh] lg:min-h-[90vh]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-border)]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[var(--accent-gold)]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2 mb-1">
          <Flame className="w-6 h-6 text-[var(--accent-gold)] fill-[var(--accent-gold)]" />
          {t('widgets.calculatorTitle')}
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {t('widgets.calculatorDesc')}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {simStep === 'idle' ? (
          <div className="space-y-6">
            <form onSubmit={handlePredictAlignment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    {t('widgets.nameOne')}
                  </label>
                  <input
                    type="text"
                    value={name1}
                    onChange={(e) => setName1(e.target.value)}
                    placeholder={t('widgets.nameOnePlaceholder')}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    {t('widgets.nameTwo')}
                  </label>
                  <input
                    type="text"
                    value={name2}
                    onChange={(e) => setName2(e.target.value)}
                    placeholder={t('widgets.nameTwoPlaceholder')}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={calculating}
                className="w-full py-3 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold shadow-md transition-all duration-300 transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Cpu className="w-4 h-4" />
                {t('widgets.btnPredict')}
              </button>
            </form>
          </div>
        ) : simStep === 'done' && result !== null ? (
          <div className="animate-fade-in flex flex-col items-center justify-center py-4">
            <div className="relative w-40 h-40 flex items-center justify-center select-none">
              {/* Glowing Heart Ring */}
              <div className="absolute inset-0 bg-[var(--accent-gold)]/10 rounded-full blur-md animate-pulse"></div>
              <svg
                className="w-full h-full text-[var(--accent-gold)] drop-shadow-[0_0_8px_rgba(212,175,55,0.25)]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--bg-canvas)] mt-1">
                <span className="text-3xl font-extrabold font-mono leading-none">{result}%</span>
                <span className="text-[10px] font-bold tracking-widest uppercase font-sans">{t('widgets.matchLabel')}</span>
              </div>
            </div>

            <p className="mt-4 text-2xl font-medium text-[var(--text-main)] text-center font-serif leading-relaxed italic">
              "{verdict}"
            </p>

            <button
              onClick={resetCalculator}
              className="mt-6 flex items-center gap-1.5 px-4.5 py-2 rounded-full border border-[var(--accent-border)]/30 hover:bg-[var(--accent-border)]/15 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('widgets.btnReset')}
            </button>
          </div>
        ) : (
          /* Actively Simulating Progress Card */
          <div className="flex flex-col items-center justify-center p-6 bg-white/10 dark:bg-slate-900/10 border border-[var(--accent-border)]/20 rounded-2xl animate-pulse min-h-[180px]">
            <Cpu className="w-12 h-12 text-[var(--accent-gold)] animate-spin mb-4" style={{ animationDuration: '3.5s' }} />
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-1 font-serif uppercase tracking-wider">
              {t('widgets.simTitle')}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] text-center max-w-xs font-mono">
              {simStep === 'clustering' && t('widgets.simClustering')}
              {simStep === 'sampling' && t('widgets.simSampling')}
              {simStep === 'converging' && t('widgets.simConverging')}
            </p>
          </div>
        )}
      </div>

      {/* Main split grid: 12 columns. 7 for visualizer, 5 for control panel/terminal */}
      <div className="flex-1 space-y-10 mt-6">
        {/* LEFT COLUMN: SVG Network Graph Visualizer (7 cols) */}
        <div className="flex flex-col justify-center h-full min-h-[300px] lg:min-h-[460px] relative">
          <svg
            viewBox="0 0 500 350"
            className="w-full h-[550px] min-h-[520px] lg:min-h-[460px] bg-slate-950/60 rounded-2xl border border-[var(--accent-border)]/20 overflow-hidden shadow-inner"
          >
            {/* SBM Blocks Background Clusters */}
            {simStep !== 'idle' && (
              <>
                {/* Block 0 (Left Block) */}
                <ellipse
                  cx="140"
                  cy="175"
                  rx="100"
                  ry="110"
                  fill="var(--accent-gold)"
                  fillOpacity="0.02"
                  stroke="var(--accent-gold)"
                  strokeOpacity="0.08"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                {/* Block 1 (Right Block) */}
                <ellipse
                  cx="360"
                  cy="175"
                  rx="100"
                  ry="110"
                  fill="var(--accent-green)"
                  fillOpacity="0.02"
                  stroke="var(--accent-green)"
                  strokeOpacity="0.08"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                {/* Block 2 (Bridge Block) */}
                <ellipse
                  cx="250"
                  cy="175"
                  rx="50"
                  ry="90"
                  fill="var(--text-muted)"
                  fillOpacity="0.01"
                  stroke="var(--text-muted)"
                  strokeOpacity="0.06"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              </>
            )}

            {/* Static background edges */}
            {renderedStaticEdges.map((edge, idx) => (
              <line
                key={`static-${idx}`}
                x1={edge?.x1}
                y1={edge?.y1}
                x2={edge?.x2}
                y2={edge?.y2}
                stroke="var(--text-muted)"
                strokeOpacity="0.12"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}

            {/* Active sampling edge */}
            {activeCoords && (
              <line
                x1={activeCoords.x1}
                y1={activeCoords.y1}
                x2={activeCoords.x2}
                y2={activeCoords.y2}
                stroke={activeCoords.isTarget ? 'var(--accent-gold)' : 'var(--accent-green)'}
                strokeWidth={activeCoords.isTarget ? '3.5' : '2'}
                className="transition-all"
                style={{
                  filter: activeCoords.isTarget
                    ? 'drop-shadow(0 0 8px var(--accent-gold))'
                    : 'drop-shadow(0 0 4px var(--accent-green))',
                }}
              />
            )}

            {/* Final predicted optimal edge (drawn when done/converged) */}
            {(simStep === 'converging' || simStep === 'done') && (
              <line
                x1={nodes[0]?.x}
                y1={nodes[0]?.y}
                x2={nodes[1]?.x}
                y2={nodes[1]?.y}
                stroke="var(--accent-gold)"
                strokeWidth="4"
                className="animate-pulse"
                style={{
                  filter: 'drop-shadow(0 0 12px var(--accent-gold))',
                }}
              />
            )}

            {/* Render nodes */}
            {nodes.map((node) => (
              <g key={node.id} className="transition-all duration-300">
                {/* Ring indicator for active node evaluations */}
                {activeEdge && (Number(node.id) === activeEdge.source || Number(node.id) === activeEdge.target) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
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
                  r={node.isTarget ? 15 : 10}
                  fill={node.isTarget ? 'var(--accent-gold)' : 'var(--bg-canvas)'}
                  stroke={node.isTarget ? 'var(--bg-canvas)' : 'var(--accent-border)'}
                  strokeWidth={node.isTarget ? '3' : '1.5'}
                  className="transition-all"
                  style={{
                    filter: node.isTarget ? 'drop-shadow(0 0 6px var(--accent-gold))' : 'none',
                  }}
                />

                {/* Small heart indicator inside target nodes */}
                {node.isTarget && (
                  <path
                    d={`M ${node.x} ${node.y + 4.5} C ${node.x - 5} ${node.y - 1} ${node.x - 5} ${node.y - 5.5} ${node.x} ${node.y - 3} C ${node.x + 5} ${node.y - 5.5} ${node.x + 5} ${node.y - 1} ${node.x} ${node.y + 4.5} Z`}
                    fill="var(--bg-canvas)"
                  />
                )}

                {/* Node label */}
                <text
                  x={node.x}
                  y={node.isTarget ? node.y - 20 : node.y - 14}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold tracking-wide fill-[var(--text-main)] ${node.isTarget ? 'font-serif text-[11px] font-extrabold fill-[var(--accent-gold)]' : 'font-sans opacity-70'
                    }`}
                >
                  {node.name}
                </text>
              </g>
            ))}
          </svg>

          {/* Status Badge overlay */}
          {simStep !== 'idle' && (
            <div className="absolute top-3 right-3 px-3 py-1 rounded-md bg-slate-950/80 border border-slate-800 flex items-center gap-1.5 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${simStep === 'done' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`} />
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-mono font-bold">
                {simStep === 'clustering'
                  ? t('widgets.statusClustering')
                  : simStep === 'sampling'
                    ? t('widgets.statusSampling')
                    : simStep === 'converging'
                      ? t('widgets.statusConverging')
                      : t('widgets.statusConverged')}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Control Panel & Terminal console logs (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6 h-full">
          {simStep !== 'idle' && (
            <div className="flex flex-col h-48 lg:h-64 justify-end">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border-t border-l border-r border-slate-800 rounded-t-xl text-[10px] text-[var(--text-muted)] font-mono select-none">
                <Terminal className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                <span>prediction_console.log</span>
              </div>
              <div
                ref={terminalRef}
                className="bg-slate-950 border border-slate-800 p-3 rounded-b-xl h-full overflow-y-auto font-mono text-[9.5px] flex flex-col gap-1 shadow-inner scrollbar-thin"
              >
                {logs.map((log, index) => renderLogLine(log, index))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveWidgets;
