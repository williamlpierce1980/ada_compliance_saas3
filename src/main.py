from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADA Compliance Checker</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #007cba 0%, #0056b3 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .input-group {
            margin-bottom: 30px;
        }
        
        .input-group label {
            display: block;
            margin-bottom: 10px;
            font-weight: bold;
            color: #333;
        }
        
        .input-group input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .input-group input:focus {
            outline: none;
            border-color: #007cba;
        }
        
        .button-group {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .btn {
            flex: 1;
            padding: 15px 25px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: #007cba;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #545b62;
            transform: translateY(-2px);
        }
        
        .results {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #007cba;
        }
        
        .loading {
            text-align: center;
            color: #666;
        }
        
        .error {
            background: #f8d7da;
            border-left-color: #dc3545;
            color: #721c24;
        }
        
        .success {
            background: #d4edda;
            border-left-color: #28a745;
            color: #155724;
        }
        
        .issue-item {
            background: white;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
            border-left: 3px solid #dc3545;
        }
        
        .grade {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 1.2em;
        }
        
        .grade-a { background: #28a745; color: white; }
        .grade-b { background: #ffc107; color: black; }
        .grade-c { background: #fd7e14; color: white; }
        .grade-f { background: #dc3545; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ ADA Compliance Checker</h1>
            <p>Protect your business from accessibility lawsuits</p>
        </div>
        
        <div class="content">
            <div class="input-group">
                <label for="urlInput">Website URL to Analyze:</label>
                <input type="text" id="urlInput" placeholder="https://example.com" value="">
            </div>
            
            <div class="button-group">
                <button class="btn btn-primary" onclick="quickScan()">Quick Scan</button>
                <button class="btn btn-secondary" onclick="fullAnalysis()">Full Analysis</button>
            </div>
            
            <div id="results"></div>
        </div>
    </div>
    
    <script>
        function quickScan() {
            analyzeWebsite('quick');
        }
        
        function fullAnalysis() {
            analyzeWebsite('full');
        }
        
        function analyzeWebsite(type) {
            const url = document.getElementById('urlInput').value.trim();
            const results = document.getElementById('results');
            
            if (!url) {
                results.innerHTML = '<div class="results error">Please enter a website URL</div>';
                return;
            }
            
            results.innerHTML = '<div class="results loading">🔍 Analyzing website for accessibility issues...</div>';
            
            fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    type: type
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    results.innerHTML = '<div class="results error"><strong>Error:</strong> ' + data.error + '</div>';
                } else {
                    displayResults(data);
                }
            })
            .catch(error => {
                results.innerHTML = '<div class="results error"><strong>Error:</strong> Unable to analyze website. Please check the URL and try again.</div>';
            });
        }
        
        function displayResults(data) {
            const results = document.getElementById('results');
            const gradeClass = 'grade-' + data.grade.toLowerCase();
            
            let html = '<div class="results success">';
            html += '<h3>📊 Analysis Results</h3>';
            html += '<p><strong>Website:</strong> ' + data.url + '</p>';
            html += '<p><strong>Issues Found:</strong> ' + data.total_issues + '</p>';
            html += '<p><strong>Compliance Grade:</strong> <span class="grade ' + gradeClass + '">' + data.grade + '</span></p>';
            
            if (data.issues && data.issues.length > 0) {
                html += '<h4>🚨 Issues Detected:</h4>';
                data.issues.forEach(issue => {
                    html += '<div class="issue-item">';
                    html += '<strong>' + issue.type + '</strong> (' + issue.severity + ')<br>';
                    html += issue.description;
                    html += '</div>';
                });
            }
            
            html += '<p style="margin-top: 20px;"><em>💡 Contact us for detailed remediation guidance and ongoing compliance monitoring.</em></p>';
            html += '</div>';
            
            results.innerHTML = html;
        }
    </script>
</body>
</html>
    '''

@app.route('/analyze', methods=['POST'])
def analyze_website():
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        analysis_type = data.get('type', 'quick')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Validate URL format
        if not re.match(r'^https?://.+\..+', url):
            return jsonify({'error': 'Please enter a valid URL'}), 400
        
        # Fetch website content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Perform accessibility analysis
        issues = []
        
        # Check 1: Images without alt text
        images = soup.find_all('img')
        images_without_alt = [img for img in images if not img.get('alt') or img.get('alt').strip() == '']
        if images_without_alt:
            issues.append({
                'type': 'Missing Alt Text',
                'severity': 'High',
                'count': len(images_without_alt),
                'description': f'{len(images_without_alt)} images missing descriptive alt text (WCAG 1.1.1)'
            })
        
        # Check 2: Missing page title
        title = soup.find('title')
        if not title or not title.get_text().strip():
            issues.append({
                'type': 'Missing Page Title',
                'severity': 'High',
                'count': 1,
                'description': 'Page is missing a descriptive title (WCAG 2.4.2)'
            })
        
        # Check 3: Heading structure
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        h1_count = len(soup.find_all('h1'))
        
        if not headings:
            issues.append({
                'type': 'No Heading Structure',
                'severity': 'Medium',
                'count': 1,
                'description': 'Page lacks proper heading structure for screen readers (WCAG 1.3.1)'
            })
        elif h1_count == 0:
            issues.append({
                'type': 'Missing H1 Heading',
                'severity': 'Medium',
                'count': 1,
                'description': 'Page missing main H1 heading (WCAG 1.3.1)'
            })
        elif h1_count > 1:
            issues.append({
                'type': 'Multiple H1 Headings',
                'severity': 'Medium',
                'count': h1_count,
                'description': f'Page has {h1_count} H1 headings, should have only one (WCAG 1.3.1)'
            })
        
        # Check 4: Form labels
        inputs = soup.find_all(['input', 'textarea', 'select'])
        inputs_without_labels = []
        for input_elem in inputs:
            input_type = input_elem.get('type', '').lower()
            if input_type in ['hidden', 'submit', 'button']:
                continue
            
            input_id = input_elem.get('id')
            aria_label = input_elem.get('aria-label')
            aria_labelledby = input_elem.get('aria-labelledby')
            
            has_label = False
            if input_id:
                label = soup.find('label', {'for': input_id})
                if label:
                    has_label = True
            
            if not has_label and not aria_label and not aria_labelledby:
                inputs_without_labels.append(input_elem)
        
        if inputs_without_labels:
            issues.append({
                'type': 'Form Inputs Without Labels',
                'severity': 'High',
                'count': len(inputs_without_labels),
                'description': f'{len(inputs_without_labels)} form inputs missing proper labels (WCAG 1.3.1)'
            })
        
        # Check 5: Links without descriptive text
        links = soup.find_all('a', href=True)
        vague_links = []
        vague_text = ['click here', 'read more', 'more', 'here', 'link', 'this']
        
        for link in links:
            link_text = link.get_text().strip().lower()
            if link_text in vague_text or len(link_text) < 3:
                vague_links.append(link)
        
        if vague_links:
            issues.append({
                'type': 'Non-Descriptive Link Text',
                'severity': 'Medium',
                'count': len(vague_links),
                'description': f'{len(vague_links)} links with vague text like "click here" (WCAG 2.4.4)'
            })
        
        # Calculate grade
        total_issues = len(issues)
        if total_issues == 0:
            grade = 'A'
        elif total_issues <= 2:
            grade = 'B'
        elif total_issues <= 5:
            grade = 'C'
        else:
            grade = 'F'
        
        return jsonify({
            'url': url,
            'issues': issues,
            'total_issues': total_issues,
            'grade': grade,
            'analysis_type': analysis_type,
            'timestamp': response.headers.get('date', 'Unknown')
        })
        
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Website took too long to respond. Please try again.'}), 408
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Unable to connect to website. Please check the URL.'}), 503
    except requests.exceptions.HTTPError as e:
        return jsonify({'error': f'Website returned error: {e.response.status_code}'}), 400
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred during analysis.'}), 500

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': 'ADA Compliance Checker'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
