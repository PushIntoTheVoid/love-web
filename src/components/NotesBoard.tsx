import React, { useState, useEffect } from 'react';
import type { Note } from '../types';
import { Plus, Trash2, Heart, Camera, Mail, Coffee, FileText, Ticket } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationContext';


export const NotesBoard: React.FC = () => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState<Note['color']>('rose');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load notes on mount
  useEffect(() => {
    const saved = localStorage.getItem('sweetheart_notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse notes', e);
      }
    } else {
      // Seed default notes
      const defaults: Note[] = [
        {
          id: '1',
          content: t('notes.defaultNote1'),
          author: 'Alex',
          color: 'rose',
          createdAt: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
        },
        {
          id: '2',
          content: t('notes.defaultNote2'),
          author: 'Emily',
          color: 'lavender',
          createdAt: new Date(Date.now() - 86400000).toLocaleDateString(),
        },
      ];
      setNotes(defaults);
      localStorage.setItem('sweetheart_notes', JSON.stringify(defaults));
    }
  }, []);

  // Save notes
  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem('sweetheart_notes', JSON.stringify(updated));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !author.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: content.trim(),
      author: author.trim(),
      color,
      createdAt: new Date().toLocaleDateString(),
    };

    const updated = [newNote, ...notes];
    saveNotes(updated);
    setContent('');
    setAuthor('');
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
  };

  // Paper styles mapping for a scrapbook look
  const paperClasses = {
    rose: 'paper-polaroid',
    lavender: 'paper-deckled',
    amber: 'paper-napkin',
    mint: 'paper-lined',
    blue: 'paper-ticket',
  };

  return (
    <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden">
      {/* Decorative background accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-border)]/15 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
            <Heart className="w-6 h-6 text-[var(--accent-gold)] fill-[var(--accent-gold)] animate-pulse" />
            {t('notes.title')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('notes.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 self-start md:self-auto px-5 py-2.5 rounded-full bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          {isFormOpen ? t('notes.btnClose') : t('notes.btnOpen')}
        </button>
      </div>

      {/* Note Creator Form */}
      {isFormOpen && (
        <form
          onSubmit={handleAddNote}
          className="mb-8 p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-[var(--accent-border)]/50 animate-fade-in flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                {t('notes.formAuthor')}
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={t('notes.formAuthorPlaceholder')}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all text-sm text-[var(--text-main)]"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                {t('notes.formPaper')}
              </label>
              <div className="flex gap-3 items-center h-10">
                {(['rose', 'lavender', 'amber', 'mint', 'blue'] as Note['color'][]).map((c) => {
                  const paperDetails = {
                    rose: { icon: Camera, bg: '#ffffff', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', label: t('notes.formPaperPolaroid') },
                    lavender: { icon: Mail, bg: '#FAF8F5', border: 'border-amber-200 dark:border-amber-900/40', text: 'text-amber-700 dark:text-amber-500', label: t('notes.formPaperLetter') },
                    amber: { icon: Coffee, bg: '#FDFBF7', border: 'border-amber-200/50 dark:border-amber-900/20', text: 'text-amber-800 dark:text-amber-600', label: t('notes.formPaperNapkin') },
                    mint: { icon: FileText, bg: '#F9FDFB', border: 'border-emerald-200 dark:border-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-500', label: t('notes.formPaperLined') },
                    blue: { icon: Ticket, bg: '#F1F8FD', border: 'border-sky-200 dark:border-sky-900/40', text: 'text-sky-800 dark:text-sky-500', textLight: 'text-sky-800', label: t('notes.formPaperTicket') },
                  };
                  const details = paperDetails[c];
                  const IconComponent = details.icon;

                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                        color === c
                          ? 'border-[var(--text-main)] ring-2 ring-[var(--accent-gold)] scale-110 shadow-sm'
                          : `${details.border} hover:border-[var(--accent-gold)] opacity-80`
                      }`}
                      style={{ backgroundColor: details.bg }}
                      title={details.label}
                    >
                      <IconComponent className={`w-4 h-4 ${details.text}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              {t('notes.formMessage')}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('notes.formMessagePlaceholder')}
              rows={3}
              required
              maxLength={280}
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-950/70 border border-[var(--accent-border)]/30 focus:border-[var(--accent-gold)] focus:outline-none transition-all resize-none text-sm text-[var(--text-main)]"
            />
          </div>

          <button
            type="submit"
            className="self-end px-6 py-2.5 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] font-semibold transition-all cursor-pointer text-sm shadow-sm"
          >
            {t('notes.btnPin')}
          </button>
        </form>
      )}

      {/* Sticky Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {notes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-serif italic text-lg">
            {t('notes.empty')}
          </div>
        ) : (
          notes.map((note, index) => {
            // Give notes custom slight rotations for vintage look
            const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-0'];
            const rotateClass = rotations[index % rotations.length];

            // Define specific text styling for each note content
            const noteTextStyles = {
              rose: 'font-romantic text-3xl font-medium text-slate-800 dark:text-slate-100 pt-3',
              lavender: 'font-serif text-lg italic text-[#2D241E] dark:text-[#E2DBF0] font-semibold pt-4 leading-relaxed',
              amber: 'font-romantic text-3xl text-amber-950 dark:text-amber-100 pt-4 leading-normal',
              mint: 'font-sans text-sm text-[#1A2E20] dark:text-[#E2EFE6] font-medium pt-3 tracking-wide',
              blue: 'font-mono text-sm tracking-tight text-slate-800 dark:text-slate-200 pt-6 font-semibold',
            };

            return (
              <div
                key={note.id}
                className={`relative p-6 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:rotate-0 hover:z-20 hover:shadow-xl shadow-md border ${paperClasses[note.color]} ${rotateClass} group`}
              >
                {/* Decorative Elements specific to each paper style */}
                {note.color === 'rose' && (
                  <>
                    <div className="tape-accent" />
                  </>
                )}

                {note.color === 'lavender' && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-700/90 border border-rose-600 flex items-center justify-center text-[10px] text-amber-200 font-serif shadow-xs select-none" title="Sealed with love">
                    ♥
                  </div>
                )}

                {note.color === 'amber' && (
                  <div className="absolute top-2.5 right-3.5 font-romantic text-xs text-amber-600/50 select-none">★</div>
                )}

                {note.color === 'mint' && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-slate-300 dark:bg-slate-700 rounded-xs border border-slate-400/40 shadow-xs flex items-center justify-center">
                    <div className="w-4 h-1.5 rounded-full border border-slate-500/40" />
                  </div>
                )}

                {note.color === 'blue' && (
                  <div className="absolute top-2 left-4 flex justify-between w-[calc(100%-2rem)]">
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 font-bold">MEM-TICKET</span>
                    <span className="font-mono text-[9px] opacity-40 font-bold">N°{note.id.slice(-6)}</span>
                  </div>
                )}

                <div className="h-full flex flex-col justify-between">
                  <p className={`${noteTextStyles[note.color]} whitespace-pre-wrap pb-6`}>
                    "{note.content}"
                  </p>

                  <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3 mt-auto">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wide ${note.color === 'rose' ? 'text-slate-500' : 'opacity-80'}`}>
                        {t('notes.from', { author: note.author })}
                      </p>
                      <p className={`text-[10px] opacity-60 mt-0.5 ${note.color === 'rose' ? 'text-slate-400 font-mono' : 'font-mono'}`}>
                        {note.createdAt}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title={t('notes.removeTooltip')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default NotesBoard;
