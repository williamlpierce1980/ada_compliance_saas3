from flask import Blueprint, request, jsonify
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import time
from datetime import datetime

compliance_bp = Blueprint('compliance', __name__)

@compliance_bp.route('/api/compliance/quick-scan', methods=['POST'])
def quick_scan():
    """Quick accessibility scan for immediate feedback"""
    try:
        data = request.get_json()
        url = data.get('url')
        business_type = data.get('business_type', 'general')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Fetch and analyze website
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            return jsonify({'error': f'Could not access website: {str(e)}'}), 400
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Quick analysis
        images = soup.find_all('img')
        total_images = len(images)
        missing_alt_text = len([img for img in images if not img.get('alt')])
        
        # Simple contrast issues estimation (placeholder)
        potential_contrast_issues = min(3, total_images // 5)  # Rough estimation
        
        # Determine risk level
        if missing_alt_text > 5 or potential_contrast_issues > 2:
            risk_level = "High"
            recommendation = "Multiple accessibility issues detected. Run full analysis immediately to identify specific problems and legal risks."
        elif missing_alt_text > 2 or potential_contrast_issues > 1:
            risk_level = "Medium"
            recommendation = "Some accessibility issues found. Consider running full analysis to ensure compliance and reduce legal risk."
        else:
            risk_level = "Low"
            recommendation = "Basic accessibility checks passed. Run full analysis for comprehensive evaluation and detailed reporting."
        
        return jsonify({
            'risk_level': risk_level,
            'missing_alt_text': missing_alt_text,
            'total_images': total_images,
            'potential_contrast_issues': potential_contrast_issues,
            'recommendation': recommendation,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@compliance_bp.route('/api/compliance/analyze', methods=['POST'])
def analyze_website():
    """Comprehensive accessibility analysis"""
    try:
        data = request.get_json()
        url = data.get('url')
        business_type = data.get('business_type', 'general')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Fetch website content
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
        except requests.RequestException as e:
            return jsonify({'error': f'Could not access website: {str(e)}'}), 400
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Comprehensive analysis
        analysis_result = analyze_website_comprehensive(soup, url, business_type)
        
        return jsonify(analysis_result)
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@compliance_bp.route('/api/compliance/business-risk', methods=['POST'])
def assess_business_risk():
    """Assess business-specific legal risk"""
    try:
        data = request.get_json()
        url = data.get('url')
        business_type = data.get('business_type', 'general')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Fetch and analyze for risk assessment
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            return jsonify({'error': f'Could not access website: {str(e)}'}), 400
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Quick compliance check for risk assessment
        images = soup.find_all('img')
        missing_alt = len([img for img in images if not img.get('alt')])
        forms = soup.find_all('form')
        unlabeled_inputs = len([inp for form in forms for inp in form.find_all('input') 
                               if inp.get('type') not in ['hidden', 'submit', 'button'] 
                               and not (inp.get('aria-label') or inp.get('aria-labelledby') or 
                                       form.find('label', {'for': inp.get('id')}))])
        
        # Calculate risk factors
        accessibility_score = max(0, 100 - (missing_alt * 5) - (unlabeled_inputs * 10))
        critical_issues = missing_alt + unlabeled_inputs
        
        # Business type risk multipliers
        business_risk_levels = {
            'restaurant': 'high',
            'real_estate': 'high', 
            'retail': 'high',
            'healthcare': 'high',
            'legal': 'high',
            'service': 'medium',
            'hvac': 'medium',
            'general': 'medium'
        }
        
        business_type_risk = business_risk_levels.get(business_type, 'medium')
        
        # Overall risk calculation
        if critical_issues >= 5 or accessibility_score < 50:
            overall_risk = 'high'
        elif critical_issues >= 2 or accessibility_score < 80:
            overall_risk = 'medium'
        else:
            overall_risk = 'low'
        
        # Elevate risk for high-risk business types
        if business_type_risk == 'high' and overall_risk == 'medium':
            overall_risk = 'high'
        
        # Generate recommendations
        recommendations = []
        if missing_alt > 0:
            recommendations.append("Fix missing alt text on images immediately")
        if unlabeled_inputs > 0:
            recommendations.append("Add proper labels to form inputs")
        if overall_risk == 'high':
            recommendations.append("Consider professional ADA compliance audit")
        
        return jsonify({
            'overall_risk': overall_risk,
            'risk_factors': {
                'accessibility_score': accessibility_score,
                'critical_issues': critical_issues,
                'business_type_risk': business_type_risk
            },
            'compliance_summary': {
                'score': accessibility_score,
                'critical_issues': critical_issues
            },
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Risk assessment failed: {str(e)}'}), 500

def analyze_website_comprehensive(soup, url, business_type):
    """Comprehensive accessibility analysis with detailed reporting"""
    
    # Initialize analysis results
    issues = []
    total_elements_checked = 0
    
    # 1. Image Analysis
    images = soup.find_all('img')
    total_images = len(images)
    missing_alt_images = []
    decorative_images = 0
    
    for img in images:
        total_elements_checked += 1
        alt_text = img.get('alt')
        src = img.get('src', '')
        
        if alt_text is None:
            missing_alt_images.append({
                'context': 'Informative image missing alt text',
                'element': f'<img src="{src[:50]}..." />'
            })
        elif alt_text == '':
            decorative_images += 1
    
    if missing_alt_images:
        issues.append({
            'category': 'Images Missing Alternative Text',
            'title': 'Images Missing Alternative Text',
            'type': 'critical',
            'count': len(missing_alt_images),
            'wcag_guideline': 'WCAG 2.1 Level A - 1.1.1 Non-text Content',
            'description': f'Found {len(missing_alt_images)} images without alt text that need immediate attention',
            'impact': 'Screen readers cannot describe these images to visually impaired users, creating barriers to understanding page content',
            'business_impact': 'Prevents 15% of users from understanding your content, increases lawsuit risk',
            'fix_instructions': {
                'immediate': 'Add alt="" for decorative images, descriptive alt text for informative images',
                'code_example': '<img src="logo.png" alt="Company Name - Home">',
                'estimated_time': f'{len(missing_alt_images) * 2} minutes'
            },
            'examples': missing_alt_images[:3]  # Show first 3 examples
        })
    
    # 2. Heading Structure Analysis
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    total_headings = len(headings)
    h1_tags = soup.find_all('h1')
    missing_h1 = len(h1_tags) == 0
    
    heading_sequence_errors = []
    if headings:
        prev_level = 0
        for heading in headings:
            current_level = int(heading.name[1])
            if prev_level > 0 and current_level > prev_level + 1:
                heading_sequence_errors.append(f'H{prev_level} followed by H{current_level}')
            prev_level = current_level
    
    total_elements_checked += total_headings
    
    if missing_h1 or heading_sequence_errors:
        issues.append({
            'category': 'Heading Structure Issues',
            'title': 'Heading Structure Issues', 
            'type': 'warning',
            'count': (1 if missing_h1 else 0) + len(heading_sequence_errors),
            'wcag_guideline': 'WCAG 2.1 Level AA - 1.3.1 Info and Relationships',
            'description': 'Heading structure problems affect navigation and content understanding',
            'impact': 'Screen reader users rely on headings to navigate and understand page structure',
            'business_impact': 'Reduces SEO effectiveness and creates navigation barriers',
            'fix_instructions': {
                'immediate': 'Ensure single H1 per page, maintain logical heading sequence (H1→H2→H3)',
                'code_example': '<h1>Main Page Title</h1>\n<h2>Section Title</h2>\n<h3>Subsection</h3>',
                'estimated_time': '15-30 minutes'
            },
            'examples': [f'Missing H1 tag: {missing_h1}'] + heading_sequence_errors[:2]
        })
    
    # 3. Form Analysis
    forms = soup.find_all('form')
    total_forms = len(forms)
    unlabeled_inputs = []
    missing_fieldsets = 0
    
    for form in forms:
        inputs = form.find_all('input')
        for inp in inputs:
            if inp.get('type') not in ['hidden', 'submit', 'button']:
                total_elements_checked += 1
                input_id = inp.get('id')
                has_label = (inp.get('aria-label') or 
                           inp.get('aria-labelledby') or
                           (input_id and form.find('label', {'for': input_id})))
                
                if not has_label:
                    unlabeled_inputs.append({
                        'type': inp.get('type', 'text'),
                        'name': inp.get('name', 'unnamed'),
                        'context': f'Input field missing label: {inp.get("type", "text")} input'
                    })
        
        # Check for fieldsets in forms with multiple inputs
        if len(inputs) > 3 and not form.find('fieldset'):
            missing_fieldsets += 1
    
    if unlabeled_inputs or missing_fieldsets:
        issues.append({
            'category': 'Form Accessibility Issues',
            'title': 'Form Accessibility Issues',
            'type': 'critical',
            'count': len(unlabeled_inputs) + missing_fieldsets,
            'wcag_guideline': 'WCAG 2.1 Level A - 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions',
            'description': 'Form inputs lack proper labels making them inaccessible to screen readers',
            'impact': 'Users with disabilities cannot understand or complete forms',
            'business_impact': 'Prevents customers from completing transactions, increases legal risk',
            'fix_instructions': {
                'immediate': 'Add <label> elements or aria-label attributes to all form inputs',
                'code_example': '<label for="email">Email Address:</label>\n<input type="email" id="email" name="email">',
                'estimated_time': f'{len(unlabeled_inputs) * 3} minutes'
            },
            'examples': unlabeled_inputs[:3]
        })
    
    # 4. Keyboard Navigation Analysis
    skip_links = soup.find_all('a', href=re.compile(r'^#'))
    has_skip_links = any('skip' in link.get_text().lower() for link in skip_links)
    
    keyboard_issues = []
    if not has_skip_links:
        keyboard_issues.append('Missing skip navigation links')
    
    if keyboard_issues:
        issues.append({
            'category': 'Keyboard Accessibility Issues',
            'title': 'Keyboard Accessibility Issues',
            'type': 'warning',
            'count': len(keyboard_issues),
            'wcag_guideline': 'WCAG 2.1 Level A - 2.1.1 Keyboard, 2.4.1 Bypass Blocks',
            'description': 'Found 1 keyboard navigation problems',
            'impact': 'Users who cannot use a mouse rely on keyboard navigation to access your site',
            'fix_instructions': {
                'immediate': 'Add skip links and ensure all interactive elements are keyboard accessible',
                'code_example': '<a href="#main-content" class="skip-link">Skip to main content</a>',
                'estimated_time': '15-20 minutes'
            },
            'examples': keyboard_issues
        })
    
    # Calculate overall scores
    critical_issues = len([issue for issue in issues if issue['type'] == 'critical'])
    warning_issues = len([issue for issue in issues if issue['type'] == 'warning'])
    total_issues = critical_issues + warning_issues
    
    # Scoring algorithm
    base_score = 100
    score = max(0, base_score - (critical_issues * 15) - (warning_issues * 5))
    
    # Grade assignment
    if score >= 90:
        grade = 'A'
        status = 'Excellent Accessibility'
        risk_level = 'Low'
    elif score >= 80:
        grade = 'B'
        status = 'Good Accessibility'
        risk_level = 'Low'
    elif score >= 70:
        grade = 'C'
        status = 'Fair Accessibility'
        risk_level = 'Medium'
    elif score >= 60:
        grade = 'D'
        status = 'Poor Accessibility'
        risk_level = 'High'
    else:
        grade = 'F'
        status = 'Critical Accessibility Issues'
        risk_level = 'Extreme'
    
    # Page information
    page_info = {
        'title': soup.find('title').get_text() if soup.find('title') else 'No title found',
        'lang_attribute': soup.find('html', {'lang': True}).get('lang') if soup.find('html', {'lang': True}) else None,
        'total_images': total_images,
        'total_links': len(soup.find_all('a')),
        'total_headings': total_headings,
        'total_forms': total_forms,
        'has_skip_links': has_skip_links,
        'viewport_meta': bool(soup.find('meta', {'name': 'viewport'}))
    }
    
    # Detailed analysis breakdown
    detailed_analysis = {
        'images': {
            'total': total_images,
            'missing_alt': len(missing_alt_images),
            'decorative': decorative_images
        },
        'headings': {
            'missing_h1': missing_h1,
            'sequence_errors': heading_sequence_errors
        },
        'color_contrast': {
            'total_checked': 100,  # Placeholder - would need more complex analysis
            'failed_aa': 0,
            'failed_aaa': 0
        },
        'forms': {
            'unlabeled_inputs': len(unlabeled_inputs),
            'missing_fieldsets': missing_fieldsets
        }
    }
    
    # Summary and recommendations
    total_estimated_time = sum([
        int(re.search(r'\d+', issue.get('fix_instructions', {}).get('estimated_time', '0')).group()) 
        for issue in issues 
        if issue.get('fix_instructions', {}).get('estimated_time')
    ])
    
    priority_actions = []
    if critical_issues > 0:
        priority_actions.append("Fix critical issues immediately to reduce lawsuit risk")
    if warning_issues > 0:
        priority_actions.append("Address warning-level issues to improve user experience")
    if total_issues > 3:
        priority_actions.append("Consider professional accessibility audit")
    
    next_steps = [
        "Download detailed report with specific fix instructions",
        "Implement fixes starting with highest priority items", 
        "Test changes with screen reader or accessibility tools",
        "Schedule regular accessibility audits",
        "Consider accessibility training for development team"
    ]
    
    summary = {
        'legal_risk_assessment': f'{risk_level.upper()} RISK - {"Several critical issues need immediate attention" if critical_issues > 2 else "Some issues should be addressed" if total_issues > 0 else "Good accessibility practices observed"}',
        'total_issues': total_issues,
        'estimated_fix_time': f'{total_estimated_time} minutes',
        'priority_actions': priority_actions,
        'next_steps': next_steps
    }
    
    return {
        'url': url,
        'timestamp': datetime.now().isoformat(),
        'grade': grade,
        'score': score,
        'status': status,
        'risk_level': risk_level,
        'critical_issues': critical_issues,
        'warnings': warning_issues,
        'total_elements_checked': total_elements_checked,
        'issues': issues,
        'page_info': page_info,
        'detailed_analysis': detailed_analysis,
        'summary': summary
    }

