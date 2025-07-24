from flask import Blueprint, jsonify, request
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin, urlparse
import time
from PIL import Image
import io
import base64

compliance_bp = Blueprint('compliance', __name__)

def calculate_contrast_ratio(color1, color2):
    """Calculate contrast ratio between two colors"""
    def get_luminance(color):
        # Convert RGB to relative luminance
        rgb = [c / 255.0 for c in color]
        rgb = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
    
    lum1 = get_luminance(color1)
    lum2 = get_luminance(color2)
    
    # Ensure lum1 is the lighter color
    if lum1 < lum2:
        lum1, lum2 = lum2, lum1
    
    return (lum1 + 0.05) / (lum2 + 0.05)

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    try:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    except:
        return (0, 0, 0)  # Default to black if parsing fails

def analyze_website_compliance(url):
    """Analyze a website for ADA compliance issues"""
    try:
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Fetch the webpage
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Initialize results
        results = {
            'url': url,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'issues': [],
            'score': 100,
            'total_elements_checked': 0,
            'critical_issues': 0,
            'warnings': 0
        }
        
        # 1. Check for missing alt text on images
        images = soup.find_all('img')
        missing_alt_images = []
        
        for img in images:
            results['total_elements_checked'] += 1
            alt_text = img.get('alt', '').strip()
            src = img.get('src', '')
            
            if not alt_text:
                missing_alt_images.append({
                    'src': src,
                    'element': str(img)[:100] + '...' if len(str(img)) > 100 else str(img)
                })
                results['critical_issues'] += 1
                results['score'] -= 5
        
        if missing_alt_images:
            results['issues'].append({
                'type': 'critical',
                'category': 'Missing Alt Text',
                'description': f'Found {len(missing_alt_images)} images without alt text',
                'impact': 'Screen readers cannot describe these images to visually impaired users',
                'wcag_guideline': 'WCAG 2.1 Level A - 1.1.1 Non-text Content',
                'count': len(missing_alt_images),
                'examples': missing_alt_images[:5],  # Show first 5 examples
                'fix_suggestion': 'Add descriptive alt attributes to all images. Use alt="" for decorative images.'
            })
        
        # 2. Check for color contrast issues
        contrast_issues = []
        
        # Extract CSS styles and check common text elements
        text_elements = soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'span', 'div', 'button'])
        
        for element in text_elements[:50]:  # Limit to first 50 elements for performance
            results['total_elements_checked'] += 1
            
            # Get computed styles (simplified approach)
            style = element.get('style', '')
            class_name = element.get('class', [])
            
            # Look for inline color styles
            color_match = re.search(r'color:\s*([^;]+)', style)
            bg_color_match = re.search(r'background-color:\s*([^;]+)', style)
            
            if color_match or bg_color_match:
                text_color = color_match.group(1).strip() if color_match else '#000000'
                bg_color = bg_color_match.group(1).strip() if bg_color_match else '#ffffff'
                
                # Convert colors to RGB (simplified)
                try:
                    if text_color.startswith('#'):
                        text_rgb = hex_to_rgb(text_color)
                    else:
                        text_rgb = (0, 0, 0)  # Default to black
                    
                    if bg_color.startswith('#'):
                        bg_rgb = hex_to_rgb(bg_color)
                    else:
                        bg_rgb = (255, 255, 255)  # Default to white
                    
                    contrast_ratio = calculate_contrast_ratio(text_rgb, bg_rgb)
                    
                    # WCAG AA requires 4.5:1 for normal text, 3:1 for large text
                    if contrast_ratio < 4.5:
                        contrast_issues.append({
                            'element': element.name,
                            'text_color': text_color,
                            'bg_color': bg_color,
                            'contrast_ratio': round(contrast_ratio, 2),
                            'text_preview': element.get_text()[:50] + '...' if len(element.get_text()) > 50 else element.get_text()
                        })
                        results['critical_issues'] += 1
                        results['score'] -= 3
                
                except Exception as e:
                    continue
        
        if contrast_issues:
            results['issues'].append({
                'type': 'critical',
                'category': 'Poor Color Contrast',
                'description': f'Found {len(contrast_issues)} elements with insufficient color contrast',
                'impact': 'Text may be difficult or impossible to read for users with visual impairments',
                'wcag_guideline': 'WCAG 2.1 Level AA - 1.4.3 Contrast (Minimum)',
                'count': len(contrast_issues),
                'examples': contrast_issues[:5],  # Show first 5 examples
                'fix_suggestion': 'Ensure text has a contrast ratio of at least 4.5:1 against its background (3:1 for large text).'
            })
        
        # 3. Check for missing form labels
        form_issues = []
        inputs = soup.find_all(['input', 'textarea', 'select'])
        
        for input_elem in inputs:
            input_type = input_elem.get('type', 'text')
            if input_type not in ['hidden', 'submit', 'button']:
                results['total_elements_checked'] += 1
                
                # Check for label association
                input_id = input_elem.get('id')
                aria_label = input_elem.get('aria-label')
                aria_labelledby = input_elem.get('aria-labelledby')
                
                has_label = False
                if input_id:
                    label = soup.find('label', {'for': input_id})
                    if label:
                        has_label = True
                
                if not has_label and not aria_label and not aria_labelledby:
                    form_issues.append({
                        'element': input_elem.name,
                        'type': input_type,
                        'element_html': str(input_elem)[:100] + '...' if len(str(input_elem)) > 100 else str(input_elem)
                    })
                    results['warnings'] += 1
                    results['score'] -= 2
        
        if form_issues:
            results['issues'].append({
                'type': 'warning',
                'category': 'Missing Form Labels',
                'description': f'Found {len(form_issues)} form inputs without proper labels',
                'impact': 'Screen readers cannot identify the purpose of form fields',
                'wcag_guideline': 'WCAG 2.1 Level A - 1.3.1 Info and Relationships',
                'count': len(form_issues),
                'examples': form_issues[:5],
                'fix_suggestion': 'Associate labels with form controls using <label for="id"> or aria-label attributes.'
            })
        
        # Calculate final score
        results['score'] = max(0, results['score'])
        
        # Add summary
        if results['score'] >= 90:
            results['grade'] = 'A'
            results['status'] = 'Excellent'
        elif results['score'] >= 80:
            results['grade'] = 'B'
            results['status'] = 'Good'
        elif results['score'] >= 70:
            results['grade'] = 'C'
            results['status'] = 'Needs Improvement'
        else:
            results['grade'] = 'F'
            results['status'] = 'Poor - High Legal Risk'
        
        return results
        
    except requests.exceptions.RequestException as e:
        return {
            'error': f'Failed to fetch website: {str(e)}',
            'url': url,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        return {
            'error': f'Analysis failed: {str(e)}',
            'url': url,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }

@compliance_bp.route('/analyze', methods=['POST'])
def analyze_compliance():
    """Analyze a website for ADA compliance"""
    try:
        data = request.json
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Perform analysis
        results = analyze_website_compliance(url)
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@compliance_bp.route('/quick-scan', methods=['POST'])
def quick_scan():
    """Quick scan for the top 2 critical issues"""
    try:
        data = request.json
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Add protocol if missing
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Fetch the webpage
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Quick check for missing alt text
        images = soup.find_all('img')
        missing_alt_count = sum(1 for img in images if not img.get('alt', '').strip())
        
        # Quick check for basic contrast issues (simplified)
        text_elements = soup.find_all(['p', 'h1', 'h2', 'h3', 'a'])[:20]
        potential_contrast_issues = 0
        
        for element in text_elements:
            style = element.get('style', '')
            if 'color:' in style and ('background' in style or element.parent.get('style', '')):
                potential_contrast_issues += 1
        
        risk_level = 'Low'
        if missing_alt_count > 5 or potential_contrast_issues > 3:
            risk_level = 'High'
        elif missing_alt_count > 2 or potential_contrast_issues > 1:
            risk_level = 'Medium'
        
        return jsonify({
            'url': url,
            'risk_level': risk_level,
            'missing_alt_text': missing_alt_count,
            'total_images': len(images),
            'potential_contrast_issues': potential_contrast_issues,
            'recommendation': 'Run full analysis for detailed report' if risk_level != 'Low' else 'Website appears to have good accessibility practices'
        })
        
    except Exception as e:
        return jsonify({'error': f'Quick scan failed: {str(e)}'}), 500

@compliance_bp.route('/business-risk', methods=['POST'])
def assess_business_risk():
    """Assess legal and business risk based on compliance issues"""
    try:
        data = request.json
        url = data.get('url', '').strip()
        business_type = data.get('business_type', 'general').lower()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Get basic compliance data
        results = analyze_website_compliance(url)
        
        if 'error' in results:
            return jsonify(results), 400
        
        # Calculate risk factors
        risk_factors = {
            'accessibility_score': results['score'],
            'critical_issues': results['critical_issues'],
            'business_type_risk': 'medium'
        }
        
        # Adjust risk based on business type
        high_risk_types = ['restaurant', 'food', 'retail', 'ecommerce', 'real estate']
        medium_risk_types = ['service', 'professional', 'healthcare', 'legal']
        
        if any(btype in business_type for btype in high_risk_types):
            risk_factors['business_type_risk'] = 'high'
        elif any(btype in business_type for btype in medium_risk_types):
            risk_factors['business_type_risk'] = 'medium'
        else:
            risk_factors['business_type_risk'] = 'low'
        
        # Calculate overall risk
        overall_risk = 'low'
        if results['score'] < 70 or results['critical_issues'] > 5:
            overall_risk = 'high'
        elif results['score'] < 85 or results['critical_issues'] > 2:
            overall_risk = 'medium'
        
        # Adjust based on business type
        if risk_factors['business_type_risk'] == 'high' and overall_risk == 'medium':
            overall_risk = 'high'
        
        return jsonify({
            'url': url,
            'overall_risk': overall_risk,
            'risk_factors': risk_factors,
            'compliance_summary': {
                'score': results['score'],
                'grade': results['grade'],
                'critical_issues': results['critical_issues'],
                'warnings': results['warnings']
            },
            'recommendations': [
                'Fix missing alt text on images immediately' if any(issue['category'] == 'Missing Alt Text' for issue in results['issues']) else None,
                'Improve color contrast for better readability' if any(issue['category'] == 'Poor Color Contrast' for issue in results['issues']) else None,
                'Add proper labels to form elements' if any(issue['category'] == 'Missing Form Labels' for issue in results['issues']) else None,
                'Consider professional ADA compliance audit' if overall_risk == 'high' else None
            ]
        })
        
    except Exception as e:
        return jsonify({'error': f'Risk assessment failed: {str(e)}'}), 500

