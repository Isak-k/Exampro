import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
  Trophy,
  Menu,
  X,
  Shield,
  UserCog,
  Building,
  User,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, role } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Show ALL admin menu items - permissions control buttons within pages, not sidebar visibility
  const adminLinks = [
    { href: "/dashboard", label: t("dashboard.menu.dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/admin/exams", label: t("dashboard.menu.manageExams"), icon: FileText },
    { href: "/dashboard/all-results", label: t("dashboard.menu.allResults"), icon: Trophy },
    { href: "/dashboard/students", label: t("dashboard.menu.students"), icon: Users },
    { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/dashboard/analytics", label: t("dashboard.menu.analytics"), icon: BarChart3 },
    { href: "/dashboard/leaderboard-admin", label: "Leaderboard Admin", icon: Trophy },
    { href: "/dashboard/departments", label: t("dashboard.menu.departments"), icon: Building },
    ...(isSuperAdmin ? [{ href: "/dashboard/super-admin", label: "Super Admin", icon: Shield }] : []),
  ];

  const studentLinks = [
    { href: "/dashboard", label: t("dashboard.menu.dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/exams", label: t("dashboard.menu.availableExams"), icon: ClipboardList },
    { href: "/dashboard/results", label: t("dashboard.menu.myResults"), icon: Trophy },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  ];

  const links = role === "admin" ? adminLinks : studentLinks;

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card/95 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">{t("common.examPro")}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="Open Profile Menu">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <User className="mr-2 h-4 w-4" />
                {t("common.profile")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {t("common.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-sidebar/95 backdrop-blur-sm border-r border-sidebar-border/50 shadow-lg transform transition-transform duration-300 ease-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center gap-3 px-6 border-b border-white/10 bg-gradient-to-r from-cyan-600 to-teal-600">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-white text-xl tracking-tight">
                {t("common.examPro")}
              </span>
              <span className="text-[10px] font-medium text-white/70 uppercase tracking-widest">
                Student Portal
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {links.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                    isActive
                      ? "bg-white/20 text-white font-semibold shadow-md backdrop-blur-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <link.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110", 
                    isActive ? "text-white" : "text-white/70 group-hover:text-white"
                  )} />
                  <span className="text-sm">{link.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10 bg-gradient-to-r from-cyan-600 to-teal-600">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/20">
                  <Avatar className="h-10 w-10 ring-2 ring-white/30 shadow-sm">
                    <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">
                      {profile?.full_name}
                    </p>
                    <p className="text-xs text-white/70 capitalize truncate">
                      {role ? t(`common.${role}`) : ""}
                    </p>
                  </div>
                  <Settings className="h-4 w-4 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                  <Users className="mr-2 h-4 w-4" />
                  {t("common.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("common.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {links.slice(0, 3).map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <link.icon className={cn(
                  "h-6 w-6",
                  isActive && "scale-110"
                )} />
                <span className="text-[10px] font-medium truncate max-w-full">
                  {link.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                )}
              </Link>
            );
          })}
          
          {/* Shortcut: Admin → Students, Student → Messages */}
          {role === "admin" ? (
            <Link
              to="/dashboard/students"
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all",
                location.pathname === "/dashboard/students"
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Users className="h-6 w-6" />
              <span className="text-[10px] font-medium truncate max-w-full">
                {t("dashboard.menu.students")}
              </span>
              {location.pathname === "/dashboard/students" && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          ) : (
            <Link
              to="/dashboard/messages"
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all",
                location.pathname === "/dashboard/messages"
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <MessageSquare className="h-6 w-6" />
              <span className="text-[10px] font-medium truncate max-w-full">
                Messages
              </span>
              {location.pathname === "/dashboard/messages" && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Profile Sheet */}
      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Profile Menu</SheetTitle>
          </SheetHeader>
          
          {/* User Info Section */}
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 -mx-6 -mt-6 px-6 py-6 rounded-t-3xl mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-white/30">
                <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{profile?.full_name}</h3>
                <p className="text-sm text-white/80 capitalize">{role ? t(`common.${role}`) : ""}</p>
              </div>
              <button
                onClick={() => setProfileSheetOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <Settings className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2 pb-4">
            <button
              onClick={() => {
                navigate("/settings");
                setProfileSheetOpen(false);
              }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </div>
              <span className="text-base font-medium">{t("common.settings")}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
