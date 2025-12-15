import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Database, Settings, LogOut, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Overview", exact: true },
        { href: "/dashboard/chat", icon: MessageSquare, label: "Chatbot" },
        { href: "/dashboard/data", icon: Database, label: "Knowledge Base" },
        { href: "/dashboard/api", icon: Settings, label: "Settings" },
    ];

    return (
        <div className="flex min-h-screen bg-background font-sans antialiased text-foreground">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-card/50 backdrop-blur-xl md:flex">
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold">P</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Prime<span className="text-primary">Chat</span></h1>
                    </div>
                </div>

                <div className="flex-1 px-4 py-2 space-y-1">
                    <p className="px-2 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        Menu
                    </p>
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? location.pathname === item.href
                            : location.pathname.startsWith(item.href);

                        return (
                            <Link key={item.href} to={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        isActive && "bg-secondary/50 font-medium text-primary shadow-sm"
                                    )}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-border/10 bg-card/30">
                    <div className="mb-4 flex items-center gap-3 px-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Admin User</span>
                            <span className="text-xs text-muted-foreground">admin@prime.com</span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-7xl p-8">
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            {/* Breadcrumbs or Title could go here */}
                        </div>
                    </header>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
