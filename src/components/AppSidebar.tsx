import { useState } from "react"
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  Building2,
  ChevronLeft,
  ChevronRight 
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: LayoutDashboard 
  },
  { 
    title: "Students", 
    url: "/students", 
    icon: Users 
  },
  { 
    title: "Fees", 
    url: "/fees", 
    icon: CreditCard 
  },
  { 
    title: "Settings", 
    url: "/settings", 
    icon: Settings 
  },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path

  const handleToggle = () => {
    setCollapsed(!collapsed)
    toggleSidebar()
  }

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} border-r border-sidebar-border bg-sidebar transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="p-0">
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-sidebar-foreground">HMS</span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-8 w-8 hover:bg-sidebar-accent"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <SidebarGroup className="px-2 py-4">
          <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} text-sidebar-foreground/70 font-medium`}>
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : ""}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}