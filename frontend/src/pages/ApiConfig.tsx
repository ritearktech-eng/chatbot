import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { API_URL } from "../config";

export const ApiConfig = () => {
    const [companies, setCompanies] = useState<any[]>([]);

    useEffect(() => {
        axios.get(`${API_URL}/company/list`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).then(res => setCompanies(res.data));
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Integration</h2>
            {companies.map(company => (
                <Card key={company.id}>
                    <CardHeader><CardTitle>{company.name}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-slate-100 rounded-md">
                            <p className="text-sm font-mono break-all">Chat Endpoint: /chat/{company.id}</p>
                        </div>

                        <h3 className="font-semibold">Widget Embed Code</h3>
                        <pre className="p-4 bg-slate-900 text-white rounded-md text-sm overflow-x-auto">
                            {`<script src="${API_URL}/widget.js" data-company-id="${company.id}"></script>`}
                        </pre>
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(company.id)}>
                            Copy Company ID
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
