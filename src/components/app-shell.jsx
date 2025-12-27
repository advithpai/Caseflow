"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../state/store"
import { Button } from "@/components/ui/button"
import { FileText, Upload, List, LogOut, User, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const navItems = [
    { href: "/cases", label: "Cases", icon: List },
    { href: "/upload", label: "Upload", icon: Upload },
  ]

  const NavLinks = ({ mobile = false }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-all duration-200",
              mobile
                ? "px-4 py-3.5 text-base"
                : "px-4 py-2.5 text-sm",
              "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
              isActive && "bg-accent text-accent-foreground font-medium",
            )}
          >
            <Icon className={cn("shrink-0", mobile ? "h-5 w-5" : "h-5 w-5")} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </>
  )

  const UserSection = ({ mobile = false }) => (
    <div className={cn(mobile ? "space-y-3" : "space-y-2")}>
      <div className={cn(
        "flex items-center gap-3 rounded-lg bg-muted",
        mobile ? "px-4 py-3" : "px-4 py-2"
      )}>
        <User className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium truncate",
            mobile ? "text-base" : "text-sm"
          )}>
            {user?.name || "User"}
          </div>
          <div className={cn(
            "text-muted-foreground capitalize",
            mobile ? "text-sm" : "text-xs"
          )}>
            {user?.role || "operator"}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start",
          mobile ? "h-12 text-base" : ""
        )}
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-3 shrink-0" />
        Logout
      </Button>
    </div>
  )

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 border-r border-border bg-card flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-4 xl:p-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-primary shrink-0" />
            <span className="text-lg xl:text-xl font-semibold">CaseFlow</span>
          </div>
        </div>

        <nav className="flex-1 p-3 xl:p-4 space-y-1">
          <NavLinks />
        </nav>

        <div className="p-3 xl:p-4 border-t border-border">
          <UserSection />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
        <div className="flex items-center justify-between h-14 sm:h-16 px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-base sm:text-lg font-semibold">CaseFlow</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 right-0 z-40 w-[280px] sm:w-[320px] bg-card border-l border-border",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col safe-area-inset-top safe-area-inset-bottom",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-14 sm:h-16 flex items-center justify-end px-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks mobile />
        </nav>

        <div className="p-4 border-t border-border">
          <UserSection mobile />
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto",
        "lg:ml-64 xl:ml-72",
        "pt-14 sm:pt-16 lg:pt-0"
      )}>
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
