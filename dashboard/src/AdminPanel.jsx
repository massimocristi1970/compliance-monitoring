import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Users, FileText, Settings, Calendar, Building2, User, Clock, CheckCircle, LogIn, LogOut } from 'lucide-react';
import { 
  auth, 
  githubProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from './firebase';
import { GithubAuthProvider } from 'firebase/auth';

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
  
  // Date selection for operations
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

  // Firebase listener to manage authentication state (CORRECTED VERSION)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the full credential data from the last successful sign-in
        // This ensures we capture the GitHub access token.
        const lastSignInProvider = firebaseUser.providerData.find(
          p => p.providerId === GithubAuthProvider.PROVIDER_ID
        );
        const token = lastSignInProvider?.accessToken;

        // Map Firebase user data to the existing user object structure
        const userData = {
          login: lastSignInProvider?.screenName || firebaseUser.displayName,
          name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
        };

        setAccessToken(token);
        setUser(userData);
        setIsAuthenticated(true);

        // If this is the AdminPanel, run the specific loadData function
        if (typeof loadData === 'function') {
          loadData();
        }

      } else {
        // User is signed out
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  // Update newCheck month/year when selectedMonth/selectedYear changes
  useEffect(() => {
    setNewCheck(prev => ({
      ...prev,
      month: selectedMonth,
      year: selectedYear
    }));
  }, [selectedMonth, selectedYear]);

  const login = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
      // State is managed by the onAuthStateChanged listener now.
    } catch (error) {
      // Handle common errors like popup closed by user or permission denied
      console.error('Firebase GitHub sign-in error:', error.message);
      alert('Authentication failed: ' + (error.message.includes('popup') ? 'Popup closed or blocked.' : error.message));
    }
  };

  const logout = () => {
    signOut(auth).then(() => {
      console.log('User signed out successfully.');
    }).catch((error) => {
      console.error('Sign-out error:', error.message);
      alert('Sign-out failed: ' + error.message);
    });
    // Clear old session storage items just in case
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
      const adminConfig = await loadFromGitHubIssues('Admin Configuration');
      if (adminConfig) {
        if (adminConfig.assignees) setAssignees(adminConfig.assignees);
        if (adminConfig.businessAreas) setBusinessAreas(adminConfig.businessAreas);
        if (adminConfig.frequencies) setFrequencies(adminConfig.frequencies);
      }

      const complianceData = await loadFromGitHubIssues('Compliance Data');
      if (complianceData && Array.isArray(complianceData)) {
        setComplianceChecks(complianceData.map(check => ({
          ...check,
          priority: check.priority || 'Medium'
        })));
      }

      if (!adminConfig && !complianceData) {
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

      console.log('Saving compliance data...');
      await saveToGitHubIssues('Compliance Data', complianceDataToSave, ['compliance']);

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

    const monthsToGenerate = activeTab === 'bulk' && document.querySelector('#bulk-all-months')?.checked 
      ? monthNames.map((name, index) => ({ name, index: index + 1 }))
      : [{ name: monthNames[selectedMonth - 1], index: selectedMonth }];

    monthsToGenerate.forEach(({ name: month, index: monthIndex }) => {
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
                onClick={login}
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
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
            <div className="flex items-center gap-2 ml-6 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Working on: <strong>{months[selectedMonth - 1]} {selectedYear}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        
        {/* Enhanced Month/Year Selection */}
        <div className="bg-white rounded-lg border-2 border-blue-200 shadow-sm p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Target Period Selection</h3>
              </div>
              <div className="text-sm text-blue-600 font-medium">
                {complianceChecks.filter(c => c.monthNumber === selectedMonth && c.year === selectedYear).length} checks for this period
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
    
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
    
              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                <div className="text-xs text-blue-800 font-medium">
                  Working on: {months[selectedMonth - 1]} {selectedYear}
                </div>
                <div className="text-xs text-blue-600">
                  All new items assigned to this period
                </div>
              </div>
            </div>
  
            {/* Period Statistics */}
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{complianceChecks.filter(c => c.monthNumber === selectedMonth && c.year === selectedYear).length}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{complianceChecks.filter(c => c.monthNumber === selectedMonth && c.year === selectedYear && c.status === 'completed').length}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{complianceChecks.filter(c => c.monthNumber === selectedMonth && c.year === selectedYear && c.status === 'pending').length}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{complianceChecks.filter(c => c.monthNumber === selectedMonth && c.year === selectedYear && c.status === 'overdue').length}</div>
                <div className="text-xs text-gray-600">Overdue</div>
              </div>
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

        {/* Content Area - Note: Full implementation of tabs content would go here */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-600">Admin panel tabs content (Assignees, Business Areas, Checks, Bulk Operations) would be implemented here based on activeTab state.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;