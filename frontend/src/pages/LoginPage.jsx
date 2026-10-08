import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Lock, Mail, AlertCircle, ArrowRight, Activity, UserCheck, ShieldCheck, Hospital } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const sessionExpired = searchParams.get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'DONOR') {
        navigate('/donor/dashboard');
      } else if (user.role === 'HOSPITAL') {
        navigate('/hospital/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/hospitals');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to fill test credentials for fast demo
  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center mx-auto shadow-xl shadow-rose-900/40">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-white tracking-tight">Sign in to LifeLink</h2>
          <p className="mt-1 text-xs text-slate-400">Emergency Response Command Network</p>
        </div>

        {sessionExpired && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Session expired. Please sign in again.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="apex@lifelink.org"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating Terminal...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="pt-4 border-t border-slate-700/60 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
            One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('apex@lifelink.org', 'password123')}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <Hospital className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate font-semibold">Apex Hospital</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('donora.escl@lifelink.org', 'password123')}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <UserCheck className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="truncate font-semibold">Rahul (Donor A)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('donorb.escl@lifelink.org', 'password123')}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate font-semibold">Sunita (Donor B)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@lifelink.org', 'admin123')}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate font-semibold">Administrator</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-rose-400 hover:text-rose-300 font-bold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
