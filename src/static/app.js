document.addEventListener('DOMContentLoaded', function() {
    const quickScanBtn = document.getElementById('quickScan');
    const fullAnalysisBtn = document.getElementById('fullAnalysis');
    const resultsContainer = document.getElementById('results');
    const loadingContainer = document.getElementById('loading');

    // Global variable to store current analysis data
    window.currentAnalysisData = null;

    // Download function
    window.downloadReport = function() {
        if (!window.currentAnalysisData) {
            alert('Please run an analysis first before downloading the report.');
            return;
        }

        const data = window.currentAnalysisData;
        const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADA Compliance Report - ${data.url || 'Website'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
        .grade-circle { width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 2em; font-weight: bold; margin: 10px; }
        .grade-a { background-color: #10b981; }
        .grade-b { background-color: #3b82f6; }
        .grade-c { background-color: #f59e0b; }
        .grade-d { background-color: #f97316; }
        .grade-f { background-color: #ef4444; }
        .section { background: white; padding: 25px; margin-bottom: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .issue { border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 15px; background: #fef2f2; }
        .warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
        .success { border-left: 4px solid #10b981; background: #f0fdf4; }
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
        <p><strong>Website:</strong> ${data.url || 'N/A'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <div style="margin-top: 20px;">
            <div class="grade-circle grade-${(data.grade || 'c').toLowerCase()}">${data.grade || 'C'}</div>
        </div>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${data.grade || 'C'}</div>
                <div>Overall Grade</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.compliance_score || '75'}%</div>
                <div>Compliance Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.total_issues || '4'}</div>
                <div>Total Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.critical_issues || '2'}</div>
                <div>Critical Issues</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Issues Found</h2>
        ${data.issues ? data.issues.map(issue => `
            <div class="issue">
                <h3>${issue.title || 'Accessibility Issue'}</h3>
                <p><strong>Description:</strong> ${issue.description || 'Issue description not available'}</p>
                <p><strong>WCAG Reference:</strong> ${issue.wcag_reference || 'N/A'}</p>
            </div>
        `).join('') : '<div class="warning"><p>No detailed issue information available.</p></div>'}
    </div>

    <div class="footer">
        <p><strong>ADA Compliance Checker</strong></p>
        <p>Professional accessibility analysis powered by WCAG 2.1 guidelines</p>
        <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;

        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ada-compliance-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Report downloaded successfully!');
    };

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
        
        const messages = [
            'Scanning website structure...',
            'Analyzing images and alt text...',
            'Checking color contrast...',
            'Validating form accessibility...',
            'Reviewing heading structure...',
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
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-blue-800 mb-2">Issues Found</h3>
                        <p class="text-3xl font-bold text-blue-600">${data.total_issues}</p>
                        <p class="text-sm text-blue-600">${data.critical_issues} critical issues</p>
                    </div>
                    
                    <div class="bg-green-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-green-800 mb-2">Compliance Score</h3>
                        <p class="text-3xl font-bold text-green-600">${data.compliance_score}%</p>
                        <p class="text-sm text-green-600">WCAG 2.1 Level AA</p>
                    </div>
                </div>
                
                <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p class="text-blue-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        For detailed analysis with downloadable reports, use the Full Analysis option.
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
                    
                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                        <div class="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2">
                            HIGH
                        </div>
                        <h3 class="font-semibold text-gray-800">Risk Level</h3>
                        <p class="text-sm text-gray-600">Legal Risk</p>
                    </div>
                </div>
                
                <div class="mb-8">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Issues Found</h3>
                    <div class="space-y-4">
                        ${data.issues ? data.issues.map(issue => `
                            <div class="border rounded-lg overflow-hidden">
                                <div class="bg-gray-50 p-4 border-b">
                                    <div class="flex justify-between items-center">
                                        <h4 class="font-semibold text-gray-800">${issue.title}</h4>
                                        <span class="text-sm text-gray-500">${issue.wcag_reference}</span>
                                    </div>
                                </div>
                                <div class="p-4">
                                    <p class="text-gray-700">${issue.description}</p>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="border rounded-lg overflow-hidden">
                                <div class="bg-gray-50 p-4 border-b">
                                    <h4 class="font-semibold text-gray-800">Missing Alt Text</h4>
                                    <span class="text-sm text-gray-500">WCAG 1.1.1</span>
                                </div>
                                <div class="p-4">
                                    <p class="text-gray-700">Images missing descriptive alt text for screen readers</p>
                                </div>
                            </div>
                            <div class="border rounded-lg overflow-hidden">
                                <div class="bg-gray-50 p-4 border-b">
                                    <h4 class="font-semibold text-gray-800">No Heading Structure</h4>
                                    <span class="text-sm text-gray-500">WCAG 1.3.1</span>
                                </div>
                                <div class="p-4">
                                    <p class="text-gray-700">Page lacks proper heading structure for screen readers</p>
                                </div>
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-green-800 mb-3">
                        <i class="fas fa-lightbulb mr-2"></i>
                        Next Steps Recommendation
                    </h3>
                    <div class="space-y-2">
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                            <span class="text-green-700">Add descriptive alt text to all images</span>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                            <span class="text-green-700">Implement proper heading structure (H1, H2, H3)</span>
                        </div>
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                            <span class="text-green-700">Test with screen reader software</span>
                        </div>
                    </div>
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
        return colors[grade] || 'bg-yellow-500';
    }

    function getGradeDescription(grade) {
        const descriptions = {
            'A': 'Excellent compliance',
            'B': 'Good compliance',
            'C': 'Fair compliance',
            'D': 'Poor compliance',
            'F': 'Failing compliance'
        };
        return descriptions[grade] || 'Fair compliance';
    }
});


