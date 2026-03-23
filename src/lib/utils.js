import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateShareCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const SET_COLORS = [
  { name: 'blue',    bg: 'bg-blue-500',   text: 'text-blue-600',   border: 'border-blue-200',   light: 'bg-blue-50' },
  { name: 'violet',  bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-200', light: 'bg-violet-50' },
  { name: 'emerald', bg: 'bg-emerald-500',text: 'text-emerald-600',border: 'border-emerald-200',light: 'bg-emerald-50' },
  { name: 'amber',   bg: 'bg-amber-500',  text: 'text-amber-600',  border: 'border-amber-200',  light: 'bg-amber-50' },
  { name: 'rose',    bg: 'bg-rose-500',   text: 'text-rose-600',   border: 'border-rose-200',   light: 'bg-rose-50' },
  { name: 'cyan',    bg: 'bg-cyan-500',   text: 'text-cyan-600',   border: 'border-cyan-200',   light: 'bg-cyan-50' },
  { name: 'indigo',  bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-200', light: 'bg-indigo-50' },
  { name: 'pink',    bg: 'bg-pink-500',   text: 'text-pink-600',   border: 'border-pink-200',   light: 'bg-pink-50' },
];

export function getColorForId(id) {
  if (!id) return SET_COLORS[0];
  const idx = Math.abs(id.charCodeAt(0) + (id.charCodeAt(1) || 0)) % SET_COLORS.length;
  return SET_COLORS[idx];
}

// Spaced repetition (SM-2 algorithm)
export function computeNextReview(card, quality) {
  // quality: 0=again, 1=hard, 2=good, 3=easy
  let { ease_factor = 2.5, interval = 1 } = card;
  if (quality < 2) {
    interval = 1;
  } else if (interval === 1) {
    interval = quality === 3 ? 4 : 2;
  } else {
    interval = Math.round(interval * ease_factor);
  }
  ease_factor = Math.max(1.3, ease_factor + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
  const due = new Date();
  due.setDate(due.getDate() + interval);
  return { ease_factor, interval, due_date: due.toISOString() };
}