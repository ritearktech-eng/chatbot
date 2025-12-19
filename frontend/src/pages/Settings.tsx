import { useState, useEffect } from "react";
import axios from "axios";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { API_URL } from "../config";

interface Company {
    id: string;
    name: string;
    systemPrompt?: string;
    greetingMessage?: string;
    googleSheetId?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    status?: 'PENDING' | 'ACTIVE' | 'REJECTED';
}

export function SettingsPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

    // Edit Form State
    const [editFormData, setEditFormData] = useState<Partial<Company>>({});

    // Create Form State
    const [createFormData, setCreateFormData] = useState({
        name: "",
        systemPrompt: "",
        greetingMessage: ""
    });
    const [creating, setCreating] = useState(false);

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            const company = companies.find(c => c.id === selectedCompanyId);
            if (company) {
                setEditFormData({
                    name: company.name,
                    systemPrompt: company.systemPrompt || "",
                    greetingMessage: company.greetingMessage || "",
                    googleSheetId: company.googleSheetId || "",
                    telegramBotToken: company.telegramBotToken || "",
                    telegramChatId: company.telegramChatId || ""
                });
            }
        }
    }, [selectedCompanyId, companies]);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/company/list`, config);
            setCompanies(res.data);
            if (res.data.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(res.data[0].id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedCompanyId) return;
        try {
            await axios.patch(`${API_URL}/company/${selectedCompanyId}`, editFormData, config);
            alert("Company settings updated successfully!");
            fetchCompanies();
        } catch (error) {
            console.error(error);
            alert("Failed to update company");
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            await axios.post(`${API_URL}/company/create`, createFormData, config);
            alert("Company created successfully!");
            setCreateFormData({ name: "", systemPrompt: "", greetingMessage: "" });
            fetchCompanies();
            // Optional: Switch to General tab and select new company? 
            // For now just refresh list.
        } catch (error) {
            console.error(error);
            alert("Failed to create company");
        } finally {
            setCreating(false);
        }
    };

    const handleTelegramCheck = async () => {
        if (!editFormData.telegramBotToken) return;
        try {
            const res = await axios.post(`${API_URL}/company/telegram/get-id`, {
                token: editFormData.telegramBotToken
            }, config);

            if (res.data.chatId) {
                setEditFormData(prev => ({ ...prev, telegramChatId: res.data.chatId }));
                alert("Found Chat ID! Saved to form.");
            }
        } catch (e: any) {
            const msg = e.response?.data?.error || "Could not find Chat ID. Make sure you sent a message to the bot first!";
            alert(msg);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your companies, configurations, and integrations.</p>
            </div>

            {loading && companies.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Tabs className="w-full" defaultValue="general">
                    <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="create">Create Company</TabsTrigger>
                        <TabsTrigger value="integration">Integration</TabsTrigger>
                    </TabsList>

                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Company Configuration</CardTitle>
                                <CardDescription>Update your chatbot's persona and settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select Company to Edit</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    >
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedCompanyId ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Company Name</Label>
                                            <Input
                                                value={editFormData.name || ""}
                                                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>System Prompt</Label>
                                            <textarea
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={editFormData.systemPrompt || ""}
                                                onChange={e => setEditFormData({ ...editFormData, systemPrompt: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Greeting Message</Label>
                                            <Input
                                                value={editFormData.greetingMessage || ""}
                                                onChange={e => setEditFormData({ ...editFormData, greetingMessage: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                                            <div className="space-y-2">
                                                <Label>Google Sheet ID</Label>
                                                <Input
                                                    value={editFormData.googleSheetId || ""}
                                                    onChange={e => setEditFormData({ ...editFormData, googleSheetId: e.target.value })}
                                                    placeholder="Spreadsheet ID"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Telegram Bot Token</Label>
                                                <Input
                                                    value={editFormData.telegramBotToken || ""}
                                                    onChange={e => setEditFormData({ ...editFormData, telegramBotToken: e.target.value })}
                                                    placeholder="123:ABC..."
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Telegram Chat ID</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={editFormData.telegramChatId || ""}
                                                        onChange={e => setEditFormData({ ...editFormData, telegramChatId: e.target.value })}
                                                        placeholder="Chat ID"
                                                    />
                                                    <Button variant="outline" onClick={handleTelegramCheck}>Auto-Fetch ID</Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button onClick={handleUpdate}>Save Changes</Button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No companies found. Create one first.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CREATE TAB */}
                    <TabsContent value="create" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create New Company</CardTitle>
                                <CardDescription>Add a new workspace for a client or project.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    <Input
                                        value={createFormData.name}
                                        onChange={e => setCreateFormData({ ...createFormData, name: e.target.value })}
                                        placeholder="Acme Corp"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>System Prompt</Label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={createFormData.systemPrompt}
                                        onChange={e => setCreateFormData({ ...createFormData, systemPrompt: e.target.value })}
                                        placeholder="You are a helpful assistant..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Initial Greeting</Label>
                                    <Input
                                        value={createFormData.greetingMessage}
                                        onChange={e => setCreateFormData({ ...createFormData, greetingMessage: e.target.value })}
                                        placeholder="Hello! How can I help?"
                                    />
                                </div>
                                <Button onClick={handleCreate} disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Company
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* INTEGRATION TAB */}
                    <TabsContent value="integration" className="space-y-4">
                        {companies.map(company => (
                            <Card key={company.id}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="space-y-1.5">
                                        <CardTitle>{company.name}</CardTitle>
                                        <CardDescription>Integration details for this workspace.</CardDescription>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${(company.status || 'PENDING') === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                        (company.status || 'PENDING') === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                            'bg-orange-100 text-orange-800'
                                        }`}>
                                        {company.status || 'PENDING'}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(company.status || 'PENDING') === 'ACTIVE' ? (
                                        <>
                                            <div className="p-4 bg-muted rounded-md border">
                                                <p className="text-sm font-mono break-all">Chat Endpoint: /chat/{company.id}</p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Widget Embed Code</Label>
                                                <pre className="mt-2 p-4 bg-slate-950 text-slate-50 rounded-md text-xs overflow-x-auto">
                                                    {`<script 
  src="${window.location.origin}/loader.js" 
  data-company-id="${company.id}"
  data-base-url="${window.location.origin}"
  async
></script>`}
                                                </pre>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(company.id)}>
                                                Copy Company ID
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                                            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                                            <p className="font-medium">Approval Pending</p>
                                            <p className="text-sm">This company must be approved by a Super Admin before integration details are available.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
