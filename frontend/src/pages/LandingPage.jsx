import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, Shield, Zap, MapPin, Radio, Clock, ArrowRight, Activity, CheckCircle2, AlertTriangle
} from 'lucide-react';
import api from '../api/axios';

export default function LandingPage() {
  const { isAuthenticated, isDonor, isHospital } = useAuth();
  const { connected, liveEvents } = useWebSocket();
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    // Fetch registered verified hospitals for network stats
    api.get('/hospitals')
      .then(res => setHospitals(res.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-6 animate-pulse">
            <Radio className="w-4 h-4" />
            <span>Real-Time Blood & Plasma Emergency Response Grid</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Life<span className="text-rose-500">Link</span> Emergency Matching
          </h1>

          <p className="mt-4 text-xl sm:text-2xl font-light text-rose-200/90 italic max-w-2xl mx-auto">
            “Connecting Every Lifesaving Donation to Those Who Need It.”
          </p>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            When minutes matter, LifeLink pairs urgent hospital blood and plasma requests with compatible, verified donors within a radius using PostGIS spatial algorithms, progressive escalation tiers, and live WebSocket streams.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register?role=DONOR"
                  className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-900/40 transition-all hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Heart className="w-5 h-5 fill-white" />
                  <span>Register as Donor</span>
                </Link>
                <Link
                  to="/register?role=HOSPITAL"
                  className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-700 transition-all hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>Hospital Emergency Portal</span>
                </Link>
              </>
            ) : isDonor ? (
              <Link
                to="/donor/dashboard"
                className="px-8 py-3.5 text-base font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-900/40 transition-all hover:scale-105 flex items-center space-x-2"
              >
                <span>Enter Donor Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/hospital/dashboard"
                className="px-8 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 flex items-center space-x-2"
              >
                <span>Hospital Emergency Console</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      </section>

      {/* Real-Time Live Feed & Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live WebSocket Event Ticker */}
          <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-lg font-bold text-white">Live Emergency Dispatch Feed</h2>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                STOMP /ws
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
              {liveEvents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                  Listening on WebSocket broadcast channel... No recent emergency dispatches yet.
                </div>
              ) : (
                liveEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 flex items-start space-x-3 text-xs"
                  >
                    <div className="mt-0.5">
                      {ev.type === 'EMERGENCY_MATCH' ? (
                        <Zap className="w-4 h-4 text-rose-400" />
                      ) : ev.type === 'DONOR_ACCEPTED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Radio className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-200">{ev.type}</span>
                        <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{ev.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Network Metrics Card */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Emergency Network Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-xs text-slate-400">Connected Hospitals</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {hospitals.length > 0 ? hospitals.length : 8}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-xs text-slate-400">Initial Response Radius</span>
                  <span className="text-lg font-bold text-rose-400 font-mono">5.0 km</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-xs text-slate-400">Escalation Tiers</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">5km → 10km → 25km → 50km</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-xs text-slate-400">Concurrency Safety</span>
                  <span className="text-xs font-bold text-blue-400 font-mono">Redis Distributed Lock</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 text-xs text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2" />
              Automated biological compatibility matrix active
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid: 4 Pillars of LifeLink */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Architecture Designed for Critical Seconds
          </h2>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">
            Every module in LifeLink is built around real-world medical guidelines and high-concurrency safeguards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-rose-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">PostGIS Spatial Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spatial radius filters and Haversine great-circle calculations instantly find the closest registered donors to the hospital coordinate.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-rose-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Biological Compatibility</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full compatibility rules across Whole Blood, Red Cells, and inverted Plasma rules (AB universal plasma donor, O universal plasma recipient).
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-rose-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Medical Interval Gaps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protects donor health by checking mandatory recovery gaps: 56 days for Whole Blood, 14 days for Plasma, and 7 days for Platelets.
            </p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl hover:border-rose-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Radius Escalation Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If an urgent request is not fulfilled in time, the system automatically expands the radius outward from 5 km up to 50 km to mobilize more donors.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
