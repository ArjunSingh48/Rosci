import { TopBar } from "@/components/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";

const Notifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // Mark all as read on mount
  const markRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["unread-notifications"] }),
  });

  // Auto-mark as read
  if (notifications.some(n => !n.is_read) && !markRead.isPending) {
    markRead.mutate();
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        {notifications.map(n => (
          <Card key={n.id} className={!n.is_read ? "border-primary/30 bg-primary/5" : ""}>
            <CardContent className="py-3 flex items-start gap-3">
              <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground">{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No notifications yet.</p>
        )}
      </main>
    </div>
  );
};

export default Notifications;
