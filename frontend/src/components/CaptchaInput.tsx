
import { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { API_URL } from "../config";

interface CaptchaInputProps {
    onCaptchaChange: (token: string, value: string) => void;
}

export const CaptchaInput = ({ onCaptchaChange }: CaptchaInputProps) => {
    const [captchaImage, setCaptchaImage] = useState<string>("");
    const [captchaToken, setCaptchaToken] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");

    const fetchCaptcha = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/captcha`);
            setCaptchaImage(res.data.image);
            setCaptchaToken(res.data.token);
            setInputValue("");
            onCaptchaChange(res.data.token, ""); // Clear parent value on refresh
        } catch (error) {
            console.error("Failed to fetch captcha", error);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        onCaptchaChange(captchaToken, value);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div
                    className="flex-1 bg-slate-100 rounded border border-slate-200 p-2 flex justify-center items-center h-12 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: captchaImage }}
                />
                <Button type="button" variant="outline" size="icon" onClick={fetchCaptcha} title="Refresh Captcha">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
            <Input
                placeholder="Enter the characters above"
                value={inputValue}
                onChange={handleChange}
                className="bg-background"
                required
            />
        </div>
    );
};
