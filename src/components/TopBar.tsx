import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { BackButton } from "@/components/BackButton";

const mainRoutes = ["/home", "/doctor", "/"];

export function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const showBack = !mainRoutes.includes(location.pathname);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count ?? 0;
    },
    enabled: !!user,
  });

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-1">
        {showBack && <BackButton />}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">RoSCI</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/notifications")}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
