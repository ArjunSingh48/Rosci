import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import PatientHome from "./pages/PatientHome";
import WellBeing from "./pages/WellBeing";
import WellBeingReports from "./pages/WellBeingReports";
import WellBeingRecovery from "./pages/WellBeingRecovery";
import WellBeingSleep from "./pages/WellBeingSleep";
import WellBeingNutrition from "./pages/WellBeingNutrition";
import WellBeingMental from "./pages/WellBeingMental";
import WellBeingAwareness from "./pages/WellBeingAwareness";
import Rehabilitation from "./pages/Rehabilitation";
import RecoveryInsights from "./pages/RecoveryInsights";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import Exercises from "./pages/Exercises";
import RecoveryJourney from "./pages/RecoveryJourney";
import Achievements from "./pages/Achievements";
import Community from "./pages/Community";
import More from "./pages/More";
import Blogs from "./pages/Blogs";
import FAQ from "./pages/FAQ";
import DoctorCheckup from "./pages/DoctorCheckup";
import ContactSpecialist from "./pages/ContactSpecialist";
import Profile from "./pages/Profile";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDetail from "./pages/PatientDetail";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: "patient" | "doctor" | "admin" }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-primary text-lg">Loading…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === "admin") return <>{children}</>;
  if (allowedRole && role !== allowedRole) return <Navigate to={role === "doctor" ? "/doctor" : "/home"} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, role, profile, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-primary text-lg">Loading…</div></div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={role === "doctor" || role === "admin" ? "/doctor" : "/home"} replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={role === "doctor" || role === "admin" ? "/doctor" : "/home"} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={role === "doctor" || role === "admin" ? "/doctor" : "/home"} replace /> : <Register />} />
      <Route path="/onboarding" element={<ProtectedRoute allowedRole="patient"><Onboarding /></ProtectedRoute>} />
      <Route path="/home" element={
        <ProtectedRoute allowedRole="patient">
          {!profile || !profile.onboarding_completed ? <Navigate to="/onboarding" replace /> : <PatientHome />}
        </ProtectedRoute>
      } />
      {/* Well-Being routes */}
      <Route path="/wellbeing" element={<ProtectedRoute allowedRole="patient"><WellBeing /></ProtectedRoute>} />
      <Route path="/wellbeing/reports" element={<ProtectedRoute allowedRole="patient"><WellBeingReports /></ProtectedRoute>} />
      <Route path="/wellbeing/recovery" element={<ProtectedRoute allowedRole="patient"><WellBeingRecovery /></ProtectedRoute>} />
      <Route path="/wellbeing/sleep" element={<ProtectedRoute allowedRole="patient"><WellBeingSleep /></ProtectedRoute>} />
      <Route path="/wellbeing/nutrition" element={<ProtectedRoute allowedRole="patient"><WellBeingNutrition /></ProtectedRoute>} />
      <Route path="/wellbeing/mental" element={<ProtectedRoute allowedRole="patient"><WellBeingMental /></ProtectedRoute>} />
      <Route path="/wellbeing/awareness" element={<ProtectedRoute allowedRole="patient"><WellBeingAwareness /></ProtectedRoute>} />
      {/* Old route redirects */}
      <Route path="/medical" element={<Navigate to="/wellbeing/reports" replace />} />
      <Route path="/exercises" element={<ProtectedRoute allowedRole="patient"><Exercises /></ProtectedRoute>} />
      <Route path="/recovery-journey" element={<ProtectedRoute allowedRole="patient"><RecoveryJourney /></ProtectedRoute>} />
      {/* Rehabilitation */}
      <Route path="/rehabilitation" element={<ProtectedRoute allowedRole="patient"><Rehabilitation /></ProtectedRoute>} />
      <Route path="/recovery-insights" element={<ProtectedRoute allowedRole="patient"><RecoveryInsights /></ProtectedRoute>} />
      <Route path="/exercise-library" element={<ProtectedRoute allowedRole="patient"><ExerciseLibrary /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute allowedRole="patient"><Achievements /></ProtectedRoute>} />
      {/* Community */}
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      {/* More */}
      <Route path="/more" element={<ProtectedRoute allowedRole="patient"><More /></ProtectedRoute>} />
      <Route path="/more/blogs" element={<ProtectedRoute allowedRole="patient"><Blogs /></ProtectedRoute>} />
      <Route path="/more/faq" element={<ProtectedRoute allowedRole="patient"><FAQ /></ProtectedRoute>} />
      <Route path="/more/checkup" element={<ProtectedRoute allowedRole="patient"><DoctorCheckup /></ProtectedRoute>} />
      <Route path="/contact-specialist" element={<ProtectedRoute><ContactSpecialist /></ProtectedRoute>} />
      {/* Profile */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      {/* Doctor */}
      <Route path="/doctor" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/patient/:id" element={<ProtectedRoute allowedRole="doctor"><PatientDetail /></ProtectedRoute>} />
      {/* Notifications */}
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
