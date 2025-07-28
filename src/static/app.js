
// Enhanced ADA Compliance Checker JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('analysisForm');
    const quickScanBtn = document.getElementById('quickScanBtn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const quickResults = document.getElementById('quickResults');
    const fullResults = document.getElementById('fullResults');
    const riskAssessment = document.getElementById('riskAssessment');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    let currentAnalysisData = null;

    // Progress simulation for better UX
    function simulateProgress(duration, callback) {
        let progress = 0;
        const interval = 100;
        const increment = 100 / (duration / interval);
        
        const progressMessages = [
            'Initializing analysis...',
            'Fetching website content...',
            'Analyzing images and alt text...',
            'Checking color contrast...',
            'Examining form accessibility...',
            'Evaluating heading structure...',
            'Testing keyboard navigation...',
            'Generating compliance report...',
            'Finalizing results...'
        ];
        
        const timer = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(timer);
                if (callback) callback();
            }
            
            if (progressBar) progressBar.style.width = progress + '%';
            const messageIndex = Math.floor((progress / 100) * (progressMessages.length - 1));
            if (progressText) progressText.textContent = progressMessages[messageIndex];
        }, interval);
    }

    // Quick scan functionality
    if (quickScanBtn) {
        quickScanBtn.addEventListener('click', function() {
            const url = document.getElementById('website-url').value.trim();
            const businessType = document.getElementById('business-type').value;
            
            if (!url) {
                alert('Please enter a website URL');
                return;
            }
            
            showLoading();
            simulateProgress(3000, () => {
                performQuickScan(url, businessType);
            });
        });
    }

    // Full analysis form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const url = document.getElementById('website-url').value.trim();
            const businessType = document.getElementById('business-type').value;
            
            if (!url) {
                alert('Please enter a website URL');
                return;
            }
            
            showLoading();
            simulateProgress(8000, () => {
                performFullAnalysis(url, businessType);
            });
        });
    }

    function showLoading() {
        if (loading) loading.classList.add('active');
        if (results) results.classList.add('hidden');
        if (quickResults) quickResults.classList.add('hidden');
        if (fullResults) fullResults.classList.add('hidden');
        if (riskAssessment) riskAssessment.classList.add('hidden');
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = 'Initializing analysis...';
    }

    function hideLoading() {
        if (loading) loading.classList.remove('active');
        if (results) results.classList.remove('hidden');
    }

    async function performQuickScan(url, businessType) {
        try {
            const response = await fetch('/api/compliance/quick-scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, business_type: businessType })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            displayQuickResults(data);
            hideLoading();
            
        } catch (error) {
            console.error('Quick scan error:', error);
            hideLoading();
            alert('Quick scan failed: ' + error.message);
        }
    }

    async function performFullAnalysis(url, businessType) {
        try {
            const response = await fetch('/api/compliance/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, business_type: businessType })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            currentAnalysisData = data;
            displayFullResults(data);
            
            // Also get risk assessment
            await performRiskAssessment(url, businessType);
            
            hideLoading();
            
        } catch (error) {
            console.error('Full analysis error:', error);
            hideLoading();
            alert('Analysis failed: ' + error.message);
        }
    }

    async function performRiskAssessment(url, businessType) {
        try {
            const response = await fetch('/api/compliance/business-risk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, business_type: businessType })
            });

            const data = await response.json();
            
            if (!data.error) {
                displayRiskAssessment(data);
            }
            
        } catch (error) {
            console.error('Risk assessment error:', error);
        }
    }

    function displayQuickResults(data) {
        const content = document.getElementById('quickResultsContent');
        if (!content) return;
        
        const riskClass = `risk-${data.risk_level.toLowerCase().replace(' ', '-')}`;
        
        content.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold mb-4">
                        <i class="fas fa-tachometer-alt mr-2 text-blue-600"></i>
                        Quick Assessment
                    </h4>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span>Risk Level:</span>
                            <span class="font-semibold ${riskClass} px-2 py-1 rounded">${data.risk_level}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Images Missing Alt Text:</span>
                            <span class="font-semibold">${data.missing_alt_text} of ${data.total_images}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Potential Contrast Issues:</span>
                            <span class="font-semibold">${data.potential_contrast_issues}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-6">
                    <h4 class="text-lg font-semibold mb-4">
                        <i class="fas fa-lightbulb mr-2 text-yellow-600"></i>
                        Recommendation
                    </h4>
                    <p class="text-gray-700">${data.recommendation}</p>
                    <div class="mt-4">
                        <button onclick="document.querySelector('form').dispatchEvent(new Event('submit'))" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200">
                            <i class="fas fa-microscope mr-2"></i>Run Full Analysis
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if (quickResults) quickResults.classList.remove('hidden');
    }

    function displayFullResults(data) {
        displayScoreOverview(data);
        displayPageInfo(data);
        displayIssuesBreakdown(data);
        displayDetailedAnalysis(data);
        displaySummary(data);
        
        if (fullResults) fullResults.classList.remove('hidden');
        
        // Add download report functionality
        const downloadBtn = document.getElementById('downloadReport');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                downloadReport(data);
            });
        }
    }

    function displayScoreOverview(data) {
        const container = document.getElementById('scoreOverview');
        if (!container) return;
        
        const gradeClass = `grade-${data.grade.toLowerCase().replace('+', '-plus')}`;
        const riskClass = `risk-${data.risk_level.toLowerCase().replace(' ', '-')}`;
        
        container.innerHTML = `
            <div class="metric-card bg-white rounded-lg p-6 text-center card-shadow">
                <div class="${gradeClass} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span class="text-2xl font-bold">${data.grade}</span>
                </div>
                <h5 class="font-semibold text-gray-800">Overall Grade</h5>
                <p class="text-sm text-gray-600">${data.status}</p>
            </div>
            
            <div class="metric-card bg-white rounded-lg p-6 text-center card-shadow">
                <div class="text-3xl font-bold text-blue-600 mb-2">${data.score}</div>
                <h5 class="font-semibold text-gray-800">Compliance Score</h5>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${data.score}%"></div>
                </div>
            </div>
            
            <div class="metric-card bg-white rounded-lg p-6 text-center card-shadow">
                <div class="text-3xl font-bold text-red-600 mb-2">${data.critical_issues}</div>
                <h5 class="font-semibold text-gray-800">Critical Issues</h5>
                <p class="text-sm text-gray-600">Need immediate attention</p>
            </div>
            
            <div class="metric-card bg-white rounded-lg p-6 text-center card-shadow">
                <div class="${riskClass} px-3 py-1 rounded-full text-sm font-semibold mb-2">${data.risk_level}</div>
                <h5 class="font-semibold text-gray-800">Legal Risk</h5>
                <p class="text-sm text-gray-600">Lawsuit probability</p>
            </div>
        `;
    }

    function displayPageInfo(data) {
        const container = document.getElementById('pageInfo');
        if (!container) return;
        
        const pageInfo = data.page_info;
        
        container.innerHTML = `
            <h5 class="font-semibold text-gray-800 mb-3">
                <i class="fas fa-info-circle mr-2 text-blue-600"></i>
                Page Information
            </h5>
            <div class="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                    <strong>Page Title:</strong> ${pageInfo.title}
                </div>
                <div>
                    <strong>Language:</strong> ${pageInfo.lang_attribute || 'Not specified'}
                </div>
                <div>
                    <strong>Total Images:</strong> ${pageInfo.total_images}
                </div>
                <div>
                    <strong>Total Links:</strong> ${pageInfo.total_links}
                </div>
                <div>
                    <strong>Headings:</strong> ${pageInfo.total_headings}
                </div>
                <div>
                    <strong>Forms:</strong> ${pageInfo.total_forms}
                </div>
                <div>
                    <strong>Skip Links:</strong> ${pageInfo.has_skip_links ? 'Present' : 'Missing'}
                </div>
                <div>
                    <strong>Viewport Meta:</strong> ${pageInfo.viewport_meta ? 'Present' : 'Missing'}
                </div>
            </div>
        `;
    }

    function displayIssuesBreakdown(data) {
        const container = document.getElementById('issuesList');
        if (!container) return;
        
        if (data.issues.length === 0) {
            container.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <i class="fas fa-check-circle text-4xl text-green-600 mb-4"></i>
                    <h5 class="text-lg font-semibold text-green-800 mb-2">No Critical Issues Found!</h5>
                    <p class="text-green-700">Your website appears to follow good accessibility practices.</p>
                </div>
            `;
            return;
        }
        
        let issuesHtml = '';
        
        data.issues.forEach((issue, index) => {
            const issueClass = `issue-${issue.type}`;
            const iconClass = issue.type === 'critical' ? 'fas fa-exclamation-triangle text-red-600' : 
                             issue.type === 'warning' ? 'fas fa-exclamation-circle text-yellow-600' : 
                             'fas fa-info-circle text-gray-600';
            
            issuesHtml += `
                <div class="${issueClass} rounded-lg p-6 mb-4">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center">
                            <i class="${iconClass} mr-3"></i>
                            <div>
                                <h5 class="text-lg font-semibold text-gray-800">${issue.title || issue.category}</h5>
                                <p class="text-sm text-gray-600">${issue.wcag_guideline}</p>
                            </div>
                        </div>
                        <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                            ${issue.count || 0} issues
                        </span>
                    </div>
                    
                    <p class="text-gray-700 mb-4">${issue.description}</p>
                    
                    <div class="bg-white bg-opacity-50 rounded p-4 mb-4">
                        <h6 class="font-semibold text-gray-800 mb-2">
                            <i class="fas fa-impact mr-2"></i>Impact
                        </h6>
                        <p class="text-sm text-gray-700">${issue.impact}</p>
                        ${issue.business_impact ? `<p class="text-sm text-gray-700 mt-2"><strong>Business Impact:</strong> ${issue.business_impact}</p>` : ''}
                    </div>
                    
                    ${issue.fix_instructions ? `
                        <div class="bg-white bg-opacity-50 rounded p-4 mb-4">
                            <h6 class="font-semibold text-gray-800 mb-2">
                                <i class="fas fa-tools mr-2"></i>How to Fix
                            </h6>
                            <p class="text-sm text-gray-700 mb-2">${issue.fix_instructions.immediate}</p>
                            ${issue.fix_instructions.code_example ? `
                                <div class="code-block mt-2">
                                    <code>${escapeHtml(issue.fix_instructions.code_example)}</code>
                                </div>
                            ` : ''}
                            ${issue.fix_instructions.estimated_time ? `
                                <p class="text-xs text-gray-600 mt-2">
                                    <i class="fas fa-clock mr-1"></i>Estimated fix time: ${issue.fix_instructions.estimated_time}
                                </p>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${issue.examples && issue.examples.length > 0 ? `
                        <button onclick="toggleExamples(${index})" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <i class="fas fa-chevron-down mr-1"></i>View Examples (${issue.examples.length})
                        </button>
                        <div id="examples-${index}" class="collapsible-content mt-3">
                            <div class="bg-white bg-opacity-50 rounded p-4">
                                <h6 class="font-semibold text-gray-800 mb-2">Examples:</h6>
                                ${issue.examples.map(example => `
                                    <div class="bg-gray-100 rounded p-2 mb-2 text-sm">
                                        ${typeof example === 'string' ? example : JSON.stringify(example, null, 2)}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = issuesHtml;
    }

    function displayDetailedAnalysis(data) {
        const container = document.getElementById('analysisDetails');
        if (!container) return;
        
        const analysis = data.detailed_analysis;
        
        container.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-6">
                    <h5 class="font-semibold text-gray-800 mb-4">
                        <i class="fas fa-image mr-2 text-blue-600"></i>
                        Image Analysis
                    </h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Total Images:</span>
                            <span class="font-medium">${analysis.images.total}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Missing Alt Text:</span>
                            <span class="font-medium text-red-600">${analysis.images.missing_alt}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Decorative Images:</span>
                            <span class="font-medium">${analysis.images.decorative}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6">
                    <h5 class="font-semibold text-gray-800 mb-4">
                        <i class="fas fa-heading mr-2 text-green-600"></i>
                        Heading Structure
                    </h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Missing H1:</span>
                            <span class="font-medium ${analysis.headings.missing_h1 ? 'text-red-600' : 'text-green-600'}">
                                ${analysis.headings.missing_h1 ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>Sequence Errors:</span>
                            <span class="font-medium">${analysis.headings.sequence_errors.length}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6">
                    <h5 class="font-semibold text-gray-800 mb-4">
                        <i class="fas fa-palette mr-2 text-purple-600"></i>
                        Color Contrast
                    </h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Elements Checked:</span>
                            <span class="font-medium">${analysis.color_contrast.total_checked}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Failed AA Standard:</span>
                            <span class="font-medium text-red-600">${analysis.color_contrast.failed_aa}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Failed AAA Standard:</span>
                            <span class="font-medium text-yellow-600">${analysis.color_contrast.failed_aaa}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-6">
                    <h5 class="font-semibold text-gray-800 mb-4">
                        <i class="fas fa-wpforms mr-2 text-orange-600"></i>
                        Form Accessibility
                    </h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Unlabeled Inputs:</span>
                            <span class="font-medium text-red-600">${analysis.forms.unlabeled_inputs}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Missing Fieldsets:</span>
                            <span class="font-medium">${analysis.forms.missing_fieldsets}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function displaySummary(data) {
        const container = document.getElementById('summaryContent');
        if (!container) return;
        
        const summary = data.summary;
        
        container.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-red-50 rounded-lg p-6">
                    <h5 class="font-semibold text-red-800 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Legal Risk Assessment
                    </h5>
                    <p class="text-red-700 font-medium mb-3">${summary.legal_risk_assessment}</p>
                    <div class="text-sm text-red-600">
                        <p><strong>Total Issues:</strong> ${summary.total_issues}</p>
                        <p><strong>Estimated Fix Time:</strong> ${summary.estimated_fix_time}</p>
                    </div>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-6">
                    <h5 class="font-semibold text-blue-800 mb-4">
                        <i class="fas fa-tasks mr-2"></i>
                        Priority Actions
                    </h5>
                    <ul class="text-sm text-blue-700 space-y-2">
                        ${summary.priority_actions.map(action => `
                            <li class="flex items-start">
                                <i class="fas fa-arrow-right mr-2 mt-1 text-xs"></i>
                                ${action}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="bg-green-50 rounded-lg p-6 mt-6">
                <h5 class="font-semibold text-green-800 mb-4">
                    <i class="fas fa-road mr-2"></i>
                    Next Steps
                </h5>
                <ol class="text-sm text-green-700 space-y-2">
                    ${summary.next_steps.map((step, index) => `
                        <li class="flex items-start">
                            <span class="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                ${index + 1}
                            </span>
                            ${step}
                        </li>
                    `).join('')}
                </ol>
            </div>
        `;
    }

    function displayRiskAssessment(data) {
        const container = document.getElementById('riskAssessmentContent');
        if (!container) return;
        
        const riskClass = `


risk-${data.overall_risk.toLowerCase()}`;
        
        container.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-6">
                    <h5 class="font-semibold text-gray-800 mb-4">
                        <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                        Risk Factors
                    </h5>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span>Overall Risk Level:</span>
                            <span class="font-semibold ${riskClass} px-2 py-1 rounded">${data.overall_risk.toUpperCase()}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Accessibility Score:</span>
                            <span class="font-semibold">${data.risk_factors.accessibility_score}/100</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Critical Issues:</span>
                            <span class="font-semibold">${data.risk_factors.critical_issues}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Business Type Risk:</span>
                            <span class="font-semibold">${data.risk_factors.business_type_risk.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-orange-50 rounded-lg p-6">
                    <h5 class="font-semibold text-orange-800 mb-4">
                        <i class="fas fa-lightbulb mr-2 text-yellow-600"></i>
                        Recommendations
                    </h5>
                    <ul class="text-sm text-orange-700 space-y-2">
                        ${data.recommendations.map(rec => `
                            <li class="flex items-start">
                                <i class="fas fa-check mr-2 mt-1 text-xs text-green-600"></i>
                                ${rec}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        if (riskAssessment) riskAssessment.classList.remove('hidden');
    }

    // Utility functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function toggleExamples(index) {
        const content = document.getElementById(`examples-${index}`);
        const button = content.previousElementSibling;
        const icon = button.querySelector('i');
        
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    function downloadReport(data) {
        const reportContent = generateReportHTML(data);
        const blob = new Blob([reportContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ada-compliance-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function generateReportHTML(data) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADA Compliance Report - ${data.url}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .issue { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 10px 0; }
        .warning { background: #fffbeb; border-left: 4px solid #f59e0b; }
        .code-block { background: #1f2937; color: #f9fafb; padding: 10px; border-radius: 4px; font-family: monospace; }
        .grade-a { background: #10b981; color: white; }
        .grade-b { background: #3b82f6; color: white; }
        .grade-c { background: #f59e0b; color: white; }
        .grade-d { background: #ef4444; color: white; }
        .grade-f { background: #dc2626; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ADA Compliance Report</h1>
        <p>Website: ${data.url}</p>
        <p>Generated: ${new Date(data.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="metric-grid">
        <div class="metric-card">
            <div class="grade-${data.grade.toLowerCase()}" style="width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 24px; font-weight: bold;">
                ${data.grade}
            </div>
            <h3>Overall Grade</h3>
            <p>${data.status}</p>
        </div>
        <div class="metric-card">
            <h2>${data.score}</h2>
            <h3>Compliance Score</h3>
        </div>
        <div class="metric-card">
            <h2>${data.critical_issues}</h2>
            <h3>Critical Issues</h3>
        </div>
        <div class="metric-card">
            <h2>${data.risk_level}</h2>
            <h3>Legal Risk</h3>
        </div>
    </div>
    
    <h2>Issues Found</h2>
    ${data.issues.map(issue => `
        <div class="issue ${issue.type === 'warning' ? 'warning' : ''}">
            <h3>${issue.title || issue.category}</h3>
            <p><strong>WCAG Guideline:</strong> ${issue.wcag_guideline}</p>
            <p>${issue.description}</p>
            <p><strong>Impact:</strong> ${issue.impact}</p>
            ${issue.business_impact ? `<p><strong>Business Impact:</strong> ${issue.business_impact}</p>` : ''}
            ${issue.fix_instructions ? `
                <h4>How to Fix:</h4>
                <p>${issue.fix_instructions.immediate}</p>
                ${issue.fix_instructions.code_example ? `<div class="code-block">${escapeHtml(issue.fix_instructions.code_example)}</div>` : ''}
                ${issue.fix_instructions.estimated_time ? `<p><strong>Estimated Fix Time:</strong> ${issue.fix_instructions.estimated_time}</p>` : ''}
            ` : ''}
        </div>
    `).join('')}
    
    <h2>Summary</h2>
    <p><strong>Legal Risk Assessment:</strong> ${data.summary.legal_risk_assessment}</p>
    <p><strong>Total Issues:</strong> ${data.summary.total_issues}</p>
    <p><strong>Estimated Fix Time:</strong> ${data.summary.estimated_fix_time}</p>
    
    <h3>Priority Actions:</h3>
    <ul>
        ${data.summary.priority_actions.map(action => `<li>${action}</li>`).join('')}
    </ul>
    
    <h3>Next Steps:</h3>
    <ol>
        ${data.summary.next_steps.map(step => `<li>${step}</li>`).join('')}
    </ol>
    
    <div style="margin-top: 40px; padding: 20px; background: #f1f5f9; border-radius: 8px;">
        <p><strong>Report generated by ADA Compliance Checker</strong></p>
        <p>This report provides an automated analysis of accessibility issues. For comprehensive compliance, consider professional accessibility auditing services.</p>
    </div>
</body>
</html>
        `;
    }

    // Make functions available globally for onclick handlers
    window.toggleExamples = toggleExamples;
});
