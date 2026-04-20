import { useState } from 'react';
import { X, Timer, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRequestOvertimeMutation } from '../store/apiSlice';


export default function OvertimeModal({ onClose, onSuccess }) {
  const [requestOvertime, { isLoading }] = useRequestOvertimeMutation();
  const [form, setForm] = useState({ requestedMinutes: 30, reason: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) { toast.error('Please provide a reason'); return; }
    if (form.requestedMinutes < 15) { toast.error('Minimum 15 minutes overtime'); return; }

    try {
      await requestOvertime({
        requestedMinutes: parseInt(form.requestedMinutes),
        reason: form.reason.trim(),
      }).unwrap();
      toast.success('Overtime request submitted!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit request');
    }
  };

  const fmtMins = (m) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min > 0 ? min + 'm' : ''}` : `${min}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-card border border-surface-border
                      rounded-2xl shadow-2xl animate-slide-up">

       
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400
                            flex items-center justify-center">
              <Timer size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">Request Overtime</h3>
              <p className="text-xs text-slate-400">For today's shift</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-surface">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

        
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Overtime Duration
              <span className="ml-2 text-amber-400 font-semibold">
                {fmtMins(form.requestedMinutes)}
              </span>
            </label>

           
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[30, 60, 90, 120].map((m) => (
                <button
                  key={m} type="button"
                  onClick={() => setForm(p => ({ ...p, requestedMinutes: m }))}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.requestedMinutes === m
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'bg-surface border-surface-border text-slate-400 hover:border-brand-500/50'
                  }`}
                >
                  {fmtMins(m)}
                </button>
              ))}
            </div>

           
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={15} max={480} step={15}
                value={form.requestedMinutes}
                onChange={(e) => setForm(p => ({ ...p, requestedMinutes: parseInt(e.target.value) || 30 }))}
                className="input-field text-center"
                placeholder="Custom minutes"
              />
              <span className="text-slate-400 text-sm shrink-0">minutes</span>
            </div>
          </div>

         
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="E.g. Critical bug fix for production deployment..."
              className="input-field resize-none"
              rows={3}
              required
            />
          </div>

         
          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
            {isLoading
              ? <Loader2 size={18} className="animate-spin" />
              : <><Send size={16} /> Submit Request</>}
          </button>
        </form>
      </div>
    </div>
  );
}
