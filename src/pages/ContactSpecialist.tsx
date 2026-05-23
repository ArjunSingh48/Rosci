import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MapPin, Stethoscope } from "lucide-react";

const ContactSpecialist = () => {
  const { data: specialists = [] } = useQuery({
    queryKey: ["specialists"],
    queryFn: async () => {
      const { data } = await supabase.from("specialists").select("*").order("name");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Contact Specialist</h1>
        <p className="text-sm text-muted-foreground">Reach out to your healthcare team.</p>

        {specialists.map((doc: any) => (
          <Card key={doc.id}>
            <CardContent className="py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{doc.name}</p>
                <p className="text-sm text-primary">{doc.specialization}</p>
                {doc.clinic_address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {doc.clinic_address}
                  </p>
                )}
              </div>
              {doc.phone && (
                <Button size="icon" className="rounded-full shrink-0" asChild>
                  <a href={`tel:${doc.phone}`}>
                    <Phone className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {specialists.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No specialists listed yet.</p>
        )}
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default ContactSpecialist;
