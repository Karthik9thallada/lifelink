import React, { useEffect, useState } from 'react';
import { hospitalApi } from '../api/hospitalApi';
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, RefreshCw, Hospital, MapPin, PhoneCall, Check, X } from 'lucide-react';

export default function AdminDashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const list = await hospitalApi.getAllHospitals();
      setHospitals(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await hospitalApi.verifyHospital(id, status);
      setMessage(`Hospital #${id} verification updated to: ${status ? 'VERIFIED' : 'PENDING'}`);
      await loadHospitals();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification update failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span>Admin Center: Hospital Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Review and certify registered hospitals to allow posting of emergency blood & plasma requests.
          </p>
        </div>

        <button
          onClick={loadHospitals}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-slate-800/90 text-xs text-slate-200 border border-slate-700 flex items-center justify-between shadow-lg">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
            <span>Loading hospital records...</span>
          </div>
        ) : hospitals.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-sm">No hospitals registered in the network yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Hospital Center</th>
                  <th className="py-3.5 px-4">License Number</th>
                  <th className="py-3.5 px-4">Emergency Hotline</th>
                  <th className="py-3.5 px-4">Physical Address</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-white flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Hospital className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{h.hospitalName}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300 font-semibold">{h.licenseNumber}</td>
                    <td className="py-4 px-4 font-mono text-slate-300">{h.emergencyPhone}</td>
                    <td className="py-4 px-4 text-slate-400">{h.address}</td>
                    <td className="py-4 px-4">
                      {h.verified ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {h.verified ? (
                        <button
                          onClick={() => handleVerify(h.id, false)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold transition-colors border border-slate-700"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(h.id, true)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 hover:scale-105"
                        >
                          Approve Hub
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
