import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BookOpen, Phone, Stethoscope, HelpCircle } from "lucide-react";

const items = [
  { to: "/more/blogs", icon: BookOpen, label: "Blogs", desc: "Articles about recovery & wellness" },
  { to: "/contact-specialist", icon: Phone, label: "Contact Specialist", desc: "Reach your healthcare team" },
  { to: "/more/checkup", icon: Stethoscope, label: "Doctor Check-up", desc: "Schedule or view check-ups" },
  { to: "/more/faq", icon: HelpCircle, label: "General FAQ", desc: "Common questions answered" },
];

const More = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">More</h1>
        <div className="grid gap-3">
          {items.map(({ to, icon: Icon, label, desc }) => (
            <Card key={to} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(to)}>
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

export default More;
