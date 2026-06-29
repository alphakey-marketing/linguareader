import { Link, useLocation } from "wouter";
import { BookOpen, LayoutDashboard, Search, ListPlus, Download, Inbox, Layers } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();

  const items = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Lessons", icon: BookOpen, href: "/lessons" },
    { title: "Review", icon: Inbox, href: "/review" },
    { title: "Vocabulary", icon: Search, href: "/vocab" },
    { title: "Collections", icon: Layers, href: "/collections" },
    { title: "Import", icon: Download, href: "/import" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary">
          <BookOpen className="w-6 h-6" />
          <span>LinguaReader</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location === item.href || location.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="flex items-center gap-3 w-full">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
