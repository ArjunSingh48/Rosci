import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How often should I do my exercises?", a: "Follow your doctor's recommendations. Typically, early-stage exercises are done 2-3 times daily in short sessions." },
  { q: "Is it normal to feel pain during recovery?", a: "Some discomfort is normal, but sharp or increasing pain should be reported to your doctor immediately." },
  { q: "How do I upload a medical report?", a: "Go to My Well-Being → Reports → Choose File. Upload your PDF and your doctor will review it." },
  { q: "Can my doctor see my daily check-ins?", a: "Yes, your doctor can view your mood check-ins, task completion, and exercise videos to support your recovery." },
  { q: "How do I contact my specialist?", a: "Use the phone button or go to More → Contact Specialist to find your healthcare team's contact details." },
];

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h1>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
    <PatientNav />
    <FloatingButtons />
    <Chatbot />
  </div>
);

export default FAQ;
