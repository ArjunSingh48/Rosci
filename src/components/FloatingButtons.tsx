import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function FloatingButtons() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3">
      <Button
        onClick={() => navigate("/contact-specialist")}
        size="icon"
        variant="outline"
        className="w-12 h-12 rounded-full shadow-lg bg-card border-primary/30 hover:bg-primary hover:text-primary-foreground"
      >
        <Phone className="w-5 h-5" />
      </Button>
    </div>
  );
}
