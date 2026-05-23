import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function WeeklySummaryCard({ patientId, patientName }: { patientId: string; patientName: string }) {
  const { toast } = useToast();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-summary", { body: { patientId } });
      if (error) throw error;
      setSummary(data?.summary || "");
    } catch (e: any) {
      toast({ title: "Could not generate summary", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(summary);
    toast({ title: "Copied to clipboard" });
  };

  const download = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${patientName.replace(/\s+/g, "_")}_weekly_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Weekly Clinical Summary
          </p>
          <Button size="sm" onClick={generate} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : summary ? "Regenerate" : "Generate"}
          </Button>
        </div>

        {!summary && !loading && (
          <p className="text-xs text-muted-foreground">Auto-generate a clinical summary covering progress, adherence, concerns, and recommendations.</p>
        )}

        {summary && (
          <>
            <pre className="whitespace-pre-wrap text-xs text-foreground bg-muted/50 p-3 rounded-md border border-border max-h-80 overflow-auto font-sans">
              {summary}
            </pre>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copy} className="flex-1"><Copy className="w-3 h-3 mr-1" /> Copy</Button>
              <Button size="sm" variant="outline" onClick={download} className="flex-1"><Download className="w-3 h-3 mr-1" /> Download</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
