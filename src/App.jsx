import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminGuard from "./components/AdminGuard.jsx";
import ChatLayout from "./layouts/ChatLayout.jsx";
import Home from "./pages/Home.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ContactsPanel from "./components/chat/ContactsPanel.jsx";
import StoriesTab from "./components/chat/StoriesTab.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AuthLanding from "./pages/AuthLanding.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import PageNotFound from "./lib/PageNotFound.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
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
            <Route path="stories" element={<StoriesTab />} />
          </Route>
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            }
          />
          <Route path="/default-path" element={<Navigate to="/" replace />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
