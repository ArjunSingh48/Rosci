import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, BookOpen, ShieldCheck, Apple, Brain, Accessibility } from "lucide-react";

interface Article {
  key: string;
  title: string;
  icon: any;
  color: string;
  summary: string;
  content: string[];
  tips: string[];
}

const articles: Article[] = [
  {
    key: "understanding-sci",
    title: "Understanding Spinal Cord Injuries",
    icon: BookOpen,
    color: "bg-primary/10 text-primary",
    summary: "Learn about how SCI affects the body and what recovery looks like.",
    content: [
      "A spinal cord injury (SCI) disrupts the signals between the brain and the body. The severity depends on whether the injury is complete or incomplete, and its location along the spine.",
      "In paraplegia, the injury typically occurs in the thoracic, lumbar, or sacral regions, affecting the lower body. Sensation, movement, and autonomic functions below the injury level may be impaired.",
      "Recovery varies greatly between individuals. Neuroplasticity — the brain's ability to form new neural connections — plays a key role. Consistent rehabilitation can help the body find new pathways for movement and sensation.",
      "Understanding your injury is the first step toward effective recovery. Work with your medical team to learn about your specific injury level and what improvements are realistic.",
    ],
    tips: [
      "Ask your doctor to explain your specific injury level",
      "Learn the difference between complete and incomplete injuries",
      "Set realistic, incremental recovery goals",
      "Track your progress over weeks, not days",
    ],
  },
  {
    key: "pressure-ulcers",
    title: "Preventing Pressure Ulcers",
    icon: ShieldCheck,
    color: "bg-destructive/10 text-destructive",
    summary: "Essential skin care practices for wheelchair users and bed rest.",
    content: [
      "Pressure ulcers (bedsores) are one of the most common complications of SCI. They occur when sustained pressure on the skin reduces blood flow to the tissue.",
      "Areas at highest risk include the sacrum (tailbone), heels, elbows, and shoulder blades — any bony prominence where the body contacts a surface for extended periods.",
      "Prevention is far easier than treatment. Regular pressure relief, proper nutrition, and skin inspection are the three pillars of prevention.",
      "If you notice any redness that doesn't fade within 30 minutes of relieving pressure, contact your healthcare provider immediately. Early detection prevents serious complications.",
    ],
    tips: [
      "Perform wheelchair push-ups every 15-30 minutes",
      "Inspect your skin daily using a mirror for hard-to-see areas",
      "Use pressure-relieving cushions and mattresses",
      "Maintain good nutrition — protein and vitamin C aid skin health",
      "Keep skin clean and dry, especially after bathing",
    ],
  },
  {
    key: "nutrition-recovery",
    title: "Nutrition for Neurological Recovery",
    icon: Apple,
    color: "bg-success/20 text-success-foreground",
    summary: "How diet supports nerve healing and overall recovery.",
    content: [
      "Proper nutrition plays a crucial role in neurological recovery. The body needs specific nutrients to repair damaged tissue, maintain muscle mass, and support nerve regeneration.",
      "Protein is essential for tissue repair and maintaining muscle mass. Aim for lean sources like chicken, fish, eggs, lentils, and Greek yogurt. Patients with SCI typically need 1.2-1.5g of protein per kg of body weight daily.",
      "Omega-3 fatty acids found in salmon, walnuts, and flaxseeds have anti-inflammatory properties that support nerve health. B vitamins (especially B12) are crucial for nerve function.",
      "Hydration is equally important. Adequate fluid intake supports circulation, prevents urinary tract infections, and promotes healthy skin. Aim for 8-10 glasses of water daily.",
    ],
    tips: [
      "Include protein in every meal",
      "Eat omega-3 rich foods 2-3 times per week",
      "Stay hydrated throughout the day",
      "Limit processed foods and excess sodium",
      "Consider a multivitamin after consulting your doctor",
    ],
  },
  {
    key: "mental-health-rehab",
    title: "Mental Health During Rehabilitation",
    icon: Brain,
    color: "bg-secondary/20 text-secondary-foreground",
    summary: "Managing emotional challenges on your recovery journey.",
    content: [
      "A spinal cord injury affects more than the body — it changes your relationship with daily activities, independence, and identity. It's completely normal to experience grief, frustration, anxiety, or depression.",
      "Research shows that mental health significantly impacts physical recovery outcomes. Patients with positive mental health engagement tend to achieve better rehabilitation results and higher quality of life.",
      "Professional support is important. Psychologists who specialize in rehabilitation can help you develop coping strategies, process grief, and build resilience.",
      "Peer support is equally valuable. Connecting with others who have experienced SCI can reduce feelings of isolation and provide practical advice from lived experience.",
    ],
    tips: [
      "Don't hesitate to seek professional mental health support",
      "Join a peer support group (online or in person)",
      "Practice daily gratitude and mindfulness",
      "Set small, achievable goals to build confidence",
      "Communicate openly with loved ones about your feelings",
    ],
  },
  {
    key: "wheelchair-mobility",
    title: "Improving Wheelchair Mobility",
    icon: Accessibility,
    color: "bg-accent/20 text-accent-foreground",
    summary: "Building independence through wheelchair skills training.",
    content: [
      "Wheelchair mobility is a key skill that directly impacts independence and quality of life. Whether you use a manual or power wheelchair, developing proficiency takes practice and patience.",
      "Basic skills include efficient propulsion (pushing technique), turning, and stopping. Advanced skills include navigating uneven terrain, ramps, curbs, and confined spaces.",
      "Upper body strength is crucial for manual wheelchair users. Regular exercises targeting the shoulders, arms, and core will improve endurance and reduce injury risk.",
      "Proper wheelchair fit is essential. A wheelchair that's too wide, too narrow, or incorrectly positioned can cause discomfort, skin breakdown, and repetitive strain injuries. Work with your occupational therapist to ensure proper fit.",
    ],
    tips: [
      "Practice wheelchair skills in a safe, open space",
      "Build upper body strength through regular exercise",
      "Ensure your wheelchair is properly fitted",
      "Learn energy-efficient propulsion techniques",
      "Practice navigating different surfaces and environments",
    ],
  },
];

const feedbackOptions = [
  { label: "Yes", value: "yes" },
  { label: "Somewhat", value: "somewhat" },
  { label: "Not really", value: "not_really" },
];

const WellBeingAwareness = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["blog-feedback", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_feedback")
        .select("*")
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ articleKey, response }: { articleKey: string; response: string }) => {
      const existing = feedbacks.find(f => f.article_key === articleKey);
      if (existing) {
        await supabase.from("blog_feedback").update({ response }).eq("id", existing.id);
      } else {
        await supabase.from("blog_feedback").insert({ user_id: user!.id, article_key: articleKey, response });
      }
    },
    onSuccess: () => {
      toast({ title: "Thanks for your feedback!" });
      queryClient.invalidateQueries({ queryKey: ["blog-feedback"] });
    },
  });

  if (selectedArticle) {
    const existingFeedback = feedbacks.find(f => f.article_key === selectedArticle.key);
    const Icon = selectedArticle.icon;

    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
          <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <ChevronLeft className="w-4 h-4" /> Back to articles
          </button>

          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedArticle.color}`}>
            <Icon className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-bold text-foreground">{selectedArticle.title}</h1>

          <div className="space-y-3">
            {selectedArticle.content.map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="py-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">Key Recovery Tips</p>
              <ul className="space-y-1">
                {selectedArticle.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary">✓</span> {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-semibold text-foreground text-center">Did this article help you?</p>
              <div className="flex gap-2 justify-center">
                {feedbackOptions.map(opt => (
                  <Button
                    key={opt.value}
                    variant={existingFeedback?.response === opt.value ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => feedbackMutation.mutate({ articleKey: selectedArticle.key, response: opt.value })}
                    disabled={feedbackMutation.isPending}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {existingFeedback && (
                <p className="text-xs text-center text-muted-foreground">Thank you for your feedback!</p>
              )}
            </CardContent>
          </Card>
        </main>
        <PatientNav />
        <FloatingButtons />
        <Chatbot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Medical Awareness</h1>
        <p className="text-sm text-muted-foreground">Educational content about spinal cord injury recovery.</p>

        {articles.map(article => {
          const Icon = article.icon;
          const hasFeedback = feedbacks.some(f => f.article_key === article.key);
          return (
            <Card
              key={article.key}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedArticle(article)}
            >
              <CardContent className="py-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${article.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{article.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{article.summary}</p>
                  {hasFeedback && <span className="text-xs text-success mt-1 inline-block">✓ Read</span>}
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 shrink-0 mt-1" />
              </CardContent>
            </Card>
          );
        })}
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default WellBeingAwareness;
