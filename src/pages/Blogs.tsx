import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const blogPosts = [
  { title: "5 Tips for Early Recovery", content: "Start small, be consistent, celebrate progress, stay connected, and trust the process. Recovery is a marathon, not a sprint." },
  { title: "Nutrition After Spinal Injury", content: "Focus on protein for tissue repair, calcium for bones, and stay hydrated. Small frequent meals maintain energy levels throughout the day." },
  { title: "Managing Pain Naturally", content: "Deep breathing, gentle stretching, proper positioning, and mindfulness meditation can complement your pain management plan." },
  { title: "The Power of Community", content: "Connecting with others who understand your journey provides emotional support and practical tips that can make a real difference." },
];

const Blogs = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground">Blogs</h1>
      {blogPosts.map((post, i) => (
        <Card key={i}>
          <CardHeader className="pb-2"><CardTitle className="text-base">{post.title}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{post.content}</p></CardContent>
        </Card>
      ))}
    </main>
    <PatientNav />
    <FloatingButtons />
    <Chatbot />
  </div>
);

export default Blogs;
