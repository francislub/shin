"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Bell, Menu, Moon, Search, Sun, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { useMobile } from "@/hooks/use-mobile"

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isMobile = useMobile()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Fetch notifications (mock data for now)
    setNotifications([
      { id: 1, message: "New student registration", time: "2 hours ago" },
      { id: 2, message: "Upcoming exam schedule published", time: "5 hours ago" },
      { id: 3, message: "System maintenance tonight", time: "1 day ago" },
    ])
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 dark:border-gray-700 dark:bg-gray-800 md:px-6">
      <div className="flex items-center gap-2">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="mr-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {!showSearch ? (
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} className="hidden md:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        ) : (
          <div className="relative hidden md:block">
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] pr-8 md:w-[300px]"
              autoFocus
              onBlur={() => setShowSearch(false)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowSearch(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {notifications.length}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-medium">Notifications</span>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-blue-500">
                Mark all as read
              </Button>
            </div>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                    <span className="text-sm">{notification.message}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-sm text-blue-500">
                  View all notifications
                </DropdownMenuItem>
              </>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No new notifications</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center gap-2 p-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${user?.role?.toLowerCase()}/profile`}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
