import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Loader2, Trash2, FileText, Eye, EyeOff } from "lucide-react";

interface Document {
    id: string;
    type: string;
    metadata: any;
    isActive: boolean;
    createdAt: string;
}

interface CompanyDocumentsProps {
    companyId: string;
}

export const CompanyDocuments = ({ companyId }: CompanyDocumentsProps) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token} ` } };

    useEffect(() => {
        if (companyId) {
            fetchDocuments();
        } else {
            setDocuments([]);
        }
    }, [companyId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:3000/company/${companyId}/documents`, config);
            setDocuments(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (doc: Document) => {
        setTogglingId(doc.id);
        try {
            const newStatus = !doc.isActive;
            await axios.patch(`http://localhost:3000/company/${companyId}/documents/${doc.id}/status`, { isActive: newStatus }, config);

            setDocuments(documents.map(d => d.id === doc.id ? { ...d, isActive: newStatus } : d));
        } catch (error) {
            alert("Failed to update status");
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm("Are you sure you want to delete this document? This will generic remove it from the AI knowledge base.")) return;

        setDeletingId(docId);
        try {
            await axios.delete(`http://localhost:3000/company/${companyId}/documents/${docId}`, config);
            setDocuments(documents.filter(d => d.id !== docId));
        } catch (error) {
            alert("Failed to delete document");
        } finally {
            setDeletingId(null);
        }
    };

    if (!companyId) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Company Documents</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <p className="text-center text-muted-foreground p-4">No documents found.</p>
                ) : (
                    <div className="space-y-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className={`flex items-center justify-between p-3 border rounded-lg bg-card ${!doc.isActive ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">
                                            {doc.metadata?.filename || doc.metadata?.url || "Untitled Document"}
                                            {!doc.isActive && <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">Disabled</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleStatus(doc)}
                                        disabled={togglingId === doc.id}
                                        title={doc.isActive ? "Disable (Hide from AI)" : "Enable (Show to AI)"}
                                    >
                                        {togglingId === doc.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : doc.isActive ? (
                                            <Eye className="h-4 w-4" />
                                        ) : (
                                            <EyeOff className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deletingId === doc.id}
                                    >
                                        {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
