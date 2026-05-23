import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Chatbot } from "@/components/Chatbot";
import { FloatingButtons } from "@/components/FloatingButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Utensils } from "lucide-react";

const carbRanges = [
  { meal: "Breakfast", min: 15, max: 30, color: "bg-primary" },
  { meal: "Lunch", min: 30, max: 45, color: "bg-secondary" },
  { meal: "Dinner", min: 30, max: 45, color: "bg-accent" },
];

const tabs = ["Meal Plan", "Cultural Meals", "Build My Plate", "Grocery List", "Meal Checker"] as const;

interface Meal {
  name: string;
  description: string;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  mealTime: "breakfast" | "lunch" | "dinner" | "snack";
}

const meals: Meal[] = [
  {
    name: "Veggie Egg Scramble",
    description: "Protein-rich scramble with fresh vegetables for muscle recovery.",
    carbs: 20, protein: 18, fat: 12, fiber: 3,
    prepTime: "5 min", cookTime: "8 min",
    ingredients: ["2 eggs", "Handful of spinach", "1 tomato, diced", "1 slice whole grain toast"],
    instructions: ["Whisk eggs in a bowl.", "Heat a non-stick pan over medium heat.", "Sauté spinach and tomato for 2 minutes.", "Pour in eggs and scramble until cooked.", "Serve with whole grain toast."],
    mealTime: "breakfast",
  },
  {
    name: "Greek Yogurt Bowl",
    description: "Creamy yogurt with antioxidant-rich berries and omega-3 seeds.",
    carbs: 18, protein: 15, fat: 6, fiber: 5,
    prepTime: "3 min", cookTime: "0 min",
    ingredients: ["1 cup plain Greek yogurt", "½ cup mixed berries", "1 tbsp chia seeds"],
    instructions: ["Add yogurt to a bowl.", "Top with berries and chia seeds.", "Mix gently and enjoy."],
    mealTime: "breakfast",
  },
  {
    name: "Avocado Toast",
    description: "Healthy fats and protein on nutrient-dense rye bread.",
    carbs: 22, protein: 12, fat: 15, fiber: 6,
    prepTime: "5 min", cookTime: "5 min",
    ingredients: ["1 slice rye bread", "½ avocado", "1 poached egg", "Pinch of salt and pepper"],
    instructions: ["Toast the rye bread.", "Mash avocado and spread on toast.", "Poach egg and place on top.", "Season with salt and pepper."],
    mealTime: "breakfast",
  },
  {
    name: "Turkey Stir Fry",
    description: "Lean protein stir fry with vegetables and brown rice for sustained energy.",
    carbs: 35, protein: 28, fat: 10, fiber: 4,
    prepTime: "5 min", cookTime: "20 min",
    ingredients: ["150g ground turkey", "1 cup mixed vegetables", "½ cup brown rice", "1 tbsp soy sauce", "1 tsp sesame oil"],
    instructions: ["Cook brown rice according to package.", "Heat sesame oil in a pan.", "Cook turkey until browned.", "Add vegetables and stir fry for 5 minutes.", "Add soy sauce and toss.", "Serve over brown rice."],
    mealTime: "lunch",
  },
  {
    name: "Grilled Chicken + Quinoa + Vegetables",
    description: "Complete protein meal with all essential amino acids for tissue repair.",
    carbs: 32, protein: 35, fat: 8, fiber: 5,
    prepTime: "10 min", cookTime: "25 min",
    ingredients: ["150g chicken breast", "½ cup quinoa", "1 cup steamed broccoli & carrots", "Lemon juice", "Olive oil"],
    instructions: ["Cook quinoa as directed.", "Season chicken with lemon and olive oil.", "Grill chicken for 6-7 minutes per side.", "Steam vegetables until tender.", "Plate quinoa, sliced chicken, and vegetables."],
    mealTime: "lunch",
  },
  {
    name: "Salmon + Sweet Potato + Broccoli",
    description: "Omega-3 rich salmon supports nerve health and reduces inflammation.",
    carbs: 30, protein: 30, fat: 14, fiber: 5,
    prepTime: "10 min", cookTime: "25 min",
    ingredients: ["150g salmon fillet", "1 medium sweet potato", "1 cup broccoli florets", "Olive oil", "Garlic"],
    instructions: ["Preheat oven to 200°C.", "Cube sweet potato, toss with olive oil, roast 20 min.", "Season salmon with garlic, bake 12-15 min.", "Steam broccoli for 5 minutes.", "Serve together."],
    mealTime: "dinner",
  },
  {
    name: "Lentil Dal + Brown Rice + Spinach",
    description: "Plant-based protein powerhouse with iron for energy.",
    carbs: 42, protein: 18, fat: 6, fiber: 10,
    prepTime: "5 min", cookTime: "30 min",
    ingredients: ["1 cup red lentils", "½ cup brown rice", "1 cup spinach", "1 tsp turmeric", "1 tsp cumin", "Garlic & onion"],
    instructions: ["Cook brown rice.", "Sauté garlic and onion in a pot.", "Add lentils, turmeric, cumin, and water.", "Simmer 20-25 minutes until soft.", "Stir in spinach until wilted.", "Serve dal over rice."],
    mealTime: "dinner",
  },
  {
    name: "Paneer + Mixed Vegetables + Whole Wheat Roti",
    description: "Calcium-rich paneer supports bone health during recovery.",
    carbs: 35, protein: 20, fat: 16, fiber: 4,
    prepTime: "10 min", cookTime: "15 min",
    ingredients: ["100g paneer, cubed", "1 cup mixed bell peppers & peas", "2 whole wheat rotis", "1 tsp garam masala", "Olive oil"],
    instructions: ["Heat oil in a pan.", "Sauté vegetables for 3 minutes.", "Add paneer cubes and garam masala.", "Cook for 5 minutes, stirring gently.", "Serve with warm rotis."],
    mealTime: "dinner",
  },
  {
    name: "Chickpea Mediterranean Salad",
    description: "Fiber-rich chickpeas support digestion and gut health.",
    carbs: 28, protein: 12, fat: 10, fiber: 8,
    prepTime: "10 min", cookTime: "0 min",
    ingredients: ["1 can chickpeas, drained", "1 cucumber, diced", "Cherry tomatoes", "Red onion", "Feta cheese", "Olive oil & lemon dressing"],
    instructions: ["Combine chickpeas, cucumber, tomatoes, and onion.", "Crumble feta on top.", "Drizzle with olive oil and lemon juice.", "Toss gently and serve."],
    mealTime: "lunch",
  },
  {
    name: "Oatmeal + Almonds + Banana",
    description: "Slow-release carbs for sustained morning energy.",
    carbs: 40, protein: 10, fat: 8, fiber: 6,
    prepTime: "2 min", cookTime: "5 min",
    ingredients: ["½ cup rolled oats", "1 cup milk or water", "1 banana, sliced", "10 almonds, chopped", "Honey (optional)"],
    instructions: ["Cook oats with milk or water.", "Top with banana slices and almonds.", "Drizzle with honey if desired."],
    mealTime: "breakfast",
  },
];

const MacroBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}g</span>
    </div>
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
  </div>
);

const MealCard = ({ meal }: { meal: Meal }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Utensils className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{meal.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meal.description}</p>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-primary">{meal.carbs}g carbs</span>
              <span>{meal.protein}g protein</span>
              {meal.fat > 0 && <span>{meal.fat}g fat</span>}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Prep: {meal.prepTime}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Cook: {meal.cookTime}</span>
                </div>
                <div className="space-y-2">
                  <MacroBar label="Carbs" value={meal.carbs} max={50} color="bg-primary" />
                  <MacroBar label="Protein" value={meal.protein} max={40} color="bg-secondary" />
                  <MacroBar label="Fat" value={meal.fat} max={25} color="bg-accent" />
                  <MacroBar label="Fiber" value={meal.fiber} max={15} color="bg-success" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Ingredients</p>
                  <ul className="space-y-1">
                    {meal.ingredients.map((ing, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {ing}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Instructions</p>
                  <ol className="space-y-1">
                    {meal.instructions.map((step, i) => (
                      <li key={i} className="text-xs text-muted-foreground">{i + 1}. {step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

const WellBeingNutrition = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Meal Plan");
  const [mealType, setMealType] = useState("lunch");
  const [protein, setProtein] = useState("");
  const [hydration, setHydration] = useState("");
  const [notes, setNotes] = useState("");

  const { data: logs = [] } = useQuery({
    queryKey: ["nutrition-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  const logMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("nutrition_logs").insert({
        patient_id: user!.id,
        meal_type: mealType as any,
        protein_intake: protein ? parseFloat(protein) : null,
        hydration_ml: hydration ? parseInt(hydration) : null,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Nutrition logged!" });
      setProtein("");
      setHydration("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["nutrition-logs"] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">Nutrition Guide</h1>

        {/* Daily Carb Distribution */}
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Daily Carb Distribution</p>
            {carbRanges.map(r => (
              <div key={r.meal} className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground w-20">{r.meal}</span>
                <div className="flex-1 mx-3">
                  <Progress value={(r.max / 60) * 100} className="h-2" />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">{r.min}–{r.max}g</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map(tab => (
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

        {/* Tab Content */}
        {activeTab === "Meal Plan" && (
          <div className="space-y-3">
            {meals.map((meal, i) => (
              <MealCard key={i} meal={meal} />
            ))}
          </div>
        )}

        {activeTab === "Cultural Meals" && (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Cultural meal plans coming soon. We're curating region-specific recovery meals.</CardContent></Card>
        )}

        {activeTab === "Build My Plate" && (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Interactive plate builder coming soon. Customize your meals based on your dietary needs.</CardContent></Card>
        )}

        {activeTab === "Grocery List" && (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Auto-generated grocery lists based on your meal plan coming soon.</CardContent></Card>
        )}

        {activeTab === "Meal Checker" && (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Snap a photo of your meal and get instant nutritional feedback — coming soon.</CardContent></Card>
        )}

        {/* Log Meal */}
        <Card>
          <CardContent className="py-4 space-y-4">
            <p className="font-semibold text-foreground">Log a Meal</p>
            <div className="space-y-1">
              <Label>Meal Type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Protein (g)</Label>
                <Input type="number" min={0} value={protein} onChange={e => setProtein(e.target.value)} placeholder="30" />
              </div>
              <div className="space-y-1">
                <Label>Water (ml)</Label>
                <Input type="number" min={0} value={hydration} onChange={e => setHydration(e.target.value)} placeholder="500" />
              </div>
            </div>
            <Textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} className="resize-none" />
            <Button onClick={() => logMutation.mutate()} disabled={logMutation.isPending} className="w-full rounded-xl">
              {logMutation.isPending ? "Saving…" : "Log Meal"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm">Recent Logs</p>
            {logs.map(l => (
              <Card key={l.id}>
                <CardContent className="py-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-foreground capitalize">{l.meal_type}</span>
                    <span className="text-xs text-muted-foreground ml-2">{l.date}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {l.protein_intake && `${l.protein_intake}g protein`}
                    {l.hydration_ml && ` • ${l.hydration_ml}ml water`}
                  </div>
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

export default WellBeingNutrition;
