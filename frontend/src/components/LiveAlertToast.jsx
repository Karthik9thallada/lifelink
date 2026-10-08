import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { AlertCircle, CheckCircle2, Radio, Zap, X } from 'lucide-react';

export default function LiveAlertToast() {
  const { liveEvents, clearEvents } = useWebSocket();

  if (!liveEvents || liveEvents.length === 0) return null;

  // Show top 3 recent events
  const displayEvents = liveEvents.slice(0, 3);

  const getEventIcon = (type) => {
    switch (type) {
      case 'EMERGENCY_MATCH':
        return <Zap className="w-5 h-5 text-rose-400 animate-pulse" />;
      case 'DONOR_ACCEPTED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'RADIUS_ESCALATED':
        return <Radio className="w-5 h-5 text-amber-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'EMERGENCY_MATCH':
        return 'border-rose-500/50 bg-rose-950/80 text-rose-100 shadow-rose-950/50';
      case 'DONOR_ACCEPTED':
        return 'border-emerald-500/50 bg-emerald-950/80 text-emerald-100 shadow-emerald-950/50';
      case 'RADIUS_ESCALATED':
        return 'border-amber-500/50 bg-amber-950/80 text-amber-100 shadow-amber-950/50';
      default:
        return 'border-slate-700 bg-slate-900/90 text-slate-200 shadow-black/50';
    }
  };

  return (
    <aside aria-label="Live System Alerts" className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      <div className="flex justify-end pointer-events-auto mb-1">
        <button
          onClick={clearEvents}
          className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 backdrop-blur-md"
        >
          Clear Alerts
        </button>
      </div>

      {displayEvents.map((ev) => (
        <div
          key={ev.id}
          className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-lg shadow-xl transition-all transform animate-in slide-in-from-bottom-2 ${getBorderColor(
            ev.type
          )}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">{getEventIcon(ev.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {ev.type?.replace(/_/g, ' ') || 'LIVE ALERT'}
                </span>
                <span className="text-[10px] opacity-75 font-mono">
                  {new Date(ev.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs mt-1 leading-snug line-clamp-2">{ev.message}</p>
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}
