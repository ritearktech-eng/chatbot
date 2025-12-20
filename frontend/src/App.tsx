import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./pages/Auth";
import { DashboardLayout } from "./layout/DashboardLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { DataManagement } from "./pages/DataManagement";
import { SettingsPage } from "./pages/Settings";
import { ChatPage } from "./pages/ChatPage";
import { CreateCompany } from "./pages/CreateCompany";
import { CompaniesDashboard } from "./pages/CompaniesDashboard";
import { CompanyLeads } from "./pages/CompanyLeads";
import { SuperAdminAuth } from "./pages/SuperAdminAuth";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import { EmbedChat } from "./pages/EmbedChat";
import { SuperAdminLayout } from "./layout/SuperAdminLayout";
import { SuperAdminUsers } from "./pages/SuperAdminUsers";
import { SuperAdminUserDetails } from "./pages/SuperAdminUserDetails";
import { SuperAdminCompanyDetails } from "./pages/SuperAdminCompanyDetails";

function App() {
  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<Navigate to="/login" />} />

        {/* Public Embed Route */}
        <Route path="/embed/:companyId" element={<EmbedChat />} />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="data" element={<DataManagement />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="company/new" element={<CreateCompany />} />
          <Route path="companies" element={<CompaniesDashboard />} />
          <Route path="company/:companyId/leads" element={<CompanyLeads />} />
        </Route>

        {/* Super Admin Routes */}
        <Route path="/admin" element={<SuperAdminAuth />} />

        <Route path="/super-dashboard" element={
          <PrivateRoute>
            <SuperAdminLayout />
          </PrivateRoute>
        }>
          <Route index element={<SuperAdminDashboard />} />
        </Route>

        <Route path="/super-admin" element={
          <PrivateRoute>
            <SuperAdminLayout />
          </PrivateRoute>
        }>
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="users/:userId" element={<SuperAdminUserDetails />} />
          <Route path="company/:companyId" element={<SuperAdminCompanyDetails />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
