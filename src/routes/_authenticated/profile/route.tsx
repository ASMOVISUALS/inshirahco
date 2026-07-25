import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, UserCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfileLayout,
});

const items = [
  { title: "Dashboard", url: "/profile", icon: LayoutDashboard },
  { title: "Profile", url: "/profile/edit", icon: UserCircle },
];

function ProfileLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-72px)] w-full">
        <ProfileSidebar />
        <main className="flex-1 min-w-0 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

function ProfileSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) => (path === "/profile" ? currentPath === "/profile" : currentPath === path || currentPath.startsWith(path + "/"));

  return (
    <Sidebar collapsible="icon" className="!top-[72px] !h-[calc(100svh-72px)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex justify-end px-1 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
