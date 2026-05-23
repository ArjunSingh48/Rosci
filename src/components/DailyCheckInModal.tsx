import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Smile, Meh, Frown, Flame, Sparkles, Zap, Battery, BatteryLow, BatteryMedium, BatteryFull, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

const motivationalMessages = [
  "Every day you show up is a victory 💪",
  "Small steps lead to big changes 🌟",
  "Your consistency is building strength ⚡",
  "You're doing amazing — keep going! 🚀",
  "Recovery is a journey, not a race 🌱",
];

interface Props {
  streak: number;
  onSubmit: (mood: "great" | "okay" | "bad", note: string, energy: string, pain: number, motivation: number) => Promise<void>;
  onClose: () => void;
}

export function DailyCheckInModal({ streak, onSubmit, onClose }: Props) {
  const [mood, setMood] = useState<"great" | "okay" | "bad" | null>(null);
  const [energy, setEnergy] = useState<"low" | "medium" | "high">("medium");
  const [painLevel, setPainLevel] = useState([3]);
  const [motivation, setMotivation] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  const handleSubmit = async () => {
    if (!mood) return;
    setSaving(true);
    await onSubmit(mood, note, energy, painLevel[0], motivation);
    setSaving(false);
  };

  const steps = [
    // Step 0: Mood
    <div className="space-y-3" key="mood">
      <p className="text-sm font-medium text-foreground text-center">How are you feeling?</p>
      <div className="flex justify-center gap-4">
        {([
          { value: "great" as const, icon: Smile, label: "Great" },
          { value: "okay" as const, icon: Meh, label: "Okay" },
          { value: "bad" as const, icon: Frown, label: "Low" },
        ]).map(m => (
          <button
            key={m.value}
            onClick={() => setMood(m.value)}
            className={`flex flex-col items-center gap-1 p-4 rounded-xl transition-all ${
              mood === m.value ? "bg-primary/15 ring-2 ring-primary scale-110" : "hover:bg-muted"
            }`}
          >
            <m.icon className="w-10 h-10 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
          </button>
        ))}
      </div>
    </div>,
    // Step 1: Energy
    <div className="space-y-3" key="energy">
      <p className="text-sm font-medium text-foreground text-center">What's your energy level?</p>
      <div className="flex justify-center gap-4">
        {([
          { value: "low" as const, icon: BatteryLow, label: "Low" },
          { value: "medium" as const, icon: BatteryMedium, label: "Medium" },
          { value: "high" as const, icon: BatteryFull, label: "High" },
        ]).map(e => (
          <button
            key={e.value}
            onClick={() => setEnergy(e.value)}
            className={`flex flex-col items-center gap-1 p-4 rounded-xl transition-all ${
              energy === e.value ? "bg-primary/15 ring-2 ring-primary scale-110" : "hover:bg-muted"
            }`}
          >
            <e.icon className="w-10 h-10 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">{e.label}</span>
          </button>
        ))}
      </div>
    </div>,
    // Step 2: Pain + Motivation + Note
    <div className="space-y-4" key="pain-motivation">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground text-center">Pain level</p>
        <Slider value={painLevel} onValueChange={setPainLevel} min={1} max={10} step={1} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Minimal</span>
          <span className="text-lg font-bold text-primary">{painLevel[0]}</span>
          <span>Severe</span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground text-center">Motivation</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} onClick={() => setMotivation(v)}>
              <Star className={`w-7 h-7 transition-colors ${v <= motivation ? "text-primary fill-primary" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      </div>
      <Textarea
        placeholder="Anything else? (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        className="resize-none"
        rows={2}
      />
    </div>,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-card rounded-2xl border shadow-lg max-w-sm w-full p-6 space-y-5"
      >
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Daily Check-In</h2>
          </div>
          <p className="text-sm text-muted-foreground italic">{message}</p>
          {streak > 0 && (
            <div className="flex items-center justify-center gap-1 text-orange-500 font-bold">
              <Flame className="w-5 h-5" />
              <span>{streak} day streak!</span>
            </div>
          )}
          {/* Step indicators */}
          <div className="flex justify-center gap-2 pt-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-primary w-6" : "bg-muted w-3"}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">
            Skip
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !mood}
              className="flex-1 rounded-xl"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!mood || saving}
              className="flex-1 rounded-xl"
            >
              {saving ? "Saving…" : "Check In (+10 pts)"}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
