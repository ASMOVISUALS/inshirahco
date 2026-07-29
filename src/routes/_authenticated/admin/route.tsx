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
  Archive,
  Settings,
  Layers,
  UserCog,
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
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const dashboardItem = { title: "Dashboard", url: "/admin", icon: LayoutDashboard };
const sections: { label: string; items: { title: string; url: string; icon: typeof FileText }[] }[] = [
  {
    label: "Content",
    items: [
      { title: "Articles", url: "/admin/articles", icon: FileText },
      { title: "Series", url: "/admin/series", icon: Layers },
      { title: "Reflections", url: "/admin/reflections", icon: Sparkles },
      { title: "FAQs", url: "/admin/faqs", icon: HelpCircle },
    ],
  },
  {
    label: "Audience",
    items: [
      { title: "Testimonials", url: "/admin/testimonials", icon: MessageSquareQuote },
      { title: "Newsletter", url: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "Structure",
    items: [
      { title: "Pillars", url: "/admin/pillars", icon: Columns3 },
      { title: "Formats", url: "/admin/formats", icon: LayoutTemplate },
    ],
  },
  {
    label: "Dev",
    items: [
      { title: "Pages", url: "/admin/pages", icon: FileStack },
    ],
  },
];

function AdminLayout() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useQuery(hasAdminRoleQuery(user?.id ?? null));
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isBuilder = /^\/admin\/pages\/[^/]+\/builder$/.test(pathname);

  useEffect(() => {
    if (!isLoading && user && isAdmin === false) navigate({ to: "/" });
  }, [isLoading, isAdmin, user, navigate]);

  if (isLoading || !user) {
    return <div className="container-wide py-24 text-center text-muted-foreground">Checking access…</div>;
  }
  if (!isAdmin) {
    return <div className="container-wide py-24 text-center text-muted-foreground">Not authorized.</div>;
  }

  if (isBuilder) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100vh-72px)] w-full">
        <AdminSidebar />
        <main className="flex-1 min-w-0 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) =>
    path === "/admin" ? currentPath === "/admin" : currentPath === path || currentPath.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon" className="!top-[72px] !h-[calc(100svh-72px)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(dashboardItem.url)} tooltip={dashboardItem.title}>
                  <Link to={dashboardItem.url}>
                    <dashboardItem.icon className="h-4 w-4" />
                    <span>{dashboardItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator className="mx-2 w-auto" />
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
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
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/archive")} tooltip="Archive">
              <Link to="/admin/archive">
                <Archive className="h-4 w-4" />
                <span>Archive</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/admin/users")} tooltip="Users">
              <Link to="/admin/users">
                <UserCog className="h-4 w-4" />
                <span>Users</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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

