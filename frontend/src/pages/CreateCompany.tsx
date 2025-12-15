import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function CreateCompany() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        systemPrompt: "",
        greetingMessage: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

            const response = await fetch(`${apiUrl}/company/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error("Failed to create company");
            }

            console.log("Company created successfully");
            navigate("/dashboard");
        } catch (error) {
            console.error("Failed to create company", error);
            // In a real app, show a toast notification here
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto pt-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Company</CardTitle>
                    <CardDescription>
                        Add a new company workspace to manage documents and chatbots.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name</Label>
                            <Input
                                id="name"
                                placeholder="Acme Inc."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="systemPrompt">System Prompt</Label>
                            <textarea
                                id="systemPrompt"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="You are a helpful assistant..."
                                value={formData.systemPrompt}
                                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Define the persona and behavior of the chatbot.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="greetingMessage">Initial Greeting</Label>
                            <Input
                                id="greetingMessage"
                                placeholder="Hello! How can I help you today?"
                                value={formData.greetingMessage}
                                onChange={(e) => setFormData({ ...formData, greetingMessage: e.target.value })}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Company
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
