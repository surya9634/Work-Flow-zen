import React, { useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  Settings,
  FileText,
  Contact2,
  Share2,
  X,
  MessagesSquare,
  LogOut,
  BarChart3,
  Users,
  Activity,
  Target,
  GitBranch,
  Menu,
} from "lucide-react";

// Import dashboard section components
import UserProfile from "../components/DashboardSections/UserProfile/UserProfile";
import Analytics from "../components/DashboardSections/Analytics/AnalyticsDashboard/Analytics";
import AIFineTuning from "../components/DashboardSections/AIFineTuning/AIFineTuning";
import Integration from "../components/DashboardSections/Integration/Integration";

import Navbar from "../components/Navbar/Navbar";
import Chats from "../components/DashboardSections/Chats/Chats";
import SignOutModal from "../components/SignOutModal";
import CampaignsDemo from "../components/CreateCampaign/CampaignsDemo";
import AICounsellor from "../components/DashboardSections/AICounsellor/AICounsellor";
import ContactUploadPage from "../components/DashboardSections/Contacts/ContactUploadPage";
import GlobalAIControl from "../components/DashboardSections/GlobalAI/GlobalAIControl";

const WorkFlowDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Users, label: "User Profile", path: "profile" },
    { icon: BarChart3, label: "Analytics", path: "analytics" },
    { icon: Settings, label: "AI Fine-Tuning", path: "ai-fine-tuning" },
    { icon: Target, label: "Campaigns", path: "campaigns" },
    { icon: GitBranch, label: "Global AI", path: "global-ai" },
    { icon: Share2, label: "Integration", path: "integration" },
    { icon: MessagesSquare, label: "Chats", path: "chats" },
    { icon: FileText, label: "AI Counsellor", path: "ai-counsellor" },
    { icon: Contact2, label: "Contacts", path: "contacts" },
  ];

  // Get active section from current path
  const getActiveSection = () => {
    const currentPath = location.pathname.split("/").pop();
    const activeItem = menuItems.find((item) => item.path === currentPath);
    return activeItem ? activeItem.label : "User Profile";
  };

  const handleSectionClick = (item) => {
    navigate(`/dashboard/${item.path}`);
    setSidebarOpen(false);
  };

  const handleSignOutClick = () => {
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    navigate("/");
  };

  const handleCancelSignOut = () => {
    setShowSignOutModal(false);
  };

  const Sidebar = () => (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm backdrop-filter bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop with hover expand, Mobile full width */}
      <div
        className={`fixed lg:static inset-y-0 left-0 bg-gradient-to-b from-blue-50 to-blue-100 shadow-xl flex flex-col z-50 
    transition-all duration-300 ease-in-out flex-shrink-0
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    ${isHovered ? "w-64" : "w-20"}
  `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between lg:justify-start overflow-hidden">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <img src="../../public/workflow-logo.png" alt="WorkFlow Logo" className="w-6 h-6" />
            </div>
            <span
              className={`text-xl font-bold text-gray-800 whitespace-nowrap transition-opacity duration-300 ${
                isHovered || sidebarOpen ? "opacity-100" : "opacity-0 lg:w-0"
              }`}
            >
              WorkFlow
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-blue-200 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item, index) => {
            const isActive = getActiveSection() === item.label;
            return (
              <div
                key={index}
                onClick={() => handleSectionClick(item)}
                className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative ${
                  isActive
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-200 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    isHovered || sidebarOpen
                      ? "opacity-100 w-auto"
                      : "opacity-0 w-0 lg:absolute lg:left-16 lg:hidden"
                  }`}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed state */}
                {!isHovered && !sidebarOpen && (
                  <div className="hidden lg:group-hover:block absolute left-full ml-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-blue-200">
          <div
            onClick={handleSignOutClick}
            className="flex items-center space-x-3 p-3 rounded-xl cursor-pointer text-red-600 hover:bg-red-50 transition-all duration-200 group relative"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={`font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                isHovered || sidebarOpen
                  ? "opacity-100 w-auto"
                  : "opacity-0 w-0 lg:absolute lg:left-16 lg:hidden"
              }`}
            >
              Sign Out
            </span>

            {/* Tooltip for collapsed state */}
            {!isHovered && !sidebarOpen && (
              <div className="hidden lg:group-hover:block absolute left-full ml-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg">
                Sign Out
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <main className="flex-1 p-2 lg:p-2 overflow-y-auto">
          {/* Content Area with Routes */}
          <Routes>
            <Route
              path="/dashboard"
              element={<Navigate to="/dashboard/profile" replace />}
            />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/campaigns" element={<CampaignsDemo />} />
            <Route path="/ai-fine-tuning" element={<AIFineTuning />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/ai-counsellor" element={<AICounsellor />} />
            <Route path="/contacts" element={<ContactUploadPage />} />
            <Route path="/global-ai" element={<GlobalAIControl />} />
            <Route
              path="*"
              element={<Navigate to="/dashboard/profile" replace />}
            />
          </Routes>
        </main>
      </div>

      {/* Sign Out Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
      />
    </div>
  );
};

export default WorkFlowDashboard;
