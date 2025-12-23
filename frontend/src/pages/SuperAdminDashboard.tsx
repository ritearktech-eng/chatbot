import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
    MessageCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

interface DashboardData {
    stats: {
        assistants: { total: number; active: number };
        revenue: string;
        messages: number; // Changed from calls
        conversions: number;
        conversations: number; // Added new property
    };
    weeklyActivity: { day: string; calls: number }[];
    topAssistants: {
        id: string;
        name: string;
        calls: number;
        leads: number;
        status: string;
        updatedAt: string;
    }[];
}

export const SuperAdminDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/super-admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
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
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading dashboard...</div>;
    }

    if (!data) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">Failed to load data</div>;

    // Dummy revenue trend for graph (since we don't have historical revenue yet)
    const revenueTrend = [
        { month: 'Jun', amount: 800 },
        { month: 'Jul', amount: 950 },
        { month: 'Aug', amount: 1100 },
        { month: 'Sep', amount: 1150 },
        { month: 'Oct', amount: parseFloat(data.stats.revenue) || 55 }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                        <p className="text-slate-400 text-sm">Monitor your voice agents at a glance • GST (Dubai) {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <div className="flex gap-2 mt-4 text-xs font-mono">
                            <span className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-yellow-500">
                                Assistants: {data.stats.assistants.total} ({data.stats.assistants.active} active)
                            </span>
                            <span className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-yellow-500">
                                Revenue: AED {data.stats.revenue}
                            </span>
                            <span className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-yellow-500">
                                Msgs (Month): {data.stats.messages}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <Button variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white border-none" onClick={() => navigate('/super-admin/users')}>
                            View Assistants
                        </Button>
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold border-none" onClick={() => navigate('/super-admin/users')}>
                            + Create Assistant
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <h3 className="text-slate-400 text-sm font-medium mb-2">Assistants</h3>
                            <div className="text-4xl font-bold text-white mb-1">{data.stats.assistants.total}</div>
                            <p className="text-slate-500 text-xs">{data.stats.assistants.active} active • {data.stats.assistants.total - data.stats.assistants.active} paused</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <h3 className="text-slate-400 text-sm font-medium mb-2">Revenue (This Month)</h3>
                            <div className="text-4xl font-bold text-white mb-1">AED {data.stats.revenue}</div>
                            <p className="text-slate-500 text-xs">Recurring + usage</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <h3 className="text-slate-400 text-sm font-medium mb-2">Messages (This Month)</h3>
                            <div className="text-4xl font-bold text-white mb-1">{data.stats.messages}</div>
                            <p className="text-slate-500 text-xs">Total messages sent</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <h3 className="text-slate-400 text-sm font-medium mb-2">Engagement</h3>
                            <div className="text-4xl font-bold text-white mb-1">{data.stats.conversations}</div>
                            <p className="text-slate-500 text-xs">{data.stats.conversions} leads generated</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Section: Status & Usage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col justify-center">
                        <h3 className="text-slate-400 text-sm font-medium mb-2">Knowledge Base Sync</h3>
                        <div className="text-3xl font-bold text-white mb-1">100% Active</div>
                        <p className="text-slate-500 text-xs">Assistants with working KB</p>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800 p-6">
                        <h3 className="text-slate-400 text-sm font-medium mb-2">Weekly Usage</h3>
                        <div className="text-sm text-slate-300 mb-2">AED 10.00 / 50.00 (20%)</div>
                        <div className="h-2 bg-slate-800 rounded-full mb-4">
                            <div className="h-full w-1/5 bg-yellow-500 rounded-full"></div>
                        </div>
                        <div className="text-green-500 text-xs font-bold mb-4">OK</div>
                        <Button variant="outline" className="border-yellow-600 text-yellow-500 hover:bg-yellow-900/20 text-xs h-8">
                            Adjust Budgets
                        </Button>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800 p-6">
                        <h3 className="text-slate-400 text-sm font-medium mb-4">System Health</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Webhooks</li>
                            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Google Sheets</li>
                            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Calendar</li>
                            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> LLM</li>
                            <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> TTS/ASR</li>
                        </ul>
                    </Card>
                </div>

                {/* Bottom Section: Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-900 border-slate-800 p-6">
                        <h3 className="text-slate-400 text-sm font-medium mb-6">Revenue Trend (AED)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                        itemStyle={{ color: '#fbbf24' }}
                                    />
                                    <Line type="monotone" dataKey="amount" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800 p-6">
                        <h3 className="text-slate-400 text-sm font-medium mb-6">Messages This Week</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.weeklyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#1e293b' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                        itemStyle={{ color: '#fbbf24' }}
                                    />
                                    <Bar dataKey="calls" fill="#a16207" activeBar={{ fill: '#fbbf24' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Assistant Activity Table */}
                <Card className="bg-slate-900 border-slate-800 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white text-lg font-bold">Assistant Activity</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="border-blue-600 text-blue-500 hover:bg-blue-900/20 text-xs h-8"
                                onClick={async () => {
                                    const token = prompt("Enter your Telegram Bot Token:");
                                    if (token) {
                                        try {
                                            const jwt = localStorage.getItem("token");
                                            const res = await axios.post(`${API_URL}/super-admin/telegram-config`, { token }, {
                                                headers: { Authorization: `Bearer ${jwt}` }
                                            });
                                            alert(res.data.message);
                                        } catch (e: any) {
                                            alert("Failed: " + (e.response?.data?.error || e.message));
                                        }
                                    }
                                }}
                            >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Connect Bot
                            </Button>
                            <Button variant="outline" className="border-yellow-600 text-yellow-500 hover:bg-yellow-900/20 text-xs h-8" onClick={() => navigate('/super-admin/users')}>
                                Manage Assistants
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-500 uppercase border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Assistant</th>
                                    <th className="px-4 py-3">Messages (Total)</th>
                                    <th className="px-4 py-3">New Leads</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.topAssistants.map((assistant) => (
                                    <tr key={assistant.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                        <td className="px-4 py-4 font-medium text-white">{assistant.name}</td>
                                        <td className="px-4 py-4">{assistant.calls}</td>
                                        <td className="px-4 py-4">{assistant.leads}</td>
                                        <td className="px-4 py-4">
                                            {assistant.status === 'PENDING' ? (
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-6 text-xs px-2"
                                                        onClick={() => handleStatusUpdate(assistant.id, 'ACTIVE')}>
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" className="h-6 text-xs px-2"
                                                        onClick={() => handleStatusUpdate(assistant.id, 'REJECTED')}>
                                                        Reject
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className={`flex items-center gap-1.5 ${assistant.status === 'ACTIVE' ? 'text-green-400' : 'text-slate-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${assistant.status === 'ACTIVE' ? 'bg-green-400' : 'bg-slate-400'}`}></span>
                                                    {assistant.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-slate-500">
                                            {new Date(assistant.updatedAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {data.topAssistants.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                            No assistants active.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

            </div>
        </div>
    );
};
