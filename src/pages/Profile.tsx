import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { PatientNav } from "@/components/PatientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Activity, Calendar, FileText, Heart, Phone, Mail, AlertTriangle } from "lucide-react";
import { getDoctorByKey } from "@/lib/doctors";

const Profile = () => {
  const { profile, signOut, role } = useAuth();
  const navigate = useNavigate();
  const [callModal, setCallModal] = useState(false);

  const doctor = getDoctorByKey(profile?.doctor_key);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-primary" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoRow label="Name" value={profile?.full_name || "—"} />
            <InfoRow label="Role" value={role === "doctor" ? "Doctor" : "Patient"} />
          </CardContent>
        </Card>

        {role === "patient" && (
          <>
            {/* Doctor card */}
            {doctor && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="w-5 h-5 text-primary" /> My Doctor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label="Name" value={doctor.name} />
                  <InfoRow label="Email" value={doctor.email} />
                  <InfoRow label="Phone" value={doctor.phone} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl mt-2"
                    onClick={() => setCallModal(true)}
                  >
                    <Phone className="w-4 h-4 mr-1" /> Call Doctor
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-primary" /> Spinal Injury Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Spinal Region" value={profile?.spinal_region || "—"} />
                <InfoRow label="Injury Level" value={profile?.injury_level || "—"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="w-5 h-5 text-primary" /> Recovery Stage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Weeks in Recovery" value={String(profile?.rehab_weeks ?? 0)} />
                <InfoRow label="Current Pain Level" value={`${profile?.pain_level ?? 0}/10`} />
                <InfoRow label="Current Mood" value={`${profile?.mood_level ?? 0}/5`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5 text-primary" /> Therapy Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Your therapy schedule will appear here once your doctor sets it up.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-primary" /> Medical History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View your uploaded reports in the My Well-Being section.</p>
              </CardContent>
            </Card>
          </>
        )}

        <Button
          variant="outline"
          className="w-full rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>

        {/* Call doctor modal */}
        {doctor && (
          <Dialog open={callModal} onOpenChange={setCallModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Call {doctor.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">{doctor.phone}</span>
                </div>
                {doctor.isRealNumber ? (
                  <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                    <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">This is a <strong>real phone number</strong>. You can call this number to reach {doctor.name}.</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-destructive/5 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">This is a <strong>demo number</strong> and is not a real phone line. It's for demonstration purposes only.</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button asChild className="flex-1 rounded-xl">
                    <a href={`tel:${doctor.phone.replace(/\s/g, "")}`}>
                      <Phone className="w-4 h-4 mr-1" /> Call Now
                    </a>
                  </Button>
                  <Button variant="outline" onClick={() => setCallModal(false)} className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
      {role === "patient" && <PatientNav />}
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground capitalize">{value}</span>
    </div>
  );
}

export default Profile;
