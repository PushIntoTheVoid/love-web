import React, { useState } from 'react';
import { Music, Play, Pause, RefreshCw, Heart, Music4 } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationContext';

interface SpotifyPlayerProps {
  spotifyUrl: string;
  onUpdateSpotifyUrl: (url: string) => void;
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ spotifyUrl, onUpdateSpotifyUrl }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Helper to parse Spotify URLs into standard embed links
  const getSpotifyEmbedUrl = (url: string) => {
    if (!url) {
      return 'https://open.spotify.com/embed/playlist/37i9dQZF1DX7rOY2tEV667?utm_source=generator&theme=0';
    }

    const cleaned = url.trim();
    const reg = /open\.spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/;
    const match = cleaned.match(reg);

    if (match) {
      const type = match[1];
      const id = match[2];
      return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
    }

    return 'https://open.spotify.com/embed/playlist/37i9dQZF1DX7rOY2tEV667?utm_source=generator&theme=0';
  };

  const embedUrl = getSpotifyEmbedUrl(spotifyUrl);

  const handleSyncCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const reg = /open\.spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/;
    if (reg.test(customUrl.trim())) {
      onUpdateSpotifyUrl(customUrl.trim());
      setErrorMessage('');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } else {
      setErrorMessage(t('spotify.errorInvalid'));
    }
  };

  return (
    <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden">
      {/* Background soft glow ambient particles */}
      <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-[var(--accent-gold)]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
            <Music className="w-6 h-6 text-[var(--accent-gold)] animate-pulse" />
            {t('spotify.title')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('spotify.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-sm ${isPlaying
            ? 'bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)] text-[var(--text-main)]'
            : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)]'
            }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              {t('spotify.btnPause')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              {t('spotify.btnStart')}
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* COLUMN 1: The Interactive Vinyl Audio Deck (5 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-between p-6 rounded-2xl bg-white/30 dark:bg-slate-900/30 border border-[var(--accent-border)]/20 relative min-h-[350px]">
          {/* Turntable Details */}
          <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-700 shadow-inner"></div>
          <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-700 shadow-inner"></div>

          {/* Vinyl Record Area */}
          <div className="relative w-56 h-56 flex items-center justify-center mt-4">
            {/* Shadow backing */}
            <div className="absolute inset-2 bg-black/40 rounded-full blur-sm"></div>

            {/* The Vinyl Disc itself */}
            <div
              className={`w-full h-full rounded-full bg-neutral-900 dark:bg-neutral-950 border-[6px] border-neutral-800 shadow-2xl relative flex items-center justify-center transition-transform ${isPlaying ? 'animate-spin' : ''
                }`}
              style={{
                animationDuration: '10s',
                backgroundImage: `
                  repeating-radial-gradient(circle, #2a2a2a, #2a2a2a 1px, transparent 1px, transparent 4px),
                  repeating-radial-gradient(circle, #161616, #161616 2px, transparent 2px, transparent 8px)
                `,
              }}
            >
              {/* Center Sticker */}
              <div className="w-18 h-18 rounded-full bg-white dark:bg-slate-900 border-4 border-neutral-800 flex items-center justify-center relative shadow-inner">
                {/* Couple image placeholder or nice icon */}
                <Heart className={`w-6 h-6 text-[var(--accent-gold)] fill-[var(--accent-gold)] ${isPlaying ? 'animate-heart-pulse' : ''
                  }`} />
                {/* Record center pin hole */}
                <div className="absolute w-2 h-2 rounded-full bg-neutral-800 dark:bg-slate-950"></div>
              </div>
            </div>

            {/* Turntable Tonearm */}
            <div
              className="absolute -top-4 right-6 w-16 h-28 pointer-events-none origin-top-right transition-transform duration-700 ease-in-out"
              style={{
                transform: isPlaying ? 'rotate(18deg)' : 'rotate(0deg)',
              }}
            >
              {/* Tonearm Base joint */}
              <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-600 shadow-md"></div>
              {/* Metallic Tonearm pole */}
              <div className="absolute top-4 right-3 w-1.5 h-20 bg-slate-300 dark:bg-slate-400 border border-slate-400 dark:border-slate-500 shadow-xs origin-top rotate-[-12deg]"></div>
              {/* Stylus Head/Cartridge */}
              <div className="absolute top-22 right-6 w-3 h-6 bg-slate-600 dark:bg-slate-800 rounded-xs border border-slate-700 shadow-sm rotate-[15deg]"></div>
            </div>
          </div>

          {/* Equalizer Visualizer */}
          <div className="w-full mt-6 bg-[var(--accent-border)]/10 px-4 py-3 rounded-xl border border-[var(--accent-border)]/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 select-none">
              <Music4 className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
              {isPlaying ? t('spotify.active') : t('spotify.paused')}
            </span>

            {/* Bouncing visual bars */}
            <div className="h-6 flex items-end gap-1 select-none">
              {[12, 22, 16, 26, 18, 10, 24, 14, 20, 8].map((maxH, i) => (
                <div
                  key={i}
                  className="w-1 bg-[var(--accent-gold)] rounded-t-xs transition-all"
                  style={{
                    height: isPlaying ? `${maxH}px` : '4px',
                    animation: isPlaying ? 'bounce 0.8s infinite alternate' : 'none',
                    animationDuration: isPlaying ? `${0.5 + i * 0.12}s` : '0s',
                    animationDelay: isPlaying ? `${i * 0.04}s` : '0s',
                    filter: isPlaying ? 'drop-shadow(0 0 3px var(--accent-gold))' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <form
            onSubmit={handleSyncCustomUrl}
            className="p-5 rounded-2xl bg-white/30 dark:bg-slate-900/30 border border-[var(--accent-border)]/20 flex flex-col gap-3"
          >
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                {t('spotify.syncTitle')}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-light leading-relaxed">
                {t('spotify.syncDesc')}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={t('spotify.inputPlaceholder')}
                className="w-full px-3.5 py-2 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-xs text-[var(--text-main)]"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('spotify.btnSync')}
              </button>
            </div>

            {errorMessage && (
              <p className="text-[10px] text-rose-500 font-medium leading-tight animate-fade-in">
                {errorMessage}
              </p>
            )}

            {isSuccess && (
              <p className="text-[10px] text-emerald-500 font-medium leading-tight animate-fade-in flex items-center gap-1">
                <span>✓</span> {t('spotify.successSync')}
              </p>
            )}
          </form>
        </div>

        {/* COLUMN 2: Spotify Live Embed Iframe (3 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="relative w-full h-[352px] rounded-2xl overflow-hidden border border-[var(--accent-border)]/30 shadow-md bg-transparent h-full">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen={false}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Player"
              className="rounded-2xl"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
