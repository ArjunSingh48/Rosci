import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  from: "user" | "bot";
  text: string;
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Hi! I'm your rehab assistant. Ask me anything about your recovery. 💬" },
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setInput("");

    const { data } = await supabase
      .from("chatbot_qa")
      .select("answer")
      .ilike("keyword", `%${userMsg.toLowerCase().split(" ").slice(0, 3).join("%")}%`)
      .limit(1);

    const answer = data?.[0]?.answer ||
      "I'm not sure about that. Please consult your doctor for specific medical advice.";

    setMessages(prev => [...prev, { from: "bot", text: answer }]);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 right-4 z-50 w-80 max-h-[500px]"
          >
            <Card className="shadow-xl border-0 flex flex-col max-h-[500px]">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Rehab Assistant</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2 max-h-72 pr-1">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                        msg.from === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  ⚠️ This assistant provides general guidance. Always consult your doctor.
                </p>
                <form
                  onSubmit={e => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask a question…"
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setOpen(!open)}
        size="icon"
        className="fixed bottom-20 right-[4.5rem] z-50 w-12 h-12 rounded-full shadow-lg"
      >
        <MessageCircle className="w-5 h-5" />
      </Button>
    </>
  );
}
