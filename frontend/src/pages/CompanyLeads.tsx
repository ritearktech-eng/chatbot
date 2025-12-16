import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronDown, ChevronUp, User, Bot } from "lucide-react";
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

    return (
        <div className="space-y-6 animate-in fade-in">
            <h1 className="text-3xl font-bold tracking-tight">Leads & Conversations</h1>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                <div className="grid gap-4">
                    {leads.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No leads captured yet.</div>
                    ) : (
                        leads.map(lead => (
                            <Card key={lead.id} className="overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/10">
                                    <div className="space-y-1">
                                        <CardTitle>{lead.name}</CardTitle>
                                        <CardDescription>{lead.email} • {lead.phone || "No Phone"}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={getScoreColor(lead.status)}>{lead.status || "NEW"}</Badge>
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
                                                        <Badge variant="outline">{conv.score}</Badge>
                                                    </div>

                                                    {conv.summary && (
                                                        <div className="text-sm italic text-muted-foreground mb-3 p-2 bg-muted rounded">
                                                            "Summary: {conv.summary}"
                                                        </div>
                                                    )}

                                                    <ScrollArea className="h-[200px] pr-4">
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
                                                    </ScrollArea>
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
