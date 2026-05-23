import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, Heart, Moon, Apple, Brain, BookOpen } from "lucide-react";

const sections = [
  { to: "/wellbeing/reports", icon: FileText, label: "Reports", desc: "View your medical reports" },
  { to: "/wellbeing/recovery", icon: Heart, label: "My Recovery Journey", desc: "Track your progress" },
  { to: "/wellbeing/sleep", icon: Moon, label: "My Sleep", desc: "Log and review sleep" },
  { to: "/wellbeing/nutrition", icon: Apple, label: "My Nutrition", desc: "Track meals & hydration" },
  { to: "/wellbeing/mental", icon: Brain, label: "My Mental Well-Being", desc: "Log your mood" },
  { to: "/wellbeing/awareness", icon: BookOpen, label: "Medical Awareness", desc: "Learn about SCI recovery" },
];

const WellBeing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">My Well-Being</h1>
        <div className="grid gap-3">
          {sections.map(({ to, icon: Icon, label, desc }) => (
            <Card
              key={to}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(to)}
            >
              <CardContent className="py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default WellBeing;
