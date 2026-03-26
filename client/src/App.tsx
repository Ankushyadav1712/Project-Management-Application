import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute, PublicRoute } from "./routes/Guards";
import DashboardLayout from "./layouts/DashboardLayout";
import { Toaster } from "sonner";

// Auth pages
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// App pages
import Dashboard from "./pages/dashboard/Dashboard";
import WorkspaceDetails from "./pages/workspace/WorkspaceDetails";
import CreateWorkspace from "./pages/workspace/CreateWorkspace";
import ProjectDetails from "./pages/project/ProjectDetails";
import CreateProject from "./pages/project/CreateProject";
import TaskDetails from "./pages/task/TaskDetails";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
});

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pm-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Semi-public routes (anyone can access) */}
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected routes (require login) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/workspace/:id" element={<WorkspaceDetails />} />
                <Route path="/create-workspace" element={<CreateWorkspace />} />
                <Route path="/workspace/:workspaceId/new-project" element={<CreateProject />} />
                <Route path="/project/:id" element={<ProjectDetails />} />
                <Route path="/task/:id" element={<TaskDetails />} />
                <Route path="/settings" element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-500 mt-2">Account settings coming soon.</p>
                  </div>
                } />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
