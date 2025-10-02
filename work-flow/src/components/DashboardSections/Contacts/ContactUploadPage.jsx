import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload,
  Users,
  Mail,
  Phone,
  Trash2,
  Download,
  Plus,
  X,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Custom style for the subtle light blue gradient effect
const BLUE_GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 70%, rgba(173, 216, 230, 0.5) 100%)', // White to Light Blue (LightSkyBlue)
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)'
};

// Contact upload/management page (light theme)
const ContactUploadPage = () => {
  const [uploadedContacts, setUploadedContacts] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualContact, setManualContact] = useState({
    name: '',
    email: '',
    phone: '',
    group: '', // New Group field
  });
  const [showManualForm, setShowManualForm] = useState(false);
  
  // New State for filtering/searching
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [contactSearchTerms, setContactSearchTerms] = useState({}); // { groupName: searchTerm }

  // --- Core Contact Logic (Modified) ---

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setSelectedFile(file);
      processCSV(file);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const processCSV = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        setUploadedContacts([]);
        setIsProcessing(false);
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const idx = {
        name: headers.indexOf('name'),
        email: headers.indexOf('email'),
        phone: headers.indexOf('phone'),
        group: headers.indexOf('group'), // New index for Group
      };

      const contacts = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line, index) => {
          const values = line.split(',').map((v) => v.trim());
          const get = (i, fallback = '') => (i >= 0 && i < values.length ? values[i] : fallback);
          return {
            id: Date.now() + index,
            name: get(idx.name) || values[0] || 'Unknown',
            email: get(idx.email),
            phone: get(idx.phone),
            group: get(idx.group) || 'Unassigned', // Default to Unassigned
          };
        });

      setUploadedContacts(contacts);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const addManualContact = () => {
    const { name, email, phone, group } = manualContact;
    const hasRequiredFields = name && group && (email || phone);

    if (hasRequiredFields) {
      setUploadedContacts((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...manualContact,
        },
      ]);
      setManualContact({ name: '', email: '', phone: '', group: '' });
      setShowManualForm(false);
    } else {
      alert('Please provide a name, group, and at least one contact method (email or phone).');
    }
  };

  const removeContact = (id) => {
    setUploadedContacts((prev) => prev.filter((contact) => contact.id !== id));
  };

  const downloadTemplate = () => {
    const csvContent =
      'name,email,phone,group\n' +
      'John Doe,john@example.com,+1234567890,VIP Customers\n' +
      'Jane Smith,jane@example.com,+0987654321,Lead Nurturing';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const startAutomation = async () => {
    if (uploadedContacts.length === 0) {
      alert('Please upload contacts first');
      return;
    }

    alert('Automation campaign simulation started for all uploaded contacts.');
    // The rest of the original startAutomation logic involving API calls to Messenger/IG is removed
    // as per the requirement to focus on Email/Phone/Group management.
  };

  // --- Grouping and Filtering Logic ---

  const groupedContacts = useMemo(() => {
    return uploadedContacts.reduce((acc, contact) => {
      const groupName = contact.group || 'Unassigned';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(contact);
      return acc;
    }, {});
  }, [uploadedContacts]);

  const filteredGroups = useMemo(() => {
    const term = groupSearchTerm.toLowerCase();
    return Object.keys(groupedContacts).filter(groupName => 
      groupName.toLowerCase().includes(term)
    ).sort((a, b) => a.localeCompare(b));
  }, [groupedContacts, groupSearchTerm]);

  const toggleGroupExpansion = useCallback((groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  }, []);

  const getFilteredContacts = useCallback((groupName) => {
    const searchTerm = (contactSearchTerms[groupName] || '').toLowerCase();
    const contacts = groupedContacts[groupName] || [];

    if (!searchTerm) return contacts;

    return contacts.filter(c => 
      c.name.toLowerCase().includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm) ||
      c.phone.toLowerCase().includes(searchTerm) ||
      c.group.toLowerCase().includes(searchTerm)
    );
  }, [groupedContacts, contactSearchTerms]);
  
  // --- Component Rendering ---

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Contact & Group Management</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload and organize your customer base into categorized groups to run segmented campaigns.
          </p>
        </div>

        {/* Upload Section (Gradient Applied) */}
        <div className="rounded-lg shadow p-6 mb-8 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">1. Upload Contact List</h2>
            <button
              onClick={downloadTemplate}
              className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your **CSV file** here, or
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer ml-1">
                browse
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
            </p>
            <p className="text-sm text-gray-500">
              Supports CSV with **Name, Email, Phone, Group** columns.
            </p>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-900 font-medium">✓ File uploaded: {selectedFile.name}</p>
              {isProcessing && (
                <p className="text-gray-600 text-sm mt-1">Processing contacts...</p>
              )}
            </div>
          )}
        </div>

        {/* Manual Contact Addition (Gradient Applied) */}
        <div className="rounded-lg shadow p-6 mb-8 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Add Contact Manually</h2>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              {showManualForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {showManualForm ? 'Close Form' : 'Add New Contact'}
            </button>
          </div>

          {showManualForm && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200">
              <input
                type="text"
                placeholder="Name *"
                required
                value={manualContact.name}
                onChange={(e) => setManualContact({ ...manualContact, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Group Name *"
                required
                value={manualContact.group}
                onChange={(e) => setManualContact({ ...manualContact, group: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <input
                type="email"
                placeholder="Email (or Phone)"
                value={manualContact.email}
                onChange={(e) => setManualContact({ ...manualContact, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <input
                type="tel"
                placeholder="Phone (or Email)"
                value={manualContact.phone}
                onChange={(e) => setManualContact({ ...manualContact, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={addManualContact}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Contact
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Group List & Automation Section */}
        {uploadedContacts.length > 0 && (
          <div className="rounded-lg shadow p-6 border border-gray-200" style={BLUE_GRADIENT_STYLE}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                3. Contact Groups ({filteredGroups.length})
              </h2>
              <button
                onClick={startAutomation}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                <Mail className="h-5 w-5 mr-2" />
                Start All Group Automations
              </button>
            </div>

            {/* Group Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups by name..."
                value={groupSearchTerm}
                onChange={(e) => setGroupSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Grouped Contact List */}
            <div className="space-y-4">
              {filteredGroups.map((groupName) => {
                const contactsInGroup = groupedContacts[groupName];
                const isExpanded = expandedGroups[groupName];
                const filteredContacts = getFilteredContacts(groupName);

                return (
                  <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroupExpansion(groupName)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
                    >
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900 mr-2">{groupName}</span>
                        <span className="text-sm font-medium text-gray-500">({contactsInGroup.length} contacts)</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      )}
                    </button>

                    {/* Group Content (Collapsible) */}
                    {isExpanded && (
                      <div className="p-4">
                        {/* Contact Search Bar */}
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search contact by name, email, or phone..."
                            value={contactSearchTerms[groupName] || ''}
                            onChange={(e) => setContactSearchTerms({ ...contactSearchTerms, [groupName]: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Contacts Table */}
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Phone</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredContacts.length > 0 ? (
                                        filteredContacts.map((contact) => (
                                            <tr key={contact.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{contact.email || 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{contact.phone || 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="flex gap-2 items-center">
                                                        <button
                                                            onClick={() => startAutomation()}
                                                            className="text-blue-600 hover:text-blue-700 transition-colors text-xs"
                                                            title="Start campaign for this user"
                                                        >
                                                            Start Campaign
                                                        </button>
                                                        <button
                                                            onClick={() => removeContact(contact.id)}
                                                            className="text-red-600 hover:text-red-700 transition-colors p-1"
                                                            title="Remove contact"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                                                No contacts found in this group matching the search term.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {uploadedContacts.length === 0 && !isProcessing && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts uploaded yet</h3>
            <p className="text-gray-600">Upload a CSV file or add contacts manually to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactUploadPage;