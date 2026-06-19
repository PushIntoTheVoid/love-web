import { useState, useEffect } from 'react';
import { Heart, Settings2, Calendar, Sparkles, Compass } from 'lucide-react';
import type { UserProfile } from './types';

import LoadingScreen from './components/LoadingScreen';
import FloatingHearts from './components/FloatingHearts';
import NotesBoard from './components/NotesBoard';
import Timeline from './components/Timeline';
import BucketList from './components/BucketList';
import InteractiveWidgets from './components/InteractiveWidgets';
import SpotifyPlayer from './components/SpotifyPlayer';
import { useTranslation } from './i18n/TranslationContext';
import './App.css';

const DEFAULT_PROFILE: UserProfile = {
  name1: 'Emily',
  name2: 'Alex',
  anniversaryDate: '2024-02-14',
  theme: 'aurora',
  isHeartsEnabled: true,
  bgStyle: 'gradient',
  spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX7rOY2tEV667',
};

function App() {
  const { t, language, setLanguage } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal temporary inputs
  const [tempName1, setTempName1] = useState('');
  const [tempName2, setTempName2] = useState('');
  const [tempDate, setTempDate] = useState('');
  const [tempTheme, setTempTheme] = useState<UserProfile['theme']>('aurora');
  const [tempHearts, setTempHearts] = useState(true);
  const [tempSpotifyUrl, setTempSpotifyUrl] = useState('');

  // Live relationships counter state
  const [duration, setDuration] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Load profile config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sweetheart_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        setProfile(parsed);
      } catch (e) {
        console.error('Failed to load profile config', e);
      }
    }
  }, []);

  // Sync profile details with document element styles (Themes)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-aurora', 'theme-solar', 'theme-forest', 'theme-synthwave');
    root.classList.add(`theme-${profile.theme}`);

    // Toggle dark class dynamically for Tailwind dark mode theme styles
    if (profile.theme === 'forest') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [profile.theme]);

  // Live Anniversary counter calculation
  useEffect(() => {
    const calculateDuration = () => {
      const anniversary = new Date(profile.anniversaryDate).getTime();
      const now = new Date().getTime();
      const diff = now - anniversary;

      if (diff <= 0) {
        setDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      setDuration({ days, hours, minutes, seconds });
    };

    calculateDuration();
    const interval = setInterval(calculateDuration, 1000);
    return () => clearInterval(interval);
  }, [profile.anniversaryDate]);

  // Open settings, seed temp states
  const handleOpenSettings = () => {
    setTempName1(profile.name1);
    setTempName2(profile.name2);
    setTempDate(profile.anniversaryDate);
    setTempTheme(profile.theme);
    setTempHearts(profile.isHeartsEnabled);
    setTempSpotifyUrl(profile.spotifyUrl);
    setIsSettingsOpen(true);
  };

  // Save settings config
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      name1: tempName1.trim() || profile.name1,
      name2: tempName2.trim() || profile.name2,
      anniversaryDate: tempDate || profile.anniversaryDate,
      theme: tempTheme,
      isHeartsEnabled: tempHearts,
      bgStyle: profile.bgStyle,
      spotifyUrl: tempSpotifyUrl.trim() || profile.spotifyUrl,
    };
    setProfile(updated);
    localStorage.setItem('sweetheart_profile', JSON.stringify(updated));
    setIsSettingsOpen(false);
  };

  const handleUpdateSpotifyUrl = (url: string) => {
    const updated = { ...profile, spotifyUrl: url };
    setProfile(updated);
    localStorage.setItem('sweetheart_profile', JSON.stringify(updated));
  };

  // Dynamic Theme names mapping
  const themeLabels = {
    aurora: t('themes.aurora'),
    solar: t('themes.solar'),
    forest: t('themes.forest'),
    synthwave: t('themes.synthwave'),
  };

  if (isLoading) {
    return (
      <LoadingScreen
        onComplete={() => {
          setIsLoading(false);
          // Reload profile from localStorage to capture updated names immediately
          const saved = localStorage.getItem('sweetheart_profile');
          if (saved) {
            try {
              setProfile(JSON.parse(saved));
            } catch (e) {
              console.error('Failed to reload profile details', e);
            }
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen relative pb-16 font-sans bg-[var(--bg-canvas)] text-[var(--text-main)] transition-colors duration-500">

      {/* Floating Canvas Hearts (Only renders if toggled in profile settings) */}
      <FloatingHearts enabled={profile.isHeartsEnabled} />

      {/* Sticky Header / Navbar */}
      <header className="sticky top-0 z-40 w-full px-4 md:px-8 py-3.5 glass shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 select-none group">
            <Heart className="w-5.5 h-5.5 text-[var(--accent-gold)] fill-[var(--accent-gold)] group-hover:scale-110 transition-transform" />
            <h1 className="text-xl md:text-2xl font-serif font-extrabold tracking-tight text-[var(--text-main)]">
              {t('nav.title')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Chip Badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[var(--accent-border)]/20 border border-[var(--accent-border)]/40 text-[var(--text-muted)] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[var(--accent-gold)]" />
              {t('nav.themeBadge')}: {themeLabels[profile.theme]}
            </span>

            {/* Language Selector Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="px-3 py-1.5 rounded-full border border-[var(--accent-border)]/30 hover:bg-[var(--accent-border)]/15 text-[var(--text-main)] text-xs font-bold uppercase transition-all cursor-pointer"
              title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
            >
              {language === 'en' ? 'ES' : 'EN'}
            </button>

            <button
              onClick={handleOpenSettings}
              className="p-2 rounded-full border border-[var(--accent-border)]/30 hover:bg-[var(--accent-border)]/15 text-[var(--text-main)] transition-all cursor-pointer"
              title={t('nav.customizeTooltip')}
            >
              <Settings2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Layout Body */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-12 relative z-10">

        {/* HERO SECTION: anniversary, illustrations, counter */}
        <section className="glass rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col lg:flex-row items-center gap-10">
          {/* Subtle light circles */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[var(--accent-border)]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[var(--accent-gold)]/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Left Side: Polaroid Keepsake Frame */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative group max-w-sm w-full p-4 pb-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-sm transform -rotate-1 hover:rotate-0 hover:scale-[1.01] transition-all duration-500">
              {/* Polaroid Tape Accent */}
              <div className="absolute -top-3 left-[35%] w-[30%] h-5 bg-amber-100/60 dark:bg-purple-900/30 border-l border-r border-dashed border-black/10 dark:border-white/10 shadow-2xs rotate-2"></div>

              <img
                src="/couple_hero.png"
                alt="Cozy sweet couple dreaming together"
                className="w-full aspect-[4/3] object-cover border border-slate-200/50 dark:border-slate-800 shadow-inner"
              />

              {/* Photo Caption Tag */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-slate-800 dark:text-slate-200">
                <span className="font-romantic text-2xl font-bold tracking-wide">
                  🌌 {t('hero.caption')}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                  {t('hero.est', { year: new Date(profile.anniversaryDate).getFullYear() })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Sweet names and Anniversary live clock counter */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[var(--accent-border)]/15 text-[var(--text-muted)] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 border border-[var(--accent-border)]/30">
              <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
              {t('hero.connecting')}
            </div>

            {/* Beautiful Name banner */}
            <h2 className="font-romantic text-6xl md:text-7xl font-bold text-[var(--text-main)] leading-tight tracking-wide">
              {profile.name1} & {profile.name2}
            </h2>

            {/* Anniversary subtitle */}
            <div className="flex items-center gap-2 mt-2 text-base font-serif italic text-[var(--text-muted)]">
              <Calendar className="w-4 h-4 text-[var(--accent-gold)]" />
              <span>{t('hero.since', {
                date: new Date(profile.anniversaryDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              })}</span>
            </div>

            {/* Relationship duration counters */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full mt-8 max-w-md">
              {[
                { label: t('hero.days'), value: duration.days },
                { label: t('hero.hours'), value: duration.hours },
                { label: t('hero.minutes'), value: duration.minutes },
                { label: t('hero.seconds'), value: duration.seconds }
              ].map((unit, idx) => (
                <div
                  key={idx}
                  className="bg-white/40 dark:bg-slate-900/40 border border-[var(--accent-border)]/30 p-3 sm:p-4 rounded-2xl flex flex-col items-center shadow-xs"
                >
                  <span className="text-2xl sm:text-3.5xl font-extrabold font-mono text-[var(--text-main)] leading-none select-none">
                    {String(unit.value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1.5 select-none">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-sm md:text-base leading-relaxed text-[var(--text-main)]/90 font-light italic">
              {t('hero.quote')}
            </p>
          </div>
        </section>

        {/* SECTION 1.5: Spotify Live Music Player */}
        <section id="music">
          <SpotifyPlayer spotifyUrl={profile.spotifyUrl} onUpdateSpotifyUrl={handleUpdateSpotifyUrl} />
        </section>

        {/* SECTION 2: Virtual Notes Board */}
        <section id="notes">
          <NotesBoard />
        </section>

        {/* SECTION 3: Vertical Milestone Timeline */}
        <section id="timeline">
          <Timeline />
        </section>

        {/* SECTION 4: Bucket List goals & Interactives */}
        <section id="adventures">
          <BucketList />
        </section>
        <section id="widgets">
          <InteractiveWidgets />
        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-16 text-center text-xs text-[var(--text-muted)] relative z-10 px-4">
        <p className="flex items-center justify-center gap-1 font-serif italic text-sm">
          Made with a heartful of <Heart className="w-3.5 h-3.5 text-[var(--accent-gold)] fill-[var(--accent-gold)] animate-heart-pulse" /> for {profile.name1} & {profile.name2}
        </p>
        <p className="opacity-50 mt-1 font-mono text-[10px] uppercase tracking-wider">{t('nav.title')} © {new Date().getFullYear()}</p>
      </footer>

      {/* CUSTOMIZER SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 animate-scale-up relative">
            <h2 className="text-xl md:text-2xl font-bold font-serif text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-6">
              <Settings2 className="w-5.5 h-5.5 text-[var(--accent-gold)]" />
              {t('settings.title')}
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Couple Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('settings.nameOne')}
                  </label>
                  <input
                    type="text"
                    value={tempName1}
                    onChange={(e) => setTempName1(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-slate-800 dark:text-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('settings.nameTwo')}
                  </label>
                  <input
                    type="text"
                    value={tempName2}
                    onChange={(e) => setTempName2(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-slate-800 dark:text-slate-100 text-sm"
                  />
                </div>
              </div>

              {/* Anniversary Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('settings.anniversary')}
                </label>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-slate-800 dark:text-slate-100 text-sm"
                />
              </div>

              {/* Select Theme Palette */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('settings.theme')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['aurora', 'solar', 'forest', 'synthwave'] as UserProfile['theme'][]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTempTheme(t)}
                      className={`px-3.5 py-2.5 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer ${tempTheme === t
                        ? 'border-[var(--text-main)] bg-[var(--accent-border)]/20 text-[var(--text-main)] font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      {themeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spotify Playlist URL */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('settings.spotify')}
                </label>
                <input
                  type="url"
                  value={tempSpotifyUrl}
                  onChange={(e) => setTempSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/... or open.spotify.com/track/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-slate-800 dark:text-slate-100 text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {t('settings.spotifyHint')}
                </p>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('settings.heartsTitle')}</h4>
                  <p className="text-xs text-slate-400">{t('settings.heartsDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTempHearts(!tempHearts)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${tempHearts ? 'bg-[var(--accent-gold)]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${tempHearts ? 'transform translate-x-6' : ''
                      }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
                >
                  {t('settings.btnCancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold text-sm shadow transition-all cursor-pointer animate-fade-in"
                >
                  {t('settings.btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
