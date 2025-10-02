import React, { useState, useEffect } from 'react';
import { User, Building2, Target, DollarSign, MessageSquare, Globe, Trash2, Save, X, ArrowLeft } from 'lucide-react';

const EditProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    userName: '',
    businessDescription: '',
    idealCustomer: '',
    leadSources: [],
    leadSourcesOther: '',
    dealSize: '',
    communicationPlatforms: [],
    communicationOther: '',
    leadHandling: '',
    salesGoal: '',
    customerQuestions: ['', '', ''],
    websiteLinks: '',
    urgency: ''
  });

  useEffect(() => {
    // Simulate loading profile data
    setTimeout(() => {
      // Load from localStorage or API
      const savedProfile = {
        businessName: 'Sample Business',
        userName: 'John Doe',
        businessDescription: 'We provide software solutions for small businesses',
        idealCustomer: 'Small business owners',
        leadSources: ['India', 'USA'],
        leadSourcesOther: '',
        dealSize: '₹20,000 – ₹50,000',
        communicationPlatforms: ['WhatsApp', 'Email'],
        communicationOther: '',
        leadHandling: 'Both',
        salesGoal: '₹100,000',
        customerQuestions: ['What is the pricing?', 'Do you offer support?', 'Can I get a demo?'],
        websiteLinks: 'https://example.com',
        urgency: 'Within this week'
      };
      setFormData(savedProfile);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleCustomerQuestionChange = (index, value) => {
    const newQuestions = [...formData.customerQuestions];
    newQuestions[index] = value;
    setFormData(prev => ({
      ...prev,
      customerQuestions: newQuestions
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Saving profile:', formData);
      alert('Profile updated successfully! ✅');
      setIsSaving(false);
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }
    console.log('Deleting account...');
    alert('Account deleted successfully');
    setShowDeleteModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-blue-600 text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Profile</h1>
              <p className="text-gray-600">Manage your business information and preferences</p>
            </div>
            <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center mb-6">
            <Building2 className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Business Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => handleInputChange('userName', e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                value={formData.businessDescription}
                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows="3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ideal Customer
              </label>
              <input
                type="text"
                value={formData.idealCustomer}
                onChange={(e) => handleInputChange('idealCustomer', e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Lead & Sales Information */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center mb-6">
            <Target className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Lead & Sales Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lead Sources
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Local', 'India', 'USA', 'Global'].map((option) => (
                  <label key={option} className="flex items-center p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={formData.leadSources.includes(option)}
                      onChange={(e) => handleCheckboxChange('leadSources', option, e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 text-sm">{option}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  value={formData.leadSourcesOther}
                  onChange={(e) => handleInputChange('leadSourcesOther', e.target.value)}
                  className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Other lead sources..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Average Deal Size
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['Under ₹5,000', '₹5,000 – ₹20,000', '₹20,000 – ₹50,000', '₹50,000+'].map((option) => (
                  <label key={option} className="flex items-center p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="dealSize"
                      value={option}
                      checked={formData.dealSize === option}
                      onChange={(e) => handleInputChange('dealSize', e.target.value)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-700 text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Monthly Sales Goal
              </label>
              <input
                type="text"
                value={formData.salesGoal}
                onChange={(e) => handleInputChange('salesGoal', e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., ₹50,000 or $1,000"
              />
            </div>
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center mb-6">
            <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Communication Preferences</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Communication Platforms
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['WhatsApp', 'Instagram', 'Facebook Messenger', 'Email', 'Website Chat'].map((option) => (
                  <label key={option} className="flex items-center p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={formData.communicationPlatforms.includes(option)}
                      onChange={(e) => handleCheckboxChange('communicationPlatforms', option, e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 text-sm">{option}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  value={formData.communicationOther}
                  onChange={(e) => handleInputChange('communicationOther', e.target.value)}
                  className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Other platforms..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lead Handling Preference
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['Send to my sales team', 'Let your AI agent handle it', 'Both'].map((option) => (
                  <label key={option} className="flex items-center p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="leadHandling"
                      value={option}
                      checked={formData.leadHandling === option}
                      onChange={(e) => handleInputChange('leadHandling', e.target.value)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-700 text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center mb-6">
            <Globe className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Additional Information</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top 3 Customer Questions/Objections
              </label>
              <div className="space-y-3">
                {formData.customerQuestions.map((question, index) => (
                  <input
                    key={index}
                    type="text"
                    value={question}
                    onChange={(e) => handleCustomerQuestionChange(index, e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={`Question/Objection ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website & Social Media Links
              </label>
              <input
                type="text"
                value={formData.websiteLinks}
                onChange={(e) => handleInputChange('websiteLinks', e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://yourwebsite.com or social media links"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Urgency Level
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['ASAP', 'Within this week', 'Within this month', 'Just exploring'].map((option) => (
                  <label key={option} className="flex items-center p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="urgency"
                      value={option}
                      checked={formData.urgency === option}
                      onChange={(e) => handleInputChange('urgency', e.target.value)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-700 text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Account
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center justify-center ${
              isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
            } text-white`}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Delete Account</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <p className="text-gray-700 font-medium mb-2">
                Type <span className="text-red-600 font-bold">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Type DELETE"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE'}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  deleteConfirmation === 'DELETE'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;