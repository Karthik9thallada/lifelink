import React, { useEffect, useState } from 'react';
import { donorApi } from '../api/donorApi';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Heart, MapPin, Radio, Activity, CheckCircle2, AlertCircle, Clock, ShieldCheck, ChevronRight, Zap
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
      // Refresh matches list
      donorApi.getMyMatches().then(res => setMatches(res || []));
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
      setMessage(`Availability updated to: ${updated.available ? 'AVAILABLE (LIVE)' : 'OFFLINE'}`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePresetLocation = async (lat, lon, addressName) => {
    try {
      setActionLoading(true);
      const updated = await donorApi.updateLocation(lat, lon, addressName);
      setDonor(updated);
      setMessage(`GPS coordinates updated to: ${addressName} (${lat}, ${lon})`);
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
        setMessage(`🎉 Donation accepted! Hospital has been notified. (Units: ${res.unitsFulfilled}/${res.unitsRequired})`);
      } else {
        setMessage(`⚠️ Notice: ${res.message}`);
      }
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !donor) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Activity className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading donor terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Welcome back, {donor?.name || 'LifeLink Donor'}
                </h1>
                <p className="text-xs text-slate-400">
                  Donor ID: #{donor?.id} • Blood Group: <span className="text-rose-400 font-bold">{donor?.bloodGroup}</span> • Component: {donor?.componentType}
                </p>
              </div>
            </div>
          </div>

          {/* Availability Toggle Switch */}
          <div className="flex items-center space-x-4 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <div className="text-right">
              <span className="block text-xs font-semibold uppercase text-slate-300">
                Live Radar Status
              </span>
              <span className={`text-xs font-bold ${donor?.available ? 'text-emerald-400' : 'text-slate-500'}`}>
                {donor?.available ? 'ACTIVE & RESPONDING' : 'OFFLINE / PAUSED'}
              </span>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={actionLoading}
              className={`w-14 h-8 rounded-full transition-colors relative p-1 ${
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

      {/* Status banner message */}
      {message && (
        <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-sm flex items-center justify-between animate-in fade-in">
          <span className="text-slate-200">{message}</span>
          <button onClick={() => setMessage('')} className="text-xs text-slate-400 hover:text-white ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Location & Medical Recovery Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GPS Location & Presets */}
        <div className="md:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white">Live GPS Location Coordinates</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {donor?.latitude?.toFixed(4)}, {donor?.longitude?.toFixed(4)}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Hospitals match donors based on great-circle spatial distance. You can simulate or update your current live GPS coordinates below:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handlePresetLocation(12.9716, 77.5946, 'MG Road Central')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-800 text-xs text-left transition-colors"
            >
              <p className="font-semibold text-slate-200">MG Road</p>
              <p className="text-[10px] text-slate-400">Central Hub</p>
            </button>
            <button
              onClick={() => handlePresetLocation(12.9352, 77.6245, 'Koramangala 5th Block')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-800 text-xs text-left transition-colors"
            >
              <p className="font-semibold text-slate-200">Koramangala</p>
              <p className="text-[10px] text-slate-400">South-East</p>
            </button>
            <button
              onClick={() => handlePresetLocation(12.9784, 77.6408, 'Indiranagar 100ft')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-800 text-xs text-left transition-colors"
            >
              <p className="font-semibold text-slate-200">Indiranagar</p>
              <p className="text-[10px] text-slate-400">East Zone</p>
            </button>
            <button
              onClick={() => handlePresetLocation(12.9698, 77.7499, 'Whitefield Tech Park')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-800 text-xs text-left transition-colors"
            >
              <p className="font-semibold text-slate-200">Whitefield</p>
              <p className="text-[10px] text-slate-400">Outer Ring (~15km)</p>
            </button>
          </div>
        </div>

        {/* Medical Interval Status */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Medical Eligibility</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-700">
                <span className="text-slate-400">Eligibility Status</span>
                <span className={`font-bold ${donor?.eligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {donor?.eligible ? 'ELIGIBLE TO DONATE' : 'RECOVERY PERIOD'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700">
                <span className="text-slate-400">Last Donation</span>
                <span className="text-slate-200 font-mono">
                  {donor?.lastDonationDate || 'First Time Donor'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700">
                <span className="text-slate-400">Interval Gap Required</span>
                <span className="text-slate-200 font-mono">
                  {donor?.componentType === 'WHOLE_BLOOD' ? '56 Days' : donor?.componentType === 'PLASMA' ? '14 Days' : '7 Days'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            LifeLink enforces biological recovery windows to protect donor health before matching.
          </div>
        </div>
      </div>

      {/* Emergency Match Notifications / Open Requests */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-lg font-bold text-white">Emergency Blood Requests Matched with You</h2>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-slate-900 rounded-full border border-slate-700 text-slate-300">
            {matches.length} Alerts
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
            No active emergency requests matched right now. Keep your radar toggle ON to receive instant notifications when nearby hospitals need your blood group!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m) => {
              const req = m.request;
              const isAccepted = m.status === 'ACCEPTED';
              const isExpired = m.status === 'EXPIRED';

              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isAccepted
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : isExpired
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                          {req?.bloodGroup}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {req?.componentType}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          req?.urgency === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {req?.urgency}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2">
                        {req?.hospital?.hospitalName}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{req?.hospital?.address}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-extrabold text-rose-400 font-mono">
                        {m.distance} km
                      </span>
                      <p className="text-[10px] text-slate-400">Away</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Demand: </span>
                      <span className="font-bold text-white">
                        {req?.unitsFulfilled || 0} / {req?.unitsRequired} Units Fulfilled
                      </span>
                    </div>

                    {isAccepted ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>You Accepted</span>
                      </span>
                    ) : isExpired ? (
                      <span className="text-slate-500 font-semibold">Fulfilled by others</span>
                    ) : (
                      <button
                        onClick={() => handleAcceptMatch(req?.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-900/40 hover:scale-105 flex items-center space-x-1.5 disabled:opacity-50"
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
