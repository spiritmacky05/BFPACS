// @ts-nocheck
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

export default function CommunityRegisterPage() {
  const navigate = useNavigate();
  const { handleCommunityRegister, isLoading, error, setError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNo, setContactNo] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const result = await handleCommunityRegister({
      full_name: fullName,
      email,
      password,
      contact_no: contactNo || null,
    });

    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-[#111] border border-[#1f1f1f] rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-semibold">Community Registration</h1>
        <p className="text-sm text-gray-400">Create community account for station viewing, auto-call, and incident reporting.</p>

        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm" />
        <input required type="email" inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm" />
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8)" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm" />
        <input value={contactNo} onChange={(e) => setContactNo(e.target.value)} placeholder="Contact number (optional)" className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm" />

        {error ? <div className="text-sm text-red-400">{error}</div> : null}

        <button disabled={isLoading} className="w-full px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium disabled:opacity-60">
          {isLoading ? 'Creating...' : 'Register Community Account'}
        </button>

        <div className="text-xs text-gray-400 text-center">
          Already have account? <Link to="/login" className="text-white underline">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
