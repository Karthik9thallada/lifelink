import React, { useEffect, useState } from 'react';
import { hospitalApi } from '../api/hospitalApi';
import { requestApi } from '../api/requestApi';
import { useWebSocket } from '../context/WebSocketContext';
import { 
  Hospital, PlusCircle, Radio, Users, CheckCircle2, AlertCircle, RefreshCw, 
  XCircle, ArrowUpRight, ShieldCheck, Clock, MapPin, Zap, Activity, Droplet, 
  PhoneCall, ChevronRight, Filter, AlertTriangle, Check
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
  const [modalError, setModalError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Create Request Form State
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [componentType, setComponentType] = useState('WHOLE_BLOOD');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [urgency, setUrgency] = useState('CRITICAL');
  const [initialRadius, setInitialRadius] = useState(5.0);
  const [timeframeHours, setTimeframeHours] = useState(4);
  const [notes, setNotes] = useState('');

  const bloodGroupOptions = [
    { value: 'O_POSITIVE', label: 'O+' },
    { value: 'O_NEGATIVE', label: 'O-' },
    { value: 'A_POSITIVE', label: 'A+' },
    { value: 'A_NEGATIVE', label: 'A-' },
    { value: 'B_POSITIVE', label: 'B+' },
    { value: 'B_NEGATIVE', label: 'B-' },
    { value: 'AB_POSITIVE', label: 'AB+' },
    { value: 'AB_NEGATIVE', label: 'AB-' },
  ];

  const componentOptions = [
    { value: 'WHOLE_BLOOD', label: 'Whole Blood', desc: 'Standard emergency trauma' },
    { value: 'RBC', label: 'Red Blood Cells (RBC)', desc: 'Severe anemia & blood loss' },
    { value: 'PLASMA', label: 'Plasma', desc: 'Burn trauma & clotting support' },
    { value: 'PLATELETS', label: 'Platelets', desc: 'Oncology & massive bleeding' },
  ];

  const urgencyOptions = [
    { value: 'CRITICAL', label: 'Critical', color: 'border-red-500 bg-red-500/10 text-red-400', badge: 'bg-red-500/20 text-red-400' },
    { value: 'URGENT', label: 'Urgent', color: 'border-amber-500 bg-amber-500/10 text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
    { value: 'NORMAL', label: 'Normal', color: 'border-blue-500 bg-blue-500/10 text-blue-400', badge: 'bg-blue-500/20 text-blue-400' },
  ];

  const getLocalFormattedTime = (hours) => {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

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

    const unsubs = requests.map((req) => {
      return subscribeToTopic(`/topic/requests/${req.id}`, (event) => {
        setNotification(`📡 Request #${req.id} Live Update: ${event.message}`);
        requestApi.getMyRequests().then((res) => setRequests(res || []));
      });
    });

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [requests.map((r) => r.id).join(',')]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      setActionLoading(true);
      const localFuture = getLocalFormattedTime(timeframeHours);
      
      const created = await requestApi.createRequest({
        bloodGroup,
        componentType,
        unitsRequired: parseInt(unitsRequired, 10),
        urgency,
        initialRadius: parseFloat(initialRadius),
        requiredBy: localFuture,
        notes: notes.trim() || 'Urgent medical transfusion required',
      });

      // Automatically search for nearby matching donors
      try {
        await requestApi.findMatches(created.id);
      } catch (matchErr) {
        console.warn('Initial auto-matching finished:', matchErr);
      }

      setShowCreateModal(false);
      setNotification(`✅ Emergency Request #${created.id} broadcast! PostGIS matching engine mobilized.`);
      setNotes('');
      await loadData();
    } catch (err) {
      console.error('Create request error:', err);
      let errMsg = 'Failed to create emergency request.';
      if (err.response?.data?.fieldErrors) {
        errMsg = Object.entries(err.response.data.fieldErrors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' • ');
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      setModalError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFindMatches = async (requestId) => {
    try {
      setActionLoading(true);
      const matches = await requestApi.findMatches(requestId);
      setNotification(`🎯 Matching Engine: Mobilized and notified ${matches.length} compatible donors!`);
      await loadData();
    } catch (err) {
      setNotification(err.response?.data?.message || 'Matching process failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (requestId) => {
    try {
      setActionLoading(true);
      const matches = await requestApi.escalateRequest(requestId);
      setNotification(`🚀 Search Radius Escalated! Found ${matches.length} additional candidate donors.`);
      await loadData();
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
      console.error('Error fetching matches:', err);
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm(`Are you sure you want to cancel Emergency Request #${requestId}?`)) return;
    try {
      await requestApi.cancelRequest(requestId);
      setNotification(`Emergency Request #${requestId} has been cancelled.`);
      await loadData();
    } catch (err) {
      setNotification(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">OPEN</span>;
      case 'SEARCHING':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            <span>SEARCHING</span>
          </span>
        );
      case 'ESCALATED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">ESCALATED</span>;
      case 'MATCHED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MATCHED</span>;
      case 'FULFILLED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600/30 text-emerald-200 border border-emerald-500/40">FULFILLED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return r.status === 'SEARCHING' || r.status === 'ESCALATED' || r.status === 'OPEN';
    if (filterStatus === 'MATCHED') return r.status === 'MATCHED' || r.status === 'FULFILLED';
    return r.status === filterStatus;
  });

  // Calculate quick stats
  const totalRequests = requests.length;
  const activeRequests = requests.filter((r) => ['SEARCHING', 'ESCALATED', 'OPEN'].includes(r.status)).length;
  const fulfilledRequests = requests.filter((r) => ['MATCHED', 'FULFILLED'].includes(r.status)).length;
  const totalUnitsNeeded = requests.reduce((acc, r) => acc + (r.unitsRequired || 0), 0);
  const totalUnitsFulfilled = requests.reduce((acc, r) => acc + (r.unitsFulfilled || 0), 0);

  if (loading && !hospital) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-9 h-9 text-rose-500 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Connecting to Hospital Command Grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hospital Banner */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
              <Hospital className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {hospital?.hospitalName || 'Emergency Center'}
                </h1>
                {hospital?.verified ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Certified Emergency Hub</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-slate-300">Lic: {hospital?.licenseNumber}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{hospital?.address}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 font-mono text-slate-300">
                  <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                  <span>{hospital?.emergencyPhone}</span>
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setModalError('');
              setShowCreateModal(true);
            }}
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-sm font-bold shadow-xl shadow-rose-950/50 transition-all hover:scale-[1.02] flex items-center justify-center space-x-2.5"
          >
            <PlusCircle className="w-5 h-5 text-white" />
            <span>Post Emergency Blood Request</span>
          </button>
        </div>
      </div>

      {/* Real-time notification banner */}
      {notification && (
        <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-sm flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-3 text-slate-200">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="text-xs text-slate-400 hover:text-white font-medium ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
          <p className="text-xs text-slate-400 font-medium">Total Posted Requests</p>
          <p className="text-2xl font-black text-white font-mono mt-1">{totalRequests}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
          <p className="text-xs text-amber-400 font-medium">Active / In Matching</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{activeRequests}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
          <p className="text-xs text-emerald-400 font-medium">Fully Matched</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{fulfilledRequests}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-md">
          <p className="text-xs text-rose-400 font-medium">Total Units Progress</p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {totalUnitsFulfilled} <span className="text-sm font-normal text-slate-500">/ {totalUnitsNeeded}</span>
          </p>
        </div>
      </div>

      {/* Emergency Requests Command List */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Emergency Blood Requests Command List</h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All ({requests.length})
              </button>
              <button
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'ACTIVE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Active ({activeRequests})
              </button>
              <button
                onClick={() => setFilterStatus('MATCHED')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === 'MATCHED' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Matched ({fulfilledRequests})
              </button>
            </div>

            <button
              onClick={loadData}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-14 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <Droplet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">No blood requests match this filter.</p>
            <p className="text-slate-500 text-xs mt-1">
              Click "Post Emergency Blood Request" above to broadcast an urgent blood or plasma requirement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4 shadow-lg shadow-black/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center space-x-4">
                    <span className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-black text-base font-mono shadow-inner flex-shrink-0">
                      {req.bloodGroup}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-white">
                          Request #{req.id} • {req.componentType}
                        </span>
                        {getStatusBadge(req.status)}
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          req.urgency === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {req.urgency}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Search Radius: <strong className="text-amber-400 font-mono">{req.currentRadius} km</strong></span>
                        <span>•</span>
                        <span>Clinical Notes: <span className="text-slate-300 italic">{req.notes || 'None'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Units Progress Counter */}
                  <div className="text-right flex-shrink-0 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-baseline justify-end space-x-1">
                      <span className="text-2xl font-black text-white font-mono">{req.unitsFulfilled}</span>
                      <span className="text-slate-400 text-xs font-mono">/ {req.unitsRequired} Units</span>
                    </div>
                    <div className="w-36 h-2 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (req.unitsFulfilled / req.unitsRequired) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Operations & Control Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleFindMatches(req.id)}
                      disabled={actionLoading || req.status === 'MATCHED' || req.status === 'FULFILLED'}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-40"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Find Donors</span>
                    </button>

                    <button
                      onClick={() => handleEscalate(req.id)}
                      disabled={actionLoading || req.status === 'MATCHED' || req.status === 'FULFILLED'}
                      className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 font-semibold transition-colors flex items-center space-x-1.5 disabled:opacity-40"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Escalate Radius Tier</span>
                    </button>

                    <button
                      onClick={() => handleViewMatches(req.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors flex items-center space-x-1.5 border border-slate-700/60"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Notified Donors</span>
                    </button>
                  </div>

                  {req.status !== 'CANCELLED' && req.status !== 'FULFILLED' && req.status !== 'MATCHED' && (
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="text-rose-400 hover:text-rose-300 font-medium px-2 py-1 transition-colors"
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

      {/* Modal: Post Emergency Blood Request */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Broadcast Emergency Request</h2>
                  <p className="text-xs text-slate-400">Initiate immediate PostGIS radius donor matching</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4">
              {/* 1. Blood Group Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Target Blood Group
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {bloodGroupOptions.map((bg) => (
                    <button
                      type="button"
                      key={bg.value}
                      onClick={() => setBloodGroup(bg.value)}
                      className={`py-2 px-3 rounded-xl font-bold font-mono text-sm border transition-all ${
                        bloodGroup === bg.value
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40 scale-[1.02]'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Component Type */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Blood Component
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {componentOptions.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setComponentType(c.value)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        componentType === c.value
                          ? 'bg-slate-800 border-rose-500 text-white shadow-inner'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <p className={`text-xs font-bold ${componentType === c.value ? 'text-rose-400' : 'text-slate-300'}`}>
                        {c.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Urgency & Units Required */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Urgency Classification
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {urgencyOptions.map((u) => (
                      <button
                        type="button"
                        key={u.value}
                        onClick={() => setUrgency(u.value)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          urgency === u.value
                            ? `${u.color} border-current shadow-md`
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Units Required
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setUnitsRequired((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-lg"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={unitsRequired}
                      onChange={(e) => setUnitsRequired(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center bg-slate-800 border border-slate-700 rounded-xl py-2 font-mono font-bold text-lg text-white focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setUnitsRequired((prev) => Math.min(20, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Radius & Target Timeframe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Initial Radius: <span className="text-amber-400 font-mono">{initialRadius} km</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={initialRadius}
                    onChange={(e) => setInitialRadius(parseFloat(e.target.value))}
                    className="w-full accent-rose-600 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>2 km (Local)</span>
                    <span>10 km</span>
                    <span>30 km (District)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Required Window
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[1, 2, 4, 12, 24].map((hrs) => (
                      <button
                        type="button"
                        key={hrs}
                        onClick={() => setTimeframeHours(hrs)}
                        className={`py-1.5 rounded-lg font-mono font-semibold border transition-all ${
                          timeframeHours === hrs
                            ? 'bg-rose-600/30 text-rose-300 border-rose-500 font-bold'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {hrs}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Clinical Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Clinical Ward / Emergency Notes
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. ICU Bed 4 - Severe Trauma & Internal Hemorrhage"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting to Radar...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Broadcast Emergency Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Matched Donors Drawer */}
      {selectedMatches && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Notified Donors • Request #{selectedMatches.requestId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Candidate donors identified by PostGIS spatial compatibility engine
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMatches(null)} 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {selectedMatches.matches.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-slate-300 font-medium text-sm">No donors matched yet within this radius.</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Click "Escalate Radius Tier" to widen the search boundary to 10 km, 25 km, or 50 km.
                  </p>
                </div>
              ) : (
                selectedMatches.matches.map((m) => (
                  <div
                    key={m.matchId || m.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                      m.status === 'ACCEPTED'
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-800/70 border-slate-700/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{m.donorName}</span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-rose-600/30 text-rose-300 border border-rose-500/40">
                          {m.bloodGroup}
                        </span>
                      </div>
                      <p className="text-slate-400 flex items-center space-x-2 text-[11px]">
                        <span>Distance: <strong className="text-amber-400 font-mono">{m.distanceKm != null ? m.distanceKm.toFixed(2) : m.distance} km</strong></span>
                        <span>•</span>
                        <span>Score: <strong className="text-emerald-400 font-mono">{m.score != null ? m.score.toFixed(1) : '-'}</strong></span>
                        {m.donorPhone && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-300 flex items-center space-x-1">
                              <PhoneCall className="w-3 h-3 text-emerald-400" />
                              <span>{m.donorPhone}</span>
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <div>
                      {m.status === 'ACCEPTED' ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>ACCEPTED</span>
                        </span>
                      ) : m.status === 'EXPIRED' ? (
                        <span className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 animate-pulse font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span>NOTIFIED</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                onClick={() => setSelectedMatches(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
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
