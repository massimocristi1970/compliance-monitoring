import React, { useState, useEffect } from 'react';
import { Calendar, Upload, FileText, CheckCircle, AlertCircle, Clock, Users, Filter, Download, MessageSquare, Eye } from 'lucide-react';

// Sample compliance data based on your Excel structure
const sampleComplianceData = [
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
    files: ["adequate_explanations_2024.pdf"]
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
    files: []
  },
  {
    checkRef: 4,
    businessArea: "Credit Agreements & Disclosures (CCA / CONC)",
    action: "Sample test of agreements (disclosures, repayment frequency)",
    frequency: "Quarterly",
    number: 20,
    responsibility: "Massimo Cristi",
    lastReviewMonth: "Jun",
    records: "Document",
    nextReviewMonth: "Sep",
    nextReviewYear: 2025,
    status: "overdue",
    dueDate: "2025-09-30",
    comments: "Quarterly review in progress. 15 out of 20 samples completed.",
    files: ["sample_test_q3_2025.xlsx"]
  },
  {
    checkRef: 7,
    businessArea: "SMCR & Governance",
    action: "Fitness & propriety (SMCR Certification)",
    frequency: "Annually",
    number: "As needed",
    responsibility: "Massimo Cristi",
    lastReviewMonth: "Oct",
    records: "Review",
    nextReviewMonth: "Oct",
    nextReviewYear: 2025,
    status: "due_soon",
    dueDate: "2025-10-31",
    comments: "",
    files: []
  },
  {
    checkRef: 9,
    businessArea: "SMCR & Governance",
    action: "FCA notifications of breaches (SUP 15)",
    frequency: "Event-driven",
    number: "As needed",
    responsibility: "Massimo Cristi",
    records: "Report",
    status: "monitoring",
    comments: "No breaches reported this month.",
    files: []
  }
];

const ComplianceDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResponsibility, setFilterResponsibility] = useState('all');
  const [complianceData, setComplianceData] = useState(sampleComplianceData);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get unique responsibilities for filter
  const responsibilities = [...new Set(complianceData.map(item => item.responsibility).filter(Boolean))];

  // Filter and categorize data
  const filteredData = complianceData.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesResponsibility = filterResponsibility === 'all' || item.responsibility === filterResponsibility;
    return matchesStatus && matchesResponsibility;
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

  const updateCheckStatus = (checkRef, updates) => {
    setComplianceData(prev => prev.map(item => 
      item.checkRef === checkRef ? { ...item, ...updates } : item
    ));
  };

  const handleFileUpload = async (checkRef, files) => {
    setUploadingFile(true);
    
    // Simulate file upload to GitHub
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const fileNames = Array.from(files).map(file => file.name);
    updateCheckStatus(checkRef, {
      files: [...(complianceData.find(item => item.checkRef === checkRef)?.files || []), ...fileNames],
      status: 'completed',
      completedDate: new Date().toISOString().split('T')[0]
    });
    
    setUploadingFile(false);
    setShowFileUpload(false);
    alert(`Files uploaded successfully to GitHub repository:\n${fileNames.join('\n')}`);
  };

  // Dashboard statistics
  const stats = {
    total: filteredData.length,
    completed: filteredData.filter(item => item.status === 'completed').length,
    pending: filteredData.filter(item => item.status === 'pending').length,
    overdue: filteredData.filter(item => item.status === 'overdue').length,
    dueSoon: filteredData.filter(item => item.status === 'due_soon').length
  };

  const generateMonthlyReport = () => {
    const report = {
      period: `${months[selectedMonth - 1]} ${selectedYear}`,
      summary: stats,
      checks: filteredData.map(check => ({
        checkRef: check.checkRef,
        action: check.action,
        status: check.status,
        responsibility: check.responsibility,
        comments: check.comments || 'No comments',
        filesCount: check.files?.length || 0
      })),
      completedChecks: filteredData.filter(c => c.status === 'completed'),
      outstandingChecks: filteredData.filter(c => c.status !== 'completed')
    };
    
    console.log('Monthly Report Generated:', report);
    alert('Monthly report generated and ready for download!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Compliance Monitoring Dashboard</h1>
              <p className="text-gray-600">Track and manage compliance checks with automated reporting</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Checks</p>
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
        </div>

        {/* Compliance Checks Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Compliance Checks - {months[selectedMonth - 1]} {selectedYear}
            </h2>
          </div>
          
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
        </div>

        {/* GitHub Setup Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GitHub Repository Integration</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Repository Structure:</h4>
              <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{`compliance-monitoring/
├── data/
│   ├── 2025/
│   │   ├── september/
│   │   │   ├── check-1/
│   │   │   ├── check-2/
│   │   │   └── check-4/
│   │   └── ...other months
│   └── 2026/
├── reports/monthly/
├── dashboard/
└── scripts/`}
              </pre>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">
                <strong>Repository URL:</strong> https://github.com/massimocristi1970/compliance-monitoring
              </p>
              <p className="text-blue-800 mt-2">
                <strong>Dashboard URL:</strong> https://massimocristi1970.github.io/compliance-monitoring/
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;