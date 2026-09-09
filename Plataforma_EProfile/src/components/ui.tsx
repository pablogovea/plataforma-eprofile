import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

export function Button({ className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium text-slate-700"><span>{label}</span><input className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" {...props} />{hint && <small className="font-normal text-slate-500">{hint}</small>}</label>;
}

export function TextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="grid gap-1.5 text-sm font-medium text-slate-700"><span>{label}</span><textarea className="min-h-28 resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" {...props} /></label>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-soft ${className}`}>{children}</section>;
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return <div className="grid min-h-[50vh] place-items-center text-slate-500"><div className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={20} />{label}</div></div>;
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const tones = { error: 'border-red-200 bg-red-50 text-red-800', success: 'border-emerald-200 bg-emerald-50 text-emerald-800', info: 'border-blue-200 bg-blue-50 text-blue-800' };
  return <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}
