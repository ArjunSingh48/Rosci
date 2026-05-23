import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Heart, Shield, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const demoLogin = async (email: string, role: string) => {
    setDemoLoading(role);
    try {
      // Clean up any leftover demo data first
      await supabase.functions.invoke("cleanup-demo");
    } catch (e) {
      console.warn("Demo cleanup before login failed:", e);
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: "demo123456" });
    if (error) {
      toast({ title: "Demo login failed", description: error.message, variant: "destructive" });
    } else {
      navigate(role === "patient" ? "/home" : "/doctor");
    }
    setDemoLoading(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient opacity-30"
        style={{
          background: "linear-gradient(135deg, hsl(180 33% 54%), hsl(15 100% 81%), hsl(180 33% 70%), hsl(120 30% 74%))",
        }}
      />
      <div className="absolute inset-0 bg-background/70" />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-lg text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Heart className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Ro<span className="text-primary">SCI</span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-lg text-muted-foreground font-medium leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Guided Recovery. Clear Progress. Supported Journey.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: TrendingUp, label: "Track Progress" },
            { icon: Shield, label: "Simplified Reports" },
            { icon: Heart, label: "Emotional Support" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-sm border">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            size="lg"
            className="w-full rounded-xl shadow-md"
            onClick={() => demoLogin("patient@demo.rosci.app", "patient")}
            disabled={!!demoLoading}
          >
            {demoLoading === "patient" ? "Signing in…" : "Demo Patient Login"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => demoLogin("doctor@demo.rosci.app", "doctor")}
            disabled={!!demoLoading}
          >
            {demoLoading === "doctor" ? "Signing in…" : "Demo Doctor Login"}
          </Button>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => navigate("/register")}>
              Register
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Landing;
