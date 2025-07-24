// ADA Compliance Checker Frontend JavaScript

class ADAComplianceChecker {
    constructor() {
        this.apiBase = '/api/compliance';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const form = document.getElementById('analysisForm');
        const quickScanBtn = document.getElementById('quickScanBtn');

        form.addEventListener('submit', (e) => this.handleFullAnalysis(e));
        quickScanBtn.addEventListener('click', () => this.handleQuickScan());
    }

    showLoading() {
        document.getElementById('loading').classList.add('active');
        document.getElementById('results').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.remove('active');
        document.getElementById('results').classList.remove('hidden');
    }

    async handleQuickScan() {
        const url = document.getElementById('website-url').value.trim();
        
        if (!url) {
            alert('Please enter a website URL');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.apiBase}/quick-scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (response.ok) {
                this.displayQuickResults(data);
            } else {
                this.displayError(data.error || 'Quick scan failed');
            }
        } catch (error) {
            this.displayError('Network error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleFullAnalysis(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const url = formData.get('url').trim();
        const businessType = formData.get('business_type');

        if (!url) {
            alert('Please enter a website URL');
            return;
        }

        this.showLoading();

        try {
            // Run full analysis
            const analysisResponse = await fetch(`${this.apiBase}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const analysisData = await analysisResponse.json();

            if (!analysisResponse.ok) {
                this.displayError(analysisData.error || 'Analysis failed');
                return;
            }

            // Run risk assessment
            const riskResponse = await fetch(`${this.apiBase}/business-risk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, business_type: businessType })
            });

            const riskData = await riskResponse.json();

            this.displayFullResults(analysisData);
            
            if (riskResponse.ok) {
                this.displayRiskAssessment(riskData);
            }

        } catch (error) {
            this.displayError('Network error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayQuickResults(data) {
        const container = document.getElementById('quickResults');
        const content = document.getElementById('quickResultsContent');

        const riskClass = `risk-${data.risk_level.toLowerCase()}`;
        const riskIcon = data.risk_level === 'High' ? 'fas fa-exclamation-triangle' : 
                        data.risk_level === 'Medium' ? 'fas fa-exclamation-circle' : 
                        'fas fa-check-circle';

        content.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div class="text-center p-6 bg-gray-50 rounded-lg">
                    <div class="text-3xl ${riskClass} mb-2">
                        <i class="${riskIcon}"></i>
                    </div>
                    <h4 class="text-xl font-semibold mb-2">Risk Level</h4>
                    <p class="text-2xl font-bold ${riskClass}">${data.risk_level}</p>
                </div>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">Images without alt text:</span>
                        <span class="font-bold ${data.missing_alt_text > 0 ? 'text-red-600' : 'text-green-600'}">
                            ${data.missing_alt_text} / ${data.total_images}
                        </span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">Potential contrast issues:</span>
                        <span class="font-bold ${data.potential_contrast_issues > 0 ? 'text-orange-600' : 'text-green-600'}">
                            ${data.potential_contrast_issues}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 class="font-semibold text-blue-800 mb-2">Recommendation:</h5>
                <p class="text-blue-700">${data.recommendation}</p>
            </div>

            ${data.risk_level !== 'Low' ? `
                <div class="mt-6 text-center">
                    <button onclick="document.querySelector('form').dispatchEvent(new Event('submit'))" 
                            class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Run Full Analysis - High Risk Detected
                    </button>
                </div>
            ` : ''}
        `;

        container.classList.remove('hidden');
    }

    displayFullResults(data) {
        const container = document.getElementById('fullResults');
        const content = document.getElementById('fullResultsContent');

        const gradeColor = data.grade === 'A' ? 'text-green-600' :
                          data.grade === 'B' ? 'text-blue-600' :
                          data.grade === 'C' ? 'text-yellow-600' : 'text-red-600';

        let issuesHtml = '';
        if (data.issues && data.issues.length > 0) {
            issuesHtml = data.issues.map(issue => `
                <div class="border border-gray-200 rounded-lg p-6 mb-4">
                    <div class="flex items-center justify-between mb-4">
                        <h5 class="text-lg font-semibold ${issue.type === 'critical' ? 'text-red-600' : 'text-orange-600'}">
                            <i class="fas ${issue.type === 'critical' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'} mr-2"></i>
                            ${issue.category}
                        </h5>
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${issue.type === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}">
                            ${issue.count} issues
                        </span>
                    </div>
                    
                    <p class="text-gray-700 mb-3">${issue.description}</p>
                    
                    <div class="bg-gray-50 rounded p-3 mb-3">
                        <p class="text-sm text-gray-600 mb-1"><strong>Impact:</strong> ${issue.impact}</p>
                        <p class="text-sm text-gray-600"><strong>WCAG Guideline:</strong> ${issue.wcag_guideline}</p>
                    </div>
                    
                    <div class="bg-green-50 border border-green-200 rounded p-3">
                        <p class="text-sm text-green-800"><strong>How to fix:</strong> ${issue.fix_suggestion}</p>
                    </div>
                    
                    ${issue.examples && issue.examples.length > 0 ? `
                        <details class="mt-3">
                            <summary class="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                View examples (${issue.examples.length})
                            </summary>
                            <div class="mt-2 space-y-2">
                                ${issue.examples.map(example => `
                                    <div class="bg-gray-100 p-2 rounded text-xs font-mono">
                                        ${typeof example === 'string' ? example : JSON.stringify(example, null, 2)}
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    ` : ''}
                </div>
            `).join('');
        } else {
            issuesHtml = `
                <div class="text-center py-8">
                    <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                    <h4 class="text-xl font-semibold text-green-600 mb-2">Great Job!</h4>
                    <p class="text-gray-600">No major accessibility issues detected in our analysis.</p>
                </div>
            `;
        }

        content.innerHTML = `
            <div class="grid md:grid-cols-3 gap-6 mb-8">
                <div class="text-center p-6 bg-gray-50 rounded-lg">
                    <div class="text-4xl ${gradeColor} mb-2 font-bold">${data.grade}</div>
                    <h4 class="text-lg font-semibold mb-1">Overall Grade</h4>
                    <p class="text-sm text-gray-600">${data.status}</p>
                </div>
                <div class="text-center p-6 bg-gray-50 rounded-lg">
                    <div class="text-4xl text-blue-600 mb-2 font-bold">${data.score}</div>
                    <h4 class="text-lg font-semibold mb-1">Compliance Score</h4>
                    <p class="text-sm text-gray-600">Out of 100</p>
                </div>
                <div class="text-center p-6 bg-gray-50 rounded-lg">
                    <div class="text-4xl ${data.critical_issues > 0 ? 'text-red-600' : 'text-green-600'} mb-2 font-bold">
                        ${data.critical_issues}
                    </div>
                    <h4 class="text-lg font-semibold mb-1">Critical Issues</h4>
                    <p class="text-sm text-gray-600">${data.warnings} warnings</p>
                </div>
            </div>

            <div class="mb-6">
                <h4 class="text-xl font-semibold mb-4">Detailed Issues</h4>
                ${issuesHtml}
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 class="font-semibold text-blue-800 mb-2">Analysis Summary:</h5>
                <p class="text-blue-700">
                    Analyzed ${data.total_elements_checked} elements on ${data.url}. 
                    ${data.critical_issues === 0 ? 'Your website shows good accessibility practices!' : 
                      `Found ${data.critical_issues} critical issues that should be addressed immediately.`}
                </p>
                <p class="text-xs text-blue-600 mt-2">Analysis completed: ${data.timestamp}</p>
            </div>
        `;

        container.classList.remove('hidden');
    }

    displayRiskAssessment(data) {
        const container = document.getElementById('riskAssessment');
        const content = document.getElementById('riskAssessmentContent');

        const riskClass = `risk-${data.overall_risk}`;
        const riskIcon = data.overall_risk === 'high' ? 'fas fa-exclamation-triangle' : 
                        data.overall_risk === 'medium' ? 'fas fa-exclamation-circle' : 
                        'fas fa-shield-alt';

        const recommendations = data.recommendations.filter(rec => rec !== null);

        content.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div class="text-center p-6 bg-gray-50 rounded-lg">
                    <div class="text-4xl ${riskClass} mb-3">
                        <i class="${riskIcon}"></i>
                    </div>
                    <h4 class="text-xl font-semibold mb-2">Legal Risk Level</h4>
                    <p class="text-2xl font-bold ${riskClass} capitalize">${data.overall_risk}</p>
                </div>
                <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">Compliance Score:</span>
                        <span class="font-bold">${data.compliance_summary.score}/100</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">Critical Issues:</span>
                        <span class="font-bold text-red-600">${data.compliance_summary.critical_issues}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">Business Type Risk:</span>
                        <span class="font-bold capitalize risk-${data.risk_factors.business_type_risk}">
                            ${data.risk_factors.business_type_risk}
                        </span>
                    </div>
                </div>
            </div>

            ${data.overall_risk === 'high' ? `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h5 class="font-semibold text-red-800 mb-2">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        High Risk Warning
                    </h5>
                    <p class="text-red-700">
                        Your website has significant accessibility issues that put your business at high risk for ADA lawsuits. 
                        Immediate action is recommended to protect your business.
                    </p>
                </div>
            ` : data.overall_risk === 'medium' ? `
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <h5 class="font-semibold text-orange-800 mb-2">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        Medium Risk Notice
                    </h5>
                    <p class="text-orange-700">
                        Your website has some accessibility issues that should be addressed to reduce legal risk.
                    </p>
                </div>
            ` : `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h5 class="font-semibold text-green-800 mb-2">
                        <i class="fas fa-check-circle mr-2"></i>
                        Low Risk Status
                    </h5>
                    <p class="text-green-700">
                        Your website shows good accessibility practices with minimal legal risk.
                    </p>
                </div>
            `}

            ${recommendations.length > 0 ? `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 class="font-semibold text-blue-800 mb-3">Priority Recommendations:</h5>
                    <ul class="space-y-2">
                        ${recommendations.map(rec => `
                            <li class="text-blue-700">
                                <i class="fas fa-arrow-right mr-2"></i>
                                ${rec}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;

        container.classList.remove('hidden');
    }

    displayError(message) {
        const container = document.getElementById('results');
        container.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-3xl text-red-600 mb-4"></i>
                <h3 class="text-xl font-semibold text-red-800 mb-2">Analysis Failed</h3>
                <p class="text-red-700">${message}</p>
                <button onclick="location.reload()" class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                    Try Again
                </button>
            </div>
        `;
        container.classList.remove('hidden');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ADAComplianceChecker();
});

