import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminGuard from "./components/AdminGuard.jsx";
import ChatLayout from "./layouts/ChatLayout.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));
const ContactsPanel = lazy(() => import("./components/chat/ContactsPanel.jsx"));
const FeedsPage = lazy(() => import("./pages/FeedsPage.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.jsx"));
const AdminSettings = lazy(() => import("./pages/AdminSettings.jsx"));
const SupportPage = lazy(() => import("./pages/SupportPage.jsx"));
const AuthLanding = lazy(() => import("./pages/AuthLanding.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const PageNotFound = lazy(() => import("./lib/PageNotFound.jsx"));

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>
          <Route path="/" element={<AuthLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <ChatLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="chat/:chatId" element={<ChatPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/:section" element={<SettingsPage />} />
            <Route path="contacts" element={<ContactsPanel />} />
            <Route path="feeds" element={<FeedsPage />} />
            <Route path="support" element={<SupportPage />} />
          </Route>
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <Outlet />
              </AdminGuard>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="support" element={<SupportPage adminMode />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="/default-path" element={<Navigate to="/" replace />} />
          <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
