import React, { useState, useEffect } from 'react';
import { Calendar, Upload, FileText, CheckCircle, AlertCircle, Clock, Users, Filter, Download, MessageSquare, Eye, RefreshCw, Settings, Shield, LogIn, LogOut } from 'lucide-react';
import { 
  auth, 
  githubProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from './firebase';
import { GithubAuthProvider } from 'firebase/auth';
import AdminPanel from './AdminPanel';

const ComplianceDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResponsibility, setFilterResponsibility] = useState('all');
  const [complianceData, setComplianceData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // OAuth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [businessAreas, setBusinessAreas] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load data from JSON files
  useEffect(() => {
    loadComplianceData();
    loadSummaryData();
  }, []);

  // Firebase listener to manage authentication state (CORRECTED VERSION)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const lastSignInProvider = firebaseUser.providerData.find(
          p => p.providerId === GithubAuthProvider.PROVIDER_ID
        );
      
        const userData = {
          login: lastSignInProvider?.screenName || firebaseUser.displayName,
          name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
        };

        setUser(userData);
      
        // Retrieve token from sessionStorage
        const storedToken = sessionStorage.getItem('github_access_token');
        if (storedToken) {
          setAccessToken(storedToken);
          setIsAuthenticated(true);
          console.log('Token retrieved from sessionStorage');
        } else {
          setIsAuthenticated(false);
          console.warn('User authenticated but no token found. Please login again.');
        }

      } else {
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
       const result = await signInWithPopup(auth, githubProvider);
  
       // Extract the token directly from the sign-in result
       const credential = GithubAuthProvider.credentialFromResult(result);
       const token = credential.accessToken;
  
       // Store token in sessionStorage for persistence
       if (token) {
         sessionStorage.setItem('github_access_token', token);
         setAccessToken(token);
         console.log('Token saved to sessionStorage');
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
     }).catch((error) => {
       console.error('Sign-out error:', error.message);
       alert('Sign-out failed: ' + error.message);
     });
   };

  const fixNullCheckRefs = (data) => {
    const needsFix = data.some(check => !check.checkRef || check.checkRef === null);
  
    if (!needsFix) {
      return data; // No fixes needed
    }
  
    console.log('⚠️ Found checks with null checkRef, auto-fixing...');
  
    // Find the highest existing checkRef
    let maxRef = Math.max(
      0,
      ...data.filter(check => check.checkRef).map(check => check.checkRef)
    );
  
    // Assign new checkRefs to null entries
    const fixedData = data.map((check) => {
      if (!check.checkRef || check.checkRef === null) {
        maxRef++;
        console.log(`  Fixed check: "${check.action?.substring(0, 50)}..." -> checkRef: ${maxRef}`);
        return { ...check, checkRef: maxRef };
      }
      return check;
    });
  
    console.log(`✅ Auto-fixed ${data.filter(c => !c.checkRef).length} checks with proper checkRef values`);
  
    return fixedData;
  };
  
   const loadComplianceData = async () => {
    try {
      setLoading(true);
    
      // Load compliance checks from GitHub Issues
      const issuesData = await loadFromGitHubIssues('Compliance Data');
      if (issuesData && Array.isArray(issuesData)) {
        // Auto-fix null checkRefs
        const fixedData = fixNullCheckRefs(issuesData);
        setComplianceData(fixedData);
        console.log(`📊 Loaded ${fixedData.length} compliance checks from GitHub Issues`);
        setError(null);
      } else {
        const response = await fetch('./data/compliance-data.json');

        if (response.ok) {
          const data = await response.json();
          // Auto-fix null checkRefs
          const fixedData = fixNullCheckRefs(data);
          setComplianceData(fixedData);
          console.log(`📊 Loaded ${fixedData.length} compliance checks from JSON`);
          setError(null);
        } else {
          console.log('📄 Using sample data - no data source available');
          const sampleData = getSampleData();
          const fixedData = fixNullCheckRefs(sampleData);
          setComplianceData(fixedData);
          setError('Using sample data - authenticate to access live data');
        }
      }

      // Load admin configuration (assignees and business areas) from GitHub Issues
      const adminConfig = await loadFromGitHubIssues('Admin Configuration');
      if (adminConfig) {
        console.log('📋 Loaded admin configuration from GitHub Issues');
      
      // Update assignees if they exist in admin config
      if (adminConfig.assignees && Array.isArray(adminConfig.assignees)) {
        setAssignees(adminConfig.assignees);
        console.log(`👥 Loaded ${adminConfig.assignees.length} assignees`);
      }

      // Update business areas if they exist in admin config
      if (adminConfig.businessAreas && Array.isArray(adminConfig.businessAreas)) {
        setBusinessAreas(adminConfig.businessAreas);
        console.log(`🏢 Loaded ${adminConfig.businessAreas.length} business areas`);
      }
      }
    
    } catch (err) {
      console.warn('⚠️  Could not load data, using sample data:', err.message);
      setComplianceData(getSampleData());
      setError('Using sample data - authenticate to access live data');
    } finally {
      setLoading(false);
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

  const loadSummaryData = async () => {
    try {
      const summaryData = await loadFromGitHubIssues('Summary Data');
      if (summaryData) {
        setSummary(summaryData);
      } else {
        const response = await fetch('./data/summary.json');
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        }
      }
    } catch (err) {
      console.warn('Could not load summary data:', err.message);
    }
  };

  const getSampleData = () => [
    {
      checkRef: 1,
      businessArea: "Credit Agreements & Disclosures (CCA / CONC)",
      action: "Adequate Explanations",
      frequency: "Annually",
      number: "As needed",
      responsibility: "Massimo Cristi",
      lastReviewMonth: "Sep",
      records: "Document",
      nextReviewMonth: "Sep",
      nextReviewYear: 2026,
      status: "completed",
      completedDate: "2024-09-15",
      comments: "Review completed successfully. All explanations meet regulatory standards.",
      files: ["adequate_explanations_2024.pdf"],
      year: 2025,
      month: "september",
      monthNumber: 9
    },
    {
      checkRef: 2,
      businessArea: "Credit Agreements & Disclosures (CCA / CONC)",
      action: "Pre-contract information (PCCI)",
      frequency: "Annually",
      number: "As needed",
      responsibility: "Massimo Cristi",
      lastReviewMonth: "Sep",
      records: "Document",
      nextReviewMonth: "Sep",
      nextReviewYear: 2026,
      status: "pending",
      dueDate: "2025-09-30",
      comments: "",
      files: [],
      year: 2025,
      month: "september",
      monthNumber: 9
    }
  ];

  const responsibilities = [...new Set(complianceData.map(item => item.responsibility).filter(Boolean))];

  const filteredData = complianceData.filter(item => {
    const matchesMonth = item.monthNumber === selectedMonth;
    const matchesYear = item.year === selectedYear;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesResponsibility = filterResponsibility === 'all' || item.responsibility === filterResponsibility;
    return matchesMonth && matchesYear && matchesStatus && matchesResponsibility;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-blue-600 bg-blue-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'due_soon': return 'text-orange-600 bg-orange-50';
      case 'monitoring': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'due_soon': return <AlertCircle className="w-4 h-4" />;
      case 'monitoring': return <Eye className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const updateCheckStatus = async (checkRef, updates) => {
  setComplianceData(prev => prev.map(item => 
    item.checkRef === checkRef ? { ...item, ...updates } : item
  ));
  console.log(`📝 Updated check ${checkRef}:`, updates);
};

const saveComplianceDataToGitHub = async () => {
  if (!isAuthenticated || !accessToken) {
    alert('Please authenticate to save changes.');
    return;
  }

  const REPO_OWNER = 'massimocristi1970';
  const REPO_NAME = 'compliance-monitoring';
  
  try {
    // Find the existing Compliance Data issue
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
    const existingIssue = existingIssues.find(issue => issue.title === 'Compliance Data');

    if (!existingIssue) {
      throw new Error('Compliance Data issue not found');
    }

    // Update the issue with current compliance data
    const body = `\`\`\`json\n${JSON.stringify(complianceData, null, 2)}\n\`\`\`\n\n*Last updated: ${new Date().toISOString()}*\n*Updated by: ${user.login} (${user.name || user.login})*`;

    const updateResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${existingIssue.number}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        body,
        labels: ['admin-data', 'compliance']
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(`Failed to update issue: ${error.message}`);
    }

    console.log('✅ Compliance data saved to GitHub');
    alert('Changes saved successfully!');
  } catch (error) {
    console.error('Failed to save:', error);
    alert(`Failed to save changes: ${error.message}`);
  }
};

const handleFileUpload = async (checkRef, files) => {
  if (!isAuthenticated) {
    alert('Please authenticate with GitHub to upload files.');
    return;
  }

  setUploadingFile(true);
    
    try {
      const REPO_OWNER = 'massimocristi1970';
      const REPO_NAME = 'compliance-monitoring';
      
      const uploadedFiles = [];
      
      for (const file of Array.from(files)) {
        const base64Content = await fileToBase64(file);
        const filePath = `data/${selectedYear}/${months[selectedMonth-1].toLowerCase()}/check-${checkRef}/${file.name}`;
        
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `Upload file for compliance check #${checkRef} by ${user.login}`,
            content: base64Content,
            branch: 'main'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          uploadedFiles.push({
            name: file.name,
            url: result.content.html_url,
            downloadUrl: result.content.download_url
          });
          console.log(`✅ Uploaded: ${file.name}`);
        } else {
          const error = await response.json();
          throw new Error(`GitHub API Error: ${error.message}`);
        }
      }
      
      const updates = {
        files: [
          ...(complianceData.find(item => item.checkRef === checkRef)?.files || []), 
          ...uploadedFiles
        ],
        status: 'completed',
        completedDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
        uploadedBy: `${user.name || user.login} (OAuth)`
      };
      
      await updateCheckStatus(checkRef, updates);
      
      setUploadingFile(false);
      setShowFileUpload(false);
      
      alert(`✅ Files uploaded successfully by ${user.name || user.login}:\n${uploadedFiles.map(f => f.name).join('\n')}\n\n🔗 View files in repository at:\ndata/${selectedYear}/${months[selectedMonth-1].toLowerCase()}/check-${checkRef}/`);
      
    } catch (error) {
      setUploadingFile(false);
      console.error('Upload failed:', error);
      alert(`❌ Upload failed: ${error.message}`);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Improved FileList component
  const FileList = ({ files, checkRef }) => {
    const normalizedFiles = files?.map(file => {
      if (typeof file === 'string') {
        return { name: file, url: null, type: 'legacy' };
      }
      return file;
    }) || [];

    return (
      <div className="mt-2 space-y-1">
        {normalizedFiles.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3 text-gray-400" />
              <span>{file.name}</span>
              {file.type === 'legacy' && (
                <span className="text-xs text-gray-500 bg-gray-200 px-1 rounded">legacy</span>
              )}
            </div>
            {file.url && (
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View on GitHub →
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const stats = {
    total: filteredData.length,
    completed: filteredData.filter(item => item.status === 'completed').length,
    pending: filteredData.filter(item => item.status === 'pending').length,
    overdue: filteredData.filter(item => item.status === 'overdue').length,
    dueSoon: filteredData.filter(item => item.status === 'due_soon').length,
    monitoring: filteredData.filter(item => item.status === 'monitoring').length
  };

  const generateMonthlyReport = () => {
    const report = {
      period: `${months[selectedMonth - 1]} ${selectedYear}`,
      generatedDate: new Date().toISOString(),
      generatedBy: user ? `${user.name || user.login} (OAuth)` : 'Anonymous',
      summary: stats,
      checks: filteredData.map(check => ({
        checkRef: check.checkRef,
        action: check.action,
        status: check.status,
        responsibility: check.responsibility,
        businessArea: check.businessArea,
        comments: check.comments || 'No comments',
        filesCount: check.files?.length || 0,
        dueDate: check.dueDate,
        completedDate: check.completedDate
      })),
      completedChecks: filteredData.filter(c => c.status === 'completed'),
      outstandingChecks: filteredData.filter(c => c.status !== 'completed'),
      overallCompletionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    };
    
    console.log('📊 Monthly Report Generated:', report);
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `compliance-report-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert(`Monthly report generated and downloaded!\n\nSummary:\n- Total checks: ${stats.total}\n- Completion rate: ${report.overallCompletionRate}%\n- Overdue items: ${stats.overdue}`);
  };

  const handleAdminDataUpdate = (newData) => {
    if (newData.complianceChecks) {
      setComplianceData(newData.complianceChecks);
      console.log('📊 Admin panel updated compliance data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Compliance Monitoring Dashboard</h1>
              <p className="text-gray-600">Track and manage compliance checks with automated reporting</p>
              {error && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ⚠️ {error}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              {isAuthenticated ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-800">{user.name || user.login}</span>
                  <button
                    onClick={logout}
                    className="ml-2 text-red-600 hover:text-red-800 p-1"
                    title="Logout"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
               <button
                  onClick={login}
                  className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  <LogIn className="w-4 h-4" />
                  Login with GitHub
                </button>
              )}

              <button
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isAdminMode 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                {isAdminMode ? 'Exit Admin' : 'Admin Mode'}
              </button>
              
              {isAdminMode && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  <Settings className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
              
              <button
                onClick={loadComplianceData}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              
              <button
                onClick={generateMonthlyReport}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-800">GitHub Authentication</h3>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Login with GitHub to upload files, save changes, and access live compliance data. You can still view and generate reports without authentication.
            </p>
          </div>
        )}

        {/* Admin Notice */}
        {isAdminMode && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <h3 className="font-medium text-red-800">Admin Mode Active</h3>
            </div>
            <p className="text-red-700 text-sm mt-1">
              You can now manage assignees, business areas, and compliance checks. Click "Admin Panel" to configure the system.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="due_soon">Due Soon</option>
                <option value="monitoring">Monitoring</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Responsibility
              </label>
              <select
                value={filterResponsibility}
                onChange={(e) => setFilterResponsibility(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assignees</option>
                {responsibilities.map(person => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Due Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dueSoon}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monitoring</p>
                <p className="text-2xl font-bold text-gray-900">{stats.monitoring}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Checks Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Compliance Checks - {months[selectedMonth - 1]} {selectedYear}
              </h2>
              <div className="text-sm text-gray-500">
                {filteredData.length} checks found
                {stats.total > 0 && (
                  <span className="ml-2">
                    ({Math.round((stats.completed / stats.total) * 100)}% complete)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {filteredData.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No compliance checks found</h3>
              <p>No checks found for {months[selectedMonth - 1]} {selectedYear} with the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsibility</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((check) => (
                    <tr key={check.checkRef} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{check.checkRef}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{check.action}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{check.businessArea}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {check.responsibility}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(check.status)}`}>
                          {getStatusIcon(check.status)}
                          {check.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCheck(check)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {isAuthenticated ? (
                            <button
                              onClick={() => {
                                setSelectedCheck(check);
                                setShowFileUpload(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Upload
                            </button>
                          ) : (
                            <button
                              onClick={() => alert('Please authenticate with GitHub to upload files.')}
                              className="text-gray-400 cursor-not-allowed"
                              title="Login required"
                            >
                              Upload
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin Panel Modal */}
        {showAdminPanel && (
          <AdminPanel
            onClose={() => setShowAdminPanel(false)}
            onDataUpdate={handleAdminDataUpdate}
          />
        )}

        {/* Check Details Modal */}
        {selectedCheck && !showFileUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Check #{selectedCheck.checkRef} Details
                  </h3>
                  <button
                    onClick={() => setSelectedCheck(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Action/Check</h4>
                  <p className="text-sm text-gray-900">{selectedCheck.action}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Business Area</h4>
                    <p className="text-sm text-gray-900">{selectedCheck.businessArea}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Responsibility</h4>
                    <p className="text-sm text-gray-900">{selectedCheck.responsibility}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Uploaded Files
                  </h4>
                  {selectedCheck.files && selectedCheck.files.length > 0 ? (
                    <FileList files={selectedCheck.files} checkRef={selectedCheck.checkRef} />
                  ) : (
                    <p className="text-sm text-gray-500 italic">No files uploaded yet</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <select
                    value={selectedCheck.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
    
                      // Log for debugging
                      console.log('Changing status for check:', selectedCheck);
    
                      if (!selectedCheck.checkRef) {
                        alert('Error: Check reference is missing. Cannot update status.');
                        return;
                      }
    
                      const updates = { status: newStatus };
                      if (newStatus === 'completed') {
                        updates.completedDate = new Date().toISOString().split('T')[0];
                      }
    
                      // Update state and get the new data
                      const updatedData = complianceData.map(item => 
                        item.checkRef === selectedCheck.checkRef ? { ...item, ...updates } : item
                      );
    
                      console.log('Updated data:', updatedData.filter(item => item.checkRef === selectedCheck.checkRef));
    
                      setComplianceData(updatedData);
                      setSelectedCheck({ ...selectedCheck, ...updates });
    
                      // Save the updated data to GitHub
                      await saveComplianceDataToGitHub(updatedData);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="due_soon">Due Soon</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                  {isAuthenticated ? (
                    <button
                      onClick={() => setShowFileUpload(true)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </button>
                  ) : (
                    <button
                      onClick={() => alert('Please authenticate with GitHub to upload files.')}
                      className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Modal */}
        {showFileUpload && selectedCheck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload Files - Check #{selectedCheck.checkRef}
                  </h3>
                  <button
                    onClick={() => setShowFileUpload(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {!isAuthenticated ? (
                  <div className="text-center">
                    <LogIn className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h4>
                    <p className="text-gray-600 mb-4">
                      You need to authenticate with GitHub to upload files to the repository.
                    </p>
                    <button
                      onClick={login}
                      className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
                    >
                      Login with GitHub
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Files will be uploaded to GitHub repository by {user.name || user.login}:
                      </p>
                      <code className="text-xs bg-gray-100 p-2 rounded block">
                        data/{selectedYear}/{months[selectedMonth-1].toLowerCase()}/check-{selectedCheck.checkRef}/
                      </code>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag and drop files here, or click to select
                      </p>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(selectedCheck.checkRef, e.target.files);
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Select Files
                      </label>
                    </div>
                    
                    {uploadingFile && (
                      <div className="mt-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">Uploading to GitHub...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default ComplianceDashboard;
                