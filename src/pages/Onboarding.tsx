import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { DOCTORS } from "@/lib/doctors";

const injuryLevels = [
  ...Array.from({ length: 8 }, (_, i) => `C${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `L${i + 1}`),
];

const spinalRegions = [
  { value: "cervical", label: "Cervical" },
  { value: "thoracic", label: "Thoracic" },
  { value: "lumbar", label: "Lumbar" },
  { value: "sacral", label: "Sacral" },
  { value: "unsure", label: "Unsure" },
];

const moodEmojis = [
  { value: 1, emoji: "😔", label: "Very Low" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [rehabWeeks, setRehabWeeks] = useState(1);
  const [spinalRegion, setSpinalRegion] = useState("unsure");
  const [injuryLevel, setInjuryLevel] = useState("T6");
  const [painLevel, setPainLevel] = useState([5]);
  const [moodLevel, setMoodLevel] = useState(3);
  const [doctorKey, setDoctorKey] = useState("singh");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("profiles").update({
      rehab_weeks: rehabWeeks,
      spinal_region: spinalRegion,
      injury_level: injuryLevel,
      pain_level: painLevel[0],
      mood_level: moodLevel,
      doctor_key: doctorKey,
      onboarding_completed: true,
    }).eq("id", user.id);
    await refreshProfile();
    setLoading(false);
    navigate("/home", { replace: true });
  };

  const steps = [
    <div className="space-y-4" key="weeks">
      <Label className="text-lg font-semibold">How many weeks since your injury?</Label>
      <Input
        type="number"
        min={1}
        max={260}
        value={rehabWeeks}
        onChange={e => setRehabWeeks(Number(e.target.value))}
        className="text-center text-2xl h-16"
      />
    </div>,
    <div className="space-y-4" key="region">
      <Label className="text-lg font-semibold">Which part of your spinal column was affected?</Label>
      <Select value={spinalRegion} onValueChange={setSpinalRegion}>
        <SelectTrigger className="h-14 text-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          {spinalRegions.map(r => (
            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>,
    <div className="space-y-4" key="injury">
      <Label className="text-lg font-semibold">What is your injury level?</Label>
      <Select value={injuryLevel} onValueChange={setInjuryLevel}>
        <SelectTrigger className="h-14 text-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          {injuryLevels.map(level => (
            <SelectItem key={level} value={level}>{level}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>,
    <div className="space-y-6" key="pain">
      <Label className="text-lg font-semibold">Current pain level</Label>
      <div className="px-2">
        <Slider value={painLevel} onValueChange={setPainLevel} min={1} max={10} step={1} />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Minimal</span>
          <span className="text-2xl font-bold text-primary">{painLevel[0]}</span>
          <span>Severe</span>
        </div>
      </div>
    </div>,
    <div className="space-y-6" key="mood">
      <Label className="text-lg font-semibold">How are you feeling today?</Label>
      <div className="flex justify-center gap-4">
        {moodEmojis.map(m => (
          <button
            key={m.value}
            onClick={() => setMoodLevel(m.value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
              moodLevel === m.value
                ? "bg-primary/15 ring-2 ring-primary scale-110"
                : "hover:bg-muted"
            }`}
          >
            <span className="text-3xl">{m.emoji}</span>
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </button>
        ))}
      </div>
    </div>,
    <div className="space-y-4" key="doctor">
      <Label className="text-lg font-semibold">Who is your doctor?</Label>
      <Select value={doctorKey} onValueChange={setDoctorKey}>
        <SelectTrigger className="h-14 text-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          {DOCTORS.map(d => (
            <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {doctorKey && (
        <p className="text-sm text-muted-foreground text-center">
          {DOCTORS.find(d => d.key === doctorKey)?.email}
        </p>
      )}
    </div>,
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center">
          <CardTitle>Let's personalize your experience</CardTitle>
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i <= step ? "bg-primary w-8" : "bg-muted w-4"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[180px] flex flex-col justify-center"
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl">
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} className="flex-1 rounded-xl">
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading} className="flex-1 rounded-xl">
                {loading ? "Saving…" : "Get Started"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
