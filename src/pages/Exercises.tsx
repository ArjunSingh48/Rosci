import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { Chatbot } from "@/components/Chatbot";
import { PatientNav } from "@/components/PatientNav";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Route as RouteIcon, Dumbbell } from "lucide-react";

const Exercises = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Exercises</h1>

        <div className="grid grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => navigate("/recovery-journey")}
          >
            <CardContent className="py-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <RouteIcon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">My Recovery Journey</h3>
                <p className="text-xs text-muted-foreground mt-1">Goals, videos & progress</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => navigate("/exercise-library")}
          >
            <CardContent className="py-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Exercise Library</h3>
                <p className="text-xs text-muted-foreground mt-1">Browse all exercises</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <PatientNav />
      <Chatbot />
    </div>
  );
};

export default Exercises;
