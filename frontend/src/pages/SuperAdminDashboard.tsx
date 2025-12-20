import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, Building, AlertCircle, TrendingUp, ShieldCheck } from "lucide-react";
import { API_URL } from "../config";

interface CompanyStats {
    id: string;
    name: string;
    messageCount: number;
    _count: { documents: number };
}

interface PendingCompany {
    id: string;
    name: string;
    createdAt: string;
}

interface DashboardStats {
    totalUsers: number;
    totalCompanies: number;
    topCompanies: CompanyStats[];
    pendingCompanies: PendingCompany[];
}

export const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        // Optional: Poll every 10 seconds for real-time vibe
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/super-admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to mark this company as ${status}?`)) return;
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`${API_URL}/super-admin/company/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Company marked as ${status}`);
            fetchStats(); // Refresh list
        } catch (err) {
            alert("Failed to update status");
        }
    };



    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
                <p className="text-slate-500">Welcome to the Super Admin control center.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers ?? "--"}</div>
                        <p className="text-xs text-muted-foreground">Registered accounts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCompanies ?? "--"}</div>
                        <p className="text-xs text-muted-foreground">Workspaces created</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <AlertCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Good</div>
                        <p className="text-xs text-muted-foreground">All systems operational</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Top Active Chatbots
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Company Name</th>
                                    <th className="px-6 py-3">Message Count</th>
                                    <th className="px-6 py-3">Documents</th>
                                    <th className="px-6 py-3">ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.topCompanies.map((company) => (
                                    <tr key={company.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{company.name}</td>
                                        <td className="px-6 py-4">{company.messageCount}</td>
                                        <td className="px-6 py-4">{company._count.documents}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{company.id}</td>
                                    </tr>
                                ))}
                                {stats?.topCompanies.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                                            No activity recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pending Approvals Section */}
            <Card className="border-orange-200 bg-orange-50">
                {/* ... (rest of content) */}
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                        <ShieldCheck className="w-5 h-5" />
                        Pending Approvals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-orange-800 uppercase bg-orange-100">
                                <tr>
                                    <th className="px-6 py-3">Company Name</th>
                                    <th className="px-6 py-3">Created At</th>
                                    <th className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.pendingCompanies?.map((company) => (
                                    <tr key={company.id} className="bg-white border-b hover:bg-orange-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{company.name}</td>
                                        <td className="px-6 py-4">{new Date(company.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 flex gap-2">
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8"
                                                onClick={() => handleStatusUpdate(company.id, 'ACTIVE')}>
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" className="h-8"
                                                onClick={() => handleStatusUpdate(company.id, 'REJECTED')}>
                                                Reject
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats?.pendingCompanies || stats.pendingCompanies.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-slate-500">
                                            No pending requests.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
