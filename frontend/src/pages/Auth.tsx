import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { API_URL } from "../config";

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().optional(),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    referralSource: z.string().optional(),
}).refine((data) => {
    if (data.confirmPassword && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type AuthFormData = z.infer<typeof authSchema>;

export const AuthPage = ({ isRegister = false }) => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
        resolver: zodResolver(authSchema),
    });

    const onSubmit = async (data: AuthFormData) => {
        if (isRegister && data.password !== data.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const endpoint = isRegister ? "/auth/register" : "/auth/login";
            // Filter out confirmPassword before sending
            const { confirmPassword, ...payload } = data;

            const res = await axios.post(`${API_URL}${endpoint}`, payload);
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.error || "Authentication failed");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 overflow-y-auto py-10">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle className="text-center">{isRegister ? "Create Account" : "Welcome Back"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" {...register("email")} />
                            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                        </div>

                        {isRegister && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" placeholder="+1234567890" {...register("phone")} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input id="companyName" placeholder="Acme Inc." {...register("companyName")} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="referralSource">How did you know about us?</Label>
                                    <Input id="referralSource" placeholder="LinkedIn, Friend, etc." {...register("referralSource")} />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...register("password")} />
                            {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                        </div>

                        {isRegister && (
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                                {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword.message}</span>}
                            </div>
                        )}

                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <Button type="submit" className="w-full">
                            {isRegister ? "Register" : "Login"}
                        </Button>
                        <div className="text-center text-sm">
                            {isRegister ? "Already have an account? " : "Don't have an account? "}
                            <Link to={isRegister ? "/login" : "/register"} className="text-primary underline">
                                {isRegister ? "Login" : "Register"}
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
