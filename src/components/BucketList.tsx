import React, { useState, useEffect } from 'react';
import type { BucketItem } from '../types';
import { Sparkles, Trash2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from '../i18n/TranslationContext';


export const BucketList: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<BucketItem[]>([]);
  const [newTitle, setNewTitle] = useState('');

  // Load items on mount
  useEffect(() => {
    const saved = localStorage.getItem('sweetheart_bucket');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse bucket list', e);
      }
    } else {
      // Seed default items
      const defaults: BucketItem[] = [
        { id: '1', title: t('bucket.defaultGoal1'), completed: false },
        { id: '2', title: t('bucket.defaultGoal2'), completed: true, completedAt: new Date().toLocaleDateString() },
        { id: '3', title: t('bucket.defaultGoal3'), completed: false },
        { id: '4', title: t('bucket.defaultGoal4'), completed: false },
        { id: '5', title: t('bucket.defaultGoal5'), completed: false },
      ];
      setItems(defaults);
      localStorage.setItem('sweetheart_bucket', JSON.stringify(defaults));
    }
  }, []);

  const saveItems = (updated: BucketItem[]) => {
    setItems(updated);
    localStorage.setItem('sweetheart_bucket', JSON.stringify(updated));
  };

  const handleToggle = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const completed = !item.completed;
        
        // Trigger small celebration burst on check
        if (completed) {
          confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#fda4af', '#f43f5e', '#a855f7'],
          });
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#fda4af', '#f43f5e', '#a855f7'],
          });
        }

        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toLocaleDateString() : undefined,
        };
      }
      return item;
    });
    saveItems(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: BucketItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      completed: false,
    };

    const updated = [...items, newItem];
    saveItems(updated);
    setNewTitle('');
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  // Stats
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden">
      {/* Soft light glow */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--accent-border)]/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--accent-gold)]" />
            {t('bucket.title')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('bucket.subtitle')}
          </p>
        </div>

        {/* Dynamic Progress circular-style card */}
        <div className="flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 border border-[var(--accent-border)]/30 px-4 py-2 rounded-2xl">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Simple circular visual */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                className="text-[var(--accent-green)] transition-all duration-500"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercent / 100)}`}
              />
            </svg>
            <span className="absolute text-xs font-bold font-mono text-[var(--text-main)]">
              {progressPercent}%
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {t('bucket.completed')}
            </div>
            <div className="text-sm font-bold text-[var(--text-main)] font-mono">
              {t('bucket.goalsCount', { completed, total })}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar for smaller layout */}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mb-6 md:hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent-border)] to-[var(--accent-green)] transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Add New Goal Form */}
      <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t('bucket.inputPlaceholder')}
          required
          maxLength={100}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)]"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold transition-all shadow-sm cursor-pointer text-sm"
        >
          {t('bucket.btnAdd')}
        </button>
      </form>

      {/* Bucket List Items Grid/List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-400 font-serif italic">
            {t('bucket.empty')}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                item.completed
                  ? 'bg-slate-100/30 dark:bg-slate-950/20 border-slate-200/50 dark:border-slate-800/40 text-slate-400'
                  : 'bg-white/50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-900/60 hover:border-[var(--accent-gold)]/40 hover:bg-white/80 dark:hover:bg-slate-950/80 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 select-none">
                <button
                  type="button"
                  className={`flex-shrink-0 transition-transform active:scale-90 ${
                    item.completed ? 'text-[var(--accent-green)]' : 'text-slate-400'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5.5 h-5.5 fill-[var(--accent-green)]/10 text-[var(--accent-green)]" />
                  ) : (
                    <div className="w-5.5 h-5.5 rounded-md border-2 border-[var(--accent-border)] hover:border-[var(--accent-gold)]" />
                  )}
                </button>

                <div className="flex flex-col">
                  <span className={`text-sm font-medium leading-relaxed ${item.completed ? 'line-through opacity-70' : 'text-[var(--text-main)]'}`}>
                    {item.title}
                  </span>
                  {item.completed && item.completedAt && (
                    <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {t('bucket.completedOn', { date: item.completedAt })}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation(); // Avoid checking/unchecking
                  handleDelete(item.id);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 hover:opacity-100 focus:opacity-100 cursor-pointer"
                title={t('bucket.deleteTooltip')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default BucketList;
