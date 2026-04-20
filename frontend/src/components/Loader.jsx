export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-surface-border border-t-brand-500 animate-spin" />
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  );
}


export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center gap-4 z-50">
      <div className="w-12 h-12 rounded-full border-2 border-surface-border border-t-brand-500 animate-spin" />
      <p className="text-slate-400 text-sm font-medium">Loading AttendPro...</p>
    </div>
  );
}
