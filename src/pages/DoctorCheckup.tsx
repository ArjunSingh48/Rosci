import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

const DoctorCheckup = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground">Doctor Check-up</h1>
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="py-8 text-center">
          <Stethoscope className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-foreground font-semibold">No upcoming check-ups</p>
          <p className="text-sm text-muted-foreground mt-1">Your doctor will schedule your next check-up. You'll receive a notification when it's set.</p>
        </CardContent>
      </Card>
    </main>
    <PatientNav />
    <FloatingButtons />
    <Chatbot />
  </div>
);

export default DoctorCheckup;
