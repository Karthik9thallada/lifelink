import React, { useEffect, useState } from 'react';
import { hospitalApi } from '../api/hospitalApi';
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, RefreshCw, Hospital } from 'lucide-react';

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
      setMessage(`Hospital #${id} verification updated to: ${status}`);
      loadHospitals();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification update failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <span>Admin Center: Hospital Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and certify registered hospitals to allow posting of emergency blood & plasma requests.
          </p>
        </div>

        <button
          onClick={loadHospitals}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 border border-slate-700">
          {message}
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 backdrop-blur-md">
        {loading ? (
          <p className="text-center text-slate-400 py-8 text-sm">Loading hospitals...</p>
        ) : hospitals.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">No hospitals registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Hospital</th>
                  <th className="py-3 px-4">License Number</th>
                  <th className="py-3 px-4">Emergency Hotline</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <Hospital className="w-4 h-4 text-emerald-400" />
                      <span>{h.hospitalName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{h.licenseNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{h.emergencyPhone}</td>
                    <td className="py-3.5 px-4 text-slate-400">{h.address}</td>
                    <td className="py-3.5 px-4">
                      {h.verified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[10px]">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {h.verified ? (
                        <button
                          onClick={() => handleVerify(h.id, false)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(h.id, true)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                        >
                          Approve
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
