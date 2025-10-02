import React, { useEffect, useState } from 'react';
import {
  FiActivity,
  FiClock,
  FiMessageSquare,
  FiUsers,
  FiRefreshCw,
  FiSend,
  FiInbox,
  FiTrendingUp,
  FiFilter,
  FiHeadphones,
  FiCheckCircle,
  FiStar,
  FiAlertTriangle,
  FiList
} from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

// Custom style for the subtle light blue gradient effect
const BLUE_GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 70%, rgba(173, 216, 230, 0.5) 100%)', // White to Light Blue (LightSkyBlue)
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
};

// --- MetricCard Component (MODIFIED for Blue Gradient) ---
const MetricCard = ({ title, value, change, icon, loading, changeInverted = false }) => {
  const getChangeColor = () => {
    const isPositive = change > 0;
    const effectivelyPositive = changeInverted ? !isPositive : isPositive;
    return effectivelyPositive ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = () => {
    const isPositive = change > 0;
    return isPositive ? '↗' : '↘';
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 transition-shadow duration-300 hover:shadow-lg" style={BLUE_GRADIENT_STYLE}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <h3 className="ml-2 text-sm font-medium text-gray-500">{title}</h3>
        </div>
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
        {!loading && change !== 0 && (
          <p className={`text-sm ${getChangeColor()} flex items-center mt-1`}>
            <span className="mr-1">{getChangeIcon()}</span>
            {Math.abs(change).toFixed(1)}% vs last period
          </p>
        )}
      </div>
    </div>
  );
};

// --- Top Query Ranking Component (No Change to logic) ---
const TopQueryRanking = ({ data, loading, campaignFilter }) => {
  const filteredData = campaignFilter === 'all' ? data : data.filter(item => item.campaign === campaignFilter);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center justify-between animate-pulse">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 w-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {filteredData.map((query, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 mb-1">{query.question}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{query.campaign}</span>
              <span>•</span>
              <span>{query.category}</span>
            </div>
          </div>
          <div className="flex items-center ml-4">
            <span className="inline-flex items-center justify-center w-8 h-6 text-xs font-bold text-blue-600 bg-blue-100 rounded-full">
              {query.count}
            </span>
          </div>
        </div>
      ))}
      {filteredData.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No queries found</p>
      )}
    </div>
  );
};

// --- Know Your Campaign Component (No Change to logic) ---
const KnowYourCampaign = ({ data, loading, campaignFilter }) => {
  const filteredData = campaignFilter === 'all' ? data : data.filter(item => item.campaign === campaignFilter);
  const goodActivities = filteredData.filter(item => item.type === 'good');
  const badActivities = filteredData.filter(item => item.type === 'bad');

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-2">What's Good</h4>
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-red-600 mb-2">What's Bad</h4>
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-64 overflow-y-auto pr-2">
      {/* What's Good Section */}
      <div className="h-full">
        <h4 className="text-sm font-semibold text-green-600 mb-3 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          What's Good
        </h4>
        <div className="space-y-3">
          {goodActivities.map((activity, index) => (
            <div key={`good-${index}`} className="pl-4 border-l-2 border-green-200">
              <p className="text-sm text-gray-900">{activity.description}</p>
              <div className="flex items-center mt-1 space-x-2">
                <span className="text-xs text-gray-500">{activity.campaign}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
          {goodActivities.length === 0 && (
            <p className="text-xs text-gray-400 italic pl-4">No positive insights found</p>
          )}
        </div>
      </div>

      {/* What's Bad Section */}
      <div className="h-full">
        <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          What's Bad
        </h4>
        <div className="space-y-3">
          {badActivities.map((activity, index) => (
            <div key={`bad-${index}`} className="pl-4 border-l-2 border-red-200">
              <p className="text-sm text-gray-900">{activity.description}</p>
              <div className="flex items-center mt-1 space-x-2">
                <span className="text-xs text-gray-500">{activity.campaign}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
          {badActivities.length === 0 && (
            <p className="text-xs text-gray-400 italic pl-4">No issues found</p>
          )}
        </div>
      </div>
    </div>
  );
};


const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  // Sales Tab States
  const [salesChannelFilter, setSalesChannelFilter] = useState('all');
  const [salesCampaignFilter, setSalesCampaignFilter] = useState('all');

  // Support Tab States
  const [queryRankingCampaign, setQueryRankingCampaign] = useState('all');
  const [queryStatusCampaign, setQueryStatusCampaign] = useState('all');
  const [agentChannelFilter, setAgentChannelFilter] = useState('all');
  const [agentCampaignFilter, setAgentCampaignFilter] = useState('all');

  // Survey Tab States
  const [surveyChannelFilter, setSurveyChannelFilter] = useState('all');
  const [surveyCampaignFilter, setSurveyCampaignFilter] = useState('all');
  const [campaignCompletionChannel, setCampaignCompletionChannel] = useState('all');


  const tabs = [
    { id: 'sales', label: 'Sales' },
    { id: 'support', label: 'Support' },
    { id: 'survey', label: 'Survey' },
  ];

  const campaigns = ['all', 'Summer Sale', 'Product Launch', 'Holiday Special', 'Newsletter', 'Flash Sale'];
  const channels = ['all', 'Messenger', 'WhatsApp', 'Instagram', 'Facebook'];
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Mock data for demonstration
  useEffect(() => {
    setLoading(true);

    const mockData = {
      // --- Sales Tab Data ---
      summary: {
        totalMessagesSent: 12543,
        totalMessagesReceived: 8976,
        avgResponseTime: 142,
        engagementRate: 0.73,
        messagesSentChange: 8.5,
        messagesReceivedChange: 12.3,
        responseTimeChange: -5.2,
        engagementChange: 3.1
      },
      conversionMetrics: {
        all: { sent: 12543, replied: 8976, conversions: 2450, pending: 1100 },
        'Summer Sale': { sent: 4000, replied: 3500, conversions: 1200, pending: 150 },
        'Product Launch': { sent: 3000, replied: 2000, conversions: 600, pending: 300 },
        'Holiday Special': { sent: 5543, replied: 3476, conversions: 650, pending: 650 },
      },
      platformComparison: [
        { name: 'WhatsApp', value: 45, fill: '#25D366' },
        { name: 'Instagram', value: 35, fill: '#E4405F' },
        { name: 'Facebook', value: 20, fill: '#1877F2' }
      ],
      campaignComparison: [
        { campaign: 'Summer Sale', replies: 324, engagements: 1256 },
        { campaign: 'Product Launch', replies: 287, engagements: 982 },
        { campaign: 'Holiday Special', replies: 445, engagements: 1678 },
        { campaign: 'Newsletter', replies: 156, engagements: 543 },
        { campaign: 'Flash Sale', replies: 378, engagements: 1123 }
      ],
      predictionActivities: [
        { type: 'good', description: 'High engagement rate detected in email campaigns', campaign: 'Summer Sale', time: '2 min ago' },
        { type: 'bad', description: 'Low conversion rate on mobile platform', campaign: 'Product Launch', time: '5 min ago' },
        { type: 'good', description: 'Optimal send time identified for target audience', campaign: 'Holiday Special', time: '8 min ago' },
        { type: 'bad', description: 'High unsubscribe rate in recent campaign', campaign: 'Newsletter', time: '12 min ago' },
        { type: 'good', description: 'Personalization increasing click-through rates', campaign: 'Flash Sale', time: '15 min ago' },
        { type: 'bad', description: 'Subject line performance below average', campaign: 'Summer Sale', time: '18 min ago' },
        { type: 'good', description: 'A/B test showing 25% improvement', campaign: 'Product Launch', time: '22 min ago' }
      ],

      // --- Support Tab Data ---
      supportSummary: {
        totalQueries: 2847,
        queriesResolved: 2398,
        avgResolutionTime: 4.2,
        customerSatisfaction: 0.87,
        humanInvolvement: 324,
        queriesChange: 12.5,
        resolvedChange: 15.3,
        resolutionTimeChange: -8.7,
        satisfactionChange: 2.4,
        humanInvolvementChange: 8.9,
      },
      queryStatus: [
        { name: 'Solved', value: 65, fill: '#10B981' },
        { name: 'Pending', value: 20, fill: '#F59E0B' },
        { name: 'In Progress', value: 10, fill: '#3B82F6' },
        { name: 'Left', value: 5, fill: '#EF4444' }
      ],
      channelDistribution: [
        { name: 'Messenger', value: 45, fill: '#0084FF' },
        { name: 'WhatsApp', value: 35, fill: '#25D366' },
        { name: 'Instagram', value: 20, fill: '#E4405F' }
      ],
      agentPerformance: [
        { agent: 'Sarah Chen', received: 156, solved: 142, avgTime: 3.2 },
        { agent: 'Mike Rodriguez', received: 142, solved: 128, avgTime: 4.1 },
        { agent: 'Emily Johnson', received: 189, solved: 175, avgTime: 2.8 },
        { agent: 'David Kim', received: 134, solved: 118, avgTime: 3.9 },
        { agent: 'Lisa Wang', received: 167, solved: 152, avgTime: 3.5 }
      ],
      topQueries: [
        { question: 'How do I reset my password?', count: 45, campaign: 'Summer Sale', category: 'Account' },
        { question: 'Where is my order?', count: 38, campaign: 'Product Launch', category: 'Shipping' },
        { question: 'How to cancel my subscription?', count: 32, campaign: 'Holiday Special', category: 'Billing' },
        { question: 'Product return policy?', count: 28, campaign: 'Summer Sale', category: 'Returns' },
        { question: 'How to change billing address?', count: 25, campaign: 'Newsletter', category: 'Account' },
        { question: 'Product warranty information?', count: 22, campaign: 'Product Launch', category: 'Product' },
        { question: 'How to update payment method?', count: 19, campaign: 'Flash Sale', category: 'Billing' },
        { question: 'Installation guide needed', count: 17, campaign: 'Holiday Special', category: 'Support' },
        { question: 'Discount code not working', count: 15, campaign: 'Summer Sale', category: 'Promotions' },
        { question: 'Size chart information', count: 12, campaign: 'Product Launch', category: 'Product' }
      ],

      // --- Survey Tab Data ---
      surveySummary: {
        totalMessagesSent: 4500,
        participationRate: 0.45,
        totalParticipated: 2025,
        avgSurveyTime: 125, // seconds
        messagesSentChange: 15.2,
        participationChange: 10.5,
        participatedChange: 11.0,
        avgTimeChange: -4.5,
      },
      surveyStatus: {
        all: { sent: 4500, participated: 2025, completed: 1800 },
        'WhatsApp': { sent: 2000, participated: 1000, completed: 900 },
        'Instagram': { sent: 1500, participated: 675, completed: 600 },
        'Facebook': { sent: 1000, participated: 350, completed: 300 },
      },
      surveyActivities: [
        { type: 'good', description: 'Survey completion rate hit 90% for "Product Launch" campaign.', campaign: 'Product Launch', time: '1 min ago' },
        { type: 'bad', description: 'Avg time taken for "Holiday Special" survey is too high.', campaign: 'Holiday Special', time: '3 min ago' },
        { type: 'good', description: 'High participation from WhatsApp users.', campaign: 'Summer Sale', time: '7 min ago' },
        { type: 'bad', description: 'High drop-off rate after question 3 on mobile.', campaign: 'Flash Sale', time: '10 min ago' },
      ],
      surveyCompletionByCampaign: {
        all: [
          { campaign: 'Summer Sale', completed: 75 },
          { campaign: 'Product Launch', completed: 90 },
          { campaign: 'Holiday Special', completed: 65 },
          { campaign: 'Newsletter', completed: 55 },
          { campaign: 'Flash Sale', completed: 80 },
        ],
        'WhatsApp': [
          { campaign: 'Summer Sale', completed: 80 },
          { campaign: 'Product Launch', completed: 95 },
          { campaign: 'Holiday Special', completed: 70 },
        ],
        'Instagram': [
          { campaign: 'Summer Sale', completed: 65 },
          { campaign: 'Product Launch', completed: 85 },
          { campaign: 'Holiday Special', completed: 50 },
        ]
      }
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, []); // Empty dependency array to fetch once

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '—';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const renderMetricValue = (value, isPercentage = false, suffix = '') => {
    if (loading) return <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>;
    if (value === undefined || value === null) return '—';
    if (isPercentage) return `${Math.round(value * 100)}%`;
    return formatNumber(value) + suffix;
  };

  const getConversionDataForPie = (channel, campaign) => {
    // For simplicity, we filter by campaign as per mock data structure
    const campaignKey = campaign !== 'all' ? campaign : 'all';
    const rawData = data?.conversionMetrics?.[campaignKey] || data?.conversionMetrics?.all || {};

    return [
      { name: 'Messages Sent', value: rawData.sent || 0, fill: '#3B82F6' },
      { name: 'Replied', value: rawData.replied || 0, fill: '#10B981' },
      { name: 'Conversions', value: rawData.conversions || 0, fill: '#F59E0B' },
      { name: 'Pending', value: rawData.pending || 0, fill: '#EF4444' },
    ].filter(d => d.value > 0);
  };

  const getSurveyStatusDataForPie = (channel, campaign) => {
    // For simplicity, we filter by channel as per mock data structure
    const channelKey = channel !== 'all' ? channel : 'all';
    const rawData = data?.surveyStatus?.[channelKey] || data?.surveyStatus?.all || {};

    return [
      { name: 'Messages Sent', value: rawData.sent || 0, fill: '#3B82F6' },
      { name: 'Participated', value: rawData.participated || 0, fill: '#10B981' },
      { name: 'Completed', value: rawData.completed || 0, fill: '#F59E0B' },
    ].filter(d => d.value > 0);
  };

  const getCampaignCompletionData = (channel) => {
    const channelKey = channel !== 'all' ? channel : 'all';
    return data?.surveyCompletionByCampaign?.[channelKey] || data?.surveyCompletionByCampaign?.all || [];
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Monitor your workflow performance and engagement metrics</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh data"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs - Even space added */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-1 border-b-2 font-medium text-sm text-center whitespace-nowrap transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Sales Tab Content */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'sales' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Messages Sent"
              value={renderMetricValue(data?.summary?.totalMessagesSent)}
              change={data?.summary?.messagesSentChange || 0}
              icon={<FiSend className="w-5 h-5 text-blue-500" />}
              loading={loading}
            />
            <MetricCard
              title="Total Messages Received"
              value={renderMetricValue(data?.summary?.totalMessagesReceived)}
              change={data?.summary?.messagesReceivedChange || 0}
              icon={<FiInbox className="w-5 h-5 text-green-500" />}
              loading={loading}
            />
            <MetricCard
              title="Average Response Time"
              value={data?.summary?.avgResponseTime ? `${Math.round(data.summary.avgResponseTime)}s` : '—'}
              change={data?.summary?.responseTimeChange || 0}
              changeInverted={true}
              icon={<FiClock className="w-5 h-5 text-purple-500" />}
              loading={loading}
            />
            <MetricCard
              title="Engagement Rate"
              value={renderMetricValue(data?.summary?.engagementRate, true)}
              change={data?.summary?.engagementChange || 0}
              icon={<FiTrendingUp className="w-5 h-5 text-orange-500" />}
              loading={loading}
            />
          </div>

          {/* Main Charts - Conversion Rate Pie Chart & Know Your Campaign */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Conversion Rate Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Conversation/Conversion Rate</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={salesChannelFilter}
                    onChange={(e) => setSalesChannelFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {channels.map(channel => (
                      <option key={channel} value={channel}>{channel === 'all' ? 'All Channels' : channel}</option>
                    ))}
                  </select>
                  <select
                    value={salesCampaignFilter}
                    onChange={(e) => setSalesCampaignFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getConversionDataForPie(salesChannelFilter, salesCampaignFilter)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getConversionDataForPie(salesChannelFilter, salesCampaignFilter).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [formatNumber(value), name]} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Know Your Campaign (Side-by-side inside) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Know Your Campaign</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={salesCampaignFilter}
                    onChange={(e) => setSalesCampaignFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                    ))}
                  </select>
                </div>
              </div>
              <KnowYourCampaign
                data={data?.predictionActivities || []}
                loading={loading}
                campaignFilter={salesCampaignFilter}
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Best Campaign – Replies vs Engagements</h3>
              </div>
              <div className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.campaignComparison || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="campaign"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="replies"
                        stackId="1"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                        name="Replies"
                      />
                      <Area
                        type="monotone"
                        dataKey="engagements"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                        name="Engagements"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Platform Comparison</h3>
                {/* Campaign Filter remains for context */}
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={salesCampaignFilter}
                    onChange={(e) => setSalesCampaignFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.platformComparison || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(data?.platformComparison || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Support Tab Content */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'support' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <MetricCard
              title="Query Received"
              value={renderMetricValue(data?.supportSummary?.totalQueries)}
              change={data?.supportSummary?.queriesChange || 0}
              icon={<FiHeadphones className="w-5 h-5 text-blue-500" />}
              loading={loading}
            />
            <MetricCard
              title="Query Resolved"
              value={renderMetricValue(data?.supportSummary?.queriesResolved)}
              change={data?.supportSummary?.resolvedChange || 0}
              icon={<FiCheckCircle className="w-5 h-5 text-green-500" />}
              loading={loading}
            />
            <MetricCard
              title="First Response Time"
              value={data?.supportSummary?.firstResponseTime ? `${data.supportSummary.firstResponseTime}h` : '—'}
              change={data?.supportSummary?.firstResponseTimeChange || 0}
              changeInverted={true}
              icon={<FiClock className="w-5 h-5 text-purple-500" />}
              loading={loading}
            />
            <MetricCard
              title="Customer Satisfaction Score"
              value={renderMetricValue(data?.supportSummary?.customerSatisfaction, true)}
              change={data?.supportSummary?.satisfactionChange || 0}
              icon={<FiStar className="w-5 h-5 text-orange-500" />}
              loading={loading}
            />
            
            {/* Custom card for Human Involvement - styled using BLUE_GRADIENT_STYLE */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 cursor-pointer transition-shadow duration-300 hover:shadow-lg" 
              style={BLUE_GRADIENT_STYLE}
              onClick={() => alert('Redirecting to chats section...')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiAlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="ml-2 text-sm font-medium text-gray-500">Need Human Involvement</h3>
                </div>
              </div>
              <div className="mt-2">
                {loading ? (
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{renderMetricValue(data?.supportSummary?.humanInvolvement)}</p>
                )}
                {!loading && data?.supportSummary?.humanInvolvementChange && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <span className="mr-1">↗</span>
                    {Math.abs(data.supportSummary.humanInvolvementChange).toFixed(1)}% vs last period
                  </p>
                )}
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-400">Click to view chats</p>
              </div>
            </div>
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Query Status Overview</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={queryStatusCampaign}
                    onChange={(e) => setQueryStatusCampaign(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.queryStatus || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(data?.queryStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Queries']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Query Ranking</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={queryRankingCampaign}
                    onChange={(e) => setQueryRankingCampaign(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                    ))}
                  </select>
                </div>
              </div>
              <TopQueryRanking
                data={data?.topQueries || []}
                loading={loading}
                campaignFilter={queryRankingCampaign}
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Agent Performance – Query Analytics</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <FiFilter className="w-4 h-4 text-gray-500" />
                    <select
                      value={agentChannelFilter}
                      onChange={(e) => setAgentChannelFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {channels.map(channel => (
                        <option key={channel} value={channel}>{channel === 'all' ? 'All Channels' : channel}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiFilter className="w-4 h-4 text-gray-500" />
                    <select
                      value={agentCampaignFilter}
                      onChange={(e) => setAgentCampaignFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {campaigns.map(campaign => (
                        <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.agentPerformance || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="agent"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="received"
                        fill="#3B82F6"
                        name="Queries Received"
                        animationDuration={1500}
                      />
                      <Bar
                        dataKey="solved"
                        fill="#10B981"
                        name="Queries Solved"
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgTime"
                        stroke="#EF4444"
                        strokeWidth={3}
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                        name="Avg Time (hours)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Channel Distribution</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={agentChannelFilter}
                    onChange={(e) => setAgentChannelFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {channels.map(channel => (
                      <option key={channel} value={channel}>{channel === 'all' ? 'All Channels' : channel}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.channelDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(data?.channelDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Survey Tab Content */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'survey' && (
        <>
          {/* Survey Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Messages Sent"
              value={renderMetricValue(data?.surveySummary?.totalMessagesSent)}
              change={data?.surveySummary?.messagesSentChange || 0}
              icon={<FiSend className="w-5 h-5 text-blue-500" />}
              loading={loading}
            />
            <MetricCard
              title="Participation Rate"
              value={renderMetricValue(data?.surveySummary?.participationRate, true)}
              change={data?.surveySummary?.participationChange || 0}
              icon={<FiUsers className="w-5 h-5 text-green-500" />}
              loading={loading}
            />
            <MetricCard
              title="Total Participated"
              value={renderMetricValue(data?.surveySummary?.totalParticipated)}
              change={data?.surveySummary?.participatedChange || 0}
              icon={<FiList className="w-5 h-5 text-purple-500" />}
              loading={loading}
            />
            <MetricCard
              title="Avg Survey Time Taken"
              value={data?.surveySummary?.avgSurveyTime ? `${Math.round(data.surveySummary.avgSurveyTime)}s` : '—'}
              change={data?.surveySummary?.avgTimeChange || 0}
              changeInverted={true}
              icon={<FiClock className="w-5 h-5 text-orange-500" />}
              loading={loading}
            />
          </div>

          {/* Main Charts - Survey Status Pie Chart & Know Your Campaign */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Survey Status Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Survey Status Overview</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={surveyChannelFilter}
                    onChange={(e) => setSurveyChannelFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {channels.map(channel => (
                      <option key={channel} value={channel}>{channel === 'all' ? 'All Channels' : channel}</option>
                    ))}
                  </select>
                  <select
                    value={surveyCampaignFilter}
                    onChange={(e) => setSurveyCampaignFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getSurveyStatusDataForPie(surveyChannelFilter, surveyCampaignFilter)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatNumber(value)}`}
                      >
                        {getSurveyStatusDataForPie(surveyChannelFilter, surveyCampaignFilter).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [formatNumber(value), name]} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Know Your Campaign (Side-by-Side) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Know Your Campaign Insights</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={surveyCampaignFilter}
                    onChange={(e) => setSurveyCampaignFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                    ))}
                  </select>
                </div>
              </div>
              <KnowYourCampaign
                data={data?.surveyActivities || []}
                loading={loading}
                campaignFilter={surveyCampaignFilter}
              />
            </div>
          </div>

          {/* Bottom Charts - Completion Bar Chart & Platform Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Percentage Survey Completed as per Campaigns */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Completion Rate by Campaign (%)</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={campaignCompletionChannel}
                    onChange={(e) => setCampaignCompletionChannel(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {channels.map(channel => (
                      <option key={channel} value={channel}>{channel === 'all' ? 'All Channels' : channel}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getCampaignCompletionData(campaignCompletionChannel)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="campaign"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Completed']} />
                      <Legend />
                      <Bar
                        dataKey="completed"
                        fill="#3B82F6"
                        name="Survey Completion %"
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Platform Distribution (Same as Sales Tab) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Platform Distribution</h3>
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-500" />
                  <select
                    value={surveyCampaignFilter}
                    onChange={(e) => setSurveyCampaignFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {campaigns.map(campaign => (
                      <option key={campaign} value={campaign}>{campaign === 'all' ? 'All Campaigns' : campaign}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.platformComparison || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(data?.platformComparison || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    
  );
};

export default Analytics;