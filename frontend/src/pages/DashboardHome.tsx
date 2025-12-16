import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, Users } from "lucide-react";

export function DashboardHome() {
    const [stats, setStats] = useState({
        documents: 0,
        queries: 0,
        activeBots: 0,
        recentActivity: null as any
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/company/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Welcome back, Admin
                </h1>
                <p className="text-muted-foreground text-lg">
                    Here's what's happening with your chatbots today.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:bg-card/80">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                        <Database className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.documents}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all companies</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:bg-card/80">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Chatbots</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.activeBots}</div>
                        <p className="text-xs text-muted-foreground mt-1">Deployed Chatbots</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:bg-card/80">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.queries}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total Conversations</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-3 rounded-xl bg-secondary/30">
                                <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <Database className="h-4 w-4 text-green-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {stats.recentActivity?.title || "System Ready"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {stats.recentActivity?.description || "Dashboard initialized successfully."}
                                    </p>
                                </div>
                                <div className="ml-auto text-xs text-muted-foreground">
                                    {stats.recentActivity?.time ? new Date(stats.recentActivity.time).toLocaleTimeString() : "Now"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
