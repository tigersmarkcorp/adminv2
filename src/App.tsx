import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Workers from "./pages/Workers";
import OJT from "./pages/OJT";
import FixedSchedule from "./pages/FixedSchedule";
import FlexibleSchedule from "./pages/FlexibleSchedule";
import Files from "./pages/Files";
import HistoryPage from "./pages/History";
import AccountSync from "./pages/AccountSync";
import EmployeeLayout from "./components/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeFiles from "./pages/employee/EmployeeFiles";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import OjtLayout from "./components/OjtLayout";
import OjtDashboard from "./pages/ojt/OjtDashboard";
import OjtProfile from "./pages/ojt/OjtProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="workers" element={<Workers />} />
              <Route path="ojt" element={<OJT />} />
              <Route path="fixed" element={<FixedSchedule />} />
              <Route path="flexible" element={<FlexibleSchedule />} />
              <Route path="files" element={<Files />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="sync" element={<AccountSync />} />
            </Route>
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="files" element={<EmployeeFiles />} />
              <Route path="profile" element={<EmployeeProfile />} />
            </Route>
            <Route path="/ojt" element={<OjtLayout />}>
              <Route index element={<OjtDashboard />} />
              <Route path="profile" element={<OjtProfile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
