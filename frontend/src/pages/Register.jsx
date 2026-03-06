import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({ full_name: fullName, email, password });
      if (result.success) {
        navigate('/'); // Redirect to dashboard
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col md:flex-row-reverse font-sans selection:bg-orange-500/30">
      
      {/* Visual / Branding Side - Reversed horizontally from Login */}
      <div className="hidden md:flex flex-col justify-center w-1/2 p-12 lg:p-24 relative overflow-hidden bg-gradient-to-bl from-orange-600 to-neutral-900 border-l border-white/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542282811-943ef1a647a5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10"
        >
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 inline-block mb-6">
            <ShieldCheck className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight text-white">
            Join the Network.
          </h2>
          <p className="text-lg text-white/70 max-w-md font-light leading-relaxed">
            Gain access to real-time incident tracking, logistical equipment routing, and coordinated fleet deployments.
          </p>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative bg-[#0A0A0A] overflow-hidden overflow-y-auto">
        {/* Abstract background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div 
          className="w-full max-w-md relative z-10 py-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="md:hidden flex items-center gap-3 mb-8">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">BFPACS</h1>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Request Access</h2>
            <p className="text-neutral-400">Create an account to join the grid.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 block pl-12 p-3.5 transition-all outline-none"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300 ml-1">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 block pl-12 p-3.5 transition-all outline-none"
                  placeholder="name@bfp.gov.ph"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 block pl-12 p-3.5 transition-all outline-none"
                  placeholder="Min. 8 characters"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-300 ml-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-500 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 block pl-12 p-3.5 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg mt-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full flex justify-center items-center gap-2 text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 focus:ring-4 focus:ring-orange-500/30 font-medium rounded-xl text-sm px-5 py-3.5 text-center transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(234,88,12,0.15)] hover:shadow-[0_0_30px_rgba(234,88,12,0.3)] border border-orange-500/20"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
            
            <motion.p variants={itemVariants} className="text-sm font-light text-neutral-400 text-center mt-6">
              Already a member?{' '}
              <Link to="/login" className="font-medium text-white hover:text-orange-400 transition-colors underline decoration-white/30 underline-offset-4 decoration-1">
                Sign in
              </Link>
            </motion.p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
