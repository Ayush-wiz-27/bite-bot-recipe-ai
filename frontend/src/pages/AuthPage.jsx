import { useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage({ setIsLoggedIn }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        setIsLoggedIn(true);
      } else {
        // If signup is successful, automatically switch to login
        setIsLogin(true);
        setError("Account created successfully. Please log in.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-primary-saffron/30 font-inter">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-[#f59e0b]/10 blur-[150px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-primary-saffron/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            whileHover={{ rotate: 180 }}
            className="inline-flex bg-primary-saffron p-4 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-6"
          >
            <ChefHat className="text-black w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-manrope font-extrabold tracking-tighter">
            <span className="text-primary-saffron text-glow-saffron italic">Bite</span> Bot
          </h1>
          <p className="text-xs uppercase tracking-[0.4em] font-black text-theme-muted mt-2">Atelier No. 001</p>
        </div>

        <div className="glass-island p-8 rounded-[2.5rem] border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${isLogin ? 'border-primary-saffron text-primary-saffron' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${!isLogin ? 'border-primary-saffron text-primary-saffron' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted mb-2 ml-4">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:border-primary-saffron/50 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                placeholder="chef@atelier.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted mb-2 ml-4">
                Passcode
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium outline-none focus:border-primary-saffron/50 focus:bg-white/10 transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs font-semibold px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-saffron hover:bg-white text-black font-manrope font-black px-8 py-4 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Lets Cook' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
