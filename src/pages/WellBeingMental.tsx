import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Wind, Eye, Sparkles, Heart } from "lucide-react";

const moodEmojis = ["😢", "😔", "😐", "🙂", "😊"];
const moodLabels = ["Struggling", "Low", "Neutral", "Good", "Great"];
const moodMap: Record<number, "struggling" | "low" | "neutral" | "happy"> = {
  0: "struggling", 1: "low", 2: "neutral", 3: "happy", 4: "happy",
};

const motivationalQuotes = [
  "Recovery happens step by step. Small progress today builds independence tomorrow.",
  "Your courage to keep going is your greatest strength.",
  "Every movement forward, no matter how small, is a victory worth celebrating.",
  "You are rewriting your story with every day of effort.",
  "Healing is not linear — but it is always possible.",
];

const exercises = [
  {
    title: "Deep Breathing",
    duration: "3 minutes",
    icon: Wind,
    color: "bg-primary/10 text-primary",
    steps: [
      "Sit comfortably with your back supported.",
      "Inhale slowly through your nose for 4 seconds.",
      "Hold your breath gently for 2 seconds.",
      "Exhale slowly through your mouth for 6 seconds.",
      "Repeat 8-10 times, focusing on each breath.",
    ],
  },
  {
    title: "Body Scan Relaxation",
    duration: "5 minutes",
    icon: Eye,
    color: "bg-secondary/20 text-secondary-foreground",
    steps: [
      "Close your eyes and take 3 deep breaths.",
      "Focus attention on the top of your head.",
      "Slowly move awareness down: forehead, jaw, neck, shoulders.",
      "Notice any tension without judging — just breathe into it.",
      "Continue scanning down through your body.",
      "End with 3 deep breaths and open your eyes.",
    ],
  },
  {
    title: "Positive Recovery Visualization",
    duration: "5 minutes",
    icon: Sparkles,
    color: "bg-accent/20 text-accent-foreground",
    steps: [
      "Close your eyes and relax your breathing.",
      "Imagine yourself achieving a recovery milestone.",
      "Picture the details: where you are, how it feels, who's with you.",
      "Feel the pride and accomplishment in your body.",
      "Hold this image for 2-3 minutes.",
      "Open your eyes and carry that feeling with you.",
    ],
  },
  {
    title: "Gratitude Reflection",
    duration: "3 minutes",
    icon: Heart,
    color: "bg-success/20 text-success-foreground",
    steps: [
      "Think of 3 things you're grateful for today.",
      "They can be small — a meal, a kind word, a comfortable moment.",
      "For each one, pause and really feel the gratitude.",
      "Optionally, write them down in your journal.",
      "End by thanking yourself for showing up today.",
    ],
  },
];

const mentalTips = [
  {
    title: "Coping with Reduced Mobility",
    content: "Focus on what you can do, not what you can't. Set micro-goals — even small achievements build momentum. Adaptive tools and technology can restore independence in daily activities.",
  },
  {
    title: "Managing Frustration During Rehab",
    content: "Frustration is natural and valid. Take breaks when overwhelmed. Celebrate small wins. Talk to your therapist about adjusting goals. Progress isn't always visible day-to-day.",
  },
  {
    title: "Staying Socially Connected",
    content: "Isolation can slow recovery. Stay in touch with friends and family. Join a support group — online or in person. Sharing experiences with others who understand can be powerful.",
  },
  {
    title: "Building a Positive Recovery Mindset",
    content: "Reframe setbacks as learning moments. Practice self-compassion — you're doing hard things. Visualization and affirmation exercises can strengthen your mental resilience.",
  },
];

const WellBeingMental = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [moodLevel, setMoodLevel] = useState(2);
  const [stressLevel, setStressLevel] = useState(2);
  const [motivationLevel, setMotivationLevel] = useState(3);
  const [painLevel, setPainLevel] = useState(1);
  const [note, setNote] = useState("");
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);

  const dailyQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  const { data: logs = [] } = useQuery({
    queryKey: ["mood-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("mood_logs")
        .select("*")
        .eq("patient_id", user!.id)
        .order("date", { ascending: false })
        .limit(14);
      return data ?? [];
    },
    enabled: !!user,
  });

  const todayLog = logs.find(l => l.date === new Date().toISOString().split("T")[0]);

  const logMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("mood_logs").insert({
        patient_id: user!.id,
        mood: moodMap[moodLevel] as any,
        note: note || `Stress: ${stressLevel}/4, Motivation: ${motivationLevel}/4, Pain: ${painLevel}/4`,
      });
    },
    onSuccess: () => {
      toast({ title: "Mental check-in saved!" });
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["mood-logs"] });
    },
  });

  const moodEmojisMap: Record<string, string> = { happy: "😊", neutral: "😐", low: "😔", struggling: "😢" };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">My Mental Well-Being</h1>

        {/* Motivational Quote */}
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="py-4 text-center">
            <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-sm italic text-foreground">{dailyQuote}</p>
          </CardContent>
        </Card>

        {/* Daily Mental Check-in */}
        {todayLog ? (
          <Card className="border-success/20">
            <CardContent className="py-4 text-center space-y-2">
              <span className="text-4xl">{moodEmojisMap[todayLog.mood] || "😐"}</span>
              <p className="text-sm font-semibold text-foreground capitalize">Today: {todayLog.mood}</p>
              {todayLog.note && <p className="text-xs text-muted-foreground">{todayLog.note}</p>}
              <p className="text-xs text-success">✓ Check-in complete</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-4 space-y-4">
              <p className="font-semibold text-foreground text-center">Daily Mental Check-in</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Mood</span>
                    <span className="text-lg">{moodEmojis[moodLevel]}</span>
                  </div>
                  <Slider value={[moodLevel]} onValueChange={v => setMoodLevel(v[0])} max={4} step={1} />
                  <p className="text-xs text-muted-foreground text-center">{moodLabels[moodLevel]}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Stress Level</span>
                    <span className="text-xs text-muted-foreground">{stressLevel}/4</span>
                  </div>
                  <Slider value={[stressLevel]} onValueChange={v => setStressLevel(v[0])} max={4} step={1} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Motivation</span>
                    <span className="text-xs text-muted-foreground">{motivationLevel}/4</span>
                  </div>
                  <Slider value={[motivationLevel]} onValueChange={v => setMotivationLevel(v[0])} max={4} step={1} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Pain Level</span>
                    <span className="text-xs text-muted-foreground">{painLevel}/4</span>
                  </div>
                  <Slider value={[painLevel]} onValueChange={v => setPainLevel(v[0])} max={4} step={1} />
                </div>
              </div>

              <Textarea placeholder="Add a note (optional)" value={note} onChange={e => setNote(e.target.value)} className="resize-none" />
              <Button onClick={() => logMutation.mutate()} disabled={logMutation.isPending} className="w-full rounded-xl">
                {logMutation.isPending ? "Saving…" : "Save Check-in"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Guided Mental Exercises */}
        <div className="space-y-2">
          <p className="font-semibold text-foreground text-sm">Guided Mental Exercises</p>
          {exercises.map((ex, i) => {
            const Icon = ex.icon;
            const isOpen = expandedExercise === i;
            return (
              <Card key={i}>
                <CardContent className="p-0">
                  <button onClick={() => setExpandedExercise(isOpen ? null : i)} className="w-full text-left p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ex.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{ex.title}</p>
                      <p className="text-xs text-muted-foreground">{ex.duration}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <ol className="space-y-2">
                            {ex.steps.map((step, j) => (
                              <li key={j} className="text-xs text-muted-foreground flex gap-2">
                                <span className="font-semibold text-foreground shrink-0">{j + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mental Health Tips */}
        <div className="space-y-2">
          <p className="font-semibold text-foreground text-sm">Mental Health Tips</p>
          {mentalTips.map((tip, i) => {
            const isOpen = expandedTip === i;
            return (
              <Card key={i}>
                <CardContent className="p-0">
                  <button onClick={() => setExpandedTip(isOpen ? null : i)} className="w-full text-left p-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{tip.title}</p>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">{tip.content}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Mood History */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">Recent Mood</p>
            {logs.map(l => (
              <Card key={l.id}>
                <CardContent className="py-3 flex items-center gap-3">
                  <span className="text-xl">{moodEmojisMap[l.mood] || "😐"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground capitalize">{l.mood}</p>
                    {l.note && <p className="text-xs text-muted-foreground line-clamp-1">{l.note}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{l.date}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default WellBeingMental;
