import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { API_URL } from "../config";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface Company {
    id: string;
    name: string;
    greetingMessage?: string;
}

export function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! Select a company to start chatting." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

    // Lead Collection State
    const [leadStep, setLeadStep] = useState<"INIT" | "ASK_NAME" | "ASK_EMAIL" | "ASK_PHONE" | "COMPLETED">("INIT");
    const [leadData, setLeadData] = useState({ name: "", email: "", phone: "" });

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch companies on load
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/company/list`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(data);
                    if (data.length > 0) {
                        const initialCompanyId = data[0].id;
                        setSelectedCompanyId(initialCompanyId);

                        // Check if lead exists in session
                        const storedLead = sessionStorage.getItem(`lead_data_${initialCompanyId}`);
                        const greeting = data[0].greetingMessage || `Connected to ${data[0].name}. Ask me anything about your data!`;

                        if (storedLead) {
                            setLeadData(JSON.parse(storedLead));
                            setLeadStep("COMPLETED");
                            setMessages([{ role: "assistant", content: greeting }]);
                        } else {
                            setLeadStep("ASK_NAME");
                            setMessages([{ role: "assistant", content: greeting }]);

                            // Add delay for the follow-up question
                            setTimeout(() => {
                                setMessages(prev => {
                                    // Prevent duplicate messages (React Strict Mode double invokation)
                                    const lastMsg = prev[prev.length - 1];
                                    if (lastMsg.content === "Before we begin, could I please get your name?") {
                                        return prev;
                                    }
                                    return [...prev, { role: "assistant", content: "Before we begin, could I please get your name?" }];
                                });
                            }, 1000);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch companies:", err);
            }
        };
        fetchCompanies();
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(",")[1];
                    handleSend("voice", base64String);
                };
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            // Stop all tracks to release microphone
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend("text");
        }
    };

    const handleSend = async (inputType: "text" | "voice" = "text", audioData?: string) => {
        if (inputType === "text" && !input.trim()) return;
        if (!selectedCompanyId) return;

        let userContent = input;
        if (inputType === "voice") {
            userContent = "🎤 Audio Message";
        }

        const userMessage: Message = { role: "user", content: userContent };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // --- Lead Collection Flow ---
        if (leadStep !== "COMPLETED") {
            setTimeout(async () => {
                let nextMessage = "";
                let nextStep: "INIT" | "ASK_NAME" | "ASK_EMAIL" | "ASK_PHONE" | "COMPLETED" = leadStep;

                if (leadStep === "INIT") {
                    // Logic handles via useEffect now
                }

                if (leadStep === "ASK_NAME") {
                    setLeadData(prev => ({ ...prev, name: userContent }));
                    nextMessage = "Nice to meet you! What is your email address?";
                    nextStep = "ASK_EMAIL";
                } else if (leadStep === "ASK_EMAIL") {
                    setLeadData(prev => ({ ...prev, email: userContent }));
                    nextMessage = "Thanks! Lastly, what is your phone number?";
                    nextStep = "ASK_PHONE";
                } else if (leadStep === "ASK_PHONE") {
                    const finalData = { ...leadData, phone: userContent };
                    setLeadData(finalData);

                    // Submit to Backend
                    try {
                        const token = localStorage.getItem("token");
                        await fetch(`${API_URL}/company/lead`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ companyId: selectedCompanyId, ...finalData })
                        });
                        nextMessage = "Thank you! I've saved your details. How can I help you today?";
                        nextStep = "COMPLETED";
                        // Save to session to avoid asking again this session
                        sessionStorage.setItem(`lead_data_${selectedCompanyId}`, JSON.stringify(finalData));
                    } catch (e) {
                        console.error("Failed to save lead", e);
                        nextMessage = "Thanks. How can I help you today?";
                        nextStep = "COMPLETED";
                    }
                }

                setMessages(prev => [...prev, { role: "assistant", content: nextMessage }]);
                setLeadStep(nextStep);
                setIsLoading(false);
            }, 600); // Simulate typing delay
            return;
        }

        // --- Normal Chat Flow ---

        try {
            const token = localStorage.getItem("token");

            const payload: any = {
                query: inputType === "text" ? input : "",
                history: messages.map(m => ({ role: m.role, content: m.content })),
                inputType: inputType
            };

            if (inputType === "voice" && audioData) {
                payload.inputAudio = audioData;
            }

            const response = await fetch(`${API_URL}/chat/${selectedCompanyId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("API Request failed");

            const data = await response.json();

            // Handle different response structures gracefully
            const botContent = data.answer || data.response || (typeof data === 'string' ? data : JSON.stringify(data));


            const botMessage: Message = {
                role: "assistant",
                content: botContent
            };
            setMessages((prev) => [...prev, botMessage]);

            // Play audio if available
            if (data.audio) {
                try {
                    const audioSrc = `data:audio/mp3;base64,${data.audio}`;
                    const audio = new Audio(audioSrc);
                    audio.play();
                } catch (audioErr) {
                    console.error("Error playing audio:", audioErr);
                }
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Error communicating with the chatbot." }]);
        } finally {
            setIsLoading(false);
        }
    };




    const handleEndChat = async () => {
        if (!selectedCompanyId || messages.length < 2) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Only end if we have some lead data or at least chat history
            // We can just send what we have.

            await fetch(`${API_URL}/company/end-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    companyId: selectedCompanyId,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    leadData: leadData
                })
            });

            alert("Chat session ended and saved.");
            setMessages([{ role: "assistant", content: "Session ended. Refresh to start a new chat." }]);
            setLeadStep("INIT"); // Reset for next time if they refresh
            sessionStorage.removeItem(`lead_captured_${selectedCompanyId}`); // Optional: clear session? Maybe not if we want to remember they are a lead.
            // Actually, if they end chat, maybe we KEEP them as lead but just new session.

        } catch (err) {
            console.error("End chat error", err);
            alert("Error ending chat session.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-End Chat Timer
    useEffect(() => {
        if (!selectedCompanyId || leadStep === "INIT" || leadStep === "COMPLETED") return;

        const timer = setTimeout(() => {
            console.log("Auto-ending chat due to inactivity");
            handleEndChat();
        }, 1 * 60 * 1000); // 1 minute

        return () => clearTimeout(timer);
    }, [messages, selectedCompanyId, leadStep]);

    // Handle Tab Close / Navigation
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (selectedCompanyId && messages.length >= 2) {
                const token = localStorage.getItem("token");
                const payload = {
                    companyId: selectedCompanyId,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    leadData: leadData
                };

                // const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

                // Try sendBeacon first (more reliable on exit), fall back to fetch
                // Note: sendBeacon doesn't support custom headers like Authorization easily in all contexts, 
                // but we can pass token in body or query if needed. 
                // However, our backend expects Bearer token.
                // fetch with keepalive is actually the modern standard replacing sendBeacon for this.
                // Let's stick to fetch keepalive but ensure we catch errors.

                fetch(`${API_URL}/company/end-session`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                    keepalive: true
                }).catch(err => console.error("Exit save failed", err));
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        // Also listen for visibility change (mobile tab close often triggers this but not beforeunload)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleBeforeUnload();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [selectedCompanyId, messages, leadData]);

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col max-w-4xl mx-auto space-y-4">
            {/* Company Selector (Simple) */}
            <div className="flex justify-between items-center">
                <div className="flex-1"></div>
                <div className="flex gap-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleEndChat}
                        disabled={isLoading || messages.length < 2}
                    >
                        End Chat
                    </Button>
                    <select
                        className="p-2 border rounded-md text-sm bg-background"
                        value={selectedCompanyId}
                        onChange={(e) => {
                            const newId = e.target.value;
                            setSelectedCompanyId(newId);
                            const company = companies.find(c => c.id === newId);

                            // Check if lead exists in session
                            const storedLead = sessionStorage.getItem(`lead_data_${newId}`);
                            const greeting = company?.greetingMessage || `Connected to ${company?.name}. Ask me anything about your data!`;

                            if (storedLead) {
                                setLeadData(JSON.parse(storedLead));
                                setLeadStep("COMPLETED");
                                setMessages([{ role: "assistant", content: greeting }]);
                            } else {
                                setLeadStep("ASK_NAME");
                                setMessages([{ role: "assistant", content: greeting }]);
                                // Add delay for the follow-up question
                                setTimeout(() => {
                                    setMessages(prev => {
                                        const lastMsg = prev[prev.length - 1];
                                        if (lastMsg.content === "Before we begin, could I please get your name?") {
                                            return prev;
                                        }
                                        return [...prev, { role: "assistant", content: "Before we begin, could I please get your name?" }];
                                    });
                                }, 1000);
                            }
                        }}
                    >
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex w-full items-start gap-2",
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div
                            className={cn(
                                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow",
                                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                        >
                            {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm shadow-sm max-w-[80%] overflow-hidden",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <div className={cn(
                                "prose prose-sm max-w-none break-words",
                                msg.role === "user" ? "prose-invert" : "dark:prose-invert"
                            )}>
                                <ReactMarkdown
                                    components={{
                                        // Custom styling to ensure lists render strictly within container
                                        ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 my-1" {...props} />,
                                        ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 my-1" {...props} />,
                                        p: ({ node, ...props }: any) => <p className="mb-1 last:mb-0" {...props} />
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex w-full items-start gap-2">
                        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow bg-muted">
                            <Bot className="h-4 w-4" />
                        </div>
                        <div className="rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <Card className="p-4 border-t bg-background">
                <div className="flex items-center gap-2">
                    <Button
                        variant={isRecording ? "destructive" : "secondary"}
                        size="icon"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading || !selectedCompanyId}
                        className={cn("shrink-0", isRecording && "animate-pulse")}
                    >
                        {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Input
                        placeholder={selectedCompanyId ? "Type your message..." : "Select a company to start"}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading || !selectedCompanyId || isRecording}
                        className="flex-1"
                    />
                    <Button onClick={() => handleSend("text")} disabled={isLoading || !input.trim() || !selectedCompanyId || isRecording}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </Card>
        </div >
    );
}
