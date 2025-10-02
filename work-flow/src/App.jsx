import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/WorkFlowLanding";
import Dashboard from "./pages/WorkFlowDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import OnboardingForm from "./pages/OnboardingForm";
import AIChat from "./pages/AIChat";
import EditProfile from "./components/Navbar/EditProfile";
import AssistantSidebar from './components/AssistantSidebar/AssistantSidebar.jsx';

// ProtectedRoute component with role-based rendering
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const userString = localStorage.getItem("user");

  let currentUser = null;
  try {
    currentUser = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user");
  }

  const isAuthenticated = !!currentUser;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (adminOnly && currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// OnboardingRoute component to check if user needs onboarding
const OnboardingRoute = ({ children }) => {
  const userString = localStorage.getItem("user");

  let currentUser = null;
  try {
    currentUser = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }

  const isAuthenticated = !!currentUser;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  // If user hasn't completed onboarding and is not admin, redirect to onboarding
  if (!currentUser.onboardingCompleted && currentUser.role !== "admin") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            style: {
              background: "linear-gradient(to right, #7c3aed, #2563eb)",
            },
          },
        }}
      />

      <div id="app-content" style={{ marginRight: 'var(--assistant-offset, 0px)' }} className="transition-[margin] duration-300 ease-in-out">
        <Routes>
          {/* Public route - Landing page only */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected route - Onboarding (only for authenticated users who haven't completed onboarding) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingForm />
              </ProtectedRoute>
            }
          />

          {/* Protected route - Dashboard (requires authentication and completed onboarding) */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <OnboardingRoute>
                  <Dashboard />
                </OnboardingRoute>
              </ProtectedRoute>
            }
          />

          {/* Protected route - Admin Dashboard (admin only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected route - AI Chat (requires authentication) */}
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute>
                <AIChat />
              </ProtectedRoute>
            }
          />

          {/* Protected route - Edit Profile (requires authentication) */}
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all - redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Assistant sidebar shifts layout via CSS var --assistant-offset */}
      <AssistantSidebar />
    </Router>
  );
}

export default App;