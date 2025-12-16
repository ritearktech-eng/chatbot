import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { API_URL } from "../config";

interface Company {
    id: string;
    name: string;
    systemPrompt?: string;
    greetingMessage?: string;
    _count?: { documents: number };
    googleSheetId?: string;
}

import { CompanyDocuments } from "../components/dashboard/CompanyDocuments";

export const DataManagement = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [urlInput, setUrlInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Create State
    const [newCompanyName, setNewCompanyName] = useState("");

    // Edit State
    const [editMode, setEditMode] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        systemPrompt: "",
        greetingMessage: "",
        googleSheetId: ""
    });

    const [refreshKey, setRefreshKey] = useState(0);

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchCompanies();
    }, []);

    // Effect to populate edit form when company selected
    useEffect(() => {
        if (selectedCompanyId) {
            const company = companies.find(c => c.id === selectedCompanyId);
            if (company) {
                setEditFormData({
                    name: company.name,
                    systemPrompt: company.systemPrompt || "",
                    greetingMessage: company.greetingMessage || "",
                    googleSheetId: company.googleSheetId || ""
                });
            }
        }
    }, [selectedCompanyId, companies]);

    const fetchCompanies = async () => {
        try {
            const res = await axios.get(`${API_URL}/company/list`, config);
            setCompanies(res.data);
            if (res.data.length > 0 && !selectedCompanyId) setSelectedCompanyId(res.data[0].id);
        } catch (error) {
            console.error(error);
        }
    };

    const createCompany = async () => {
        try {
            await axios.post(`${API_URL}/company/create`, { name: newCompanyName }, config);
            setNewCompanyName("");
            fetchCompanies();
        } catch (error) { alert("Failed to create company"); }
    };

    const updateCompany = async () => {
        if (!selectedCompanyId) return;
        try {
            await axios.patch(`${API_URL}/company/${selectedCompanyId}`, editFormData, config);
            alert("Company updated successfully!");
            fetchCompanies();
            setEditMode(false);
        } catch (error) {
            console.error("Failed to update company", error);
            alert("Failed to update company");
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedCompanyId) return;
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", selectedCompanyId);

        try {
            await axios.post(`${API_URL}/company/upload`, formData, {
                headers: { ...config.headers, "Content-Type": "multipart/form-data" }
            });
            alert("Uploaded!");
            setFile(null);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            alert("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const handleUrlScrape = async () => {
        if (!urlInput || !selectedCompanyId) return;
        setLoading(true);
        try {
            await axios.post(`${API_URL}/company/upload`, {
                companyId: selectedCompanyId,
                type: 'URL',
                content: urlInput
            }, config);
            alert("Scraped and added to Knowledge Base!");
            setUrlInput("");
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            alert("Scraping failed. Ensure URL is valid.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold">Data Management</h2>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Label className="whitespace-nowrap">Active Company:</Label>
                    <select
                        className="w-full md:w-[250px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                    >
                        <option value="" disabled>Select a company</option>
                        {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c._count?.documents || 0} docs)</option>
                        ))}
                    </select>
                    {selectedCompanyId && (
                        <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                            {editMode ? "Cancel Edit" : "Edit Settings"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Edit Mode Panel */}
            {editMode && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>Edit Company Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>System Prompt (AI Persona)</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editFormData.systemPrompt}
                                onChange={(e) => setEditFormData({ ...editFormData, systemPrompt: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Initial Greeting Message</Label>
                            <Input
                                value={editFormData.greetingMessage}
                                onChange={(e) => setEditFormData({ ...editFormData, greetingMessage: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Google Sheet ID (for Leads & Export)</Label>
                            <Input
                                value={editFormData.googleSheetId}
                                onChange={(e) => setEditFormData({ ...editFormData, googleSheetId: e.target.value })}
                                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            />
                            <p className="text-xs text-muted-foreground">
                                Share your sheet with the service account email (check config).
                            </p>
                        </div>
                        <Button onClick={updateCompany}>Save Changes</Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Upload Card */}
                <Card className={!selectedCompanyId ? "opacity-50 pointer-events-none" : ""}>
                    <CardHeader>
                        <CardTitle>Upload Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            <p className="text-sm text-muted-foreground mt-2">PDF, DOCX, or TXT</p>
                        </div>
                        <Button onClick={handleUpload} disabled={!file || !selectedCompanyId || loading} className="w-full">
                            {loading ? "Uploading..." : "Upload & Process"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Create Company Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Company</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter name..."
                                    value={newCompanyName}
                                    onChange={(e) => setNewCompanyName(e.target.value)}
                                />
                                <Button onClick={createCompany}>Create</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Document List */}
            {selectedCompanyId ? (
                <CompanyDocuments key={refreshKey} companyId={selectedCompanyId} />
            ) : (
                <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                    Please select a company to view and manage documents.
                </div>
            )}
        </div>
    );
};
