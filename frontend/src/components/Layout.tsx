import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Briefcase, Home, Upload, BarChart3, LogOut, Shield } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/upload', label: 'Resume Hub', icon: Upload },
    { path: '/matches', label: 'Smart Matches', icon: Briefcase },
    { path: '/analysis-results', label: 'Insights', icon: BarChart3 },
    { path: '/admin', label: 'AIOps Control', icon: Shield },
  ]

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={cn(
        "flex flex-col border-r border-white/70 bg-white/65 backdrop-blur-xl transition-all duration-300 ease-in-out",
        mobile ? "w-64" : sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-border/80 p-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          {(!mobile && sidebarOpen) || (mobile && sidebarMobileOpen) ? (
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">JobMatch</span>
          ) : null}
        </Link>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => mobile && setSidebarMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive(path)
                ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_hsl(251_83%_62%_/_0.9)]"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
            )}
            title={(!mobile && !sidebarOpen) ? label : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {(!mobile && sidebarOpen) || (mobile && sidebarMobileOpen) ? <span>{label}</span> : null}
          </Link>
        ))}
      </nav>

      {/* User Section */}
      {user && (
        <div className="border-t border-border/80 p-4 space-y-3">
          <div className="flex items-center gap-2">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            {((!mobile && sidebarOpen) || (mobile && sidebarMobileOpen)) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </div>
          {((!mobile && sidebarOpen) || (mobile && sidebarMobileOpen)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/80 p-4">
        {((!mobile && sidebarOpen) || (mobile && sidebarMobileOpen)) && (
          <p className="text-xs text-muted-foreground">
            © 2025 Resume Job Matcher
          </p>
        )}
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-transparent">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar mobile={false} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/70 bg-white/70 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
                className="md:hidden h-8 w-8"
                aria-label="Toggle sidebar"
              >
                {sidebarMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                JobMatch
              </h1>
            </div>
            {user && (
              <div className="hidden md:flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1.5">
                {user.picture && (
                  <img src={user.picture} alt={user.name || 'User'} className="h-6 w-6 rounded-full object-cover" />
                )}
                <span className="max-w-40 truncate text-xs text-muted-foreground">{user.name || user.email}</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-auto bg-transparent p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-30"
            onClick={() => setSidebarMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-40 md:hidden">
            <Sidebar mobile={true} />
          </div>
        </>
      )}
    </div>
  )
}

export default Layout
