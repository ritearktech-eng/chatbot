import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MessageSquare, Database, Trash2 } from "lucide-react";
import { API_URL } from "../config";

interface Company {
    id: string;
    name: string;
    _count?: { documents: number };
}

export function CompaniesDashboard() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/company/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(res.data);
        } catch (error) {
            console.error("Failed to fetch companies", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/company/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Company deleted successfully");
            fetchData();
        } catch (err) {
            alert("Failed to delete company");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                    Your Companies
                </h1>
                <p className="text-muted-foreground">
                    Manage your organizations and their chatbots.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Add New Card */}
                    <Link to="/dashboard/company/new">
                        <Card className="h-full border-dashed border-2 flex flex-col items-center justify-center p-6 hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold text-lg">Create New Company</h3>
                        </Card>
                    </Link>

                    {companies.map(company => (
                        <Card key={company.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                    {company.name}
                                </CardTitle>
                                <CardDescription>
                                    {company._count?.documents || 0} Knowledge Base Documents
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">
                                        Chatbot Status: <span className="text-green-600 font-medium">Active</span>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="flex gap-2 justify-between border-t p-4 bg-muted/20">
                                <div className="flex gap-2">
                                    <Link to={`/dashboard/chat`}>
                                        <Button variant="outline" size="sm" title="Test Chat">
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link to={`/dashboard/data`}>
                                        <Button variant="outline" size="sm" title="Manage Data">
                                            <Database className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(company.id, company.name)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
