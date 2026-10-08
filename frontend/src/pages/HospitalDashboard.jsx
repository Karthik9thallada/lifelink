import React, { useEffect, useState } from 'react';
import { hospitalApi } from '../api/hospitalApi';
import { requestApi } from '../api/requestApi';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Hospital, PlusCircle, Radio, Users, CheckCircle2, AlertCircle, RefreshCw, XCircle, ArrowUpRight, ShieldCheck, Clock, MapPin, Zap
} from 'lucide-react';

export default function HospitalDashboard() {
  const { subscribeToTopic } = useWebSocket();
  const [hospital, setHospital] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState('');

  // Create Request Form State
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [componentType, setComponentType] = useState('WHOLE_BLOOD');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [urgency, setUrgency] = useState('CRITICAL');
  const [initialRadius, setInitialRadius] = useState(5.0);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const hosp = await hospitalApi.getProfile();
      setHospital(hosp);

      const reqList = await requestApi.getMyRequests();
      setRequests(reqList || []);
    } catch (err) {
      console.error('Failed to load hospital dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Subscribe to live events for requests
  useEffect(() => {
    if (!requests || requests.length === 0) return;

    // Listen on each active request topic
    const unsubs = requests.map((req) => {
      return subscribeToTopic(`/topic/requests/${req.id}`, (event) => {
        setNotification(`📡 Request #${req.id} Live Update: ${event.message}`);
        // Auto reload requests to reflect donor acceptances or escalation
        requestApi.getMyRequests().then((res) => setRequests(res || []));
      });
    });

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [requests.map((r) => r.id).join(',')]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await requestApi.createRequest({
        bloodGroup,
        componentType,
        unitsRequired: parseInt(unitsRequired, 10),
        urgency,
        initialRadius: parseFloat(initialRadius),
        requiredBy: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        notes,
      });
      setShowCreateModal(false);
      setNotification('✅ Emergency blood request broadcast successfully! Initializing matching engine...');
      loadData();
    } catch (err) {
      setNotification(err.response?.data?.message || 'Failed to create request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFindMatches = async (requestId) => {
    try {
      setActionLoading(true);
      const matches = await requestApi.findMatches(requestId);
      setNotification(`🎯 Matching Engine: Found and notified ${matches.length} compatible donors!`);
      loadData();
    } catch (err) {
      setNotification(err.response?.data?.message || 'Matching failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (requestId) => {
    try {
      setActionLoading(true);
      const matches = await requestApi.escalateRequest(requestId);
      setNotification(`🚀 Radius Escalated! Mobilized ${matches.length} additional donors.`);
      loadData();
    } catch (err) {
      setNotification(err.response?.data?.message || 'Escalation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewMatches = async (requestId) => {
    try {
      const matches = await requestApi.getRequestMatches(requestId);
      setSelectedMatches({ requestId, matches });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this emergency request?')) return;
    try {
      await requestApi.cancelRequest(requestId);
      setNotification(`Request #${requestId} cancelled.`);
      loadData();
    } catch (err) {
      setNotification(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">OPEN</span>;
      case 'SEARCHING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">SEARCHING</span>;
      case 'ESCALATED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">ESCALATED</span>;
      case 'MATCHED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MATCHED</span>;
      case 'FULFILLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600/30 text-emerald-200 border border-emerald-500/40">FULFILLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  if (loading && !hospital) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading hospital command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hospital Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Hospital className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {hospital?.hospitalName || 'Emergency Center'}
              </h1>
              {hospital?.verified ? (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Node</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span>Lic: {hospital?.licenseNumber}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{hospital?.address}</span>
              </span>
              <span>•</span>
              <span>Hotline: {hospital?.emergencyPhone}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-950/40 transition-all hover:scale-105 flex items-center justify-center space-x-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Post Emergency Blood Request</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-sm flex items-center justify-between animate-in fade-in">
          <span className="text-slate-200">{notification}</span>
          <button onClick={() => setNotification('')} className="text-xs text-slate-400 hover:text-white ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Requests Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Emergency Blood Requests Command List</h2>
          </div>
          <button
            onClick={loadData}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No blood requests currently active. Click "Post Emergency Blood Request" above to broadcast an urgent requirement.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-sm font-mono">
                      {req.bloodGroup}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">
                          Request #{req.id} • {req.componentType}
                        </span>
                        {getStatusBadge(req.status)}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          req.urgency === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {req.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Current Search Radius: <span className="font-mono text-amber-400 font-bold">{req.currentRadius} km</span> (Initial: {req.initialRadius} km)
                      </p>
                    </div>
                  </div>

                  {/* Progress & Units */}
                  <div className="text-right">
                    <span className="text-xl font-black text-white font-mono">
                      {req.unitsFulfilled} <span className="text-slate-500 text-sm font-normal">/ {req.unitsRequired} Units</span>
                    </span>
                    <div className="w-36 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden ml-auto">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (req.unitsFulfilled / req.unitsRequired) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Operations Bar */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFindMatches(req.id)}
                      disabled={actionLoading || req.status === 'MATCHED' || req.status === 'FULFILLED'}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-40"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Match Nearby Donors</span>
                    </button>

                    <button
                      onClick={() => handleEscalate(req.id)}
                      disabled={actionLoading || req.status === 'MATCHED' || req.status === 'FULFILLED'}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-40"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Escalate Radius Tier</span>
                    </button>

                    <button
                      onClick={() => handleViewMatches(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors flex items-center space-x-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View Notified Donors</span>
                    </button>
                  </div>

                  {req.status !== 'CANCELLED' && req.status !== 'FULFILLED' && req.status !== 'MATCHED' && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Post Emergency Request */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-rose-500" />
                <span>Emergency Blood Requirement</span>
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Component</label>
                  <select
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="WHOLE_BLOOD">Whole Blood</option>
                    <option value="RBC">Red Blood Cells (RBC)</option>
                    <option value="PLASMA">Plasma</option>
                    <option value="PLATELETS">Platelets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Units</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Radius (km)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={initialRadius}
                    onChange={(e) => setInitialRadius(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. ICU Trauma Patient, Bed 4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40"
                >
                  {actionLoading ? 'Broadcasting...' : 'Broadcast Emergency Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Matched Donors Drawer */}
      {selectedMatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Notified Donors for Request #{selectedMatches.requestId}</span>
              </h2>
              <button onClick={() => setSelectedMatches(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {selectedMatches.matches.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">
                  No donors matched yet. Try clicking "Match Nearby Donors" or "Escalate Radius Tier".
                </p>
              ) : (
                selectedMatches.matches.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{m.donorName}</p>
                      <p className="text-slate-400">
                        {m.bloodGroup} • {m.distance} km away • Score: {m.score.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      {m.status === 'ACCEPTED' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                          ACCEPTED
                        </span>
                      ) : m.status === 'EXPIRED' ? (
                        <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-400">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 animate-pulse font-semibold">
                          NOTIFIED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedMatches(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
