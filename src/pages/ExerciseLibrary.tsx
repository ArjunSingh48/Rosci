import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "@/hooks/useGamification";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, Dumbbell, Zap, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { key: "all", label: "All" },
  { key: "upper_body", label: "Upper Body" },
  { key: "core", label: "Core" },
  { key: "stretching", label: "Stretching" },
  { key: "breathing", label: "Breathing" },
  { key: "mobility", label: "Mobility" },
];

const ExerciseLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardPoints, tryAwardBadge } = useGamification();
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercise-library"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  const filtered = activeCategory === "all"
    ? exercises
    : exercises.filter((e: any) => e.category === activeCategory);

  const quickStart = exercises.filter((e: any) => e.is_bite_sized && e.duration_minutes <= 3).slice(0, 3);

  const handleStart = async (exercise: any) => {
    if (!user) return;
    await supabase.from("daily_tasks_log").insert({
      patient_id: user.id,
      task_name: exercise.name,
      task_category: "rehabilitation" as any,
      completed: true,
      skipped: false,
    });
    await awardPoints(5, `Completed: ${exercise.name}`);
    await tryAwardBadge("first_exercise");
    toast({ title: `+5 pts — ${exercise.name} completed! 💪` });
  };

  const categoryIcons: Record<string, string> = {
    upper_body: "💪",
    core: "🎯",
    stretching: "🧘",
    breathing: "🫁",
    mobility: "🦽",
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Exercise Library</h1>

        {/* Quick Start */}
        {quickStart.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Quick Start (2-3 min)</h2>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickStart.map((ex: any) => (
                <Card key={ex.id} className="bg-primary/5 border-primary/10">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.duration_minutes} min · {ex.difficulty}</p>
                    </div>
                    <Button size="sm" className="rounded-xl gap-1" onClick={() => handleStart(ex)}>
                      <Play className="w-3 h-3" /> Start
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === c.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="space-y-2">
          {filtered.map((ex: any) => {
            const isExpanded = expandedId === ex.id;
            const instructions: string[] = Array.isArray(ex.instructions) ? ex.instructions : [];

            return (
              <Card key={ex.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                  className="w-full text-left"
                >
                  <CardContent className="py-3 flex items-center gap-3">
                    <span className="text-2xl">{categoryIcons[ex.category] || "🏋️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ex.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {ex.duration_minutes} min
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {ex.difficulty}
                        </Badge>
                        {ex.is_bite_sized && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                            bite-sized
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </CardContent>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t space-y-3">
                        <p className="text-xs font-semibold text-primary">{ex.purpose}</p>
                        {(ex.muscle_groups as string[])?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {(ex.muscle_groups as string[]).map((mg: string) => (
                              <Badge key={mg} variant="secondary" className="text-[10px]">{mg}</Badge>
                            ))}
                          </div>
                        )}
                        <ol className="space-y-1 list-decimal list-inside">
                          {instructions.map((inst: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground">{inst}</li>
                          ))}
                        </ol>
                        {ex.equipment_needed !== "none" && (
                          <p className="text-xs text-muted-foreground">
                            <Dumbbell className="w-3 h-3 inline mr-1" />
                            Equipment: {ex.equipment_needed}
                          </p>
                        )}
                        <Button size="sm" className="w-full rounded-xl gap-1" onClick={() => handleStart(ex)}>
                          <Play className="w-3 h-3" /> Complete Exercise (+5 pts)
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default ExerciseLibrary;
