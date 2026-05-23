import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Clock } from "lucide-react";
import { useRef } from "react";

const WellBeingReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: reports = [] } = useQuery({
    queryKey: ["medical-reports", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_reports")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("medical-reports").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("medical-reports").getPublicUrl(path);
      await supabase.from("medical_reports").insert({
        patient_id: user!.id,
        original_file_url: urlData.publicUrl,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast({ title: "Report uploaded! Your doctor will review it." });
      queryClient.invalidateQueries({ queryKey: ["medical-reports"] });
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>

        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="py-8 text-center">
            <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Upload a medical report (PDF)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
              }}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending} className="rounded-xl">
              {uploadMutation.isPending ? "Uploading…" : "Choose File"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {reports.map(report => (
            <Card key={report.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Report — {new Date(report.created_at).toLocaleDateString()}
                      </p>
                      <Badge variant={report.status === "approved" ? "default" : "secondary"} className="mt-1">
                        {report.status === "approved" ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Reviewed</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                {report.status === "approved" && report.simplified_summary && (
                  <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Simplified Summary</p>
                    <p className="text-sm text-foreground">{report.simplified_summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No reports yet. Upload your first report above.</p>
          )}
        </div>
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default WellBeingReports;
