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
    quickScanBtn.addEventListener('click', async function(e) {
        e.preventDefault();
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
    fullAnalysisBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const url = document.getElementById('websiteUrl').value;
        const businessType = document.getElementById('businessType').value;
        
        if (!url) {
            alert('Please enter a website URL');
            return;
        }

        showLoading();
        simulateProgress();
        
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
        } catch (error) {
            console.error('Error:', error);
            hideLoading();
            resultsContainer.innerHTML = '<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error analyzing website. Please try again.</div>';
        }
    });

    function showLoading() {
        loadingContainer.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        if (riskAssessment) riskAssessment.classList.add('hidden');
    }

    function hideLoading() {
        loadingContainer.classList.add('hidden');
    }

    function simulateProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const messages = [
            'Initializing analysis...',
            'Analyzing images and alt text...',
            'Checking color contrast...',
            'Examining form accessibility...',
            'Evaluating heading structure...',
            'Assessing keyboard navigation...',
            'Generating compliance report...'
        ];
        
        let progress = 0;
        let messageIndex = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 95) progress = 95;
            
            if (progressBar) progressBar.style.width = progress + '%';
            
            if (messageIndex < messages.length - 1 && progress > (messageIndex + 1) * 14) {
                messageIndex++;
                if (progressText) progressText.textContent = messages[messageIndex];
            }
        }, 800);
        
        // Clear interval after analysis completes
        setTimeout(() => {
            clearInterval(interval);
            if (progressBar) progressBar.style.width = '100%';
            if (progressText) progressText.textContent = 'Analysis complete!';
        }, 8000);
    }

    function displayQuickResults(data) {
        hideLoading();
        
        const riskClass = data.risk_level === 'High' ? 'text-red-600' : 
                         data.risk_level === 'Medium' ? 'text-yellow-600' : 'text-green-600';
        
        resultsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-800">Quick Scan Results</h3>
                    <span class="px-3 py-1 rounded-full text-sm font-semibold ${riskClass} bg-gray-100">
                        ${data.risk_level} Risk
                    </span>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h4 class="font-semibold text-blue-800 mb-2">
                            <i class="fas fa-images mr-2"></i>Image Accessibility
                        </h4>
                        <p class="text-blue-700">${data.missing_alt_text} of ${data.total_images} images missing alt text</p>
                    </div>
                    
                    <div class="bg-purple-50 rounded-lg p-4">
                        <h4 class="font-semibold text-purple-800 mb-2">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Risk Assessment
                        </h4>
                        <p class="text-purple-700">${data.risk_level} legal risk level</p>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 class="font-semibold text-gray-800 mb-2">
                        <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>Recommendation
                    </h4>
                    <p class="text-gray-700">${data.recommendation}</p>
                </div>
                
                <div class="text-center">
                    <button id="runFullAnalysis" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200">
                        <i class="fas fa-search-plus mr-2"></i>Run Full Analysis
                    </button>
                </div>
            </div>
        `;
        
        resultsContainer.classList.remove('hidden');
        
        // Add event listener for full analysis button
        const runFullBtn = document.getElementById('runFullAnalysis');
        if (runFullBtn) {
            runFullBtn.addEventListener('click', function() {
                fullAnalysisBtn.click();
            });
        }
    }

    function displayFullResults(data) {
        hideLoading();
        
        // Store data globally for download function
        window.currentAnalysisData = data;
        
        const gradeClass = `grade-${data.grade.toLowerCase()}`;
        
        resultsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <!-- Header with Download Button -->
                <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-2xl font-bold mb-2">ADA Compliance Analysis</h3>
                            <p class="text-blue-100">Comprehensive accessibility audit for ${escapeHtml(data.url)}</p>
                        </div>
                        <button id="downloadReportBtn" class="bg-white text-blue-600 hover:bg-blue-50 font-bold py-2 px-4 rounded-lg transition duration-200">
                            <i class="fas fa-download mr-2"></i>Download Report
                        </button>
                    </div>
                </div>

                <!-- Score Overview -->
                <div class="p-6 border-b border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Score Overview</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <div class="${gradeClass} w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-2">
                                ${data.grade}
                            </div>
                            <p class="text-sm text-gray-600">Overall Grade</p>
                            <p class="text-xs text-gray-500">${data.status}</p>
                        </div>
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600 mb-2">${data.score}</div>
                            <p class="text-sm text-gray-600">Compliance Score</p>
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${data.score}%"></div>
                            </div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <div class="text-2xl font-bold text-red-600 mb-2">${data.critical_issues}</div>
                            <p class="text-sm text-gray-600">Critical Issues</p>
                        </div>
                        <div class="text-center p-4 bg-gray-50 rounded-lg">
                            <div class="text-2xl font-bold text-orange-600 mb-2">${data.risk_level}</div>
                            <p class="text-sm text-gray-600">Legal Risk</p>
                        </div>
                    </div>
                </div>

                <!-- Page Information -->
                <div class="p-6 border-b border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-info-circle mr-2 text-blue-600"></i>Page Information
                    </h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><strong>Page Title:</strong> ${escapeHtml(data.page_info.title)}</div>
                        <div><strong>Language:</strong> ${data.page_info.language}</div>
                        <div><strong>Images:</strong> ${data.page_info.total_images}</div>
                        <div><strong>Links:</strong> ${data.page_info.total_links}</div>
                        <div><strong>Headings:</strong> ${data.page_info.total_headings}</div>
                        <div><strong>Forms:</strong> ${data.page_info.total_forms}</div>
                        <div><strong>Skip Links:</strong> ${data.page_info.skip_links}</div>
                        <div><strong>Viewport Meta:</strong> ${data.page_info.viewport_meta}</div>
                    </div>
                </div>

                <!-- Issues Found -->
                <div class="p-6 border-b border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2 text-red-600"></i>Issues Found
                    </h4>
                    <div class="space-y-4">
                        ${data.issues.map((issue, index) => `
                            <div class="border-l-4 ${issue.type === 'critical' ? 'border-red-500 bg-red-50' : 
                                                   issue.type === 'warning' ? 'border-yellow-500 bg-yellow-50' : 
                                                   'border-blue-500 bg-blue-50'} p-4 rounded-r-lg">
                                <div class="flex justify-between items-start mb-2">
                                    <h5 class="font-semibold ${issue.type === 'critical' ? 'text-red-800' : 
                                                              issue.type === 'warning' ? 'text-yellow-800' : 
                                                              'text-blue-800'}">${issue.title || issue.category}</h5>
                                    <span class="text-xs px-2 py-1 rounded ${issue.type === 'critical' ? 'bg-red-200 text-red-800' : 
                                                                           issue.type === 'warning' ? 'bg-yellow-200 text-yellow-800' : 
                                                                           'bg-blue-200 text-blue-800'}">${issue.type.toUpperCase()}</span>
                                </div>
                                <p class="text-sm text-gray-700 mb-2"><strong>WCAG Guideline:</strong> ${issue.wcag_guideline}</p>
                                <p class="text-sm text-gray-700 mb-2">${issue.description}</p>
                                <p class="text-sm text-gray-700 mb-2"><strong>Impact:</strong> ${issue.impact}</p>
                                ${issue.business_impact ? `<p class="text-sm text-gray-700 mb-2"><strong>Business Impact:</strong> ${issue.business_impact}</p>` : ''}
                                ${issue.fix_instructions ? `
                                    <div class="mt-3">
                                        <button onclick="toggleExamples(${index})" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                            <i class="fas fa-chevron-down mr-1"></i>How to Fix
                                        </button>
                                        <div id="examples-${index}" style="display: none;" class="mt-2 p-3 bg-white rounded border">
                                            <p class="text-sm text-gray-700 mb-2">${issue.fix_instructions.immediate}</p>
                                            ${issue.fix_instructions.code_example ? `
                                                <div class="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono mt-2">
                                                    ${escapeHtml(issue.fix_instructions.code_example)}
                                                </div>
                                            ` : ''}
                                            ${issue.fix_instructions.estimated_time ? `
                                                <p class="text-xs text-gray-500 mt-2">Estimated fix time: ${issue.fix_instructions.estimated_time}</p>
                                            ` : ''}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Detailed Analysis -->
                <div class="p-6 border-b border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-chart-bar mr-2 text-green-600"></i>Detailed Analysis
                    </h4>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h5 class="font-semibold text-gray-800 mb-3">
                                <i class="fas fa-images mr-2 text-blue-600"></i>Image Analysis
                            </h5>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>Total Images:</span>
                                    <span class="font-semibold">${data.detailed_analysis.image_analysis.total_images}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Missing Alt Text:</span>
                                    <span class="font-semibold text-red-600">${data.detailed_analysis.image_analysis.missing_alt}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Decorative Images:</span>
                                    <span class="font-semibold">${data.detailed_analysis.image_analysis.decorative}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Complex Images:</span>
                                    <span class="font-semibold">${data.detailed_analysis.image_analysis.complex}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h5 class="font-semibold text-gray-800 mb-3">
                                <i class="fas fa-heading mr-2 text-purple-600"></i>Heading Structure
                            </h5>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>H1 Headings:</span>
                                    <span class="font-semibold">${data.detailed_analysis.heading_structure.h1_count}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>H2 Headings:</span>
                                    <span class="font-semibold">${data.detailed_analysis.heading_structure.h2_count}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>H3+ Headings:</span>
                                    <span class="font-semibold">${data.detailed_analysis.heading_structure.h3_plus_count}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Proper Hierarchy:</span>
                                    <span class="font-semibold ${data.detailed_analysis.heading_structure.proper_hierarchy ? 'text-green-600' : 'text-red-600'}">
                                        ${data.detailed_analysis.heading_structure.proper_hierarchy ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h5 class="font-semibold text-gray-800 mb-3">
                                <i class="fas fa-palette mr-2 text-orange-600"></i>Color Contrast
                            </h5>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>Elements Checked:</span>
                                    <span class="font-semibold">${data.detailed_analysis.color_contrast.elements_checked}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>AA Compliant:</span>
                                    <span class="font-semibold text-green-600">${data.detailed_analysis.color_contrast.aa_compliant}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>AAA Compliant:</span>
                                    <span class="font-semibold text-blue-600">${data.detailed_analysis.color_contrast.aaa_compliant}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Failures:</span>
                                    <span class="font-semibold text-red-600">${data.detailed_analysis.color_contrast.failures}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h5 class="font-semibold text-gray-800 mb-3">
                                <i class="fas fa-wpforms mr-2 text-teal-600"></i>Form Accessibility
                            </h5>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span>Total Forms:</span>
                                    <span class="font-semibold">${data.detailed_analysis.form_accessibility.total_forms}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Labeled Inputs:</span>
                                    <span class="font-semibold text-green-600">${data.detailed_analysis.form_accessibility.labeled_inputs}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Unlabeled Inputs:</span>
                                    <span class="font-semibold text-red-600">${data.detailed_analysis.form_accessibility.unlabeled_inputs}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Error Handling:</span>
                                    <span class="font-semibold ${data.detailed_analysis.form_accessibility.error_handling ? 'text-green-600' : 'text-red-600'}">
                                        ${data.detailed_analysis.form_accessibility.error_handling ? 'Present' : 'Missing'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary & Recommendations -->
                <div class="p-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-clipboard-list mr-2 text-indigo-600"></i>Summary & Recommendations
                    </h4>
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 class="font-semibold text-gray-800 mb-2">Legal Risk Assessment</h5>
                        <p class="text-gray-700 text-sm">${data.summary.legal_risk_assessment}</p>
                    </div>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <h5 class="font-semibold text-gray-800 mb-3">Priority Actions</h5>
                            <ul class="space-y-2 text-sm">
                                ${data.summary.priority_actions.map(action => `
                                    <li class="flex items-start">
                                        <i class="fas fa-arrow-right mr-2 mt-1 text-xs text-red-600"></i>
                                        ${action}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div>
                            <h5 class="font-semibold text-gray-800 mb-3">Next Steps</h5>
                            <ol class="space-y-2 text-sm">
                                ${data.summary.next_steps.map((step, index) => `
                                    <li class="flex items-start">
                                        <span class="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">${index + 1}</span>
                                        ${step}
                                    </li>
                                `).join('')}
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.classList.remove('hidden');
        
        // Add event listener for download button (FIXED APPROACH)
        const downloadBtn = document.getElementById('downloadReportBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadReport);
        }
        
        displayRiskAssessment(data);
    }

    function displayRiskAssessment(data) {
        const container = document.getElementById('riskAssessmentContent');
        if (!container) return;
        
        const riskClass = data.overall_risk === 'High' ? 'text-red-600' : 
                         data.overall_risk === 'Medium' ? 'text-yellow-600' : 'text-green-600';
        
        container.className = `p-6 rounded-lg border-2 ${data.overall_risk === 'High' ? 'border-red-200 bg-red-50' : 
                                                        data.overall_risk === 'Medium' ? 'border-yellow-200 bg-yellow-50' : 
                                                        'border-green-200 bg-green-50'} risk-${data.overall_risk.toLowerCase()}`;
        
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

    function generateReportHTML(data) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADA Compliance Report - ${escapeHtml(data.url)}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8fafc; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { margin: 0 0 10px 0; font-size: 2.5em; }
        .header p { margin: 5px 0; opacity: 0.9; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { background: white; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .metric-card h2 { margin: 10px 0; font-size: 2.5em; }
        .metric-card h3 { margin: 10px 0; color: #374151; }
        .grade-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 2.5em; font-weight: bold; color: white; }
        .grade-a { background: #10b981; }
        .grade-b { background: #3b82f6; }
        .grade-c { background: #f59e0b; }
        .grade-d { background: #ef4444; }
        .grade-f { background: #dc2626; }
        .section { background: white; margin: 20px 0; padding: 25px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
        .issue { background: #fef2f2; border-left: 5px solid #ef4444; padding: 20px; margin: 15px 0; border-radius: 0 8px 8px 0; }
        .warning { background: #fffbeb; border-left-color: #f59e0b; }
        .info { background: #eff6ff; border-left-color: #3b82f6; }
        .issue h3 { margin: 0 0 10px 0; color: #1f2937; }
        .issue p { margin: 8px 0; }
        .code-block { background: #1f2937; color: #10b981; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; margin: 10px 0; overflow-x: auto; }
        .priority-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .priority-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .footer { background: #374151; color: white; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-item { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 1.8em; font-weight: bold; color: #1e40af; }
        .stat-label { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ADA Compliance Report</h1>
        <p><strong>Website:</strong> ${escapeHtml(data.url)}</p>
        <p><strong>Analysis Date:</strong> ${new Date(data.timestamp).toLocaleDateString()}</p>
        <p><strong>Business Type:</strong> ${data.business_type || 'General Business'}</p>
    </div>
    
    <div class="metric-grid">
        <div class="metric-card">
            <div class="grade-circle grade-${data.grade.toLowerCase()}">
                ${data.grade}
            </div>
            <h3>Overall Grade</h3>
            <p>${data.status}</p>
        </div>
        <div class="metric-card">
            <h2 style="color: #3b82f6;">${data.score}</h2>
            <h3>Compliance Score</h3>
            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin-top: 10px;">
                <div style="background: #3b82f6; height: 8px; border-radius: 4px; width: ${data.score}%;"></div>
            </div>
        </div>
        <div class="metric-card">
            <h2 style="color: #ef4444;">${data.critical_issues}</h2>
            <h3>Critical Issues</h3>
        </div>
        <div class="metric-card">
            <h2 style="color: #f59e0b;">${data.risk_level}</h2>
            <h3>Legal Risk Level</h3>
        </div>
    </div>

    <div class="section">
        <h2>📊 Website Statistics</h2>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${data.page_info.total_images}</div>
                <div class="stat-label">Total Images</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.page_info.total_links}</div>
                <div class="stat-label">Total Links</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.page_info.total_headings}</div>
                <div class="stat-label">Headings</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${data.page_info.total_forms}</div>
                <div class="stat-label">Forms</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>🚨 Issues Found</h2>
        ${data.issues.map(issue => `
            <div class="issue ${issue.type === 'warning' ? 'warning' : issue.type === 'info' ? 'info' : ''}">
                <h3>${issue.title || issue.category}</h3>
                <p><strong>WCAG Guideline:</strong> ${issue.wcag_guideline}</p>
                <p><strong>Description:</strong> ${issue.description}</p>
                <p><strong>Impact:</strong> ${issue.impact}</p>
                ${issue.business_impact ? `<p><strong>Business Impact:</strong> ${issue.business_impact}</p>` : ''}
                ${issue.fix_instructions ? `
                    <div style="margin-top: 15px;">
                        <h4 style="color: #059669;">🔧 How to Fix:</h4>
                        <p>${issue.fix_instructions.immediate}</p>
                        ${issue.fix_instructions.code_example ? `
                            <div class="code-block">${escapeHtml(issue.fix_instructions.code_example)}</div>
                        ` : ''}
                        ${issue.fix_instructions.estimated_time ? `
                            <p><strong>⏱️ Estimated Fix Time:</strong> ${issue.fix_instructions.estimated_time}</p>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>📋 Executive Summary</h2>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #92400e;">⚖️ Legal Risk Assessment</h3>
            <p style="margin-bottom: 0;">${data.summary.legal_risk_assessment}</p>
        </div>
        
        <div class="priority-grid">
            <div class="priority-card">
                <h3 style="margin-top: 0; color: #1e40af;">🎯 Priority Actions</h3>
                <ul style="padding-left: 20px;">
                    ${data.summary.priority_actions.map(action => `<li style="margin: 8px 0;">${action}</li>`).join('')}
                </ul>
            </div>
            
            <div class="priority-card">
                <h3 style="margin-top: 0; color: #1e40af;">📝 Next Steps</h3>
                <ol style="padding-left: 20px;">
                    ${data.summary.next_steps.map(step => `<li style="margin: 8px 0;">${step}</li>`).join('')}
                </ol>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📊 Detailed Analysis Breakdown</h2>
        <div class="priority-grid">
            <div class="priority-card">
                <h3 style="color: #3b82f6;">🖼️ Image Analysis</h3>
                <p><strong>Total Images:</strong> ${data.detailed_analysis.image_analysis.total_images}</p>
                <p><strong>Missing Alt Text:</strong> <span style="color: #ef4444;">${data.detailed_analysis.image_analysis.missing_alt}</span></p>
                <p><strong>Decorative Images:</strong> ${data.detailed_analysis.image_analysis.decorative}</p>
                <p><strong>Complex Images:</strong> ${data.detailed_analysis.image_analysis.complex}</p>
            </div>
            
            <div class="priority-card">
                <h3 style="color: #7c3aed;">📝 Heading Structure</h3>
                <p><strong>H1 Headings:</strong> ${data.detailed_analysis.heading_structure.h1_count}</p>
                <p><strong>H2 Headings:</strong> ${data.detailed_analysis.heading_structure.h2_count}</p>
                <p><strong>H3+ Headings:</strong> ${data.detailed_analysis.heading_structure.h3_plus_count}</p>
                <p><strong>Proper Hierarchy:</strong> <span style="color: ${data.detailed_analysis.heading_structure.proper_hierarchy ? '#10b981' : '#ef4444'};">${data.detailed_analysis.heading_structure.proper_hierarchy ? 'Yes' : 'No'}</span></p>
            </div>
            
            <div class="priority-card">
                <h3 style="color: #f59e0b;">🎨 Color Contrast</h3>
                <p><strong>Elements Checked:</strong> ${data.detailed_analysis.color_contrast.elements_checked}</p>
                <p><strong>AA Compliant:</strong> <span style="color: #10b981;">${data.detailed_analysis.color_contrast.aa_compliant}</span></p>
                <p><strong>AAA Compliant:</strong> <span style="color: #3b82f6;">${data.detailed_analysis.color_contrast.aaa_compliant}</span></p>
                <p><strong>Failures:</strong> <span style="color: #ef4444;">${data.detailed_analysis.color_contrast.failures}</span></p>
            </div>
            
            <div class="priority-card">
                <h3 style="color: #059669;">📝 Form Accessibility</h3>
                <p><strong>Total Forms:</strong> ${data.detailed_analysis.form_accessibility.total_forms}</p>
                <p><strong>Labeled Inputs:</strong> <span style="color: #10b981;">${data.detailed_analysis.form_accessibility.labeled_inputs}</span></p>
                <p><strong>Unlabeled Inputs:</strong> <span style="color: #ef4444;">${data.detailed_analysis.form_accessibility.unlabeled_inputs}</span></p>
                <p><strong>Error Handling:</strong> <span style="color: ${data.detailed_analysis.form_accessibility.error_handling ? '#10b981' : '#ef4444'};">${data.detailed_analysis.form_accessibility.error_handling ? 'Present' : 'Missing'}</span></p>
            </div>
        </div>
    </div>

    <div class="footer">
        <h3>📄 Report Information</h3>
        <p><strong>Generated by:</strong> ADA Compliance Checker</p>
        <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Analysis Type:</strong> Comprehensive Accessibility Audit</p>
        <p style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
            This report provides an automated analysis of accessibility issues based on WCAG 2.1 guidelines. 
            For comprehensive compliance and legal protection, consider professional accessibility auditing services.
        </p>
    </div>
</body>
</html>
        `;
    }

    // Make functions available globally for onclick handlers
    window.toggleExamples = toggleExamples;
});
