import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./pages/Auth";
import { DashboardLayout } from "./layout/DashboardLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { DataManagement } from "./pages/DataManagement";
import { ApiConfig } from "./pages/ApiConfig";
import { ChatPage } from "./pages/ChatPage";
import { CreateCompany } from "./pages/CreateCompany";
import { CompaniesDashboard } from "./pages/CompaniesDashboard";
import { CompanyLeads } from "./pages/CompanyLeads";
import { EmbedChat } from "./pages/EmbedChat";

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
          <Route path="api" element={<ApiConfig />} />
          <Route path="company/new" element={<CreateCompany />} />
          <Route path="companies" element={<CompaniesDashboard />} />
          <Route path="company/:companyId/leads" element={<CompanyLeads />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
