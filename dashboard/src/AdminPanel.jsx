import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Users, FileText, Settings, Calendar, Building2, User, Clock, CheckCircle } from 'lucide-react';

const AdminPanel = ({ onClose, onDataUpdate }) => {
  const [activeTab, setActiveTab] = useState('assignees');
  const [assignees, setAssignees] = useState([]);
  const [businessAreas, setBusinessAreas] = useState([]);
  const [complianceChecks, setComplianceChecks] = useState([]);
  const [frequencies, setFrequencies] = useState(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Event-driven']);
  
  // Form states
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [showAddBusinessArea, setShowAddBusinessArea] = useState(false);
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form data
  const [newAssignee, setNewAssignee] = useState({ name: '', email: '', role: '', githubUsername: '' });
  const [newBusinessArea, setNewBusinessArea] = useState({ name: '', description: '', regulations: '' });
  const [newCheck, setNewCheck] = useState({
    action: '',
    businessArea: '',
    frequency: 'Monthly',
    responsibility: '',
    records: 'Document',
    number: '',
    dueDate: '',
    priority: 'Medium'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load existing assignees from dashboard data
      const response = await fetch('/compliance-monitoring/dashboard/data/compliance-data.json');
      if (response.ok) {
        const data = await response.json();
        const uniqueAssignees = [...new Set(data.map(item => item.responsibility).filter(Boolean))];
        setAssignees(uniqueAssignees.map(name => ({ 
          name, 
          email: `${name.toLowerCase().replace(' ', '.')}@company.com`,
          role: 'Compliance Officer',
          githubUsername: name.toLowerCase().replace(' ', '-')
        })));
        
        const uniqueBusinessAreas = [...new Set(data.map(item => item.businessArea).filter(Boolean))];
        setBusinessAreas(uniqueBusinessAreas.map(area => ({
          name: area,
          description: `Compliance area for ${area}`,
          regulations: area.includes('CCA') ? 'CCA, CONC' : area.includes('SMCR') ? 'SMCR, SUP' : 'Various'
        })));
        
        setComplianceChecks(data.map(check => ({
          ...check,
          priority: 'Medium'
        })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddAssignee = () => {
    if (newAssignee.name.trim()) {
      setAssignees([...assignees, { ...newAssignee, id: Date.now() }]);
      setNewAssignee({ name: '', email: '', role: '', githubUsername: '' });
      setShowAddAssignee(false);
    }
  };

  const handleAddBusinessArea = () => {
    if (newBusinessArea.name.trim()) {
      setBusinessAreas([...businessAreas, { ...newBusinessArea, id: Date.now() }]);
      setNewBusinessArea({ name: '', description: '', regulations: '' });
      setShowAddBusinessArea(false);
    }
  };

  const handleAddCheck = () => {
    if (newCheck.action.trim() && newCheck.businessArea && newCheck.responsibility) {
      const checkRef = Math.max(...complianceChecks.map(c => c.checkRef || 0)) + 1;
      const check = {
        ...newCheck,
        checkRef,
        status: 'pending',
        uploadDate: new Date().toISOString(),
        uploadedBy: 'Admin',
        files: [],
        comments: '',
        year: new Date().getFullYear(),
        month: new Date().toLocaleDateString('en-US', { month: 'long' }).toLowerCase(),
        monthNumber: new Date().getMonth() + 1
      };
      
      setComplianceChecks([...complianceChecks, check]);
      setNewCheck({
        action: '',
        businessArea: '',
        frequency: 'Monthly',
        responsibility: '',
        records: 'Document',
        number: '',
        dueDate: '',
        priority: 'Medium'
      });
      setShowAddCheck(false);
    }
  };

  const handleDeleteItem = (type, index) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      switch (type) {
        case 'assignee':
          setAssignees(assignees.filter((_, i) => i !== index));
          break;
        case 'businessArea':
          setBusinessAreas(businessAreas.filter((_, i) => i !== index));
          break;
        case 'check':
          setComplianceChecks(complianceChecks.filter((_, i) => i !== index));
          break;
      }
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Simulate saving data
      const dataToSave = {
        assignees,
        businessAreas,
        complianceChecks,
        frequencies,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Saving admin data:', dataToSave);
      
      // In a real implementation, this would save to your backend/GitHub
      alert('Changes saved successfully! In production, this would update your GitHub repository.');
      
      if (onDataUpdate) {
        onDataUpdate(dataToSave);
      }
      
    } catch (error) {
      alert('Error saving changes: ' + error.message);
    }
  };

  const generateBulkChecks = () => {
    if (assignees.length === 0 || businessAreas.length === 0) {
      alert('Please add assignees and business areas first.');
      return;
    }

    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];

    const actions = [
      'Monthly compliance review',
      'Quarterly risk assessment',
      'Annual policy update',
      'Documentation audit',
      'Customer file sampling',
      'Training records review',
      'System access review',
      'Regulatory filing',
      'Incident reporting review',
      'Data quality check'
    ];

    let newChecks = [];
    let checkRef = Math.max(...complianceChecks.map(c => c.checkRef || 0)) + 1;

    months.forEach((month, monthIndex) => {
      // Add 3-5 checks per month
      const numChecks = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numChecks; i++) {
        const assignee = assignees[Math.floor(Math.random() * assignees.length)];
        const businessArea = businessAreas[Math.floor(Math.random() * businessAreas.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
        
        const statuses = ['pending', 'completed', 'overdue', 'due_soon'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        newChecks.push({
          checkRef: checkRef++,
          action: `${action} - ${businessArea.name.split('(')[0].trim()}`,
          businessArea: businessArea.name,
          frequency,
          responsibility: assignee.name,
          records: ['Document', 'Review', 'Data Review', 'Report'][Math.floor(Math.random() * 4)],
          number: Math.floor(Math.random() * 50) + 5,
          status,
          priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
          dueDate: `2025-${(monthIndex + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
          year: 2025,
          month,
          monthNumber: monthIndex + 1,
          uploadDate: new Date().toISOString(),
          uploadedBy: 'Admin Bulk Import',
          files: status === 'completed' ? [`${month}_${checkRef}_evidence.pdf`] : [],
          comments: status === 'completed' ? `Bulk generated ${month} check completed.` : '',
          completedDate: status === 'completed' ? `2025-${(monthIndex + 1).toString().padStart(2, '0')}-15` : undefined
        });
      }
    });

    setComplianceChecks([...complianceChecks, ...newChecks]);
    alert(`Generated ${newChecks.length} compliance checks across all months!`);
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
        activeTab === id
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                Save All Changes
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            <TabButton id="assignees" label="Assignees" icon={Users} />
            <TabButton id="business-areas" label="Business Areas" icon={Building2} />
            <TabButton id="checks" label="Compliance Checks" icon={FileText} />
            <TabButton id="bulk" label="Bulk Operations" icon={Settings} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Assignees Tab */}
          {activeTab === 'assignees' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Manage Assignees</h3>
                <button
                  onClick={() => setShowAddAssignee(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Assignee
                </button>
              </div>

              {/* Add Assignee Form */}
              {showAddAssignee && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-4">Add New Assignee</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newAssignee.name}
                      onChange={(e) => setNewAssignee({ ...newAssignee, name: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newAssignee.email}
                      onChange={(e) => setNewAssignee({ ...newAssignee, email: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    />
                    <input
                      type="text"
                      placeholder="Role/Title"
                      value={newAssignee.role}
                      onChange={(e) => setNewAssignee({ ...newAssignee, role: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    />
                    <input
                      type="text"
                      placeholder="GitHub Username"
                      value={newAssignee.githubUsername}
                      onChange={(e) => setNewAssignee({ ...newAssignee, githubUsername: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddAssignee}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Add Assignee
                    </button>
                    <button
                      onClick={() => setShowAddAssignee(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Assignees List */}
              <div className="space-y-3">
                {assignees.map((assignee, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{assignee.name}</div>
                        <div className="text-sm text-gray-500">{assignee.email} • {assignee.role}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem({ type: 'assignee', index, data: assignee })}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem('assignee', index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Areas Tab */}
          {activeTab === 'business-areas' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Manage Business Areas</h3>
                <button
                  onClick={() => setShowAddBusinessArea(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Business Area
                </button>
              </div>

              {/* Add Business Area Form */}
              {showAddBusinessArea && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-4">Add New Business Area</h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Business Area Name"
                      value={newBusinessArea.name}
                      onChange={(e) => setNewBusinessArea({ ...newBusinessArea, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                    <textarea
                      placeholder="Description"
                      value={newBusinessArea.description}
                      onChange={(e) => setNewBusinessArea({ ...newBusinessArea, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 h-20"
                    />
                    <input
                      type="text"
                      placeholder="Related Regulations (e.g., CCA, CONC, SMCR)"
                      value={newBusinessArea.regulations}
                      onChange={(e) => setNewBusinessArea({ ...newBusinessArea, regulations: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddBusinessArea}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Add Business Area
                    </button>
                    <button
                      onClick={() => setShowAddBusinessArea(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Business Areas List */}
              <div className="space-y-3">
                {businessAreas.map((area, index) => (
                  <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{area.name}</div>
                          <div className="text-sm text-gray-500">{area.description}</div>
                          <div className="text-xs text-blue-600 mt-1">Regulations: {area.regulations}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem({ type: 'businessArea', index, data: area })}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('businessArea', index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Checks Tab */}
          {activeTab === 'checks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Manage Compliance Checks</h3>
                <button
                  onClick={() => setShowAddCheck(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Check
                </button>
              </div>

              {/* Add Check Form */}
              {showAddCheck && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-4">Add New Compliance Check</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Check Action/Description"
                      value={newCheck.action}
                      onChange={(e) => setNewCheck({ ...newCheck, action: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    />
                    <select
                      value={newCheck.businessArea}
                      onChange={(e) => setNewCheck({ ...newCheck, businessArea: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    >
                      <option value="">Select Business Area</option>
                      {businessAreas.map((area, index) => (
                        <option key={index} value={area.name}>{area.name}</option>
                      ))}
                    </select>
                    <select
                      value={newCheck.frequency}
                      onChange={(e) => setNewCheck({ ...newCheck, frequency: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    >
                      {frequencies.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                    <select
                      value={newCheck.responsibility}
                      onChange={(e) => setNewCheck({ ...newCheck, responsibility: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    >
                      <option value="">Select Assignee</option>
                      {assignees.map((assignee, index) => (
                        <option key={index} value={assignee.name}>{assignee.name}</option>
                      ))}
                    </select>
                    <select
                      value={newCheck.records}
                      onChange={(e) => setNewCheck({ ...newCheck, records: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    >
                      <option value="Document">Document</option>
                      <option value="Review">Review</option>
                      <option value="Data Review">Data Review</option>
                      <option value="Report">Report</option>
                      <option value="Test">Test</option>
                      <option value="Audit">Audit</option>
                    </select>
                    <select
                      value={newCheck.priority}
                      onChange={(e) => setNewCheck({ ...newCheck, priority: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Sample Size (optional)"
                      value={newCheck.number}
                      onChange={(e) => setNewCheck({ ...newCheck, number: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    />
                    <input
                      type="date"
                      placeholder="Due Date"
                      value={newCheck.dueDate}
                      onChange={(e) => setNewCheck({ ...newCheck, dueDate: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddCheck}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Add Check
                    </button>
                    <button
                      onClick={() => setShowAddCheck(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Checks List */}
              <div className="space-y-3">
                {complianceChecks.slice(0, 20).map((check, index) => (
                  <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">#{check.checkRef}: {check.action}</div>
                          <div className="text-sm text-gray-500">
                            {check.businessArea} • {check.frequency} • {check.responsibility}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Status: {check.status} • Priority: {check.priority || 'Medium'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem({ type: 'check', index, data: check })}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('check', index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {complianceChecks.length > 20 && (
                  <div className="text-center text-gray-500 py-4">
                    Showing first 20 checks. Total: {complianceChecks.length}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Operations Tab */}
          {activeTab === 'bulk' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Bulk Operations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Generate Bulk Checks</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Automatically generate compliance checks for all months using existing assignees and business areas.
                  </p>
                  <button
                    onClick={generateBulkChecks}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Generate Checks for All Months
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Current Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div>Assignees: <span className="font-medium">{assignees.length}</span></div>
                    <div>Business Areas: <span className="font-medium">{businessAreas.length}</span></div>
                    <div>Compliance Checks: <span className="font-medium">{complianceChecks.length}</span></div>
                    <div>Frequencies: <span className="font-medium">{frequencies.length}</span></div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Manage Frequencies</h4>
                  <div className="space-y-2">
                    {frequencies.map((freq, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{freq}</span>
                        <button
                          onClick={() => {
                            const newFreqs = frequencies.filter((_, i) => i !== index);
                            setFrequencies(newFreqs);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <input
                      type="text"
                      placeholder="Add new frequency"
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          setFrequencies([...frequencies, e.target.value.trim()]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Export Data</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Export your configuration and compliance data as JSON.
                  </p>
                  <button
                    onClick={() => {
                      const exportData = { assignees, businessAreas, complianceChecks, frequencies };
                      const dataStr = JSON.stringify(exportData, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const exportFileDefaultName = `compliance-config-${new Date().toISOString().split('T')[0]}.json`;
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Export Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;