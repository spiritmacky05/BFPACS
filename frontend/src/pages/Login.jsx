import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
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
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col md:flex-row font-sans selection:bg-orange-500/30">
      {/* Visual / Branding Side */}
      <div className="hidden md:flex flex-col justify-center w-1/2 p-12 lg:p-24 relative overflow-hidden bg-gradient-to-br from-orange-600 to-red-900 border-r border-white/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542282811-943ef1a647a5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute top-12 left-12 z-20 flex items-center gap-3"
        >
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
            <ShieldCheck className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">BFPACS</h1>
            <p className="text-xs text-orange-200 uppercase tracking-widest font-semibold font-mono">Operations Command</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10"
        >
          <h2 className="text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Secure.<br/>
            Deploy.<br/>
            Respond.
          </h2>
          <p className="text-lg text-white/70 max-w-md font-light leading-relaxed">
            Centralized coordination system for immediate threat response and operational logistics tracking. Enter your credentials to access the grid.
          </p>
        </motion.div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative bg-[#0A0A0A] overflow-hidden">
        {/* Abstract background blobs for modern vibe */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-red-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <motion.div 
          className="w-full max-w-md relative z-10"
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
            
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back</h2>
            <p className="text-neutral-400">Please enter your details to sign in.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-2">
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

            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-neutral-300">Password</label>
                <a href="#" className="text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors">Forgot password?</a>
              </div>
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
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full flex justify-center items-center gap-2 text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 focus:ring-4 focus:ring-orange-500/30 font-medium rounded-xl text-sm px-5 py-3.5 text-center transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(234,88,12,0.15)] hover:shadow-[0_0_30px_rgba(234,88,12,0.3)] border border-orange-500/20"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign in securely
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
            
            <motion.p variants={itemVariants} className="text-sm font-light text-neutral-400 text-center mt-6">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-medium text-white hover:text-orange-400 transition-colors underline decoration-white/30 underline-offset-4 decoration-1">
                Request access
              </Link>
            </motion.p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
