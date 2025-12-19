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
import { ShieldCheck } from "lucide-react";
import { API_URL } from "../config";

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

type AuthFormData = z.infer<typeof authSchema>;

export const SuperAdminAuth = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
        resolver: zodResolver(authSchema),
    });

    const onSubmit = async (data: AuthFormData) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, data);

            if (res.data.user.role !== "SUPER_ADMIN") {
                setError("Access Denied. Not a Super Admin.");
                return;
            }

            localStorage.setItem("token", res.data.token);
            navigate("/super-dashboard");
        } catch (err: any) {
            setError(err.response?.data?.error || "Authentication failed");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <Card className="w-[400px] border-slate-700 bg-slate-800 text-slate-100">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-slate-700 p-3 rounded-full w-fit mb-2">
                        <ShieldCheck className="w-8 h-8 text-indigo-400" />
                    </div>
                    <CardTitle className="text-xl">Super Admin Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...register("email")}
                                className="bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-500"
                            />
                            {errors.email && <span className="text-red-400 text-sm">{errors.email.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password")}
                                className="bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-500"
                            />
                            {errors.password && <span className="text-red-400 text-sm">{errors.password.message}</span>}
                        </div>
                        {error && <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</div>}
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                            Secure Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
