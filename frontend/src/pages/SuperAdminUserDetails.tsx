import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Building, Mail, Calendar, ExternalLink } from "lucide-react";
import { API_URL } from "../config";

interface Company {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    messageCount: number;
}

interface UserDetails {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    companies: Company[];
}

export const SuperAdminUserDetails = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) fetchUserDetails();
    }, [userId]);

    const fetchUserDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/super-admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
    if (!user) return <div className="p-8 text-center text-red-500">User not found</div>;

    return (
        <div className="p-8 space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Profile Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>User Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-full">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Email</div>
                                <div className="font-medium">{user.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-full">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Joined On</div>
                                <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <div className="text-sm text-slate-500 mb-1">User ID</div>
                            <code className="bg-slate-100 p-1 rounded text-xs select-all block break-all">
                                {user.id}
                            </code>
                        </div>
                    </CardContent>
                </Card>

                {/* Companies List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Companies / Bots ({user.companies.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.companies.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                                This user has not created any companies yet.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {user.companies.map(company => (
                                    <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <Building className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{company.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                            company.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {company.status}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {company.messageCount} messages
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link to={`/super-admin/company/${company.id}`}>
                                            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                                                Full Details <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
