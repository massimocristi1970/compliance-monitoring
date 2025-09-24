import React, { useState, useEffect } from 'react';
import { Calendar, Upload, FileText, CheckCircle, AlertCircle, Clock, Users, Filter, Download, MessageSquare, Eye, RefreshCw, Settings, Shield } from 'lucide-react';
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Load data from JSON files
  useEffect(() => {
    loadComplianceData();
    loadSummaryData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from the data file
      const response = await fetch('/compliance-monitoring/dashboard/data/compliance-data.json');
      
      if (response.ok) {
        const data = await response.json();
        setComplianceData(data);
        console.log(`📊 Loaded ${data.length} compliance checks from JSON`);
      } else {
        // Fallback to sample data if file doesn't exist
        console.log('📄 Using sample data - run sync script to load real data');
        setComplianceData(getSampleData());
      }
      
      setError(null);
    } catch (err) {
      console.warn('⚠️  Could not load data file, using sample data:', err.message);
      setComplianceData(getSampleData());
      setError('Using sample data - run sync script to load real data');
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryData = async () => {
    try {
      const response = await fetch('/compliance-monitoring/dashboard/data/summary.json');
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
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

  // Get unique responsibilities for filter
  const responsibilities = [...new Set(complianceData.map(item => item.responsibility).filter(Boolean))];

  // Filter data by selected criteria
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
    // Update local state immediately
    setComplianceData(prev => prev.map(item => 
      item.checkRef === checkRef ? { ...item, ...updates } : item
    ));

    console.log(`📝 Updated check ${checkRef}:`, updates);
    
    // Simulate API call
    try {
      const response = await simulateApiCall('/api/compliance/update', {
        method: 'POST',
        body: JSON.stringify({ checkRef, ...updates })
      });
      console.log('✅ Check updated successfully');
    } catch (error) {
      console.error('❌ Failed to update check:', error);
    }
  };

  // Replace your current handleFileUpload function with this:
const handleFileUpload = async (checkRef, files) => {
  setUploadingFile(true);
  
  try {
    const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
    const REPO_OWNER = 'massimocristi1970';
    const REPO_NAME = 'compliance-monitoring';
    
    const uploadedFiles = [];
    
    for (const file of Array.from(files)) {
      // Convert file to base64
      const base64Content = await fileToBase64(file);
      
      // Create the file path
      const filePath = `data/${selectedYear}/${months[selectedMonth-1].toLowerCase()}/check-${checkRef}/${file.name}`;
      
      // GitHub API request
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Upload file for compliance check #${checkRef}`,
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
    
    // Update the compliance check with real file info
    const updates = {
      files: [
        ...(complianceData.find(item => item.checkRef === checkRef)?.files || []), 
        ...uploadedFiles
      ],
      status: 'completed',
      completedDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString()
    };
    
    await updateCheckStatus(checkRef, updates);
    
    setUploadingFile(false);
    setShowFileUpload(false);
    
    alert(`✅ Files uploaded successfully to GitHub:\n${uploadedFiles.map(f => f.name).join('\n')}\n\n🔗 View files in repository at:\ndata/${selectedYear}/${months[selectedMonth-1].toLowerCase()}/check-${checkRef}/`);
    
  } catch (error) {
    setUploadingFile(false);
    console.error('Upload failed:', error);
    alert(`❌ Upload failed: ${error.message}`);
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data:mime/type;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Enhanced file display component
const FileList = ({ files, checkRef }) => {
  return (
    <div className="mt-2 space-y-1">
      {files?.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
          <span>{typeof file === 'string' ? file : file.name}</span>
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

  const simulateApiCall = async (url, options) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate success/failure
    if (Math.random() > 0.1) { // 90% success rate
      return { success: true };
    } else {
      throw new Error('Network error');
    }
  };

  // Dashboard statistics
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
    
    // Create downloadable JSON
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
    // Update compliance data from admin panel
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
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
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
              {isAdminMode ? (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Add Checks in Admin Panel
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedMonth(9);
                    setSelectedYear(2025);
                    setFilterStatus('all');
                    setFilterResponsibility('all');
                  }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  View Sample Data (Sep 2025)
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Area
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Files
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                          {check.frequency}
                        </span>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {check.dueDate ? new Date(check.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{check.files?.length || 0} files</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCheck(check)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCheck(check);
                              setShowFileUpload(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Upload
                          </button>
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
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Frequency</h4>
                    <p className="text-sm text-gray-900">{selectedCheck.frequency}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Responsibility</h4>
                    <p className="text-sm text-gray-900">{selectedCheck.responsibility}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCheck.status)}`}>
                      {getStatusIcon(selectedCheck.status)}
                      {selectedCheck.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {selectedCheck.dueDate && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Due Date</h4>
                      <p className="text-sm text-gray-900">{new Date(selectedCheck.dueDate).toLocaleDateString()}</p>
                    </div>
                    {selectedCheck.completedDate && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Completed Date</h4>
                        <p className="text-sm text-gray-900">{new Date(selectedCheck.completedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Comments
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <textarea
                      value={selectedCheck.comments || ''}
                      onChange={(e) => {
                        const updatedCheck = { ...selectedCheck, comments: e.target.value };
                        setSelectedCheck(updatedCheck);
                        updateCheckStatus(selectedCheck.checkRef, { comments: e.target.value });
                      }}
                      placeholder="Add comments about this compliance check..."
                      className="w-full h-24 border-0 bg-transparent resize-none focus:ring-0 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Uploaded Files
                  </h4>
                  {selectedCheck.files && selectedCheck.files.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCheck.files.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file}</span>
                          <span className="ml-auto text-xs text-gray-500">
                            data/{selectedCheck.year}/{selectedCheck.month}/check-{selectedCheck.checkRef}/
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No files uploaded yet</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <select
                    value={selectedCheck.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      const updates = { status: newStatus };
                      if (newStatus === 'completed') {
                        updates.completedDate = new Date().toISOString().split('T')[0];
                      }
                      updateCheckStatus(selectedCheck.checkRef, updates);
                      setSelectedCheck({ ...selectedCheck, ...updates });
                    }}
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="due_soon">Due Soon</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                  <button
                    onClick={() => {
                      setShowFileUpload(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Files
                  </button>
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
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Files will be uploaded to GitHub repository:
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
              </div>
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Source</h4>
              <p>{error ? '⚠️ Sample Data (File not found)' : '✅ Real Data (JSON loaded)'}</p>
              <p className="text-xs mt-1">Run sync script to update data</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Repository</h4>
              <p>📂 GitHub: massimocristi1970/compliance-monitoring</p>
              <a 
                href="https://github.com/massimocristi1970/compliance-monitoring" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                View Repository →
              </a>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Last Updated</h4>
              <p>{summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleDateString() : 'Unknown'}</p>
              <p className="text-xs mt-1">Dashboard version 2.0 (with Admin Panel)</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🚀 Getting Started</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>For Agents:</strong> Use the dashboard to view assigned checks, update status, and upload files</p>
              <p><strong>For Managers:</strong> Generate monthly reports and monitor team progress</p>
              <p><strong>For Admins:</strong> Click "Admin Mode" to manage assignees, business areas, and compliance checks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;