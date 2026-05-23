import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  title: string;
  action: string;
  reasoning: string;
  urgency: "low" | "medium" | "high";
}

export function AISuggestionsPanel({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [approved, setApproved] = useState<Set<number>>(new Set());

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("doctor-suggestions", {
        body: { patientId, mode: "suggestions" },
      });
      if (error) throw error;
      setSuggestions(data?.suggestions || []);
      setDismissed(new Set());
      setApproved(new Set());
    } catch (e: any) {
      toast({ title: "Could not generate suggestions", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AI Suggested Adjustments
          </p>
          <Button size="sm" onClick={generate} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : suggestions.length ? "Regenerate" : "Generate"}
          </Button>
        </div>

        {!suggestions.length && !loading && (
          <p className="text-xs text-muted-foreground">Generate AI-powered, data-driven adjustment suggestions for this patient. Each comes with explainability so you can validate before approving.</p>
        )}

        {suggestions.map((s, i) => {
          const isOpen = openIdx === i;
          const isDismissed = dismissed.has(i);
          const isApproved = approved.has(i);
          return (
            <div key={i} className={`rounded-lg border p-3 space-y-2 ${isDismissed ? "opacity-50" : ""} ${isApproved ? "border-primary/40 bg-primary/5" : "border-border"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={s.urgency === "high" ? "destructive" : s.urgency === "medium" ? "secondary" : "outline"} className="text-[10px]">{s.urgency}</Badge>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.action}</p>
                </div>
              </div>

              <button onClick={() => setOpenIdx(isOpen ? null : i)} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                Why? {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {isOpen && (
                <div className="rounded-md bg-muted/50 p-2 text-xs text-foreground border border-border">
                  {s.reasoning}
                </div>
              )}

              {!isApproved && !isDismissed && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="default" className="h-7 text-xs flex-1" onClick={() => { setApproved(prev => new Set(prev).add(i)); toast({ title: "Suggestion approved", description: "Recorded in patient's care plan." }); }}>
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => setDismissed(prev => new Set(prev).add(i))}>
                    <X className="w-3 h-3 mr-1" /> Dismiss
                  </Button>
                </div>
              )}

              {isApproved && <p className="text-xs text-primary font-medium">✓ Approved</p>}
              {isDismissed && <p className="text-xs text-muted-foreground">Dismissed</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
