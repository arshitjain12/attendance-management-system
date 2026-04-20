export default function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colorMap = {
    brand:   'text-brand-400  bg-brand-500/10  border-brand-500/20',
    green:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber:   'text-amber-400   bg-amber-500/10   border-amber-500/20',
    rose:    'text-rose-400    bg-rose-500/10    border-rose-500/20',
  };

  return (
    <div className="card flex items-start gap-4 animate-slide-up">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-white font-display font-bold text-2xl mt-0.5">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}
