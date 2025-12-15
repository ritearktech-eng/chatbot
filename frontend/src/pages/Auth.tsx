import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

type AuthFormData = z.infer<typeof authSchema>;

export const AuthPage = ({ isRegister = false }) => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
        resolver: zodResolver(authSchema),
    });

    const onSubmit = async (data: AuthFormData) => {
        try {
            const endpoint = isRegister ? "/auth/register" : "/auth/login";
            // In prod use env var
            const res = await axios.post(`http://localhost:3000${endpoint}`, data);
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.error || "Authentication failed");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
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
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...register("password")} />
                            {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <Button type="submit" className="w-full">
                            {isRegister ? "Register" : "Login"}
                        </Button>
                        <div className="text-center text-sm">
                            {isRegister ? "Already have an account? " : "Don't have an account? "}
                            <a href={isRegister ? "/login" : "/register"} className="text-primary underline">
                                {isRegister ? "Login" : "Register"}
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
