import { NavLink } from "react-router-dom";
import { Home, Heart, Dumbbell, Users, MoreHorizontal } from "lucide-react";

export function PatientNav() {
  const links = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/wellbeing", icon: Heart, label: "Well-Being" },
    { to: "/exercises", icon: Dumbbell, label: "Exercises" },
    { to: "/community", icon: Users, label: "Community" },
    { to: "/more", icon: MoreHorizontal, label: "More" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t px-2 py-2 flex justify-around">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors ${
              isActive ? "text-primary font-semibold" : "text-muted-foreground"
            }`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
