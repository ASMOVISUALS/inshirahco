import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { hasAdminRoleQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  MessageSquareQuote,
  Mail,
  Columns3,
  LayoutTemplate,
  FileStack,
  HelpCircle,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const topItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Articles", url: "/admin/articles", icon: FileText },
  { title: "Reflections", url: "/admin/reflections", icon: Sparkles },
  { title: "Testimonials", url: "/admin/testimonials", icon: MessageSquareQuote },
  { title: "Newsletter", url: "/admin/newsletter", icon: Mail },
  { title: "Pillars", url: "/admin/pillars", icon: Columns3 },
  { title: "Formats", url: "/admin/formats", icon: LayoutTemplate },
  { title: "Pages", url: "/admin/pages", icon: FileStack },
  { title: "FAQs", url: "/admin/faqs", icon: HelpCircle },
];

function AdminLayout() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useQuery(hasAdminRoleQuery(user?.id ?? null));
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && isAdmin === false) navigate({ to: "/" });
  }, [isLoading, isAdmin, user, navigate]);

  if (isLoading || !user) {
    return <div className="container-wide py-24 text-center text-muted-foreground">Checking access…</div>;
  }
  if (!isAdmin) {
    return <div className="container-wide py-24 text-center text-muted-foreground">Not authorized.</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-background px-6">
          <p className="eyebrow text-xs">Admin</p>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-display leading-none">Inshirah control room</h1>
        </header>
        <div className="flex flex-1 min-h-0 w-full">
          <AdminSidebar />
          <main className="flex-1 min-w-0 overflow-auto p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) =>
    path === "/admin" ? currentPath === "/admin" : currentPath === path || currentPath.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {topItems.map((item) => (
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/settings")} tooltip="Settings">
              <Link to="/admin/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex justify-end px-1 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

