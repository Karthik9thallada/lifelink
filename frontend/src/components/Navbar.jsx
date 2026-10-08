import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Heart, Activity, Radio, UserCheck, Hospital, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isDonor, isHospital, isAdmin, logout } = useAuth();
  const { connected } = useWebSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/40 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  Life<span className="text-rose-500">Link</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Emergency v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Connecting Every Lifesaving Donation to Those Who Need It
              </p>
            </div>
          </Link>

          {/* Center: Live WebSocket Status Pill */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className={connected ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
              {connected ? 'Live Radar Stream Active' : 'Connecting to Live Broker...'}
            </span>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAuthenticated ? (
              <>
                {isDonor && (
                  <Link
                    to="/donor/dashboard"
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/50"
                  >
                    <UserCheck className="w-4 h-4 text-rose-400" />
                    <span>Donor Desk</span>
                  </Link>
                )}

                {isHospital && (
                  <Link
                    to="/hospital/dashboard"
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/50"
                  >
                    <Hospital className="w-4 h-4 text-emerald-400" />
                    <span>Hospital Console</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin/hospitals"
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/50"
                  >
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Admin Verifications</span>
                  </Link>
                )}

                {/* User badge */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user?.name}</p>
                    <p className="text-[10px] uppercase font-mono text-slate-400">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Log out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-900/30 transition-all hover:scale-[1.02]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join Network</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
