document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('complianceForm');
    const quickScanBtn = document.getElementById('quickScan');
    const fullAnalysisBtn = document.getElementById('fullAnalysis');
    const resultsContainer = document.getElementById('results');
    const loadingContainer = document.getElementById('loading');
    const riskAssessment = document.getElementById('riskAssessment');

    // Global variable to store current analysis data for download
    window.currentAnalysisData = null;

    // Utility functions (defined first to avoid reference errors)
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function downloadReport() {
        if (!window.currentAnalysisData) {
            alert('No analysis data available for download. Please run an analysis first.');
            return;
        }

        try {
            const reportContent = generateReportHTML(window.currentAnalysisData);
            const blob = new Blob([reportContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ada-compliance-report-${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success message
            showNotification('Report downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showNotification('Failed to download report. Please try again.', 'error');
        }
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    function toggleExamples(index) {
        const content = document.getElementById(`examples-${index}`);
        if (!content) return;

        const button = content.previousElementSibling;
        const icon = button.querySelector('i');

        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        } else {
            content.style.display = 'none';
            if (icon) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        }
    }

    // Quick scan functionality
    quickScanBtn.addEventListener('click', async function() {
        const url = document.getElementById('websiteUrl').value;
        const businessType = document.getElementById('businessType').value;

        if (!url) {
            alert('Please enter a website URL');
            return;
        }

        showLoading();

        try {
            const response = await fetch('/api/quick-scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, business_type: businessType })
            });

            const data = await response.json();
            displayQuickResults(data);
        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            resultsContainer.innerHTML = '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error analyzing website. Please try again.</div>';
        }
    });

    // Full analysis functionality
    fullAnalysisBtn.addEventListener('click', async function() {
        const url = document.getElementById('websiteUrl').value;
        const businessType = document.getElementById('businessType').value;

        if (!url) {
            alert('Please enter a website URL');
            return;
        }

        showLoading();

        try {
            const response = await fetch('/api/full-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, business_type: businessType })
            });

            const data = await response.json();
            displayFullResults(data);
            window.currentAnalysisData = data; // Store for download
        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            resultsContainer.innerHTML = '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error analyzing website. Please try again.</div>';
        }
    });

    function showLoading() {
        loadingContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
        riskAssessment.style.display = 'none';
        
        // Show progressive loading messages
        const messages = [
            'Scanning website structure...',
            'Analyzing images and alt text...',
            'Checking color contrast...',
            'Validating form accessibility...',
            'Reviewing heading structure...',
            'Assessing keyboard navigation...',
            'Generating compliance report...'
        ];
        
        let messageIndex = 0;
        const messageElement = document.querySelector('#loading p');
        
        const messageInterval = setInterval(() => {
            if (messageIndex < messages.length) {
                messageElement.textContent = messages[messageIndex];
                messageIndex++;
            } else {
                clearInterval(messageInterval);
            }
        }, 1000);
    }

    function hideLoading() {
        loadingContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
    }

    function displayQuickResults(data) {
        hideLoading();
        
        const gradeColor = getGradeColor(data.grade);
        const riskColor = getRiskColor(data.risk_level);
        
        resultsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">Quick Scan Results</h2>
                    <div class="flex items-center space-x-4">
                        <div class="text-center">
                            <div class="w-16 h-16 rounded-full ${gradeColor} flex items-center justify-center text-white text-2xl font-bold">
                                ${data.grade}
                            </div>
                            <p class="text-sm text-gray-600 mt-1">Grade</p>
                        </div>
                        <div class="text-center">
                            <div class="w-16 h-16 rounded-full ${riskColor} flex items-center justify-center text-white text-xl font-bold">
                                ${data.risk_level}
                            </div>
                            <p class="text-sm text-gray-600 mt-1">Risk</p>
                        </div>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-blue-800 mb-2">Issues Found</h3>
                        <p class="text-3xl font-bold text-blue-600">${data.total_issues}</p>
                        <p class="text-sm text-blue-600">${data.critical_issues} critical, ${data.warning_issues} warnings</p>
                    </div>
                    
                    <div class="bg-green-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-green-800 mb-2">Compliance Score</h3>
                        <p class="text-3xl font-bold text-green-600">${data.compliance_score}%</p>
                        <p class="text-sm text-green-600">WCAG 2.1 Level AA</p>
                    </div>
                </div>
                
                <div class="mt-6">
                    <h3 class="font-semibold text-gray-800 mb-3">Top Issues to Address</h3>
                    <div class="space-y-2">
                        ${data.top_issues.map(issue => `
                            <div class="flex items-center p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                <i class="fas fa-exclamation-triangle text-yellow-500 mr-3"></i>
                                <span class="text-gray-700">${escapeHtml(issue)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p class="text-blue-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        For detailed analysis with fix instructions and downloadable reports, use the Full Analysis option.
                    </p>
                </div>
            </div>
        `;
    }

    function displayFullResults(data) {
        hideLoading();
        
        // Store data globally for download functionality
        window.currentAnalysisData = data;
        
        const gradeColor = getGradeColor(data.grade);
        const riskColor = getRiskColor(data.risk_level);
        
        resultsContainer.innerHTML = `
            <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-3xl font-bold mb-2">ADA Compliance Analysis</h2>
                        <p class="text-blue-100">Comprehensive WCAG 2.1 Assessment</p>
                    </div>
                    <button onclick="downloadReport()" class="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                        <i class="fas fa-download mr-2"></i>Download Report
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-b-lg shadow-lg p-6">
                <div class="grid md:grid-cols-4 gap-4 mb-8">
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <div class="w-20 h-20 mx-auto rounded-full ${gradeColor} flex items-center justify-center text-white text-3xl font-bold mb-2">
                            ${data.grade}
                        </div>
                        <h3 class="font-semibold text-gray-800">Overall Grade</h3>
                        <p class="text-sm text-gray-600">${getGradeDescription(data.grade)}</p>
                    </div>
                    
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <div class="w-20 h-20 mx-auto rounded-full ${riskColor} flex items-center justify-center text-white text-lg font-bold mb-2">
                            ${data.risk_level}
                        </div>
                        <h3 class="font-semibold text-gray-800">Legal Risk</h3>
                        <p class="text-sm text-gray-600">${getRiskDescription(data.risk_level)}</p>
                    </div>
                    
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <div class="w-20 h-20 mx-auto bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                            ${data.compliance_score}%
                        </div>
                        <h3 class="font-semibold text-gray-800">Compliance</h3>
                        <p class="text-sm text-gray-600">WCAG 2.1 Level AA</p>
                    </div>
                    
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <div class="w-20 h-20 mx-auto bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                            ${data.total_issues}
                        </div>
                        <h3 class="font-semibold text-gray-800">Total Issues</h3>
                        <p class="text-sm text-gray-600">${data.critical_issues} critical</p>
                    </div>
                </div>
                
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Business Impact Analysis</h3>
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-users text-yellow-600 mr-2"></i>
                            <span class="font-semibold text-yellow-800">Potential User Exclusion</span>
                        </div>
                        <p class="text-yellow-700 mb-2">${data.business_impact.user_exclusion}</p>
                        <p class="text-sm text-yellow-600">${data.business_impact.impact_description}</p>
                    </div>
                </div>
                
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Detailed Analysis Results</h3>
                    <div class="space-y-4">
                        ${data.detailed_issues.map((issue, index) => `
                            <div class="border rounded-lg overflow-hidden">
                                <div class="bg-gray-50 p-4 border-b">
                                    <div class="flex justify-between items-center">
                                        <div class="flex items-center">
                                            <span class="inline-block w-3 h-3 rounded-full ${issue.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'} mr-3"></span>
                                            <h4 class="font-semibold text-gray-800">${escapeHtml(issue.title)}</h4>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <span class="text-sm px-2 py-1 rounded ${issue.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                                                ${issue.severity.toUpperCase()}
                                            </span>
                                            <span class="text-sm text-gray-500">${issue.wcag_reference}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="p-4">
                                    <p class="text-gray-700 mb-3">${escapeHtml(issue.description)}</p>
                                    
                                    <div class="mb-4">
                                        <h5 class="font-semibold text-gray-800 mb-2">How to Fix:</h5>
                                        <div class="bg-blue-50 p-3 rounded">
                                            <p class="text-blue-800">${escapeHtml(issue.fix_instruction)}</p>
                                        </div>
                                    </div>
                                    
                                    ${issue.code_example ? `
                                        <div class="mb-4">
                                            <h5 class="font-semibold text-gray-800 mb-2">Code Example:</h5>
                                            <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto"><code>${escapeHtml(issue.code_example)}</code></pre>
                                        </div>
                                    ` : ''}
                                    
                                    ${issue.examples && issue.examples.length > 0 ? `
                                        <button onclick="toggleExamples(${index})" class="text-blue-600 hover:text-blue-800 font-medium">
                                            <i class="fas fa-chevron-down mr-1"></i>
                                            View Examples (${issue.examples.length})
                                        </button>
                                        <div id="examples-${index}" style="display: none;" class="mt-3 space-y-2">
                                            ${issue.examples.map(example => `
                                                <div class="bg-red-50 p-3 rounded border-l-4 border-red-300">
                                                    <p class="text-sm text-red-800">${escapeHtml(example)}</p>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    <div class="mt-3 flex justify-between items-center text-sm text-gray-600">
                                        <span>Estimated fix time: ${issue.estimated_time}</span>
                                        <span>Priority: ${issue.priority}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-green-800 mb-3">
                        <i class="fas fa-lightbulb mr-2"></i>
                        Next Steps Recommendation
                    </h3>
                    <div class="space-y-2">
                        ${data.recommendations.map(rec => `
                            <div class="flex items-start">
                                <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                                <span class="text-green-700">${escapeHtml(rec)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Show risk assessment
        displayRiskAssessment(data);
    }

    function displayRiskAssessment(data) {
        riskAssessment.style.display = 'block';
        riskAssessment.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-shield-alt mr-2 text-blue-600"></i>
                    Legal Risk Assessment
                </h3>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-3">Industry Risk Factors</h4>
                        <div class="space-y-2">
                            ${data.risk_factors.map(factor => `
                                <div class="flex items-center p-2 bg-yellow-50 rounded">
                                    <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                                    <span class="text-gray-700">${escapeHtml(factor)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-3">Lawsuit Statistics</h4>
                        <div class="bg-red-50 p-4 rounded-lg">
                            <p class="text-red-800 font-semibold">${data.lawsuit_stats.annual_lawsuits} ADA lawsuits filed in 2024</p>
                            <p class="text-red-700 text-sm mt-1">${data.lawsuit_stats.industry_risk}</p>
                            <p class="text-red-600 text-sm mt-2">Average settlement: ${data.lawsuit_stats.average_settlement}</p>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 class="font-semibold text-blue-800 mb-2">Compliance Benefits</h4>
                    <ul class="text-blue-700 space-y-1">
                        <li><i class="fas fa-check mr-2"></i>Reduce legal liability and lawsuit risk</li>
                        <li><i class="fas fa-check mr-2"></i>Expand customer base to include disabled users</li>
                        <li><i class="fas fa-check mr-2"></i>Improve SEO and search engine rankings</li>
                        <li><i class="fas fa-check mr-2"></i>Enhance brand reputation and social responsibility</li>
                    </ul>
                </div>
            </div>
        `;
    }

    function getGradeColor(grade) {
        const colors = {
            'A': 'bg-green-500',
            'B': 'bg-blue-500',
            'C': 'bg-yellow-500',
            'D': 'bg-orange-500',
            'F': 'bg-red-500'
        };
        return colors[grade] || 'bg-gray-500';
    }

    function getRiskColor(risk) {
        const colors = {
            'LOW': 'bg-green-500',
            'MEDIUM': 'bg-yellow-500',
            'HIGH': 'bg-red-500',
            'CRITICAL': 'bg-red-700'
        };
        return colors[risk] || 'bg-gray-500';
    }

    function getGradeDescription(grade) {
        const descriptions = {
            'A': 'Excellent compliance',
            'B': 'Good compliance',
            'C': 'Fair compliance',
            'D': 'Poor compliance',
            'F': 'Failing compliance'
        };
        return descriptions[grade] || 'Unknown';
    }

    function getRiskDescription(risk) {
        const descriptions = {
            'LOW': 'Minimal lawsuit risk',
            'MEDIUM': 'Moderate lawsuit risk',
            'HIGH': 'High lawsuit risk',
            'CRITICAL': 'Critical lawsuit risk'
        };
        return descriptions[risk] || 'Unknown';
    }

    function generateReportHTML(data) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADA Compliance Report - ${escapeHtml(data.url)}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
        .grade-circle { width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2em; font-weight: bold; margin: 10px; }
        .grade-a { background-color: #10b981; }
        .grade-b { background-color: #3b82f6; }
        .grade-c { background-color: #f59e0b; }
        .grade-d { background-color: #f97316; }
        .grade-f { background-color: #ef4444; }
        .risk-high { background-color: #ef4444; }
        .risk-medium { background-color: #f59e0b; }
        .risk-low { background-color: #10b981; }
        .section { background: white; padding: 25px; margin-bottom: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .issue { border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 15px; background: #fef2f2; }
        .warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
        .success { border-left: 4px solid #10b981; background: #f0fdf4; }
        .code { background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace; overflow-x: auto; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { text-align: center; padding: 20px; background: #f8fafc; border-radius: 10px; }
        .stat-number { font-size: 2.5em; font-weight: bold; color: #3b82f6; }
        h1, h2, h3 { color: #1f2937; }
        .footer { text-align: center; margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ADA Compliance Analysis Report</h1>
        <p>Comprehensive WCAG 2.1 Assessment</p>
        <p><strong>Website:</strong> ${escapeHtml(data.url)}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <div style="margin-top: 20px;">
            <div class="grade-circle grade-${data.grade.toLowerCase()}">${data.grade}</div>
            <div class="grade-circle risk-${data.risk_level.toLowerCase()}">${data.risk_level}</div>
        </div>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${data.grade}</div>
                <div>Overall Grade</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.compliance_score}%</div>
                <div>Compliance Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.total_issues}</div>
                <div>Total Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.critical_issues}</div>
                <div>Critical Issues</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Business Impact Analysis</h2>
        <div class="warning">
            <h3>Potential User Exclusion</h3>
            <p>${escapeHtml(data.business_impact.user_exclusion)}</p>
            <p><strong>Impact:</strong> ${escapeHtml(data.business_impact.impact_description)}</p>
        </div>
    </div>

    <div class="section">
        <h2>Detailed Issues Found</h2>
        ${data.detailed_issues.map(issue => `
            <div class="${issue.severity === 'critical' ? 'issue' : 'warning'}">
                <h3>${escapeHtml(issue.title)} <span style="font-size: 0.8em; color: #666;">(${issue.wcag_reference})</span></h3>
                <p><strong>Description:</strong> ${escapeHtml(issue.description)}</p>
                <p><strong>How to Fix:</strong> ${escapeHtml(issue.fix_instruction)}</p>
                ${issue.code_example ? `
                    <p><strong>Code Example:</strong></p>
                    <div class="code">${escapeHtml(issue.code_example)}</div>
                ` : ''}
                <p><strong>Priority:</strong> ${issue.priority} | <strong>Estimated Fix Time:</strong> ${issue.estimated_time}</p>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Legal Risk Assessment</h2>
        <div class="warning">
            <h3>Risk Level: ${data.risk_level}</h3>
            <p><strong>Industry Risk Factors:</strong></p>
            <ul>
                ${data.risk_factors.map(factor => `<li>${escapeHtml(factor)}</li>`).join('')}
            </ul>
            <p><strong>Lawsuit Statistics:</strong> ${data.lawsuit_stats.annual_lawsuits} ADA lawsuits filed in 2024</p>
            <p><strong>Average Settlement:</strong> ${data.lawsuit_stats.average_settlement}</p>
        </div>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <div class="success">
            <h3>Next Steps</h3>
            <ul>
                ${data.recommendations.map(rec => `<li>${escapeHtml(rec)}</li>`).join('')}
            </ul>
        </div>
    </div>

    <div class="footer">
        <p><strong>ADA Compliance Checker</strong></p>
        <p>Professional accessibility analysis powered by WCAG 2.1 guidelines</p>
        <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>
        `;
    }

    // Make downloadReport globally accessible
    window.downloadReport = downloadReport;
    window.toggleExamples = toggleExamples;
});


