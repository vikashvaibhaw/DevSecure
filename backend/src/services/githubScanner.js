const axios = require('axios');
const { pool } = require('../config/db');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Secret detection patterns
const SECRET_PATTERNS = [
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    severity: 'critical'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical'
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical'
  },
  {
    name: 'Database URL',
    pattern: /(postgresql|mysql|mongodb):\/\/[^\/\s]+:[^\/\s]+@/gi,
    severity: 'critical'
  },
  {
    name: 'JWT Secret',
    pattern: /(JWT_SECRET|SECRET_KEY)\s*=\s*['"][a-zA-Z0-9]{32,}['"]/gi,
    severity: 'high'
  },
  {
    name: 'API Key',
    pattern: /(api_key|apikey|API_KEY)\s*=\s*['"][a-zA-Z0-9]{32,}['"]/gi,
    severity: 'high'
  },
  {
    name: 'MongoDB URI',
    pattern: /mongodb(?:\+srv)?:\/\/[^\/\s]+:[^\/\s]+@[^\/\s]+\/[^\s]+/gi,
    severity: 'critical'
  },
  {
    name: 'Password in Code',
    pattern: /(password|passwd|pwd)\s*=\s*['"][^'"]+['"]/gi,
    severity: 'high'
  }
];

// Scan file content for secrets
function scanContent(content, filePath) {
  const findings = [];
  
  for (const secretType of SECRET_PATTERNS) {
    const matches = content.matchAll(secretType.pattern);
    
    for (const match of matches) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      
      // Don't report if it's clearly a placeholder or example
      const matchedValue = match[0];
      if (matchedValue.includes('example') || matchedValue.includes('your_') || matchedValue.includes('YOUR_')) {
        continue;
      }
      
      findings.push({
        type: secretType.name,
        severity: secretType.severity,
        file: filePath,
        line: lineNumber,
        matched_value: matchedValue.substring(0, 50) + (matchedValue.length > 50 ? '...' : '')
      });
    }
  }
  
  return findings;
}

// Scan GitHub repository
async function scanGitHubRepo(owner, repo, branch, organizationId, userId) {
  const findings = [];
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  
  console.log(`🔍 Scanning ${owner}/${repo}...`);
  
  // Headers with authentication if token exists
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'DevSecure-AI'
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    console.log('✅ Using authenticated GitHub API (higher rate limits)');
  } else {
    console.log('⚠️ No GitHub token found. Rate limits will be lower. Add GITHUB_TOKEN to .env');
  }
  
  try {
    const response = await axios.get(apiUrl, { headers });
    
    const files = response.data.tree.filter(item => item.type === 'blob');
    console.log(`📁 Found ${files.length} files to scan`);
    
    let scanned = 0;
    
    for (const file of files) {
      // Skip binary files, node_modules, dist, etc.
      if (file.path.includes('node_modules') || 
          file.path.includes('.git') || 
          file.path.includes('dist') ||
          file.path.includes('build') ||
          file.path.includes('.png') ||
          file.path.includes('.jpg') ||
          file.path.includes('.ico')) {
        continue;
      }
      
      try {
        const contentResponse = await axios.get(file.url, {
          headers: { ...headers, 'Accept': 'application/vnd.github.v3.raw' }
        });
        
        const content = contentResponse.data;
        const fileFindings = scanContent(content, file.path);
        
        if (fileFindings.length > 0) {
          findings.push(...fileFindings);
          
          for (const finding of fileFindings) {
            await pool.query(
              `INSERT INTO security_alerts (organization_id, alert_type, severity, description, details, fixed)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                organizationId,
                finding.type,
                finding.severity,
                `🔴 ${finding.type} found in ${finding.file}:${finding.line}`,
                JSON.stringify({
                  file: finding.file,
                  line: finding.line,
                  matched_value: finding.matched_value,
                  repo: `${owner}/${repo}`
                }),
                false
              ]
            );
          }
        }
        
        scanned++;
        if (scanned % 20 === 0) {
          console.log(`📊 Scanned ${scanned} files, found ${findings.length} secrets`);
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
    
    console.log(`✅ Scan complete! Found ${findings.length} secrets in ${scanned} files`);
    
    return {
      success: true,
      repo: `${owner}/${repo}`,
      files_scanned: scanned,
      findings_count: findings.length
    };
  } catch (error) {
    console.error('GitHub scan error:', error.response?.status, error.response?.data?.message || error.message);
    
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please add GITHUB_TOKEN to .env file for higher limits.');
    }
    throw new Error(`Failed to scan repository: ${error.message}`);
  }
}

function parseGitHubUrl(url) {
  let owner, repo;
  
  if (url.includes('github.com')) {
    const match = url.match(/github\.com[:\/]([^\/]+)\/([^\/\.]+)/);
    if (match) {
      owner = match[1];
      repo = match[2];
    }
  } else if (url.includes('/')) {
    [owner, repo] = url.split('/');
  }
  
  return { owner, repo };
}

module.exports = { scanGitHubRepo, parseGitHubUrl };