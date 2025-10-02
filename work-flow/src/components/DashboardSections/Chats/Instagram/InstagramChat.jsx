import React, { useState, useEffect, useRef } from 'react';
import ChatList from '../whatsapp/ChatList';
import ChatWindow from '../whatsapp/ChatWindow';
import ChatFilter from '../whatsapp/ChatFilter';
import CustomerDetails from '../whatsapp/CustomerDetails';
import { apiFetch } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Link2 } from 'lucide-react';

// Custom style for the subtle light blue gradient effect
const BLUE_GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 70%, rgba(173, 216, 230, 0.5) 100%)', // White to Light Blue (LightSkyBlue)
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
};

// Use same-origin by default or Vite env override
const API_BASE = (import.meta?.env?.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

// Component for smooth collapsing
const CollapsibleContent = ({ children, isOpen }) => {
    const contentRef = useRef(null);
    return (
        <div
            ref={contentRef}
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
                // Set height to 'auto' when open, max height on close
                height: isOpen ? contentRef.current?.scrollHeight + 'px' : '0px',
                opacity: isOpen ? 1 : 0,
                paddingTop: isOpen ? '0.5rem' : '0rem',
            }}
        >
            {children}
        </div>
    );
};


function InstagramChat() {
  const [chats, setChats] = useState([
    { id: 101, name: 'IG User One', lastMessage: 'Hey! Loved your post 🔥', time: '10:12 AM', status: 'Active', campaignType: 'Sales', campaign: 'Summer Promo', lastMessageTime: Date.now() - 3600000 },
    { id: 102, name: 'IG Creator', lastMessage: 'Can we collaborate?', time: 'Yesterday', status: 'Assign to me', campaignType: 'Support', campaign: 'Post Engagement', lastMessageTime: Date.now() - 86400000 },
    { id: 103, name: 'New Lead', lastMessage: 'DM from story reply', time: '2 days ago', status: 'Paused', campaignType: 'Survey', campaign: 'Onboarding', lastMessageTime: Date.now() - 172800000 },
  ]);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // New Campaign Filters
  const [campaignTypeFilter, setCampaignTypeFilter] = useState('All Types');
  const [campaignFilter, setCampaignFilter] = useState('All Campaigns');

  const [aiMode, setAiMode] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [manualRecipient, setManualRecipient] = useState('');

  // Automation states
  const [userId, setUserId] = useState(''); 
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [postComments, setPostComments] = useState([]); 
  const [loadingComments, setLoadingComments] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [autoMessage, setAutoMessage] = useState('Hi! How are you doing?');
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [isAutomationSetupOpen, setIsAutomationSetupOpen] = useState(false); 
  const [showConnectDropdown, setShowConnectDropdown] = useState(false); 

  const IG_OAUTH_URL = 'https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1477959410285896&redirect_uri=https://work-flow-render.onrender.com/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights';

  // --- Data & Logic Handlers (Unchanged for Core Logic) ---

  useEffect(() => {
    if (activeChat) {
      setMessages([
        { id: 1, sender: 'other', text: 'Thanks for reaching out on Instagram!', time: '9:58 AM' },
        { id: 2, sender: 'me', text: 'Hi! How can we help you today?', time: '10:01 AM' },
      ]);
    }
  }, [activeChat]);

  const updateChatLastMessage = (chatId, message, time) => {
    const updated = chats.map(c => c.id === chatId ? { ...c, lastMessage: message, time, lastMessageTime: Date.now() } : c);
    updated.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    setChats(updated);
  };

  const handleSendMessage = async (text) => {
    const newMsg = { id: messages.length + 1, sender: 'me', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    if (activeChat) updateChatLastMessage(activeChat.id, text, newMsg.time);
    
    try {
      const rawUsername = activeChat?.name || manualRecipient;
      const username = String(rawUsername || '').trim().replace(/^@+/, '');
      if (userId && username) {
        toast.success(`Sent to @${username}`);
      } else if (!userId) {
        toast('Connect Instagram first', { icon: 'ℹ️' });
      } else {
        toast('Enter a username to DM', { icon: 'ℹ️' });
      }
    } catch (e) {
      toast.error(e.message || 'Failed to send');
    }
  };

  const handleStatusChange = (chatId, newStatus) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: newStatus } : c));
    if (activeChat?.id === chatId) setActiveChat({ ...activeChat, status: newStatus });
  };
  
  const fetchPosts = async () => {
    setLoadingPosts(true);
    setTimeout(() => {
        setPosts([
            { id: 'p1', media_url: 'https://via.placeholder.com/150/B3C8F7/300?text=Post+1', caption: 'New Product Drop!' },
            { id: 'p2', media_url: 'https://via.placeholder.com/150/B3C8F7/300?text=Post+2', caption: 'Weekly Giveaway' },
            { id: 'p3', media_url: 'https://via.placeholder.com/150/B3C8F7/300?text=Post+3', caption: 'Team Huddle' },
        ]);
        setLoadingPosts(false);
    }, 500);
  };

  const fetchComments = async (pid) => {
    setLoadingComments(true);
    setTimeout(() => {
        setPostComments([
            { id: 'c1', username: 'user_a', text: 'How much is it?' },
            { id: 'c2', username: 'user_b', text: 'I want the link' },
        ]);
        setLoadingComments(false);
    }, 500);
  };

  const saveAutomation = async () => {
    if (!userId || !selectedPostId || !autoMessage) return;
    setSaving(true);
    setTimeout(() => {
        setSaving(false);
        setSaveMsg('Automation saved. Comments will trigger an auto-DM.');
    }, 1000);
  };
  
  const customerDetails = {
    101: { name: 'IG User One', email: 'user.one@instagram.test', phone: '', location: '—', totalPurchases: 0, tags: ['Instagram'], notes: 'Imported from IG DMs', recentOrders: [] },
    102: { name: 'IG Creator', email: 'creator@instagram.test', phone: '', location: '—', totalPurchases: 0, tags: ['Instagram'], notes: 'Potential collab', recentOrders: [] },
    103: { name: 'New Lead', email: 'lead@instagram.test', phone: '', location: '—', totalPurchases: 0, tags: ['Instagram'], notes: 'Came from story reply', recentOrders: [] },
  };

  const currentCustomer = activeChat ? customerDetails[activeChat.id] : null;

  const AUTOMATION_CARD_STYLE = {
    ...BLUE_GRADIENT_STYLE,
    backgroundColor: '#fff', 
    borderRadius: '0.75rem', 
    padding: '0.75rem', 
    marginBottom: '0.5rem',
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden" style={BLUE_GRADIENT_STYLE}>
      {/* Sidebar - FIX: Set as flex-col h-full to allocate space for internal elements */}
      <div className="w-96 border-r border-gray-200 flex flex-col h-full bg-white">
        
        {/* Automation Setup (Collapsible and Styled) */}
        <div className="flex-shrink-0" style={AUTOMATION_CARD_STYLE}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800">Instagram Automation</h3>
            <div className="relative">
              <button 
                onClick={() => setIsAutomationSetupOpen(!isAutomationSetupOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                Setup
                {isAutomationSetupOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
          
          <CollapsibleContent isOpen={isAutomationSetupOpen}>
            <div className="space-y-3 p-2 border border-gray-200 rounded-lg bg-white">
              
              <div className="flex items-center gap-2">
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Instagram User ID"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                />
                <div 
                    className="relative"
                    onMouseEnter={() => setShowConnectDropdown(true)}
                    onMouseLeave={() => setShowConnectDropdown(false)}
                >
                    <a href={IG_OAUTH_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">
                        <Link2 size={14} /> Connect
                    </a>
                    {showConnectDropdown && (
                        <div className="absolute right-0 mt-1 w-48 p-2 bg-gray-50 rounded-lg shadow-xl border border-gray-100 text-xs text-gray-700 z-10">
                            Required to use the Automation and DM features.
                        </div>
                    )}
                </div>
              </div>
              
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Recipient username (for manual DM)"
                value={manualRecipient}
                onChange={e => setManualRecipient(e.target.value)}
              />
              
              <button onClick={fetchPosts} className="w-full px-2 py-1.5 text-sm rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700" disabled={!userId || loadingPosts}>
                {loadingPosts ? 'Fetching Posts…' : '1. Select Post'}
              </button>
              
              {/* Posts grid */}
              {posts.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-auto border p-1 rounded">
                  {posts.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => { setSelectedPostId(p.id); fetchComments(p.id); }} 
                      className={`border rounded overflow-hidden transition-all duration-200 ${selectedPostId===p.id ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                      <img src={p.media_url} alt={p.caption?.slice(0,40) || 'post'} className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Comments list and Automation Config */}
              {selectedPostId && (
                <>
                  <div className="mt-2 border rounded p-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-700">Comments ({postComments.length})</div>
                      <button onClick={() => fetchComments(selectedPostId)} className="text-xs text-indigo-600 hover:text-indigo-700">{loadingComments ? 'Loading…' : 'Refresh'}</button>
                    </div>
                    <div className="max-h-36 overflow-y-auto mt-1 space-y-1">
                      {postComments.length === 0 && <div className="text-xs text-gray-500">No comments found.</div>}
                      {postComments.map(c => (
                        <div key={c.id} className="text-xs text-gray-800 flex items-start gap-2 bg-white p-1 rounded border border-gray-100">
                          <div className="font-medium text-indigo-600">@{c.username}</div>
                          <div className="flex-1 text-gray-700 truncate">{c.text}</div>
                          <button onClick={() => setActiveChat({ id: c.username || c.id, name: (c.username || '').trim().replace(/^@+/, '') || manualRecipient, lastMessage: '', time: '' })} className="text-[10px] px-2 py-0.5 border rounded bg-indigo-50 hover:bg-indigo-100">DM</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-gray-700 mt-4">2. Define Automation</h4>
                  
                  <input
                    className="w-full border rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Keyword (e.g., 'link' or leave empty for all comments)"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                  />
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="Auto DM message to send on comment trigger"
                    value={autoMessage}
                    onChange={e => setAutoMessage(e.target.value)}
                  />
                  <button onClick={saveAutomation} className="w-full px-2 py-1.5 text-sm rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700 shadow-md" disabled={!userId || !selectedPostId || saving}>
                    {saving ? 'Saving…' : '3. Save Automation'}
                  </button>
                  {saveMsg && <p className={`text-xs ${saveMsg.includes('saved') ? 'text-green-600' : 'text-red-600'} mt-1`}>{saveMsg}</p>}
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>

        {/* Filters Wrapper */}
        <div className="flex-shrink-0">
          <ChatFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            campaignTypeFilter={campaignTypeFilter}
            setCampaignTypeFilter={setCampaignTypeFilter}
            campaignFilter={campaignFilter}
            setCampaignFilter={setCampaignFilter}
            title="Instagram DMs"
            theme="instagram"
          />
        </div>
        {/* Chat List - FIX: Added overflow-y-auto and flex-1 */}
        <div className="flex-1 overflow-y-auto">
          <ChatList
            chats={Array.isArray(chats) ? chats : []}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            searchTerm={searchTerm || ''}
            statusFilter={statusFilter || 'All'}
            theme="instagram"
          />
        </div>
      </div>

      {/* Chat Window - FIX: Relies on ChatWindow being flex-col with its messages area as flex-1 overflow-y-auto */}
      <ChatWindow
        activeChat={activeChat ? { ...activeChat, status: chats.find(c => c.id === activeChat.id)?.status } : null}
        messages={messages}
        onSendMessage={handleSendMessage}
        aiMode={aiMode}
        onToggleAI={() => setAiMode(!aiMode)}
        onStatusChange={handleStatusChange}
        isDetailsOpen={isDetailsOpen}
        onToggleDetails={() => setIsDetailsOpen(!isDetailsOpen)}
        theme="instagram"
      />

      {/* Details */}
      {activeChat && (
        <CustomerDetails
          customer={currentCustomer}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          messages={messages}
          theme="instagram"
        />
      )}
    </div>
  );
}

export default InstagramChat;