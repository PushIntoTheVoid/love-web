import React, { useState, useEffect } from 'react';
import type { Milestone } from '../types';
import { Heart, Camera, MapPin, Star, Gift, Plane, Coffee, Flame, Plus, Calendar, Bookmark, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from '../i18n/TranslationContext';


const ICON_MAP = {
  Heart: Heart,
  Camera: Camera,
  MapPin: MapPin,
  Star: Star,
  Gift: Gift,
  Plane: Plane,
  Coffee: Coffee,
  Flame: Flame,
};

export const Timeline: React.FC = () => {
  const { t } = useTranslation();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState<Milestone['iconName']>('Heart');
  const [category, setCategory] = useState<Milestone['category']>('firsts');

  useEffect(() => {
    const saved = localStorage.getItem('sweetheart_milestones');
    if (saved) {
      try {
        setMilestones(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse milestones', e);
      }
    } else {
      // Seed default milestones
      const defaults: Milestone[] = [
        {
          id: '1',
          title: t('timeline.defaultMilestone1Title'),
          date: '2024-02-14',
          description: t('timeline.defaultMilestone1Desc'),
          iconName: 'Coffee',
          category: 'firsts',
        },
        {
          id: '2',
          title: t('timeline.defaultMilestone2Title'),
          date: '2024-03-01',
          description: t('timeline.defaultMilestone2Desc'),
          iconName: 'Heart',
          category: 'dates',
        },
        {
          id: '3',
          title: t('timeline.defaultMilestone3Title'),
          date: '2024-08-15',
          description: t('timeline.defaultMilestone3Desc'),
          iconName: 'Plane',
          category: 'trips',
        },
      ];
      setMilestones(defaults);
      localStorage.setItem('sweetheart_milestones', JSON.stringify(defaults));
    }
  }, []);

  const saveMilestones = (updated: Milestone[]) => {
    // Sort milestones by date descending
    const sorted = [...updated].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMilestones(sorted);
    localStorage.setItem('sweetheart_milestones', JSON.stringify(sorted));
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !description.trim()) return;

    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: title.trim(),
      date,
      description: description.trim(),
      iconName,
      category,
    };

    const updated = [...milestones, newMilestone];
    saveMilestones(updated);

    // Trigger romantic celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#fda4af', '#f43f5e', '#a855f7', '#fbbf24'],
    });

    setTitle('');
    setDate('');
    setDescription('');
    setIconName('Heart');
    setCategory('firsts');
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = milestones.filter((m) => m.id !== id);
    saveMilestones(updated);
  };

  return (
    <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden">
      {/* Background radial soft light */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 bg-[var(--accent-border)]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-[var(--accent-gold)] fill-[var(--accent-gold)]" />
            {t('timeline.title')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('timeline.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 self-start md:self-auto cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          {isFormOpen ? t('timeline.btnClose') : t('timeline.btnOpen')}
        </button>
      </div>

      {/* Add Milestone Form */}
      {isFormOpen && (
        <form
          onSubmit={handleAddMilestone}
          className="mb-10 p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-[var(--accent-border)]/50 animate-fade-in flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {t('timeline.formTitle')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('timeline.formTitlePlaceholder')}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {t('timeline.formDate')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-10 px-4 py-2 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {t('timeline.formCategory')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Milestone['category'])}
                className="w-full h-10 px-4 py-2 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)]"
              >
                <option value="firsts">{t('timeline.formCategoryFirsts')}</option>
                <option value="dates">{t('timeline.formCategoryDates')}</option>
                <option value="trips">{t('timeline.formCategoryTrips')}</option>
                <option value="memories">{t('timeline.formCategoryMemories')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                {t('timeline.formIcon')}
              </label>
              <div className="flex gap-2 items-center overflow-x-auto p-1">
                {(Object.keys(ICON_MAP) as Milestone['iconName'][]).map((name) => {
                  const IconComp = ICON_MAP[name];
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setIconName(name)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${iconName === name
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--text-main)] scale-110'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-[var(--accent-border)]'
                        }`}
                      title={name}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              {t('timeline.formDesc')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('timeline.formDescPlaceholder')}
              rows={3}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all resize-none text-sm text-[var(--text-main)]"
            />
          </div>

          <button
            type="submit"
            className="self-end px-6 py-2.5 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold transition-all cursor-pointer text-sm shadow-sm"
          >
            {t('timeline.btnCreate')}
          </button>
        </form>
      )}

      {/* Story Timeline vertical layout */}
      <div className="relative ml-4 md:ml-32 pl-8 md:pl-12 py-4 space-y-10">
        {/* Animated Heartbeat EKG vertical line */}
        <div className="ekg-line-container">
          <div className="ekg-base-line" />
          <div className="ekg-pulse-line" />
        </div>

        {milestones.length === 0 ? (
          <div className="text-center text-slate-400 py-6 font-serif italic">
            {t('timeline.empty')}
          </div>
        ) : (
          milestones.map((milestone) => {
            const IconComponent = ICON_MAP[milestone.iconName] || Heart;

            return (
              <div key={milestone.id} className="relative group animate-fade-in">
                {/* Visual Icon Node on Timeline */}
                <div className="absolute -left-12 md:-left-16 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-gold)] border-2 border-[var(--accent-border)] text-[var(--text-muted)] shadow-xs group-hover:scale-110 group-hover:border-[var(--accent-gold)] group-hover:text-[var(--text-main)] transition-all z-10">
                  <IconComponent className="w-5 h-5 text-[var(--btn-text)]" />
                </div>

                {/* Left Side Date Label (hidden on small screen) */}
                <div className="hidden md:block absolute -left-[208px] w-36 text-right top-1">
                  <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-semibold font-mono">
                    {new Date(milestone.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5 capitalize font-mono">
                    {milestone.category}
                  </div>
                </div>

                {/* Main Card */}
                <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900/60 shadow-xs hover:shadow-md transition-all duration-300">
                  {/* Date label for mobile */}
                  <div className="md:hidden flex gap-2 items-center text-xs font-semibold text-[var(--text-muted)] mb-2 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(milestone.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    <span className="px-1.5 py-0.5 rounded bg-[var(--accent-border)]/20 text-[var(--text-muted)] capitalize text-[9px]">
                      {milestone.category}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg md:text-xl font-bold font-serif text-[var(--text-main)] group-hover:text-[var(--accent-gold)] transition-colors">
                      {milestone.title}
                    </h3>

                    <button
                      onClick={() => handleDelete(milestone.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title={t('timeline.deleteTooltip')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-[var(--text-main)]/90 leading-relaxed font-light">
                    {milestone.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default Timeline;
