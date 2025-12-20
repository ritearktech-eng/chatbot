import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Key, MessageSquare, Globe, Bot, Settings, Activity, Save, X, Edit2 } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

import { API_URL } from "../config";

interface CompanyFull {
    id: string;
    name: string;
    systemPrompt: string;
    greetingMessage: string;
    status: string;
    vectorNamespace: string;
    googleSheetId?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    createdAt: string;
    apiKeys: { id: string; key: string; createdAt: string }[];
    _count: { documents: number };
    usageLogs: { id: string; tokens: number; timestamp: string }[];
}

export const SuperAdminCompanyDetails = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState<CompanyFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        systemPrompt: '',
        greetingMessage: '',
        googleSheetId: '',
        telegramBotToken: '',
        telegramChatId: ''
    });

    useEffect(() => {
        if (companyId) fetchCompanyDetails();
    }, [companyId]);

    const fetchCompanyDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/super-admin/company/${companyId}/full`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompany(res.data);
            setFormData({
                systemPrompt: res.data.systemPrompt || '',
                greetingMessage: res.data.greetingMessage || '',
                googleSheetId: res.data.googleSheetId || '',
                telegramBotToken: res.data.telegramBotToken || '',
                telegramChatId: res.data.telegramChatId || ''
            });
        } catch (error) {
            console.error("Failed to fetch company details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`${API_URL}/company/${companyId}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsEditing(false);
            fetchCompanyDetails();
            alert("Configuration updated successfully");
        } catch (error) {
            console.error("Failed to update company", error);
            alert("Failed to update configuration");
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to original
        if (company) {
            setFormData({
                systemPrompt: company.systemPrompt || '',
                greetingMessage: company.greetingMessage || '',
                googleSheetId: company.googleSheetId || '',
                telegramBotToken: company.telegramBotToken || '',
                telegramChatId: company.telegramChatId || ''
            });
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading company data...</div>;
    if (!company) return <div className="p-8 text-center text-red-500">Company not found</div>;

    return (
        <div className="p-8 space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="font-mono text-xs text-slate-400">ID: {company.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            company.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                            }`}>
                            {company.status}
                        </span>
                    </div>
                </div>
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="gap-2">
                        <Edit2 className="w-4 h-4" /> Edit Configuration
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel} className="gap-2">
                            <X className="w-4 h-4" /> Cancel
                        </Button>
                        <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4" /> Save Changes
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* AI Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-indigo-600" />
                            AI Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase">System Prompt</Label>
                            {isEditing ? (
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                    value={formData.systemPrompt}
                                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                                />
                            ) : (
                                <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {company.systemPrompt || "Default system prompt"}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase">Greeting Message</Label>
                            {isEditing ? (
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                    value={formData.greetingMessage}
                                    onChange={(e) => setFormData({ ...formData, greetingMessage: e.target.value })}
                                />
                            ) : (
                                <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                                    {company.greetingMessage || "Hello! How can I help you today?"}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Integration & Keys */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-amber-600" />
                            Credentials & Integrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase">API Keys</Label>
                            <div className="mt-1 space-y-2">
                                {company.apiKeys.map(key => (
                                    <div key={key.id} className="flex items-center justify-between p-2 bg-slate-50 border rounded text-xs font-mono">
                                        <span className="truncate">{key.key}</span>
                                        <span className="text-slate-400 text-[10px]">{new Date(key.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Google Sheet ID
                                </Label>
                                {isEditing ? (
                                    <Input
                                        className="mt-1"
                                        value={formData.googleSheetId}
                                        onChange={(e) => setFormData({ ...formData, googleSheetId: e.target.value })}
                                        placeholder="Google Sheet ID"
                                    />
                                ) : (
                                    <div className="text-sm truncate text-slate-700 mt-1 bg-slate-50 p-2 rounded">
                                        {company.googleSheetId || "Not Configured"}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" /> Telegram Bot Token
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            className="mt-1"
                                            value={formData.telegramBotToken}
                                            onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                                            type="password"
                                            placeholder="Bot Token"
                                        />
                                    ) : (
                                        <div className="text-sm truncate text-slate-700 mt-1 bg-slate-50 p-2 rounded">
                                            {company.telegramBotToken ? "••••••••" : "Not Configured"}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" /> Telegram Chat ID
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            className="mt-1"
                                            value={formData.telegramChatId}
                                            onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                                            placeholder="Chat ID"
                                        />
                                    ) : (
                                        <div className="text-sm truncate text-slate-700 mt-1 bg-slate-50 p-2 rounded">
                                            {company.telegramChatId || "Not Configured"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics & Usage */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Usage Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-700">{company._count.documents}</div>
                                <div className="text-xs text-blue-600">Documents Ingested</div>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-indigo-700">{company.vectorNamespace ? "Ready" : "Error"}</div>
                                <div className="text-xs text-indigo-600">Vector Store Status</div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Recent Usage (Latest 10)</label>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs bg-slate-100 text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2">Time</th>
                                            <th className="px-4 py-2">Tokens</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {company.usageLogs.map(log => (
                                            <tr key={log.id} className="border-t">
                                                <td className="px-4 py-2 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-2">{log.tokens}</td>
                                            </tr>
                                        ))}
                                        {company.usageLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="px-4 py-4 text-center text-xs text-slate-400">
                                                    No recent usage logs.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-600" />
                            System Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Created At</dt>
                                <dd className="font-medium">{new Date(company.createdAt).toLocaleString()}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Vector Namespace</dt>
                                <dd className="font-mono text-xs">{company.vectorNamespace}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

            </div>
        </div >
    );
};
