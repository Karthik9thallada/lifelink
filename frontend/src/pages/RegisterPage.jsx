import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donorApi } from '../api/donorApi';
import { hospitalApi } from '../api/hospitalApi';
import { Heart, Activity, User, Mail, Lock, Phone, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || 'DONOR';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Donor-specific fields
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [componentType, setComponentType] = useState('WHOLE_BLOOD');

  // Hospital-specific fields
  const [hospitalName, setHospitalName] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Register User
      const authUser = await register({
        name,
        email,
        password,
        phone,
        role,
      });

      // 2. Automatically create profile based on role
      if (role === 'DONOR') {
        // Default to Bangalore MG Road coordinate for simulated demo
        await donorApi.createOrUpdateProfile({
          bloodGroup,
          componentType,
          available: true,
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Bangalore Central, Karnataka',
          },
        });
        navigate('/donor/dashboard');
      } else if (role === 'HOSPITAL') {
        await hospitalApi.createOrUpdateProfile({
          hospitalName: hospitalName || name,
          address: address || 'MG Road, Bangalore',
          emergencyPhone: emergencyPhone || phone,
          licenseNumber: licenseNumber || 'HOSP-' + Math.floor(1000 + Math.random() * 9000),
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: address || 'MG Road, Bangalore',
          },
        });
        navigate('/hospital/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-xl w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">Join LifeLink Emergency Grid</h2>
          <p className="mt-1 text-xs text-slate-400">Choose your role to get started</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setRole('DONOR')}
            className={`py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              role === 'DONOR'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Blood / Plasma Donor</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('HOSPITAL')}
            className={`py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              role === 'HOSPITAL'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Hospital / Blood Bank</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {role === 'DONOR' ? 'Full Name' : 'Contact Person Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'DONOR' ? 'John Doe' : 'Dr. Sarah Connor'}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.org"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Role specific form sections */}
          {role === 'DONOR' ? (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Medical Blood Profile
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="A_POSITIVE">A+ (A Positive)</option>
                    <option value="A_NEGATIVE">A- (A Negative)</option>
                    <option value="B_POSITIVE">B+ (B Positive)</option>
                    <option value="B_NEGATIVE">B- (B Negative)</option>
                    <option value="AB_POSITIVE">AB+ (AB Positive)</option>
                    <option value="AB_NEGATIVE">AB- (AB Negative)</option>
                    <option value="O_POSITIVE">O+ (O Positive)</option>
                    <option value="O_NEGATIVE">O- (O Negative)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Component</label>
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
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Hospital Credentials
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="Apollo Emergency Hospital"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Hotline</label>
                  <input
                    type="tel"
                    required
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+918022334455"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">License #</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="HOSP-BLR-098"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="MG Road, Bangalore"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 text-white text-sm font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 disabled:opacity-50 ${
              role === 'DONOR'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
            }`}
          >
            <span>{loading ? 'Creating Network Node...' : `Register as ${role}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-rose-400 hover:text-rose-300 font-medium">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
