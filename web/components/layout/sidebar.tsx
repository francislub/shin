"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  User,
  Users,
  Bell,
  Mail,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/context/auth-context"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  // Reset open items when user changes
  useEffect(() => {
    setOpenItems({})
  }, [user?.role])

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const handleLogout = () => {
    logout()
  }

  const renderAdminLinks = () => (
    <>
      <Link href="/admin/dashboard" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/admin/dashboard") && "bg-muted font-medium text-foreground")}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>

      <Collapsible open={openItems["students"]} onOpenChange={() => toggleItem("students")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Students
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", openItems["students"] && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-1">
          <div className="flex flex-col space-y-1">
            <Link href="/admin/students" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/students") && "bg-muted font-medium text-foreground",
                )}
              >
                All Students
              </Button>
            </Link>
            <Link href="/admin/students/add" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/students/add") && "bg-muted font-medium text-foreground",
                )}
              >
                Add Student
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openItems["teachers"]} onOpenChange={() => toggleItem("teachers")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center">
              <GraduationCap className="mr-2 h-4 w-4" />
              Teachers
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", openItems["teachers"] && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-1">
          <div className="flex flex-col space-y-1">
            <Link href="/admin/teachers" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/teachers") && "bg-muted font-medium text-foreground",
                )}
              >
                All Teachers
              </Button>
            </Link>
            <Link href="/admin/teachers/add" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/teachers/add") && "bg-muted font-medium text-foreground",
                )}
              >
                Add Teacher
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openItems["parents"]} onOpenChange={() => toggleItem("parents")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Parents
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", openItems["parents"] && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-1">
          <div className="flex flex-col space-y-1">
            <Link href="/admin/parents" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/parents") && "bg-muted font-medium text-foreground",
                )}
              >
                All Parents
              </Button>
            </Link>
            <Link href="/admin/parents/add" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/parents/add") && "bg-muted font-medium text-foreground",
                )}
              >
                Add Parent
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openItems["classes"]} onOpenChange={() => toggleItem("classes")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Classes
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", openItems["classes"] && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-1">
          <div className="flex flex-col space-y-1">
            <Link href="/admin/classes" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/classes") && "bg-muted font-medium text-foreground",
                )}
              >
                All Classes
              </Button>
            </Link>
            <Link href="/admin/classes/add" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/classes/add") && "bg-muted font-medium text-foreground",
                )}
              >
                Add Class
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openItems["subjects"]} onOpenChange={() => toggleItem("subjects")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Subjects
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", openItems["subjects"] && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-1">
          <div className="flex flex-col space-y-1">
            <Link href="/admin/subjects" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/subjects") && "bg-muted font-medium text-foreground",
                )}
              >
                All Subjects
              </Button>
            </Link>
            <Link href="/admin/subjects/add" passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/subjects/add") && "bg-muted font-medium text-foreground",
                )}
              >
                Add Subject
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Link href="/admin/notices" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/admin/notices") && "bg-muted font-medium text-foreground")}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notices
        </Button>
      </Link>

      <Link href="/admin/report-cards" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/admin/report-cards") && "bg-muted font-medium text-foreground",
          )}
        >
          <FileText className="mr-2 h-4 w-4" />
          Report Cards
        </Button>
      </Link>

      <Link href="/admin/email" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/admin/email") && "bg-muted font-medium text-foreground")}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
      </Link>

      <Link href="/admin/messages" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/admin/messages") && "bg-muted font-medium text-foreground")}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
        </Button>
      </Link>

      <Link href="/admin/profile" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/admin/profile") && "bg-muted font-medium text-foreground")}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
      </Link>
    </>
  )

  const renderTeacherLinks = () => (
    <>
      <Link href="/teacher/dashboard" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/teacher/dashboard") && "bg-muted font-medium text-foreground",
          )}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>

      <Link href="/teacher/students" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/teacher/students") && "bg-muted font-medium text-foreground",
          )}
        >
          <Users className="mr-2 h-4 w-4" />
          Students
        </Button>
      </Link>

      <Link href="/teacher/attendance" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/teacher/attendance") && "bg-muted font-medium text-foreground",
          )}
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          Attendance
        </Button>
      </Link>

      <Link href="/teacher/exams" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/teacher/exams") && "bg-muted font-medium text-foreground")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Exams
        </Button>
      </Link>

      <Link href="/teacher/results" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/teacher/results") && "bg-muted font-medium text-foreground")}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Results
        </Button>
      </Link>

      <Link href="/teacher/report-cards" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/teacher/report-cards") && "bg-muted font-medium text-foreground",
          )}
        >
          <FileText className="mr-2 h-4 w-4" />
          Report Cards
        </Button>
      </Link>

      <Link href="/teacher/notices" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/teacher/notices") && "bg-muted font-medium text-foreground")}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notices
        </Button>
      </Link>

      <Link href="/teacher/profile" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/teacher/profile") && "bg-muted font-medium text-foreground")}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
      </Link>
    </>
  )

  const renderStudentLinks = () => (
    <>
      <Link href="/student/dashboard" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/student/dashboard") && "bg-muted font-medium text-foreground",
          )}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>

      <Link href="/student/subjects" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/student/subjects") && "bg-muted font-medium text-foreground",
          )}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Subjects
        </Button>
      </Link>

      <Link href="/student/attendance" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/student/attendance") && "bg-muted font-medium text-foreground",
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Attendance
        </Button>
      </Link>

      <Link href="/student/exams" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/student/exams") && "bg-muted font-medium text-foreground")}
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          Exams
        </Button>
      </Link>

      <Link href="/student/results" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/student/results") && "bg-muted font-medium text-foreground")}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Results
        </Button>
      </Link>

      <Link href="/student/notices" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/student/notices") && "bg-muted font-medium text-foreground")}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notices
        </Button>
      </Link>

      <Link href="/student/complaints" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/student/complaints") && "bg-muted font-medium text-foreground",
          )}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Complaints
        </Button>
      </Link>

      <Link href="/student/profile" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/student/profile") && "bg-muted font-medium text-foreground")}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
      </Link>
    </>
  )

  const renderParentLinks = () => (
    <>
      <Link href="/parent/dashboard" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/parent/dashboard") && "bg-muted font-medium text-foreground",
          )}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>

      <Link href="/parent/children" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/parent/children") && "bg-muted font-medium text-foreground")}
        >
          <Users className="mr-2 h-4 w-4" />
          Children
        </Button>
      </Link>

      <Link href="/parent/attendance" passHref>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            isActive("/parent/attendance") && "bg-muted font-medium text-foreground",
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Attendance
        </Button>
      </Link>

      <Link href="/parent/notices" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/parent/notices") && "bg-muted font-medium text-foreground")}
        >
          <Bell className="mr-2 h-4 w-4" />
          Notices
        </Button>
      </Link>

      <Link href="/parent/payments" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/parent/payments") && "bg-muted font-medium text-foreground")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Payments
        </Button>
      </Link>

      <Link href="/parent/profile" passHref>
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isActive("/parent/profile") && "bg-muted font-medium text-foreground")}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
      </Link>
    </>
  )

  return (
    <div className={cn("flex h-full flex-col border-r bg-background", className)}>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="h-6 w-6" />
          <span>School Management</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {user?.role === "Admin" && renderAdminLinks()}
          {user?.role === "Teacher" && renderTeacherLinks()}
          {user?.role === "Student" && renderStudentLinks()}
          {user?.role === "Parent" && renderParentLinks()}
        </nav>
      </div>
      <div className="mt-auto border-t p-2">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
