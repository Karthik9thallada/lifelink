import React, { useEffect, useState } from 'react';
import { donorApi } from '../api/donorApi';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Heart, MapPin, Radio, Activity, CheckCircle2, AlertCircle, Clock, 
  ShieldCheck, ChevronRight, Zap, PhoneCall, RefreshCw, Check, Droplet
} from 'lucide-react';

export default function DonorDashboard() {
  const { subscribeToTopic } = useWebSocket();
  const [donor, setDonor] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await donorApi.getProfile();
      setDonor(profile);

      const matchList = await donorApi.getMyMatches();
      setMatches(matchList || []);
    } catch (err) {
      console.error('Error fetching donor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Subscribe to real-time alerts for this donor
  useEffect(() => {
    if (!donor?.id) return;

    const topic = `/topic/donors/${donor.id}`;
    const unsubscribe = subscribeToTopic(topic, (event) => {
      setMessage(`🚨 New match alert: ${event.message}`);
      donorApi.getMyMatches().then((res) => setMatches(res || []));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [donor?.id]);

  const handleToggleAvailability = async () => {
    if (!donor) return;
    try {
      setActionLoading(true);
      const updated = await donorApi.updateAvailability(!donor.available);
      setDonor(updated);
      setMessage(`Radar status: ${updated.available ? '🟢 LIVE & RESPONDING' : '⚪ OFFLINE / PAUSED'}`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update radar availability');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePresetLocation = async (lat, lon, addressName) => {
    try {
      setActionLoading(true);
      const updated = await donorApi.updateLocation(lat, lon, addressName);
      setDonor(updated);
      setMessage(`📍 GPS coordinates updated to: ${addressName} (${lat}, ${lon})`);
      // Reload matches with new position
      const matchList = await donorApi.getMyMatches();
      setMatches(matchList || []);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update location');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptMatch = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await donorApi.acceptRequest(requestId);
      if (res.success) {
        setMessage(`🎉 Donation accepted! Hospital notified immediately. (${res.unitsFulfilled}/${res.unitsRequired} Units Secured)`);
      } else {
        setMessage(`⚠️ Notice: ${res.message}`);
      }
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to accept donation request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !donor) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Activity className="w-9 h-9 text-rose-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Connecting to Donor Live Radar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Donor Banner */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {donor?.name || 'LifeLink Donor'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs">
                  {donor?.bloodGroup}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                  {donor?.componentType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Donor ID: #{donor?.id}</span>
                <span>•</span>
                <span>Phone: {donor?.phone}</span>
                <span>•</span>
                <span>Email: {donor?.email}</span>
              </p>
            </div>
          </div>

          {/* Live Radar Toggle */}
          <div className="flex items-center space-x-4 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shadow-inner">
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Emergency Radar
              </span>
              <span className={`text-xs font-bold ${donor?.available ? 'text-emerald-400 flex items-center space-x-1 justify-end' : 'text-slate-500'}`}>
                {donor?.available ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>ACTIVE & RESPONDING</span>
                  </>
                ) : (
                  <span>OFFLINE / PAUSED</span>
                )}
              </span>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={actionLoading}
              className={`w-14 h-8 rounded-full transition-colors relative p-1 focus:outline-none ${
                donor?.available ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  donor?.available ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time alert message */}
      {message && (
        <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-sm flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-3 text-slate-200">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-xs text-slate-400 hover:text-white font-medium ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Live GPS & Medical Eligibility */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GPS Location & Presets */}
        <div className="md:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white">Live GPS Location Coordinates</h2>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {donor?.latitude?.toFixed(4)}, {donor?.longitude?.toFixed(4)}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            LifeLink computes real-time spherical distances from hospital emergency wards. Click any location preset below to simulate moving to a new district:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => handlePresetLocation(12.9716, 77.5946, 'MG Road Central')}
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-700/80 border border-slate-800 text-xs text-left transition-all hover:scale-[1.02]"
            >
              <p className="font-bold text-slate-200">MG Road</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Central Bangalore</p>
            </button>
            <button
              onClick={() => handlePresetLocation(12.9784, 77.6408, 'Indiranagar 100ft')}
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-700/80 border border-slate-800 text-xs text-left transition-all hover:scale-[1.02]"
            >
              <p className="font-bold text-slate-200">Indiranagar</p>
              <p className="text-[10px] text-slate-400 mt-0.5">East Zone (~5km)</p>
            </button>
            <button
              onClick={() => handlePresetLocation(12.9352, 77.6245, 'Koramangala 5th Block')}
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-700/80 border border-slate-800 text-xs text-left transition-all hover:scale-[1.02]"
            >
              <p className="font-bold text-slate-200">Koramangala</p>
              <p className="text-[10px] text-slate-400 mt-0.5">South Zone (~6km)</p>
            </button>
            <button
              onClick={() => handlePresetLocation(12.9698, 77.7499, 'Whitefield Tech Park')}
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-700/80 border border-slate-800 text-xs text-left transition-all hover:scale-[1.02]"
            >
              <p className="font-bold text-slate-200">Whitefield</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Outer Ring (~16km)</p>
            </button>
          </div>
        </div>

        {/* Medical Interval Status */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Biological Safety</h2>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Health Eligibility</span>
                <span className={`font-bold ${donor?.eligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {donor?.eligible ? 'ELIGIBLE TO DONATE' : 'RECOVERY WINDOW'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Last Donation</span>
                <span className="text-slate-200 font-mono">
                  {donor?.lastDonationDate || 'First Time Hero'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Mandatory Recovery Gap</span>
                <span className="text-slate-200 font-mono">
                  {donor?.componentType === 'WHOLE_BLOOD' ? '56 Days' : donor?.componentType === 'PLASMA' ? '14 Days' : '7 Days'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            LifeLink automatically locks matching until minimum medical interval gaps are satisfied.
          </p>
        </div>
      </div>

      {/* Matched Emergency Requests */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Emergency Blood Requests Matched with You</h2>
          </div>
          <button
            onClick={loadData}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-14 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-300 font-semibold text-sm">No emergency requests active in your current radius.</p>
            <p className="text-slate-500 text-xs mt-1">
              Keep your radar toggle ON. When a hospital broadcasts a compatible requirement, your terminal will alert you in real time!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m, index) => {
              const isAccepted = m.status === 'ACCEPTED';
              const isExpired = m.status === 'EXPIRED';

              return (
                <div
                  key={m.matchId != null ? `match-${m.matchId}` : `match-${index}`}
                  className={`p-6 rounded-2xl border transition-all space-y-4 ${
                    isAccepted
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/10'
                      : isExpired
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-900/90 border-rose-500/40 shadow-xl shadow-rose-950/20 hover:border-rose-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-rose-600 text-white">
                          {m.bloodGroup}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {m.componentType || 'WHOLE_BLOOD'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          m.urgency === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {m.urgency || 'CRITICAL'}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-white mt-2">
                        {m.hospitalName || 'Emergency Center'}
                      </h3>
                      {m.hospitalAddress && (
                        <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span>{m.hospitalAddress}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800">
                      <span className="text-xl font-extrabold text-rose-400 font-mono">
                        {m.distanceKm != null ? m.distanceKm.toFixed(2) : '-'} km
                      </span>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Distance</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Demand: </span>
                      <strong className="text-white font-mono">
                        {m.unitsFulfilled || 0} / {m.unitsRequired || 2} Units Secured
                      </strong>
                    </div>

                    {isAccepted ? (
                      <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>You Accepted & Reserved</span>
                      </span>
                    ) : isExpired ? (
                      <span className="text-slate-500 font-semibold px-3 py-1.5 rounded-lg bg-slate-800">
                        Fulfilled by others
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcceptMatch(m.requestId)}
                        disabled={actionLoading}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold transition-all shadow-lg shadow-rose-950/50 hover:scale-[1.03] flex items-center space-x-2 disabled:opacity-50"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Accept & Donate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
