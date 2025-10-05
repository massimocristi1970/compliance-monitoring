import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Users, FileText, Settings, Calendar, Building2, User, Clock, CheckCircle, LogIn, LogOut, Package, ListChecks, Loader, Repeat, Zap } from 'lucide-react';
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
  const AUTHORIZED_ADMINS = ['massimocristi1970'];
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Date selection for operations
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Form states
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [showAddBusinessArea, setShowAddBusinessArea] = useState(false);
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Check Templates state
  const [checkTemplates, setCheckTemplates] = useState([]);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    businessArea: '',
    description: '',
    regulations: '',
    frequency: 'Monthly',
    startDate: '',
    records: 'Document',
    responsibility: ''
  });

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
    'january', 'exec_review', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  // Firebase listener to manage authentication state
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Try to restore the full user object from sessionStorage FIRST
      const storedUserData = sessionStorage.getItem('github_user');
      const storedToken = sessionStorage.getItem('github_access_token');
      
      if (storedUserData && storedToken) {
        // Rehydrate from storage
        const userData = JSON.parse(storedUserData);
        setUser(userData);
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        setIsAdmin(AUTHORIZED_ADMINS.includes(userData.login));
        console.log('User restored from sessionStorage:', userData);
      } else {
        // Fallback: user is authenticated but we lost the session data
        console.warn('User authenticated but session data missing. Please login again.');
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      
      if (typeof loadData === 'function') {
        loadData();
      }
    } else {
      // User is signed out
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  });

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
    const result = await signInWithPopup(auth, githubProvider);
    
    // Extract the token
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    // Extract the CORRECT GitHub username from the raw response
    const githubUsername = result._tokenResponse?.rawUserInfo 
      ? JSON.parse(result._tokenResponse.rawUserInfo).login 
      : result.user.displayName;
    
    // Build complete user object with correct login
    const userData = {
      login: githubUsername,
      name: result.user.displayName,
      avatar_url: result.user.photoURL,
    };
    
    // Store BOTH token and user data in sessionStorage
    if (token) {
      sessionStorage.setItem('github_access_token', token);
      sessionStorage.setItem('github_user', JSON.stringify(userData));
      setAccessToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(AUTHORIZED_ADMINS.includes(userData.login));
      console.log('Token and user saved to sessionStorage', userData);
    }
  } catch (error) {
    console.error('Firebase GitHub sign-in error:', error.message);
    alert('Authentication failed: ' + (error.message.includes('popup') ? 'Popup closed or blocked.' : error.message));
  }
};

  const logout = () => {
  // Clear session storage BEFORE signing out
  sessionStorage.removeItem('github_access_token');
  sessionStorage.removeItem('github_user');
  sessionStorage.removeItem('oauth_state');

  signOut(auth).then(() => {
    console.log('User signed out successfully.');
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  }).catch((error) => {
    console.error('Sign-out error:', error.message);
    alert('Sign-out failed: ' + error.message);
  });
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
      // Note: We don't require the accessToken here for public data, but if this were private, we would.
      // This is for initial population when the user is logged in.
      const headers = {
         'Accept': 'application/vnd.github.v3+json'
      };
      if (accessToken) {
         headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=admin-data&state=all`, {
        headers: headers
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
	  
	 // Load check templates
      const templates = await loadFromGitHubIssues('Check Templates');
      if (templates && Array.isArray(templates)) {
        setCheckTemplates(templates);
        console.log(`📋 Loaded ${templates.length} check templates`);
      } 
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleEditItem = (item, type, index) => {
    setEditingItem({ item: { ...item }, type, index });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const { type, index, item } = editingItem;
    
    switch (type) {
      case 'assignee':
        setAssignees(prev => prev.map((a, i) => i === index ? item : a));
        break;
      case 'businessArea':
        setBusinessAreas(prev => prev.map((b, i) => i === index ? item : b));
        break;
      case 'check':
        setComplianceChecks(prev => prev.map((c, i) => i === index ? item : c));
        break;
      default:
        break;
    }

    setEditingItem(null);
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
        month: months[newCheck.month - 1].toLowerCase(),
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
  
  const handleAddTemplate = () => {
    if (newTemplate.name.trim() && newTemplate.businessArea) {
      const templateId = Date.now();
      const template = {
        ...newTemplate,
        id: templateId,
        createdDate: new Date().toISOString(),
        createdBy: user ? `${user.name || user.login}` : 'Admin'
      };
      
      setCheckTemplates([...checkTemplates, template]);
      setNewTemplate({
        name: '',
        businessArea: '',
        description: '',
        regulations: '',
        frequency: 'Monthly',
        startDate: '',
        records: 'Document',
        responsibility: ''
      });
      setShowAddTemplate(false);
    }
  };

  const handleDeleteItem = (type, index) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be easily undone.')) {
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
        default:
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

      console.log('Saving check templates...');
      await saveToGitHubIssues('Check Templates', checkTemplates, ['templates']);

      setSaving(false);
      alert(`Changes saved successfully to GitHub Issues by ${user.name || user.login}!\n\nData stored in repository issues:\n• Compliance Data\n• Summary Data\n• Admin Configuration\n• Check Templates\n\nOther users will see these changes immediately.`);
      
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
    if (checkTemplates.length === 0) {
      alert('No check templates found. Please create templates in the "Check Templates" tab first.');
      return;
    }

    if (assignees.length === 0 || businessAreas.length === 0) {
      alert('Please add assignees and business areas first.');
      return;
    }

    if (!window.confirm('This will generate checks for ALL 12 months of 2025 from your templates. Continue?')) {
      return;
    }

    let allNewChecks = [];
    let checkRef = Math.max(...complianceChecks.map(c => c.checkRef || 0)) + 1;
    const year = 2025;

    // Loop through all 12 months
    for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
      const monthName = months[monthIndex - 1].toLowerCase();
      
      // Calculate which templates are due for this month
      const dueTemplates = checkTemplates.filter(template => {
        if (!template.startDate) return false;
        
        const startDate = new Date(template.startDate);
        const targetDate = new Date(year, monthIndex - 1, 1);
        
        if (targetDate < startDate) return false;
        
        switch (template.frequency) {
          case 'Monthly':
            return true;
            
          case 'Quarterly':
            const monthsSinceStart = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                     (targetDate.getMonth() - startDate.getMonth());
            return monthsSinceStart >= 0 && monthsSinceStart % 3 === 0;
            
          case 'Annually':
            return targetDate.getMonth() === startDate.getMonth() && 
                   targetDate.getFullYear() >= startDate.getFullYear();
            
          case 'Weekly':
          case 'Daily':
            return true;
            
          case 'Event-driven':
            return false;
            
          default:
            return false;
        }
      });

      // Create checks for this month
      dueTemplates.forEach(template => {
        // Check if check already exists
        const exists = complianceChecks.some(check => 
          check.businessArea === template.businessArea &&
          check.action === template.description &&
          check.monthNumber === monthIndex &&
          check.year === year
        );

        if (!exists) {
          const lastDay = new Date(year, monthIndex, 0).getDate();
          const dueDate = `${year}-${monthIndex.toString().padStart(2, '0')}-${lastDay}`;

          allNewChecks.push({
            checkRef: checkRef++,
            action: template.description,
            businessArea: template.businessArea,
            frequency: template.frequency,
            responsibility: template.responsibility || assignees[0].name,
            records: template.records,
            number: '',
            status: 'pending',
            priority: template.regulations,
            dueDate: dueDate,
            year: year,
            month: monthName,
            monthNumber: monthIndex,
            uploadDate: new Date().toISOString(),
            uploadedBy: user ? `${user.name || user.login} (Full Year Generation)` : 'System Generated',
            files: [],
            comments: `Generated from template: ${template.name}`,
            templateId: template.id
          });
        }
      });
    }

    if (allNewChecks.length > 0) {
      setComplianceChecks([...complianceChecks, ...allNewChecks]);
      alert(`Generated ${allNewChecks.length} compliance checks across all months of 2025.\n\nRemember to click "Save All Changes" to persist these checks.`);
    } else {
      alert('All template-based checks for 2025 already exist. No new checks created.');
    }
  };

  const generateChecksForSpecificMonth = () => {
    if (checkTemplates.length === 0) {
      alert('No check templates found. Please create templates in the "Check Templates" tab first.');
      return;
    }

    if (assignees.length === 0 || businessAreas.length === 0) {
      alert('Please add assignees and business areas first.');
      return;
    }

    // Calculate which templates are due for the selected month
    const dueTemplates = checkTemplates.filter(template => {
      if (!template.startDate) return false; // Skip templates without start date
      
      const startDate = new Date(template.startDate);
      const targetDate = new Date(selectedYear, selectedMonth - 1, 1);
      
      // Check if target month is before start date
      if (targetDate < startDate) return false;
      
      switch (template.frequency) {
        case 'Monthly':
          return true; // Always due
          
        case 'Quarterly':
          // Check if months match (every 3 months from start)
          const monthsSinceStart = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                   (targetDate.getMonth() - startDate.getMonth());
          return monthsSinceStart >= 0 && monthsSinceStart % 3 === 0;
          
        case 'Annually':
          // Check if same month and year >= start year
          return targetDate.getMonth() === startDate.getMonth() && 
                 targetDate.getFullYear() >= startDate.getFullYear();
          
        case 'Weekly':
        case 'Daily':
          return true; // Generate for current month
          
        case 'Event-driven':
          return false; // Manual only
          
        default:
          return false;
      }
    });

    if (dueTemplates.length === 0) {
      alert(`No templates are due for ${months[selectedMonth - 1]} ${selectedYear} based on their frequencies and start dates.`);
      return;
    }

    // Check for duplicates and create checks
    let newChecks = [];
    let skippedCount = 0;
    let checkRef = Math.max(...complianceChecks.map(c => c.checkRef || 0)) + 1;

    dueTemplates.forEach(template => {
      // Check if check already exists (duplicate detection)
      const exists = complianceChecks.some(check => 
        check.businessArea === template.businessArea &&
        check.action === template.description &&
        check.monthNumber === selectedMonth &&
        check.year === selectedYear
      );

      if (exists) {
        skippedCount++;
        return; // Skip this template
      }

      // Create new check from template
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const dueDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay}`;

      newChecks.push({
        checkRef: checkRef++,
        action: template.description,
        businessArea: template.businessArea,
        frequency: template.frequency,
        responsibility: template.responsibility || assignees[0].name,
        records: template.records,
        number: '',
        status: 'pending',
        priority: template.regulations,
        dueDate: dueDate,
        year: selectedYear,
        month: months[selectedMonth - 1].toLowerCase(),
        monthNumber: selectedMonth,
        uploadDate: new Date().toISOString(),
        uploadedBy: user ? `${user.name || user.login} (Generated from Template)` : 'System Generated',
        files: [],
        comments: `Generated from template: ${template.name}`,
        templateId: template.id
      });
    });

    if (newChecks.length > 0) {
      setComplianceChecks([...complianceChecks, ...newChecks]);
      alert(`Generated ${newChecks.length} compliance check(s) for ${months[selectedMonth - 1]} ${selectedYear}.\n${skippedCount > 0 ? `Skipped ${skippedCount} duplicate(s).` : ''}\n\nRemember to click "Save All Changes" to persist these checks.`);
    } else {
      alert(`All checks for ${months[selectedMonth - 1]} ${selectedYear} already exist. No new checks created.`);
    }
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

  // Authentication Gate - Not logged in at all
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

// Authorization Gate - Logged in but not admin
if (isAuthenticated && !isAdmin) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center">
          <Settings className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have administrator permissions.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Logged in as: <strong>{user.name}</strong> (@{user.login})
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// Full Admin Panel - Authenticated AND authorized
return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
              title="Close Panel"
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
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
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
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
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
            <TabButton id="templates" label="Check Templates" icon={ListChecks} />
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
                <h3 className="text-lg font-semibold text-gray-900">Manage Assignees ({assignees.length})</h3>
                <p className="text-sm text-gray-600 mt-1">
                  These assignees will be available for compliance checks in: <strong>{months[selectedMonth - 1]} {selectedYear}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowAddAssignee(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Assignee
              </button>
            </div>

            {/* Add Assignee Form */}
            {showAddAssignee && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <h4 className="font-medium mb-4">Add New Assignee</h4>
                <div className="grid grid-cols-5 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAssignee.name}
                    onChange={(e) => setNewAssignee({ ...newAssignee, name: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm col-span-1"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newAssignee.email}
                    onChange={(e) => setNewAssignee({ ...newAssignee, email: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm col-span-1"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g., Compliance Officer)"
                    value={newAssignee.role}
                    onChange={(e) => setNewAssignee({ ...newAssignee, role: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm col-span-1"
                  />
                  <input
                    type="text"
                    placeholder="GitHub Username"
                    value={newAssignee.githubUsername}
                    onChange={(e) => setNewAssignee({ ...newAssignee, githubUsername: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm col-span-1"
                  />
                  <div className="flex gap-2 col-span-1">
                    <button onClick={handleAddAssignee} className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
                      <Plus className="w-4 h-4" /> Save
                    </button>
                    <button onClick={() => setShowAddAssignee(false)} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 text-sm">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Assignee List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / GitHub</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignees.map((assignee, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assignee.name} <span className="text-gray-500 text-xs">(@{assignee.githubUsername})</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignee.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignee.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditItem(assignee, 'assignee', index)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('assignee', index)}
                          className="text-red-600 hover:text-red-900 p-1 ml-2"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assignees.length === 0 && <p className="text-center p-4 text-gray-500">No assignees added yet.</p>}
            </div>
          </div>
        )}

        {/* Business Areas Tab */}
        {activeTab === 'business-areas' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Business Areas ({businessAreas.length})</h3>
                <p className="text-sm text-gray-600 mt-1">
                  These areas classify checks and ensure coverage across the business.
                </p>
              </div>
              <button
                onClick={() => setShowAddBusinessArea(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Business Area
              </button>
            </div>

            {/* Add Business Area Form */}
            {showAddBusinessArea && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <h4 className="font-medium mb-4">Add New Business Area</h4>
                <div className="grid grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Name (e.g., Retail Banking)"
                    value={newBusinessArea.name}
                    onChange={(e) => setNewBusinessArea({ ...newBusinessArea, name: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm col-span-1"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Regulations (e.g., MiFID II, AML)"
                    value={newBusinessArea.regulations}
                    onChange={(e) => setNewBusinessArea({ ...newBusinessArea, regulations: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm col-span-1"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newBusinessArea.description}
                    onChange={(e) => setNewBusinessArea({ ...newBusinessArea, description: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm col-span-1"
                  />
                  <div className="flex gap-2 col-span-1 justify-end">
                    <button onClick={handleAddBusinessArea} className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
                      <Plus className="w-4 h-4" /> Save
                    </button>
                    <button onClick={() => setShowAddBusinessArea(false)} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 text-sm">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Business Areas List */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto
			border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regulations</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {businessAreas.map((area, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.regulations}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{area.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <button 
                          onClick={() => handleEditItem(area, 'businessArea', index)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('businessArea', index)}
                          className="text-red-600 hover:text-red-900 p-1 ml-2"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {businessAreas.length === 0 && <p className="text-center p-4 text-gray-500">No business areas added yet.</p>}
            </div>
          </div>
        )}

        {/* Compliance Checks Tab */}
        {activeTab === 'checks' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Compliance Checks ({complianceChecks.length} Total)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Checks displayed here are for <strong>ALL</strong> months, use the filters on the Dashboard to see only this period.
                </p>
              </div>
              <button
                onClick={() => setShowAddCheck(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Check
              </button>
            </div>
            
            {/* Add Check Form */}
            {showAddCheck && (
				<div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
					<h4 className="font-medium mb-4">Add New Check for {months[selectedMonth - 1]} {selectedYear}</h4>
					<div className="grid grid-cols-4 gap-4">
						<select
							value={newCheck.businessArea}
							onChange={(e) => {
								setNewCheck({ 
									...newCheck, 
									businessArea: e.target.value,
									action: '',
									priority: ''
								});
							}}
							className="border border-gray-300 rounded-md p-2 text-sm"
							required
						>
							<option value="">1. Select Business Area First</option>
							{businessAreas.map(area => (
								<option key={area.name} value={area.name}>{area.name}</option>
							))}
						</select>
            
						<select
							value={newCheck.action}
							onChange={(e) => setNewCheck({ ...newCheck, action: e.target.value })}
							className="border border-gray-300 rounded-md p-2 text-sm col-span-2"
							required
							disabled={!newCheck.businessArea}
						>
							<option value="">2. Select Action/Description</option>
							{newCheck.businessArea && businessAreas
								.filter(area => area.name === newCheck.businessArea)
								.map(area => (
									<option key={area.description} value={area.description}>
										{area.description}
									</option>
								))
							}
						</select>
            
						<select
							value={newCheck.responsibility}
							onChange={(e) => setNewCheck({ ...newCheck, responsibility: e.target.value })}
							className="border border-gray-300 rounded-md p-2 text-sm"
							required
						>
							<option value="">Select Responsibility</option>
							{assignees.map(a => (
								<option key={a.name} value={a.name}>{a.name}</option>
							))}
						</select>
					</div>
					<div className="grid grid-cols-5 gap-4 mt-4">
						<select
							value={newCheck.frequency}
							onChange={(e) => setNewCheck({ ...newCheck, frequency: e.target.value })}
							className="border border-gray-300 rounded-md p-2 text-sm"
						>
							{frequencies.map(f => (
								<option key={f} value={f}>{f}</option>
							))}
						</select>
            
						<select
							value={newCheck.priority}
							onChange={(e) => setNewCheck({ ...newCheck, priority: e.target.value })}
							className="border border-gray-300 rounded-md p-2 text-sm"
							disabled={!newCheck.businessArea}
						>
							<option value="">Select Regulation Type</option>
							{newCheck.businessArea && businessAreas
								.filter(area => area.name === newCheck.businessArea)
								.map(area => (
									<option key={area.regulations} value={area.regulations}>
										{area.regulations}
									</option>
								))
							}
						</select>
                        <select
                            value={newCheck.records}
                            onChange={(e) => setNewCheck({ ...newCheck, records: e.target.value })}
                            className="border border-gray-300 rounded-md p-2 text-sm"
                        >
                            <option value="Document">Document</option>
                            <option value="Review">Review</option>
                            <option value="Data Review">Data Review</option>
                            <option value="Report">Report</option>
                        </select>
                        <input
                            type="date"
                            placeholder="Due Date (optional)"
                            value={newCheck.dueDate}
                            onChange={(e) => setNewCheck({ ...newCheck, dueDate: e.target.value })}
                            className="border border-gray-300 rounded-md p-2 text-sm"
                        />
                         <div className="flex gap-2 justify-end">
                            <button onClick={handleAddCheck} className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
                                <Plus className="w-4 h-4" /> Save Check
                            </button>
                            <button onClick={() => setShowAddCheck(false)} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 text-sm">
                                <X className="w-4 h-4" /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compliance Check List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref / Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area / Assignee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period / Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status / Priority</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complianceChecks.slice().reverse().map((check, index) => {
                    const originalIndex = complianceChecks.length - 1 - index;
                    const statusClass = check.status === 'completed' ? 'text-green-600 bg-green-100' :
                                        check.status === 'overdue' ? 'text-red-600 bg-red-100' :
                                        check.status === 'due_soon' ? 'text-yellow-600 bg-yellow-100' :
                                        'text-blue-600 bg-blue-100';
                    const priorityClass = check.priority === 'High' ? 'text-red-700' :
                                          check.priority === 'Medium' ? 'text-yellow-700' :
                                          'text-gray-700';

                    return (
                      <tr key={originalIndex} className={check.monthNumber === selectedMonth && check.year === selectedYear ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <span className="font-mono text-xs text-gray-500">#{check.checkRef}</span>
                          <p className="mt-1">{check.action}</p>
                          <span className="text-xs text-gray-500">{check.frequency}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="font-medium text-gray-700">{check.businessArea}</div>
                          <div className="text-xs text-blue-600">{check.responsibility}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="font-medium text-gray-700 capitalize">{check.month} {check.year}</div>
                          <div className="text-xs">{check.dueDate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusClass}`}>
                            {check.status.replace('_', ' ')}
                          </span>
                          <div className={`text-xs mt-1 font-medium ${priorityClass}`}>{check.priority} Priority</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleEditItem(check, 'check', originalIndex)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem('check', originalIndex)}
                            className="text-red-600 hover:text-red-900 p-1 ml-2"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {complianceChecks.length === 0 && <p className="text-center p-4 text-gray-500">No compliance checks found.</p>}
            </div>
          </div>
        )}

        {/* Check Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manage Check Templates ({checkTemplates.length})</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Define template checks with frequencies. Use "Generate" in Bulk Operations to create actual checks from these templates.
                </p>
              </div>
              <button
                onClick={() => setShowAddTemplate(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Template
              </button>
            </div>

            {/* Add Template Form */}
            {showAddTemplate && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <h4 className="font-medium mb-4">Add New Check Template</h4>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Template Name (e.g., Quarterly Risk Review)"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm col-span-1"
                    required
                  />
                  <select
                    value={newTemplate.businessArea}
                    onChange={(e) => {
                      const selectedArea = businessAreas.find(area => area.name === e.target.value);
                      setNewTemplate({ 
                        ...newTemplate, 
                        businessArea: e.target.value,
                        description: selectedArea?.description || '',
                        regulations: selectedArea?.regulations || ''
                      });
                    }}
                    className="border border-gray-300 rounded-md p-2 text-sm"
                    required
                  >
                    <option value="">Select Business Area</option>
                    {businessAreas.map(area => (
                      <option key={area.name} value={area.name}>{area.name}</option>
                    ))}
                  </select>
                  <select
                    value={newTemplate.responsibility}
                    onChange={(e) => setNewTemplate({ ...newTemplate, responsibility: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm"
                  >
                    <option value="">Assign Later (Optional)</option>
                    {assignees.map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <select
                    value={newTemplate.frequency}
                    onChange={(e) => setNewTemplate({ ...newTemplate, frequency: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm"
                  >
                    {frequencies.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={newTemplate.startDate}
                    onChange={(e) => setNewTemplate({ ...newTemplate, startDate: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm"
                    required
                  />
                  <select
                    value={newTemplate.records}
                    onChange={(e) => setNewTemplate({ ...newTemplate, records: e.target.value })}
                    className="border border-gray-300 rounded-md p-2 text-sm"
                  >
                    <option value="Document">Document</option>
                    <option value="Review">Review</option>
                    <option value="Data Review">Data Review</option>
                    <option value="Report">Report</option>
                  </select>
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleAddTemplate} className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
                      <Plus className="w-4 h-4" /> Save Template
                    </button>
                    <button onClick={() => setShowAddTemplate(false)} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 text-sm">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Templates List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsibility</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checkTemplates.map((template, index) => (
                    <tr key={template.id || index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{template.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{template.businessArea}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{template.frequency}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{template.startDate || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{template.responsibility || 'Unassigned'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDeleteTemplate(index)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {checkTemplates.length === 0 && <p className="text-center p-4 text-gray-500">No check templates added yet.</p>}
            </div>
          </div>
        )}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk' && (
          <div className="grid grid-cols-3 gap-6">
            
            {/* Bulk Generation Card */}
            <div className="col-span-2">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Repeat className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Compliance Check Generation</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Quickly generate dummy or template checks for the selected period, or an entire year.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-800 mb-2">Option 1: Generate for Current Period</h4>
                    <p className="text-sm text-indigo-600 mb-3">
                      Generates a random number of checks for **{months[selectedMonth - 1]} {selectedYear}** using existing assignees and business areas.
                    </p>
                    <button
                      onClick={generateChecksForSpecificMonth}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Generate for {months[selectedMonth - 1]}
                    </button>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
					<h4 className="font-medium text-purple-800 mb-2">Option 2: Generate Full Year from Templates</h4>
					<p className="text-sm text-purple-600 mb-3">
						Creates checks for all 12 months of 2025 from your templates based on their frequencies.
					</p>
					<button
						onClick={generateBulkChecks}
						className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
					>
						<Zap className="w-4 h-4" />
						Generate Full Year from Templates
					  </button>
				  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card (Clear Data) */}
            <div className="col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (window.confirm('This will clear ALL compliance checks. Are you sure? This action cannot be reversed!')) {
                        setComplianceChecks([]);
                        alert('All compliance checks cleared! Remember to save changes to persist this to GitHub.');
                      }
                    }}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm transition-colors"
                  >
                    Clear All Checks
                  </button>
                  <button
                    onClick={() => {
                      const filtered = complianceChecks.filter(c => 
                        !(c.monthNumber === selectedMonth && c.year === selectedYear)
                      );
                      setComplianceChecks(filtered);
                      alert(`Cleared ${complianceChecks.length - filtered.length} checks for ${months[selectedMonth - 1]} ${selectedYear}. Remember to save changes!`);
                    }}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm transition-colors"
                  >
                    Clear {months[selectedMonth - 1]} {selectedYear} Checks
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Modal (Generic for Assignee/Business Area) */}
        {editingItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                <form onSubmit={handleSaveEdit} className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        Edit {editingItem.type === 'assignee' ? 'Assignee' : editingItem.type === 'businessArea' ? 'Business Area' : 'Compliance Check'}
                    </h3>
                    
                    {/* Assignee Fields */}
                    {editingItem.type === 'assignee' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    value={editingItem.item.name}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, name: e.target.value } }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={editingItem.item.email}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, email: e.target.value } }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                <input
                                    type="text"
                                    value={editingItem.item.role}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, role: e.target.value } }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">GitHub Username</label>
                                <input
                                    type="text"
                                    value={editingItem.item.githubUsername}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, githubUsername: e.target.value } }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        </>
                    )}
                    
                    {/* Business Area Fields */}
                    {editingItem.type === 'businessArea' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={editingItem.item.name}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, name: e.target.value } }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Regulations</label>
                                <input
                                    type="text"
                                    value={editingItem.item.regulations}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev.item, item: { ...prev.item, regulations: e.target.value } }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={editingItem.item.description}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, description: e.target.value } }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        </>
                    )}
                    
                    {/* Compliance Check Fields (simplified for modal) */}
                    {editingItem.type === 'check' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Action/Description</label>
                                <input
                                    type="text"
                                    value={editingItem.item.action}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, action: e.target.value } }))}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Responsibility</label>
                                    <select
                                        value={editingItem.item.responsibility}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, responsibility: e.target.value } }))}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        {assignees.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={editingItem.item.status}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev, item: { ...prev.item, status: e.target.value } }))}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 capitalize"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                        <option value="overdue">Overdue</option>
                                        <option value="due_soon">Due Soon</option>
                                        <option value="monitoring">Monitoring</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="flex items-center gap-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        )}
      </div>
    </div>
  </div>
);
};

export default AdminPanel;