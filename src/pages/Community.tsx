import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Send, Users, MessageSquare, Star } from "lucide-react";

const communityTabs = ["Feed", "Support Groups", "Topics", "Peer Stories"] as const;

const supportGroups = [
  { name: "New to SCI", description: "For recently injured patients and their families", members: 124, color: "bg-primary/10 border-primary/20" },
  { name: "Wheelchair Users", description: "Tips, tricks, and support for wheelchair mobility", members: 89, color: "bg-secondary/20 border-secondary/30" },
  { name: "Caregivers Circle", description: "A safe space for caregivers to connect and share", members: 67, color: "bg-accent/20 border-accent/30" },
  { name: "Return to Work", description: "Navigating career and employment after SCI", members: 45, color: "bg-success/20 border-success/30" },
];

const discussionTopics = [
  { title: "Best exercises for upper body strength?", replies: 23, category: "Rehabilitation" },
  { title: "How do you manage chronic pain?", replies: 45, category: "Pain Management" },
  { title: "Wheelchair-accessible travel tips", replies: 31, category: "Lifestyle" },
  { title: "Nutrition tips for muscle maintenance", replies: 18, category: "Nutrition" },
  { title: "Mental health resources that helped me", replies: 37, category: "Mental Health" },
];

const peerStories = [
  { name: "Alex M.", milestone: "First time standing with a walker!", timeAgo: "2 days ago", content: "After 8 months of rehab, I stood up with a walker today. Never thought this day would come. Keep pushing everyone!" },
  { name: "Sarah K.", milestone: "Returned to work", timeAgo: "1 week ago", content: "Started my remote job today. It took adjustments, but I'm back doing what I love. Don't give up on your goals." },
  { name: "David R.", milestone: "1 year post-injury", timeAgo: "3 days ago", content: "One year since my injury. The journey has been incredibly hard, but I'm stronger than I ever imagined. To anyone early in their journey — it gets better." },
];

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const Avatar = ({ name }: { name: string }) => (
  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
    <span className="text-xs font-bold text-primary">{getInitials(name)}</span>
  </div>
);

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<typeof communityTabs[number]>("Feed");
  const [newPost, setNewPost] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!data?.length) return [];

      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
      const { data: likes } = await supabase.from("community_likes").select("*");
      const { data: comments } = await supabase.from("community_comments").select("*").order("created_at", { ascending: true });

      const commentUserIds = [...new Set((comments ?? []).map(c => c.user_id))];
      const { data: commentProfiles } = commentUserIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", commentUserIds)
        : { data: [] };

      return data.map(post => ({
        ...post,
        author: profiles?.find(p => p.id === post.user_id)?.full_name || "User",
        isDoctor: roles?.find(r => r.user_id === post.user_id)?.role === "doctor",
        likeCount: likes?.filter(l => l.post_id === post.id).length ?? 0,
        liked: likes?.some(l => l.post_id === post.id && l.user_id === user?.id) ?? false,
        comments: (comments ?? [])
          .filter(c => c.post_id === post.id)
          .map(c => ({
            ...c,
            author: commentProfiles?.find(p => p.id === c.user_id)?.full_name || "User",
          })),
      }));
    },
    enabled: !!user,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("community_posts").insert({ user_id: user!.id, content: newPost.trim() });
    },
    onSuccess: () => {
      setNewPost("");
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", user!.id);
      } else {
        await supabase.from("community_likes").insert({ post_id: postId, user_id: user!.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community-posts"] }),
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      await supabase.from("community_comments").insert({ post_id: postId, user_id: user!.id, content });
    },
    onSuccess: (_, { postId }) => {
      setCommentInputs(p => ({ ...p, [postId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Community</h1>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {communityTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Feed Tab */}
        {activeTab === "Feed" && (
          <>
            <Card>
              <CardContent className="py-4 space-y-3">
                <Textarea
                  placeholder="Share your experience or encouragement…"
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  className="resize-none"
                />
                <Button
                  onClick={() => postMutation.mutate()}
                  disabled={!newPost.trim() || postMutation.isPending}
                  className="rounded-xl"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-1" /> Post
                </Button>
              </CardContent>
            </Card>

            {posts.map((post: any) => (
              <Card key={post.id} className={post.isDoctor ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={post.author} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{post.author}</p>
                        {post.isDoctor && <Badge variant="default" className="text-[10px] py-0">Doctor</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{post.content}</p>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => likeMutation.mutate({ postId: post.id, liked: post.liked })}
                      className={`flex items-center gap-1 text-sm ${post.liked ? "text-destructive" : "text-muted-foreground"} hover:text-destructive`}
                    >
                      <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""}`} />
                      {post.likeCount}
                    </button>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageCircle className="w-4 h-4" /> {post.comments.length}
                    </span>
                  </div>

                  {post.comments.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-border">
                      {post.comments.map((c: any) => (
                        <div key={c.id} className="flex gap-2">
                          <Avatar name={c.author} />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{c.author}</p>
                            <p className="text-xs text-muted-foreground">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-sm bg-muted rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground outline-none"
                      placeholder="Comment…"
                      value={commentInputs[post.id] || ""}
                      onChange={e => setCommentInputs(p => ({ ...p, [post.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === "Enter" && commentInputs[post.id]?.trim()) {
                          commentMutation.mutate({ postId: post.id, content: commentInputs[post.id] });
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* Support Groups Tab */}
        {activeTab === "Support Groups" && (
          <div className="space-y-3">
            {supportGroups.map(group => (
              <Card key={group.name} className={`${group.color}`}>
                <CardContent className="py-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{group.members} members</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs shrink-0">Join</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Topics Tab */}
        {activeTab === "Topics" && (
          <div className="space-y-2">
            {discussionTopics.map((topic, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="py-3 flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{topic.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">{topic.category}</Badge>
                      <span className="text-xs text-muted-foreground">{topic.replies} replies</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Peer Stories Tab */}
        {activeTab === "Peer Stories" && (
          <div className="space-y-3">
            {peerStories.map((story, i) => (
              <Card key={i} className="border-primary/10">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={story.name} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{story.name}</p>
                      <span className="text-xs text-muted-foreground">{story.timeAgo}</span>
                    </div>
                    <Star className="w-4 h-4 text-primary" />
                  </div>
                  <Badge className="text-[10px]">{story.milestone}</Badge>
                  <p className="text-sm text-muted-foreground">{story.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <PatientNav />
      <FloatingButtons />
      <Chatbot />
    </div>
  );
};

export default Community;
