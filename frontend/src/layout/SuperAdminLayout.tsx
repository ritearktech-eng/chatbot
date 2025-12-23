import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { SupportChatWidget } from '../components/SupportChatWidget';

export const SuperAdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/admin");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xl text-white">RiteArkSuper</span>
                        <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-medium">ADMIN</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/super-dashboard"
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/super-admin/users"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`
                        }
                    >
                        <Users className="w-5 h-5" />
                        Users
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-slate-800"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
            <SupportChatWidget />
        </div>
    );
};
