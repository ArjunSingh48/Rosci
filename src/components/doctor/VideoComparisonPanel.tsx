import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoRow { id: string; exercise_name: string; video_url: string | null; created_at: string }

export function VideoComparisonPanel({ videos }: { videos: VideoRow[] }) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const sorted = [...videos].filter(v => v.video_url).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  if (!first || !latest || first.id === latest.id) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Need at least two uploaded videos to compare progress.
        </CardContent>
      </Card>
    );
  }

  const compare = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-feedback", {
        body: {
          mode: "comparison",
          firstVideoUrl: first.video_url,
          latestVideoUrl: latest.video_url,
          exerciseName: latest.exercise_name,
          weeksBetween: Math.round((new Date(latest.created_at).getTime() - new Date(first.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)),
        },
      });
      if (error) throw error;
      setAnalysis(data?.comparison || data?.feedback || "Comparison generated.");
    } catch (e: any) {
      toast({ title: "Comparison failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" /> Progress Comparison
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">First — {new Date(first.created_at).toLocaleDateString()}</p>
            <video src={first.video_url!} controls className="w-full rounded-md aspect-video bg-muted" />
            <p className="text-xs text-foreground truncate">{first.exercise_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Latest — {new Date(latest.created_at).toLocaleDateString()}</p>
            <video src={latest.video_url!} controls className="w-full rounded-md aspect-video bg-muted" />
            <p className="text-xs text-foreground truncate">{latest.exercise_name}</p>
          </div>
        </div>
        <Button size="sm" onClick={compare} disabled={loading} className="w-full rounded-xl">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
          {analysis ? "Regenerate AI Analysis" : "Generate AI Comparison"}
        </Button>
        {analysis && (
          <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-foreground whitespace-pre-wrap">{analysis}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
