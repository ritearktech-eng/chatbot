import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, Download } from "lucide-react";
import { API_URL } from "../config";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface Conversation {
    id: string;
    summary: string;
    score: string;
    history: Message[];
    createdAt: string;
}

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    conversations: Conversation[];
    createdAt: string;
}

export function CompanyLeads() {
    const { companyId } = useParams<{ companyId: string }>();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    useEffect(() => {
        const fetchLeads = async () => {
            if (!companyId) return;
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/company/${companyId}/leads`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLeads(res.data);
            } catch (error) {
                console.error("Failed to fetch leads", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, [companyId]);

    const getScoreColor = (score: string) => {
        switch (score?.toUpperCase()) {
            case "HOT": return "bg-red-500 hover:bg-red-600";
            case "WARM": return "bg-orange-500 hover:bg-orange-600";
            case "COLD": return "bg-blue-500 hover:bg-blue-600";
            default: return "bg-gray-500";
        }
    };

    const filteredLeads = leads.filter(lead => statusFilter === "ALL" || (lead.status || "NEW") === statusFilter);

    const downloadCSV = () => {
        const headers = ["Name", "Email", "Phone", "Status", "Summary", "Latest Score", "Topics"];
        const rows = filteredLeads.map(lead => {
            const latestConv = lead.conversations[0];
            const summaryText = latestConv ? latestConv.summary.replace(/"/g, '""') : "";
            // Extract topics from summary if possible, or just dump the whole summary

            return [
                `"${lead.name}"`,
                `"${lead.email}"`,
                `"${lead.phone || ""}"`,
                `"${lead.status || "NEW"}"`,
                `"${summaryText}"`,
                `"${latestConv ? latestConv.score : ""}"`,
                "" // Topics are inside summary string for now
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leads_export_${companyId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Leads & Conversations</h1>
                <div className="flex items-center gap-2">
                    <select
                        className="h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="HOT">Hot</option>
                        <option value="WARM">Warm</option>
                        <option value="COLD">Cold</option>
                        <option value="NEW">New</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={downloadCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export XLS
                    </Button>
                </div>
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                <div className="grid gap-4">
                    {filteredLeads.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No leads found.</div>
                    ) : (
                        filteredLeads.map(lead => (
                            <Card key={lead.id} className="overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/10">
                                    <div className="space-y-1">
                                        <CardTitle>{lead.name}</CardTitle>
                                        <CardDescription>{lead.email} • {lead.phone || "No Phone"}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getScoreColor(lead.status)}`}>{lead.status || "NEW"}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                                        >
                                            {expandedLeadId === lead.id ? <ChevronUp /> : <ChevronDown />}
                                        </Button>
                                    </div>
                                </CardHeader>

                                {expandedLeadId === lead.id && (
                                    <CardContent className="p-0 border-t">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
                                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Conversation History</h3>

                                            {lead.conversations.map(conv => (
                                                <div key={conv.id} className="space-y-2 border rounded-lg p-3 bg-background">
                                                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                                        <span>{new Date(conv.createdAt).toLocaleString()}</span>
                                                        <span className="px-2 py-0.5 border rounded text-xs">{conv.score}</span>
                                                    </div>

                                                    {conv.summary && (
                                                        <div className="text-sm italic text-muted-foreground mb-3 p-2 bg-muted rounded">
                                                            "Summary: {conv.summary}"
                                                        </div>
                                                    )}

                                                    <div className="h-[200px] overflow-y-auto pr-4 border rounded p-2">
                                                        <div className="space-y-3">
                                                            {conv.history.map((msg, idx) => (
                                                                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                    <div className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${msg.role === 'user'
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : 'bg-muted text-foreground'
                                                                        }`}>
                                                                        {msg.content}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
