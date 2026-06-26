import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Play,
  ChefHat,
  Search,
  MessageSquare,
  UtensilsCrossed,
  Info,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Layers,
  Zap,
  Command,
  Eye,
  LogOut,
  Menu,
  X,
  Save,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";


function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// EXPLOSION VARIANTS
const explosionContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const explosionItem = {
  hidden: { opacity: 0, scale: 0.8, y: 20, filter: "blur(10px)" },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function Dashboard({ setIsLoggedIn }) {
  const [url, setUrl] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [listening, setListening] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [theme, setTheme] = useState("dark"); // 'dark' | 'light'
  const [showIngredientsMobile, setShowIngredientsMobile] = useState(false);
  const [isExploding, setIsExploding] = useState(false); // New State
  const scrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState("generate");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [saveToast, setSaveToast] = useState(false);
  const [ragQuery, setRagQuery] = useState("");
  const [ragResults, setRagResults] = useState([]);
  const [ragAnswer, setRagAnswer] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  //Fetch recipes saved
  const loadSavedRecipes = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/recipe/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setSavedRecipes(data);
  };


  // Sync theme to document
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  useEffect(() => {
    if (activeTab === "saved") {
      loadSavedRecipes();
    }
  }, [activeTab]);



  // Speak logic
  const speakStep = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1.1;
    window.speechSynthesis.speak(speech);
  };
  const handleSave = async () => {
    const token = localStorage.getItem("token");

    await fetch(`${import.meta.env.VITE_API_URL}/api/recipe/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url,
        recipe,
      }),
    });

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };
  // Voice Recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      if (!recipe) return;
      if (transcript.includes("next")) {
        setCurrentStep((prev) => {
          const newStep = Math.min(prev + 1, recipe.steps.length - 1);
          speakStep(recipe.steps[newStep]);
          return newStep;
        });
      } else if (transcript.includes("back") || transcript.includes("previous")) {
        setCurrentStep((prev) => {
          const newStep = Math.max(prev - 1, 0);
          speakStep(recipe.steps[newStep]);
          return newStep;
        });
      } else if (transcript.includes("repeat")) {
        speakStep(recipe.steps[currentStep]);
      } else {
        askAI(transcript);
      }
    };
    recognition.start();
  };

  useEffect(() => {
    if (recipe?.steps?.length > 0 && !isExploding) {
      speakStep(recipe.steps[currentStep]);
    }
  }, [currentStep, recipe, isExploding]);

  const handleSubmit = async () => {
    if (!url) return;
    setLoading(true);
    setRecipe(null);
    try {
      console.log("Engaging Bite Bot for URL:", url);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/recipe/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      console.log("Bite Bot Response:", data);

      if (!res.ok || !data.recipe) {
        throw new Error(data.error || "Failed to forge recipe. Check your URL or API key.");
      }

      // TRIGGER CINEMATIC SUPERNOVA
      setIsExploding(true);
      setLoading(false);

      // Wait for the "Supernova Image" to explode before showing dashboard
      setTimeout(() => {
        setRecipe(data.recipe);
        setCurrentStep(0);
        setIsExploding(false);
      }, 2000);

    } catch (err) {
      console.error("Bite Bot Forge Error:", err);
      alert(`Bite Bot Error: ${err.message}`);
      setLoading(false);
      setIsExploding(false);
    }
  };

  //raghandle
  const handleRag = async (mode) => {
    try {
      if (mode === "generate") {
        setLoading(true);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/recipe/rag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          query: ragQuery,
          mode,
        }),
      });

      const data = await res.json();

      if (mode === "suggest") {
        setRagResults(data.recipes || []);
        setRagAnswer("");
      } else {
        // Generate mode — load recipe like ENGAGE does
        if (data.recipe) {
          setLoading(false);
          setIsExploding(true);

          setTimeout(() => {
            setRecipe(data.recipe);
            setCurrentStep(0);
            setIsExploding(false);
            setRagQuery("");
            setRagResults([]);
          }, 2000);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setIsExploding(false);
    }
  };

  const askAI = async (question) => {
    setChatHistory(prev => [...prev, { role: 'user', content: question }]);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/recipe/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          question,
          ingredients: recipe?.ingredients || [],
        }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
      speakStep(data.answer);
    } catch (err) {
      console.error("AI Query Error:", err);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const getVitalityClass = (index) => {
    if (index % 3 === 0) return "vital-essential border-red-500/10";
    if (index % 3 === 1) return "vital-optional border-yellow-500/10";
    return "vital-garnishing border-green-500/10";
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-primary-saffron/30 font-inter transition-colors duration-700">

      {/* THE SUPERNOVA OVERLAY (CINEMATIC) */}
      <AnimatePresence>
        {isExploding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          >
            <motion.div
              initial={{ scale: 1, filter: "blur(0px)", opacity: 0 }}
              animate={{
                scale: [1, 1.2, 5],
                filter: ["blur(0px)", "blur(10px)", "blur(80px)"],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center shadow-[inset_0_0_200px_rgba(0,0,0,1)]"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop")' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1.5] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative z-10 text-center"
            >
              <h2 className="text-primary-saffron font-manrope font-black text-6xl md:text-8xl tracking-tight italic">
                Bite <span className="text-white">Bot</span>
              </h2>
              <div className="mt-4 text-white/50 font-manrope font-black text-[12px] tracking-[0.8em] uppercase">Forging Identity...</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CINEMATIC ATELIER BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {theme === "light" && (
          <>
            <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-[#f59e0b]/5 blur-[150px] rounded-full animate-pulse-slow" />
            <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-primary-saffron/3 blur-[120px] rounded-full" />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-[1750px] mx-auto min-h-screen flex flex-col p-4 md:p-10">

        {/* NAVIGATION / HEADER */}
        {/* <header className="flex justify-between items-center mb-8 lg:mb-16 px-2">
          <div className="flex items-center gap-3 lg:gap-4">
            <motion.div
              whileHover={{ rotate: 180 }}
              className="bg-primary-saffron p-2 lg:p-2.5 rounded-xl lg:rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              <ChefHat className="text-black w-5 h-5 lg:w-6 lg:h-6" />
            </motion.div>
            <div>
              <h1 className="text-lg lg:text-3xl font-manrope font-extrabold tracking-tighter transition-colors duration-700">
                <span className="text-primary-saffron text-glow-saffron italic">Bite</span> Bot
              </h1>
              <p className="text-[8px] lg:text-[9px] uppercase tracking-[0.4em] font-black text-theme-muted mt-0.5"></p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                setIsLoggedIn(false);
              }}
              className="text-[10px] lg:text-xs font-manrope font-black tracking-[0.1em] text-red-400 hover:text-red-300 transition-all uppercase flex items-center gap-1"
            >
              <LogOut className="w-3 h-3 lg:w-4 lg:h-4" /> Logout
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex bg-zinc-900/50 p-1 rounded-full border border-white/10 hover:border-primary-saffron transition-all"
            >
              <div className={cn(
                "p-1.5 lg:p-2 rounded-full transition-all duration-500",
                theme === 'dark' ? "bg-primary-saffron text-black shadow-lg" : "text-zinc-500"
              )}>
                <Moon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </div>
              <div className={cn(
                "p-1.5 lg:p-2 rounded-full transition-all duration-500",
                theme === 'light' ? "bg-primary-saffron text-white shadow-lg" : "text-zinc-500"
              )}>
                <Sun className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </div>
            </button>

            {recipe && (
              <button
                onClick={handleSave}
                className="text-[10px] lg:text-xs font-manrope font-black tracking-[0.1em] text-green-400 hover:text-green-300 transition-all uppercase"
              >
                Save
              </button>
            )}

            <button
              onClick={() => setActiveTab(activeTab === 'saved' ? 'generate' : 'saved')}
              className="text-[10px] lg:text-xs font-manrope font-black tracking-[0.1em] text-theme-text hover:text-theme-accent transition-all uppercase flex items-center gap-1"
            >
              {activeTab === 'saved' ? 'Back' : 'Saved Recipes'}
            </button>

            {recipe && (
              <button
                onClick={() => setRecipe(null)}
                className="text-[10px] lg:text-xs font-manrope font-black tracking-[0.1em] text-primary-saffron hover:text-inherit transition-all uppercase"
              >
                Reset
              </button>
            )}
          </div>
        </header> */}

        <header className="flex justify-between items-center mb-8 lg:mb-16 px-2 relative">

          {/* Logo */}
          <div className="flex items-center gap-3 lg:gap-4">
            <motion.div
              whileHover={{ rotate: 180 }}
              className="bg-primary-saffron p-2 lg:p-2.5 rounded-xl lg:rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              <ChefHat className="text-black w-5 h-5 lg:w-6 lg:h-6" />
            </motion.div>

            <div>
              <h1 className="text-lg lg:text-3xl font-manrope font-extrabold tracking-tighter">
                <span className="text-primary-saffron italic">Bite</span> Bot
              </h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-theme-muted">
                Your AI Cooking Companion
              </p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-6">

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex bg-zinc-900/50 p-1 rounded-full border border-white/10"
            >
              <div className={cn(
                "p-2 rounded-full",
                theme === "dark"
                  ? "bg-primary-saffron text-black"
                  : "text-zinc-500"
              )}>
                <Moon size={16} />
              </div>

              <div className={cn(
                "p-2 rounded-full",
                theme === "light"
                  ? "bg-primary-saffron text-white"
                  : "text-zinc-500"
              )}>
                <Sun size={16} />
              </div>
            </button>

            {recipe && (
              <button
                onClick={handleSave}
                className="text-green-400 font-bold uppercase text-xs"
              >
                Save
              </button>
            )}

            <button
              onClick={() =>
                setActiveTab(activeTab === "saved" ? "generate" : "saved")
              }
              className="font-bold uppercase text-xs"
            >
              {activeTab === "saved" ? "Back" : "Saved Recipes"}
            </button>

            {recipe && (
              <button
                onClick={() => setRecipe(null)}
                className="text-primary-saffron font-bold uppercase text-xs"
              >
                Reset
              </button>
            )}

            <button
              onClick={() => {
                localStorage.removeItem("token");
                setIsLoggedIn(false);
              }}
              className="text-red-400 font-bold uppercase text-xs flex items-center gap-1"
            >
              <LogOut size={15} />
              Logout
            </button>

          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          {/* Mobile Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={cn(
                  "absolute top-20 right-0 w-60 rounded-2xl p-5 flex flex-col gap-4 z-50 lg:hidden shadow-2xl border",
                  theme === "dark"
                    ? "bg-zinc-900 border-zinc-700"
                    : "bg-white border-zinc-200"
                )}
              >
                {/* <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 pb-3 border-b border-white/10 text-left hover:text-primary-saffron transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-semibold">Back</span>
                </button> */}
                <button
                  onClick={() => {
                    setActiveTab("generate");
                    setMobileMenuOpen(false);
                  }}
                  className="text-left flex items-center gap-2 hover:text-primary-saffron transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  Dashboard
                </button>

                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setMobileMenuOpen(false);
                  }}
                  className="text-left"
                >
                  {theme === "dark"
                    ? "☀️ Light Mode"
                    : "🌙 Dark Mode"}
                </button>

                {recipe && (
                  <button
                    onClick={() => {
                      handleSave();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left"
                  >

                    Save Recipe
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab(
                      activeTab === "saved"
                        ? "generate"
                        : "saved"
                    );
                    setMobileMenuOpen(false);
                  }}
                  className="text-left"
                >
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Saved Recipes
                </button>

                {recipe && (
                  <button
                    onClick={() => {
                      setRecipe(null);
                      setMobileMenuOpen(false);
                    }}
                    className="text-left"
                  >
                    Reset
                  </button>
                )}

                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    setIsLoggedIn(false);
                  }}
                  className="text-left text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>

              </motion.div>
            )}
          </AnimatePresence>

        </header>

        {activeTab === 'generate' && (
          <AnimatePresence mode="wait">
            {!recipe ? (
              /* LUXURY HOME SCREEN */
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-10 lg:-mt-20"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="mb-8 lg:mb-12"
                >
                  <div className="inline-flex items-center gap-2 lg:gap-3 glass-pill px-6 lg:px-8 py-2.5 lg:py-3 rounded-full text-[9px] lg:text-[11px] font-black text-primary-saffron tracking-[0.2em] uppercase border-white/10">
                    <Sparkles className="w-3.5 h-3.5" /> Kitchen Assistant
                  </div>
                </motion.div>

                <h2 className="text-4xl md:text-7xl lg:text-9xl font-manrope font-extrabold mb-6 lg:mb-8 tracking-tighter leading-[1] transition-colors duration-700">
                  Taste <br /> <span className="text-primary-saffron text-glow-saffron italic">Explosion</span>
                </h2>
                <p className="text-theme-muted text-base lg:text-2xl max-w-3xl mb-12 lg:mb-16 font-medium leading-relaxed tracking-tight px-4 transition-colors duration-700">
                  Import your favorite masterclasses and watch the Bite Bot forge your reality.
                </p>

                {/* ARTISAN INPUT CAPSULE */}
                <div className="relative w-full max-w-4xl group">
                  <div className="glass-island p-2 lg:p-4 rounded-3xl lg:rounded-full flex flex-col lg:flex-row items-stretch lg:items-center transition-all duration-700 border-white/20 group-focus-within:border-primary-saffron/60 group-focus-within:bg-black/80 shadow-[0_30px_60px_rgba(0,0,0,0.4)] gap-2">
                    <div className="flex items-center flex-1 px-4">
                      <Search className="text-zinc-600 w-5 h-5 lg:w-7 h-7 group-focus-within:text-primary-saffron" />
                      <input
                        type="text"
                        placeholder="Import Masterclass or Reel URL..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none py-4 lg:py-6 px-4 lg:px-8 text-inherit placeholder:text-zinc-800 text-lg lg:text-2xl font-semibold transition-colors duration-700"
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-primary-saffron hover:bg-white text-black font-manrope font-black px-8 lg:px-12 py-4 lg:py-6 rounded-2xl lg:rounded-full transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <RotateCcw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>ENGAGE <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* RAG SUGGESTION SECTION */}
                <div className="w-full max-w-4xl mt-12 lg:mt-16">
                  <div className="glass-island p-4 lg:p-6 rounded-3xl border-white/10 space-y-4">
                    <h3 className="text-[10px] lg:text-[12px] font-manrope font-black uppercase tracking-[0.3em] text-primary-saffron flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> What are you craving?
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="e.g. something spicy with paneer..."
                        value={ragQuery}
                        onChange={(e) => setRagQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && ragQuery && handleRag('suggest')}
                        className="flex-1 bg-white/5 border border-white/10 focus:border-primary-saffron/60 outline-none px-5 py-3.5 rounded-2xl text-inherit placeholder:text-zinc-600 text-sm lg:text-base font-semibold transition-all duration-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRag('suggest')}
                          disabled={!ragQuery}
                          className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-primary-saffron/20 border border-white/10 hover:border-primary-saffron/40 text-[10px] lg:text-xs font-manrope font-black uppercase tracking-[0.15em] text-primary-saffron transition-all disabled:opacity-30 whitespace-nowrap"
                        >
                          Suggest
                        </button>
                        <button
                          onClick={() => handleRag('generate')}
                          disabled={!ragQuery}
                          className="px-5 py-3.5 rounded-2xl bg-primary-saffron/10 hover:bg-primary-saffron/20 border border-primary-saffron/30 hover:border-primary-saffron/60 text-[10px] lg:text-xs font-manrope font-black uppercase tracking-[0.15em] text-primary-saffron transition-all disabled:opacity-30 whitespace-nowrap"
                        >
                          Create New
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {ragAnswer && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="glass-island p-5 lg:p-6 rounded-2xl border-primary-saffron/20 space-y-2"
                        >
                          <h4 className="text-[10px] font-manrope font-black uppercase tracking-[0.2em] text-primary-saffron">BiteBot Suggestion</h4>
                          <p className="text-sm lg:text-base font-medium leading-relaxed text-theme-muted whitespace-pre-line">{ragAnswer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {ragResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 md:grid-cols-3 gap-3"
                        >
                          {ragResults.map((r, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              onClick={() => {
                                if (!r.recipe || !r.recipe.steps) {
                                  console.log("Invalid recipe", r);
                                  return;
                                }

                                setIsExploding(true);

                                setTimeout(() => {
                                  setRecipe(r.recipe);
                                  setCurrentStep(0);
                                  setIsExploding(false);
                                }, 1500);
                              }}
                              className="glass-island p-4 lg:p-5 rounded-2xl border-white/5 hover:border-primary-saffron/40 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl">{r.ingredients?.[0]?.emoji || '🥘'}</span>
                                <h4 className="font-manrope font-black text-sm tracking-tight group-hover:text-primary-saffron transition-colors">{r.title}</h4>
                              </div>
                              <p className="text-[10px] lg:text-xs text-theme-muted font-medium truncate">
                                {r.ingredients?.slice(0, 3).map(ing => ing.name).join(', ')}
                              </p>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </motion.div>
            ) : (
              /* DASHBOARD (REVEAL AFTER EXPLOSION) */
              <motion.div
                key="cooking"
                variants={explosionContainer}
                initial="hidden"
                animate="show"
                className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-12 items-stretch"
              >
                {/* COLUMN 1: ELEMENTS */}
                <motion.aside
                  variants={explosionItem}
                  className={cn(
                    "flex flex-col space-y-4 lg:space-y-8 lg:col-span-3 transition-all duration-500",
                    showIngredientsMobile ? "h-[50vh]" : "h-auto lg:h-full"
                  )}
                >
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] lg:text-[12px] font-manrope font-black uppercase tracking-[0.3em] text-primary-saffron flex items-center gap-2">
                      <UtensilsCrossed className="w-3.5 h-3.5" /> Elements
                    </h3>
                    <button
                      onClick={() => setShowIngredientsMobile(!showIngredientsMobile)}
                      className="lg:hidden glass-pill px-4 py-2 rounded-full text-[10px] font-black text-theme-muted flex items-center gap-2"
                    >
                      <Layers className="w-3 h-3" /> {showIngredientsMobile ? 'Minimize' : 'Expand'}
                    </button>
                  </div>

                  <div className={cn(
                    "flex-1 space-y-4 lg:space-y-6 lg:pr-4 custom-scrollbar lg:max-h-[75vh]",
                    showIngredientsMobile ? "overflow-y-auto" : "hidden lg:block overflow-y-auto"
                  )}>
                    {recipe.ingredients.map((ing, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setActiveIngredient(activeIngredient === i ? null : i)}
                        className={cn(
                          "glass-island p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] cursor-pointer transition-all duration-500 border-white/5 relative overflow-hidden group",
                          activeIngredient === i ? "border-primary-saffron/50 bg-primary-saffron/10 ring-2 ring-primary-saffron/20" : "hover:bg-white/5",
                          activeIngredient === i ? "" : getVitalityClass(i)
                        )}
                      >
                        <div className="flex justify-between items-start relative z-10">
                          <div className="space-y-1">
                            <h4 className="font-manrope font-black text-sm lg:text-base tracking-tight text-inherit flex items-center gap-2">
                              <span className="text-lg">{ing.emoji || '🥘'}</span> {ing.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] lg:text-[10px] font-black text-theme-muted uppercase tracking-widest">{ing.quantity}</span>
                            </div>
                          </div>
                          <div className="bg-primary-saffron/10 p-1.5 rounded-xl group-hover:bg-white transition-colors">
                            <Info className="w-3.5 h-3.5 text-primary-saffron group-hover:text-black" />
                          </div>
                        </div>

                        <AnimatePresence>
                          {activeIngredient === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="pt-4 lg:pt-6 mt-4 lg:mt-6 border-t border-white/10 space-y-4"
                            >

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                  <span className="block text-[8px] uppercase tracking-tighter text-theme-muted mb-0.5">Protein</span>
                                  <span className="font-manrope font-black text-[10px]">{ing.protein || '—'}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                  <span className="block text-[8px] uppercase tracking-tighter text-theme-muted mb-0.5">Fat</span>
                                  <span className="font-manrope font-black text-[10px]">{ing.fat || '—'}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                  <span className="block text-[8px] uppercase tracking-tighter text-theme-muted mb-0.5">Carbs</span>
                                  <span className="font-manrope font-black text-[10px]">{ing.carbs || '—'}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                  <span className="block text-[8px] uppercase tracking-tighter text-theme-muted mb-0.5">Vits</span>
                                  <span className="font-manrope font-black text-[10px]">{ing.vitamins || '—'}</span>
                                </div>
                              </div>
                              <p className="text-xs lg:text-sm text-theme-muted font-medium leading-relaxed font-inter transition-colors duration-700">{ing.purpose}</p>
                              <div className="bg-primary-saffron font-manrope text-black font-black p-4 rounded-2xl text-[10px] uppercase tracking-widest">
                                Impact: {ing.impact}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </motion.aside>

                {/* COLUMN 2: THE ATELIER */}
                <motion.main
                  variants={explosionItem}
                  className="lg:col-span-6 flex flex-col items-center justify-center relative py-4 lg:py-0"
                >
                  <div className="w-full relative px-2">
                    <div className="glass-island w-full rounded-[2.5rem] lg:rounded-[4rem] p-8 md:p-16 lg:p-24 flex flex-col items-center text-center relative border-white/20 space-y-8 lg:space-y-20 shadow-2xl overflow-hidden">
                      <div className="text-primary-saffron font-manrope font-black text-[10px] lg:text-[12px] tracking-[0.5em] uppercase border border-primary-saffron/30 px-5 lg:px-6 py-1.5 lg:py-2 rounded-full relative z-10">
                        STAGE {currentStep + 1} OF {recipe.steps.length}
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStep}
                          initial={{ opacity: 0, y: 20, rotateX: 20 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0 }}
                          exit={{ opacity: 0, y: -20, rotateX: -20 }}
                          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                          className="flex items-center justify-center min-h-[180px] lg:min-h-[350px] relative z-10"
                        >
                          <h3 className="text-2xl md:text-5xl lg:text-7xl font-manrope font-extrabold leading-tight tracking-tighter text-balance max-w-4xl mx-auto">
                            {recipe.steps[currentStep]}
                          </h3>
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex items-center gap-6 lg:gap-12 w-full justify-center relative z-10">
                        <button
                          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                          disabled={currentStep === 0}
                          className="p-5 lg:p-8 rounded-2xl lg:rounded-[2.5rem] glass-island hover:border-primary-saffron transition-all disabled:opacity-5 text-theme-muted"
                        >
                          <ChevronLeft className="w-6 h-6 lg:w-10 lg:h-10" />
                        </button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => speakStep(recipe.steps[currentStep])}
                          className="h-20 w-20 lg:h-32 lg:w-32 rounded-full bg-primary-saffron text-black flex items-center justify-center shadow-xl group"
                        >
                          <Play className="w-8 h-8 lg:w-12 lg:h-12 fill-current ml-1 group-hover:scale-125 transition-transform" />
                        </motion.button>

                        <button
                          onClick={() => setCurrentStep(prev => Math.min(recipe.steps.length - 1, prev + 1))}
                          disabled={currentStep === recipe.steps.length - 1}
                          className="p-5 lg:p-8 rounded-2xl lg:rounded-[2.5rem] glass-island hover:border-primary-saffron transition-all disabled:opacity-5 text-theme-muted"
                        >
                          <ChevronRight className="w-6 h-6 lg:w-10 lg:h-10" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.main>

                {/* COLUMN 3: CHAT */}
                <motion.aside
                  variants={explosionItem}
                  className="lg:col-span-3 flex flex-col h-full space-y-4 lg:space-y-8 py-4 lg:py-0"
                >
                  <h3 className="text-[10px] lg:text-[12px] font-manrope font-black uppercase tracking-[0.3em] text-primary-saffron flex items-center gap-2 px-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </h3>

                  <div className="glass-island flex-1 rounded-[2rem] lg:rounded-[3.5rem] flex flex-col overflow-hidden border-white/20 max-h-[40vh] lg:max-h-[75vh]">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6 lg:space-y-8 custom-scrollbar">
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 lg:p-12 opacity-20">
                          <Sparkles className="w-10 h-10 lg:w-14 lg:h-14 mb-4 lg:mb-8 text-primary-saffron animate-bounce" />
                          <p className="text-[10px] lg:text-[12px] font-manrope font-black uppercase tracking-[0.3em] leading-loose text-theme-muted transition-colors duration-700">
                            Voice sync active
                          </p>
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={i}
                            className={cn(
                              "p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] text-xs lg:text-sm font-semibold leading-relaxed font-inter transition-colors duration-700",
                              msg.role === 'user'
                                ? "bg-primary-saffron text-black ml-auto rounded-tr-none px-6 py-4 lg:px-8 lg:py-5 shadow-xl"
                                : "glass-island text-inherit rounded-tl-none border-white/5"
                            )}
                          >
                            {msg.content}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {activeTab === 'saved' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center p-4"
          >
            <h2 className="text-2xl md:text-5xl font-manrope font-extrabold mb-12 tracking-tighter text-white">
              <span className="text-primary-saffron italic">Saved</span> Recipes
            </h2>

            {savedRecipes.length === 0 ? (
              <div className="glass-island p-10 rounded-[2rem] border-white/10 text-center opacity-50 flex flex-col items-center">
                <ChefHat className="w-12 h-12 mb-4 text-primary-saffron" />
                <p className="font-manrope font-black uppercase tracking-[0.2em] text-theme-muted">No recipes saved yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {savedRecipes.map((r, i) => (
                  <div key={i} className="glass-island p-6 lg:p-8 rounded-[2rem] border-white/10 hover:border-primary-saffron/40 transition-all flex flex-col items-center text-center shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-primary-saffron/10 flex items-center justify-center mb-6 text-3xl">
                      {r.recipe?.ingredients?.[0]?.emoji || '🥘'}
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold font-manrope mb-6 text-theme-text tracking-tight line-clamp-2">
                      {r.title || `Recipe #${i + 1}`}
                    </h3>
                    <button
                      onClick={() => {
                        setRecipe(r.recipe);
                        setActiveTab("generate");
                      }}
                      className="mt-auto bg-primary-saffron text-black font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-full hover:scale-105 transition-transform"
                    >
                      Open Recipe
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* VOICE PILL */}
        {recipe && !loading && (
          <div className="fixed bottom-6 right-6 lg:bottom-12 lg:right-12 z-50 flex items-center gap-4">
            <AnimatePresence>
              {listening && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-primary-saffron px-5 lg:px-8 py-2.5 lg:py-4 rounded-full text-black font-manrope font-black text-[9px] lg:text-[12px] uppercase tracking-[0.4em] shadow-2xl"
                >
                  Listening...
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={startListening}
              className={cn(
                "w-16 h-16 lg:w-24 lg:h-24 rounded-full flex items-center justify-center transition-all duration-700 relative overflow-hidden shadow-2xl",
                listening ? "bg-primary-saffron scale-110 shadow-[0_0_30px_rgba(245,158,11,0.5)]" : "glass-island hover:border-primary-saffron"
              )}
            >
              {listening ? (
                <Mic className="w-7 h-7 lg:w-10 lg:h-10 text-black relative z-10" />
              ) : (
                <div className="relative">
                  <MicOff className="w-7 h-7 lg:w-10 lg:h-10 text-zinc-600 group-hover:text-primary-saffron transition-colors" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                </div>
              )}
            </button>
          </div>
        )}

      </div>

      {/* SAVE TOAST NOTIFICATION */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] glass-island px-6 py-4 rounded-full border-primary-saffron/50 shadow-[0_0_40px_rgba(245,158,11,0.3)] flex items-center gap-3 bg-black/80 backdrop-blur-xl"
          >
            <div className="bg-primary-saffron/20 p-2 rounded-full">
              <ChefHat className="w-4 h-4 text-primary-saffron" />
            </div>
            <span className="text-white font-manrope font-black text-[11px] tracking-widest uppercase pt-0.5">
              Recipe Added to Your Cookbook
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
