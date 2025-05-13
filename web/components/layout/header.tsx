"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Menu, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/context/auth-context"
import { useMobile } from "@/hooks/use-mobile"

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const isMobile = useMobile()

  const getPageTitle = () => {
    if (title) return title

    // Extract page title from pathname
    const path = pathname.split("/").filter(Boolean)
    if (path.length === 0) return "Dashboard"

    // Get the last segment and capitalize it
    const lastSegment = path[path.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  const handleLogout = () => {
    logout()
  }

  const getProfileLink = () => {
    if (user?.role === "Admin") return "/admin/profile"
    if (user?.role === "Teacher") return "/teacher/profile"
    if (user?.role === "Student") return "/student/profile"
    if (user?.role === "Parent") return "/parent/profile"
    return "/profile"
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        {isMobile && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px] pr-0">
              <Sidebar className="px-2" />
            </SheetContent>
          </Sheet>
        )}
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-auto">
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium">New notice posted</span>
                  <span className="text-xs text-muted-foreground">2 minutes ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium">Exam results published</span>
                  <span className="text-xs text-muted-foreground">1 hour ago</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium">Parent meeting scheduled</span>
                  <span className="text-xs text-muted-foreground">Yesterday</span>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={getProfileLink()}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${getProfileLink()}?tab=security`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
