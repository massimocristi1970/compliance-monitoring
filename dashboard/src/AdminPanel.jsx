import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Users, FileText, Settings, Calendar, Building2, User, Clock, CheckCircle, LogIn, LogOut } from 'lucide-react';

const AdminPanel = ({ onClose, onDataUpdate }) => {
  const [activeTab, setActiveTab] = useState('assignees');
  const [assignees, setAssignees] = useState([]);
  const [businessAreas, setBusinessAreas] = useState([]);
  const [complianceChecks, setComplianceChecks] = useState([]);
  const [frequencies, setFrequencies] = useState(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Event-driven']);
  
  // OAuth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  
  // Date selection for operations - this now controls ALL operations
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Form states
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [showAddBusinessArea, setShowAddBusinessArea] = useState(false);
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

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
    priority: 'Medium',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  // GitHub OAuth configuration
  const GITHUB_OAUTH = {
    CLIENT_ID: 'Ov23liBeQ6mRrc1gRYIi', // Replace with your actual client ID
    REDIRECT_URI: `${window.location.origin}/compliance-monitoring/`,
    SCOPE: 'repo',
    STATE: Math.random().toString(36).substring(2, 15)
  };

  useEffect(() => {
    // Check if user is coming back from OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
      handleOAuthCallback(code, state);
    } else {
      // Check for existing token in session storage
      const token = sessionStorage.getItem('github_access_token');
      const userData = sessionStorage.getItem('github_user');
      
      if (token && userData) {
        setAccessToken(token);
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        loadData();
      }
    }
  }, []);

  // Update newCheck month/year when selectedMonth/selectedYear changes
  useEffect(() => {
    setNewCheck(prev => ({
      ...prev,
      month: selectedMonth,
      year: selectedYear
    }));
  }, [selectedMonth, selectedYear]);

  const initiateOAuth = () => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_OAUTH.CLIENT_ID}&redirect_uri=${GITHUB_OAUTH.REDIRECT_URI}&scope=${GITHUB_OAUTH.SCOPE}&state=${GITHUB_OAUTH.STATE}`;
    
    // Store state for verification
    sessionStorage.setItem('oauth_state', GITHUB_OAUTH.STATE);
    
    // Redirect to GitHub OAuth
    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code, state) => {
    try {
      // Verify state
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid OAuth state');
      }

      // Temporary: simulate successful authentication for testing
      const simulatedToken = 'temp_token_for_testing';
      const userData = {
        login: 'test_user',
        name: 'Test User',
        avatar_url: 'https://github.com/identicons/test.png'
      };

      // Store authentication data
      setAccessToken(simulatedToken);
      setUser(userData);
      setIsAuthenticated(true);

      sessionStorage.setItem('github_access_token', simulatedToken);
      sessionStorage.setItem('github_user', JSON.stringify(userData));

      // Clean up URL and load data
      window.history.replaceState({}, document.title, window.location.pathname);
      loadData();

    } catch (error) {
      console.error('OAuth callback error:', error);
      alert('Authentication failed: ' + error.message);
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('github_access_token');
    sessionStorage.removeItem('github_user');
    sessionStorage.removeItem('oauth_state');
  };

  // Helper function to save data using OAuth token
  const saveToGitHubIssues = async (title, data, labels = []) => {
    if (!accessToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const REPO_OWNER = 'massimocristi1970';
    const REPO_NAME = 'compliance-monitoring';
    
    try {
      // First, check if an issue with this title already exists
      const searchResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=admin-data&state=all`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Failed to search issues: ${searchResponse.statusText}`);
      }

      const existingIssues = await searchResponse.json();
      const existingIssue = existingIssues.find(issue => issue.title === title);

      const body = `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n*Last updated: ${new Date().toISOString()}*\n*Updated by: ${user.login} (${user.name || user.login})*`;

      if (existingIssue) {
        // Update existing issue
        const updateResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${existingIssue.number}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            title,
            body,
            labels: ['admin-data', ...labels]
          })
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          throw new Error(`Failed to update issue: ${error.message}`);
        }

        console.log(`Updated issue: ${title}`);
        return await updateResponse.json();
      } else {
        // Create new issue
        const createResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            title,
            body,
            labels: ['admin-data', ...labels]
          })
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(`Failed to create issue: ${error.message}`);
        }

        console.log(`Created new issue: ${title}`);
        return await createResponse.json();
      }
    } catch (error) {
      console.error(`Failed to save ${title}:`, error);
      throw error;
    }
  };

  // Helper function to load data from GitHub Issues (public access)
  const loadFromGitHubIssues = async (title) => {
    const REPO_OWNER = 'massimocristi1970';
    const REPO_NAME = 'compliance-monitoring';
    
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=admin-data&state=all`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load issues: ${response.statusText}`);
      }

      const issues = await response.json();
      const issue = issues.find(issue => issue.title === title);

      if (issue) {
        // Extract JSON from the issue body
        const jsonMatch = issue.body.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to load ${title}:`, error);
      return null;
    }
  };

  const loadData = async () => {
    try {
      // Load admin configuration from Issues first
      const adminConfig = await loadFromGitHubIssues('Admin Configuration');
      if (adminConfig) {
        if (adminConfig.assignees) setAssignees(adminConfig.assignees);
        if (adminConfig.businessAreas) setBusinessAreas(adminConfig.businessAreas);
        if (adminConfig.frequencies) setFrequencies(adminConfig.frequencies);
      }

      // Load compliance data from Issues
      const complianceData = await loadFromGitHubIssues('Compliance Data');
      if (complianceData && Array.isArray(complianceData)) {
        setComplianceChecks(complianceData.map(check => ({
          ...check,
          priority: check.priority || 'Medium'
        })));
      }

      // Fallback to original JSON loading if Issues data not available
      if (!adminConfig && !complianceData) {
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
            priority: check.priority || 'Medium'
          })));
        }

        // Try to load admin configuration from JSON as fallback
        try {
          const adminResponse = await fetch('/compliance-monitoring/dashboard/data/admin-config.json');
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            if (adminData.assignees) setAssignees(adminData.assignees);
            if (adminData.businessAreas) setBusinessAreas(adminData.businessAreas);
            if (adminData.frequencies) setFrequencies(adminData.frequencies);
          }
        } catch (e) {
          console.log('Admin config not found, using defaults');
        }
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
      
      // Generate due date based on selected month/year if not provided
      let dueDate = newCheck.dueDate;
      if (!dueDate) {
        const lastDay = new Date(newCheck.year, newCheck.month, 0).getDate();
        dueDate = `${newCheck.year}-${newCheck.month.toString().padStart(2, '0')}-${lastDay}`;
      }
      
      const check = {
        ...newCheck,
        checkRef,
        status: 'pending',
        uploadDate: new Date().toISOString(),
        uploadedBy: user ? `${user.name || user.login} (via OAuth)` : 'Admin',
        files: [],
        comments: '',
        year: parseInt(newCheck.year),
        month: monthNames[newCheck.month - 1],
        monthNumber: parseInt(newCheck.month),
        dueDate
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
        priority: 'Medium',
        month: selectedMonth,
        year: selectedYear
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
    if (!isAuthenticated) {
      alert('Please login with GitHub to save changes.');
      return;
    }

    if (saving) return;
    
    setSaving(true);
    
    try {
      // Prepare the compliance data for saving
      const complianceDataToSave = complianceChecks.map(check => ({
        checkRef: check.checkRef,
        action: check.action,
        businessArea: check.businessArea,
        frequency: check.frequency,
        responsibility: check.responsibility,
        records: check.records,
        number: check.number,
        status: check.status,
        priority: check.priority,
        dueDate: check.dueDate,
        year: check.year,
        month: check.month,
        monthNumber: check.monthNumber,
        uploadDate: check.uploadDate,
        uploadedBy: check.uploadedBy,
        files: check.files || [],
        comments: check.comments || '',
        completedDate: check.completedDate
      }));

      // Save compliance data
      console.log('Saving compliance data...');
      await saveToGitHubIssues('Compliance Data', complianceDataToSave, ['compliance']);

      // Create and save summary data
      const stats = {
        total: complianceChecks.length,
        completed: complianceChecks.filter(item => item.status === 'completed').length,
        pending: complianceChecks.filter(item => item.status === 'pending').length,
        overdue: complianceChecks.filter(item => item.status === 'overdue').length,
        dueSoon: complianceChecks.filter(item => item.status === 'due_soon').length,
        monitoring: complianceChecks.filter(item => item.status === 'monitoring').length
      };

      const summaryData = {
        lastUpdated: new Date().toISOString(),
        totalChecks: stats.total,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        statistics: stats,
        assignees: assignees.length,
        businessAreas: businessAreas.length,
        frequencies: frequencies.length
      };

      console.log('Saving summary data...');
      await saveToGitHubIssues('Summary Data', summaryData, ['summary']);

      // Save admin configuration
      const adminConfig = {
        assignees,
        businessAreas,
        frequencies,
        lastUpdated: new Date().toISOString(),
        updatedBy: `${user.name || user.login} (OAuth)`
      };

      console.log('Saving admin configuration...');
      await saveToGitHubIssues('Admin Configuration', adminConfig, ['config']);

      setSaving(false);
      alert(`Changes saved successfully to GitHub Issues by ${user.name || user.login}!\n\nData stored in repository issues:\n• Compliance Data\n• Summary Data\n• Admin Configuration\n\nOther users will see these changes immediately.`);
      
      if (onDataUpdate) {
        onDataUpdate({
          assignees,
          businessAreas,
          complianceChecks,
          frequencies,
          lastUpdated: new Date().toISOString()
        });
      }
      
    } catch (error) {
      setSaving(false);
      console.error('Error saving to GitHub Issues:', error);
      alert('Error saving changes: ' + error.message);
    }
  };

  const generateBulkChecks = () => {
    if (assignees.length === 0 || businessAreas.length === 0) {
      alert('Please add assignees and business areas first.');
      return;
    }

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

    // Generate for selected month/year or all months
    const monthsToGenerate = activeTab === 'bulk' && document.querySelector('#bulk-all-months')?.checked 
      ? monthNames.map((name, index) => ({ name, index: index + 1 }))
      : [{ name: monthNames[selectedMonth - 1], index: selectedMonth }];

    monthsToGenerate.forEach(({ name: month, index: monthIndex }) => {
      // Add 3-5 checks per month
      const numChecks = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numChecks; i++) {
        const assignee = assignees[Math.floor(Math.random() * assignees.length)];
        const businessArea = businessAreas[Math.floor(Math.random() * businessAreas.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
        
        const statuses = ['pending', 'completed', 'overdue', 'due_soon'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const yearToUse = monthsToGenerate.length === 1 ? selectedYear : 2025;
        
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
          dueDate: `${yearToUse}-${monthIndex.toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
          year: yearToUse,
          month,
          monthNumber: monthIndex,
          uploadDate: new Date().toISOString(),
          uploadedBy: user ? `${user.name || user.login} (Bulk Import via OAuth)` : 'Admin Bulk Import',
          files: status === 'completed' ? [`${month}_${checkRef}_evidence.pdf`] : [],
          comments: status === 'completed' ? `Bulk generated ${month} check completed.` : '',
          completedDate: status === 'completed' ? `${yearToUse}-${monthIndex.toString().padStart(2, '0')}-15` : undefined
        });
      }
    });

    setComplianceChecks([...complianceChecks, ...newChecks]);
    alert(`Generated ${newChecks.length} compliance checks for ${monthsToGenerate.length === 1 ? months[selectedMonth - 1] + ' ' + selectedYear : 'all months'}!`);
  };

  const generateChecksForSpecificMonth = () => {
    if (assignees.length === 0 || businessAreas.length === 0) {
      alert('Please add assignees and business areas first.');
      return;
    }

    const actions = [
      'Monthly compliance review',
      'Quarterly risk assessment',
      'Documentation audit',
      'Customer file sampling',
      'Training records review',
      'System access review',
      'Regulatory filing review',
      'Policy compliance check'
    ];

    const numChecks = parseInt(prompt('How many checks would you like to generate for ' + months[selectedMonth - 1] + ' ' + selectedYear + '?', '5') || '5');
    
    let newChecks = [];
    let checkRef = Math.max(...complianceChecks.map(c => c.checkRef || 0)) + 1;

    for (let i = 0; i < numChecks; i++) {
      const assignee = assignees[Math.floor(Math.random() * assignees.length)];
      const businessArea = businessAreas[Math.floor(Math.random() * businessAreas.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
      
      newChecks.push({
        checkRef: checkRef++,
        action: `${action} - ${businessArea.name.split('(')[0].trim()}`,
        businessArea: businessArea.name,
        frequency,
        responsibility: assignee.name,
        records: ['Document', 'Review', 'Data Review', 'Report'][Math.floor(Math.random() * 4)],
        number: Math.floor(Math.random() * 50) + 5,
        status: 'pending',
        priority: 'Medium',
        dueDate: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
        year: selectedYear,
        month: monthNames[selectedMonth - 1],
        monthNumber: selectedMonth,
        uploadDate: new Date().toISOString(),
        uploadedBy: user ? `${user.name || user.login} (OAuth)` : 'Admin',
        files: [],
        comments: '',
        completedDate: undefined
      });
    }

    setComplianceChecks([...complianceChecks, ...newChecks]);
    alert(`Generated ${numChecks} compliance checks for ${months[selectedMonth - 1]} ${selectedYear}!`);
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

  // Authentication Gate
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
          <div className="text-center">
            <Settings className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h2>
            <p className="text-gray-600 mb-6">
              Authentication required to manage compliance data safely.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={initiateOAuth}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Login with GitHub
              </button>
              
              <button
                onClick={onClose}
                className="w-full text-gray-500 hover:text-gray-700 px-6 py-2"
              >
                Cancel
              </button>
            </div>
            
            <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-4 rounded-lg">
              <div className="font-medium mb-2">Why GitHub Authentication?</div>
              <div className="text-left space-y-1">
                <div>• Secure access to your compliance repository</div>
                <div>• Changes are tracked with your GitHub identity</div>  
                <div>• No hardcoded tokens that get revoked</div>
                <div>• Standard OAuth security practices</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
            <div className="flex-1 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded">
              <strong>Active Period:</strong> All new compliance checks will be assigned to <strong>{months[selectedMonth - 1]} {selectedYear}</strong>
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Assignees</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    These assignees will be available for compliance checks in: <strong>{months[selectedMonth - 1]} {selectedYear}</strong>
                  </p>
                </div>
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Business Areas</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    These business areas will be available for compliance checks in: <strong>{months[selectedMonth - 1]} {selectedYear}</strong>
                  </p>
                </div>
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Compliance Checks</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Adding checks for: <strong>{months[selectedMonth - 1]} {selectedYear}</strong>
                  </p>
                </div>
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
                  <h4 className="font-medium mb-4">Add New Compliance Check for {months[selectedMonth - 1]} {selectedYear}</h4>
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
                      placeholder="Due Date (auto-generated if empty)"
                      value={newCheck.dueDate}
                      onChange={(e) => setNewCheck({ ...newCheck, dueDate: e.target.value })}
                      className="border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Assignment Details:</strong>
                      <div className="mt-1">
                        • Month: {months[newCheck.month - 1]}
                        • Year: {newCheck.year}
                        • Due Date: {newCheck.dueDate || `Auto-generated (end of ${months[newCheck.month - 1]})`}
                      </div>
                    </div>
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
                            Status: {check.status} • Priority: {check.priority || 'Medium'} • 
                            {check.month && ` Month: ${check.month.charAt(0).toUpperCase() + check.month.slice(1)}`}
                            {check.year && ` ${check.year}`}
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
                  <h4 className="font-medium text-gray-900 mb-4">Generate Checks for Selected Month</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate compliance checks specifically for <strong>{months[selectedMonth - 1]} {selectedYear}</strong>
                  </p>
                  <button
                    onClick={generateChecksForSpecificMonth}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Generate for {months[selectedMonth - 1]} {selectedYear}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Generate Bulk Checks</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate compliance checks for all months using existing assignees and business areas.
                  </p>
                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="bulk-all-months"
                        className="rounded"
                      />
                      <span className="text-sm">Generate for all 12 months</span>
                    </label>
                  </div>
                  <button
                    onClick={generateBulkChecks}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Generate Bulk Checks
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
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600">
                      Selected Period: <span className="font-medium">{months[selectedMonth - 1]} {selectedYear}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Checks for this period: {complianceChecks.filter(c => c.monthNumber === selectedMonth && c.year === selectedYear).length}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Export Data</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Export your configuration and compliance data as JSON.
                  </p>
                  <button
                    onClick={() => {
                      const exportData = { 
                        assignees, 
                        businessAreas, 
                        complianceChecks: complianceChecks.filter(c => 
                          c.monthNumber === selectedMonth && c.year === selectedYear
                        ), 
                        frequencies,
                        exportPeriod: `${months[selectedMonth - 1]} ${selectedYear}`
                      };
                      const dataStr = JSON.stringify(exportData, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const exportFileDefaultName = `compliance-config-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.json`;
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-2"
                  >
                    Export Selected Month
                  </button>
                  <button
                    onClick={() => {
                      const exportData = { assignees, businessAreas, complianceChecks, frequencies };
                      const dataStr = JSON.stringify(exportData, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const exportFileDefaultName = `compliance-config-all-${new Date().toISOString().split('T')[0]}.json`;
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Export All Data
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Manage Frequencies</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {frequencies.map((freq, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{freq}</span>
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
                  <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (window.confirm('This will clear ALL compliance checks. Are you sure?')) {
                          setComplianceChecks([]);
                          alert('All compliance checks cleared!');
                        }
                      }}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      Clear All Checks
                    </button>
                    <button
                      onClick={() => {
                        const filtered = complianceChecks.filter(c => 
                          !(c.monthNumber === selectedMonth && c.year === selectedYear)
                        );
                        setComplianceChecks(filtered);
                        alert(`Cleared checks for ${months[selectedMonth - 1]} ${selectedYear}`);
                      }}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm"
                    >
                      Clear {months[selectedMonth - 1]} {selectedYear}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
              <div className="flex items-center gap-2 ml-6 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Working on: <strong>{months[selectedMonth - 1]} {selectedYear}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.name || user.login}</span>
                <button
                  onClick={logout}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Month/Year Selection - Enhanced */}
          <div className="flex items-center gap-4 mt-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Target Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center