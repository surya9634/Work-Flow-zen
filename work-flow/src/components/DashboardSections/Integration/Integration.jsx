import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ConnectionCard from './ConnectionCard';
import AutomationCard from './AutomationCard';
import ConnectionModal from './ConnectionModal';
import AutomationModal from './AutomationModal';
import { platforms } from '../../data/platformData';
import WhatsAppIntegrationPanel from './WhatsAppIntegrationPanel';

// Custom style for the subtle light blue gradient effect
const BLUE_GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 70%, rgba(173, 216, 230, 0.5) 100%)', // White to Light Blue (LightSkyBlue)
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
};

const FacebookAppBanner = () => {
  const [info, setInfo] = React.useState({ appId: null, appName: null, callback: null });
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/facebook/app`);
        const data = await res.json();
        if (!ignore) setInfo(data || {});
      } catch (_) {}
    })();
    return () => { ignore = true; };
  }, []);
  if (!info?.appId) return null;
  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      Using Facebook App: <span className="font-medium">{info.appName || 'Unknown'}</span> (ID: {info.appId}) · Callback: <code className="bg-white px-1 py-0.5 rounded border">{info.callback}</code>
    </div>
  );
};

const Integration = () => {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [editingConnection, setEditingConnection] = useState(null);
  const [editingAutomation, setEditingAutomation] = useState(null);

  const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

  // Load integration status (facebook/whatsapp/instagram)
  const [status, setStatus] = useState({ facebook: { connected: false }, whatsapp: { connected: false }, instagram: { connected: false } });
  React.useEffect(() => {
    let ignore = false;
    async function loadStatus() {
      try {
        const res = await fetch(`${API_BASE}/api/integrations/status`);
        const data = await res.json();
        if (!res.ok) throw new Error('Failed to load integration status');
        if (ignore) return;
        setStatus(data);
      } catch {}
    }
    loadStatus();
    return () => { ignore = true; };
  }, []);

  const handleAddConnection = (platform) => {
    if (platform === 'facebook') {
      // Kick off backend OAuth for Facebook
      window.location.href = `${API_BASE}/auth/facebook`;
      return;
    }
    if (platform === 'instagram') {
      // Direct Instagram OAuth (uses exact redirect_uri to avoid mismatch errors)
      window.location.href = 'https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1477959410285896&redirect_uri=https://work-flow-render.onrender.com/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights';
      return;
    }
    setSelectedPlatform(platform);
    setEditingConnection(null);
    setShowConnectionModal(true);
  };

  const handleEditConnection = (connection) => {
    setEditingConnection(connection);
    setSelectedPlatform(connection.platform);
    setShowConnectionModal(true);
  };

  const handleDisconnect = (connectionId) => {
    setConnectedAccounts(prev => prev.filter(acc => acc.id !== connectionId));
  };

  const handleSaveConnection = (connectionData) => {
    if (editingConnection) {
      setConnectedAccounts(prev => 
        prev.map(acc => acc.id === editingConnection.id ? { ...acc, ...connectionData } : acc)
      );
    } else {
      setConnectedAccounts(prev => [...prev, { 
        id: Date.now(), 
        ...connectionData,
        status: 'active',
        createdAt: new Date().toISOString()
      }]);
    }
    setShowConnectionModal(false);
  };

  const handleCreateAutomation = () => {
    setEditingAutomation(null);
    setShowAutomationModal(true);
  };

  const handleEditAutomation = (automation) => {
    setEditingAutomation(automation);
    setShowAutomationModal(true);
  };

  const handleToggleAutomation = (automationId) => {
    setAutomations(prev => 
      prev.map(auto => 
        auto.id === automationId ? { ...auto, active: !auto.active } : auto
      )
    );
  };

  const handleDeleteAutomation = (automationId) => {
    setAutomations(prev => prev.filter(auto => auto.id !== automationId));
  };

  const handleSaveAutomation = (automationData) => {
    if (editingAutomation) {
      setAutomations(prev => 
        prev.map(auto => auto.id === editingAutomation.id ? { ...auto, ...automationData } : auto)
      );
    } else {
      setAutomations(prev => [...prev, { 
        id: Date.now(), 
        ...automationData,
        active: true,
        createdAt: new Date().toISOString()
      }]);
    }
    setShowAutomationModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations & Automation</h1>
          <p className="text-gray-600">Connect your **social platforms** and create **AI-powered automations** for seamless audience engagement. 🚀</p>
        </div>

        {/* Connected Accounts Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Platform Connections</h2>
          </div>
          {/* FB App banner */}
          <FacebookAppBanner />

          {/* Platform Connection Buttons (Applying Gradient Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(platforms).map(([key, platform]) => {
              const Icon = platform.icon;
              const isConnected = status[key]?.connected || connectedAccounts.some(acc => acc.platform === key);
              
              return (
                <button
                  key={key}
                  onClick={() => handleAddConnection(key)}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 group text-left ${
                    isConnected 
                      ? 'border-green-400 bg-green-50 hover:border-green-600'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  style={!isConnected ? BLUE_GRADIENT_STYLE : {}} // Apply gradient to unconnected cards
                >
                  <div className="flex items-center gap-4">
                    {/* Platform Icon */}
                    <div className={`p-3 rounded-xl ${platform.color} text-white transition-colors duration-200`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{platform.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {isConnected ? 'Connected, click to add more accounts.' : 'Click to connect your account.'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </button>
              );
            })}
          </div>

          {/* Connected Account Cards (Assuming ConnectionCard accepts style and applies it internally) */}
          {connectedAccounts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedAccounts.map(connection => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onEdit={handleEditConnection}
                  onDisconnect={handleDisconnect}
                  // Pass the style prop down to apply the gradient inside ConnectionCard
                  cardStyle={BLUE_GRADIENT_STYLE} 
                />
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp Integration deep-dive panel */}
        <div className="mb-12">
          <WhatsAppIntegrationPanel />
        </div>

        {/* Automations Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">AI Automations</h2>
            <button
              onClick={handleCreateAutomation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              Create Automation
            </button>
          </div>

          {automations.length === 0 ? (
            // Automation Empty State Card (Applying Gradient Style)
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center" style={BLUE_GRADIENT_STYLE}>
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first AI automation to start engaging with your audience automatically.
                </p>
                <button
                  onClick={handleCreateAutomation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
                >
                  Create Automation
                </button>
              </div>
            </div>
          ) : (
            // Automation Cards (Assuming AutomationCard accepts style and applies it internally)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {automations.map(automation => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onToggle={handleToggleAutomation}
                  onEdit={handleEditAutomation}
                  onDelete={handleDeleteAutomation}
                  // Pass the style prop down to apply the gradient inside AutomationCard
                  cardStyle={BLUE_GRADIENT_STYLE} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showConnectionModal && (
        <ConnectionModal
          platform={selectedPlatform}
          editingConnection={editingConnection}
          onClose={() => setShowConnectionModal(false)}
          onSave={handleSaveConnection}
        />
      )}

      {showAutomationModal && (
        <AutomationModal
          editingAutomation={editingAutomation}
          connectedAccounts={connectedAccounts}
          onClose={() => setShowAutomationModal(false)}
          onSave={handleSaveAutomation}
        />
      )}
    </div>
  );
};

export default Integration;