"use client"

import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Clock,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  User,
  Users,
  Bell,
  FileText,
  CreditCard,
  School,
  BookOpenCheck,
  ClipboardList,
  Calendar,
  UserPlus,
  MessageCircle,
  Award,
  AlertCircle,
  BarChart4,
  TrendingUp,
  Eye,
  MessageCircleMore,
} from "lucide-react"

interface SidebarProps {
  className?: string
  onClose?: () => void
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const getNavItems = () => {
    if (!user) return []

    switch (user.role) {
      case "Admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/terms", label: "Terms", icon: Calendar },
          { href: "/admin/students", label: "Students", icon: Users },
          { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
          { href: "/admin/parents", label: "Parents", icon: UserPlus },
          { href: "/admin/classes", label: "Classes", icon: BookOpen },
          { href: "/admin/subjects", label: "Subjects", icon: BookOpenCheck },
          { href: "/admin/exams", label: "Exams", icon: ClipboardList },
          { href: "/admin/attendance", label: "Attendance", icon: Clock },
          { href: "/admin/report-cards", label: "Report Cards", icon: FileText },
          { href: "/admin/payments", label: "Payments", icon: CreditCard },
          { href: "/admin/notices", label: "Notices", icon: Bell },
          { href: "/admin/head-teacher-comments", label: "HT Comments", icon: MessageCircle },
          { href: "/admin/gradings", label: "Grading", icon: Award },
          { href: "/admin/messages", label: "Messages", icon: MessageSquare },
          { href: "/admin/profile", label: "Profile", icon: User },
          { href: "/admin/settings", label: "Settings", icon: Settings },
          { href: "/admin/complaints", label: "Complaints", icon: AlertCircle },
          { href: "/admin/ai-analytics", label: "AI Analytics", icon: BarChart4 }, // Dashboard with AI insights on performance trends
          { href: "/admin/ai-performance-prediction", label: "Performance Prediction", icon: TrendingUp }, // Predict student performance
          { href: "/admin/ai-attendance-insights", label: "Attendance Insights", icon: Eye }, // Flag students with risky attendance
          { href: "/admin/ai-message-suggestions", label: "Suggested Messages", icon: MessageCircleMore }, // Auto-generate notice/message templates

        ]
      case "Teacher":
        return [
          { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/teacher/students", label: "Students", icon: Users },
          { href: "/teacher/classes", label: "Classes", icon: BookOpen },
          { href: "/teacher/subjects", label: "Subjects", icon: BookOpenCheck },
          { href: "/teacher/attendance", label: "Attendance", icon: Clock },
          { href: "/teacher/exams", label: "Exams", icon: ClipboardList },
          { href: "/teacher/class-teacher-comments", label: "CT Comments", icon: MessageSquare },
          // { href: "/teacher/report-cards", label: "Report Cards", icon: FileText },
          { href: "/teacher/notices", label: "Notices", icon: Bell },
          { href: "/teacher/messages", label: "Messages", icon: MessageSquare },
          { href: "/teacher/profile", label: "Profile", icon: User },
          { href: "/teacher/ai-marking-assist", label: "Marking Assistant", icon: PenTool }, // Auto-grade structured answers
          { href: "/teacher/ai-lesson-plans", label: "AI Lesson Plans", icon: NotebookPen }, // Generate smart lesson suggestions
          { href: "/teacher/ai-progress-tracker", label: "Progress Tracker", icon: LineChart }, // Predict learning gaps
          { href: "/teacher/ai-behavior-analysis", label: "Behavior Alerts", icon: AlertTriangle }, // Analyze patterns in attendance/comments

        ]
      case "Student":
        return [
          { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/student/subjects", label: "Subjects", icon: BookOpen },
          { href: "/student/attendance", label: "Attendance", icon: Clock },
          { href: "/student/exams", label: "Exams", icon: ClipboardList },
          { href: "/student/results", label: "Results", icon: FileText },
          { href: "/student/notices", label: "Notices", icon: Bell },
          { href: "/student/complaints", label: "Complaints", icon: AlertCircle },
          { href: "/student/profile", label: "Profile", icon: User },
          { href: "/student/ai-study-tips", label: "Study Tips", icon: BrainCircuit }, // Personalized study advice
          { href: "/student/ai-revision-helper", label: "Revision Helper", icon: BookText }, // AI quiz or revision generator
          { href: "/student/ai-goals", label: "Smart Goals", icon: Target }, // Set & track study goals using AI
          { href: "/student/ai-motivation", label: "Motivation Boost", icon: Sparkles }, // Daily quote or feedback generator

        ]
      case "Parent":
        return [
          { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/parent/children", label: "Children", icon: Users },
          { href: "/parent/attendance", label: "Attendance", icon: Clock },
          { href: "/parent/results", label: "Results", icon: FileText },
          { href: "/parent/notices", label: "Notices", icon: Bell },
          { href: "/parent/payments", label: "Payments", icon: CreditCard },
          { href: "/parent/messages", label: "Messages", icon: MessageSquare },
          { href: "/parent/profile", label: "Profile", icon: User },
          { href: "/parent/ai-progress-summary", label: "Child Progress", icon: PieChart }, // AI-generated summary of child’s performance
          { href: "/parent/ai-communication-suggestions", label: "Talk to Teacher", icon: MessageSquareDashed }, // AI-generated concern templates
          { href: "/parent/ai-attendance-alerts", label: "Attendance Alerts", icon: BellRing }, // Predict if child is at risk

        ]
      default:
        return [{ href: "/login", label: "Login", icon: LogOut }]
    }
  }

  const navItems = getNavItems()

  return (
    <aside
      className={cn("flex h-screen w-64 flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white", className)}
    >
      <div className="flex h-16 items-center border-b border-gray-700 px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <School className="h-6 w-6" />
          <span className="text-xl">School Management</span>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href) ? "bg-indigo-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
              )}
              onClick={onClose}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {isActive(item.href) && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">{user?.name || "User"}</p>
            <p className="truncate text-xs text-gray-400">{user?.role || "Role"}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
