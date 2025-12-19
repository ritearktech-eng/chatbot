import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { API_URL } from "../config";
import { CompanyDocuments } from "../components/dashboard/CompanyDocuments";

interface Company {
    id: string;
    name: string;
    _count?: { documents: number };
}

export const DataManagement = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [urlInput, setUrlInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await axios.get(`${API_URL}/company/list`, config);
            setCompanies(res.data);
            if (res.data.length > 0 && !selectedCompanyId) setSelectedCompanyId(res.data[0].id);
        } catch (error) {
            console.error(error);
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                </div>
            </div>

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
                            {loading && !urlInput ? "Uploading..." : "Upload & Process"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Scrape URL Card */}
                <Card className={!selectedCompanyId ? "opacity-50 pointer-events-none" : ""}>
                    <CardHeader>
                        <CardTitle>Import from Website</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Website URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://example.com"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                />
                                <Button onClick={handleUrlScrape} disabled={!urlInput || loading}>
                                    {loading && urlInput ? "Scraping..." : "Scrape"}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                We will extract visible text from this page.
                            </p>
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
