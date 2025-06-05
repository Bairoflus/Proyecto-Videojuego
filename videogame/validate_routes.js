#!/usr/bin/env node

/**
 * Route validation script for Shattered Timeline project
 * Checks all file references and imports to ensure they exist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const issues = [];
const checkedFiles = new Set();

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Resolve relative path to absolute
 */
function resolvePath(basePath, relativePath) {
  return path.resolve(path.dirname(basePath), relativePath);
}

/**
 * Check HTML files for broken links
 */
function checkHtmlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Check CSS links
  const cssMatches = content.matchAll(/href\s*=\s*["']([^"']+\.css)["']/g);
  for (const match of cssMatches) {
    const cssPath = resolvePath(filePath, match[1]);
    if (!fileExists(cssPath)) {
      issues.push(`❌ ${fileName}: CSS file not found: ${match[1]} -> ${cssPath}`);
    } else {
      console.log(`✅ ${fileName}: CSS found: ${match[1]}`);
    }
  }
  
  // Check JS script sources
  const jsMatches = content.matchAll(/src\s*=\s*["']([^"']+\.js)["']/g);
  for (const match of jsMatches) {
    const jsPath = resolvePath(filePath, match[1]);
    if (!fileExists(jsPath)) {
      issues.push(`❌ ${fileName}: JS file not found: ${match[1]} -> ${jsPath}`);
    } else {
      console.log(`✅ ${fileName}: JS found: ${match[1]}`);
    }
  }
  
  // Check imports in inline scripts
  const importMatches = content.matchAll(/import.*from\s*['"]([^'"]+)['"];/g);
  for (const match of importMatches) {
    const importPath = resolvePath(filePath, match[1]);
    if (!fileExists(importPath)) {
      issues.push(`❌ ${fileName}: Import not found: ${match[1]} -> ${importPath}`);
    } else {
      console.log(`✅ ${fileName}: Import found: ${match[1]}`);
    }
  }
  
  // Check dynamic imports
  const dynamicImportMatches = content.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const match of dynamicImportMatches) {
    let importPath = match[1];
    
    // Handle absolute paths (served by server)
    if (importPath.startsWith('/')) {
      importPath = path.join(__dirname, 'src', importPath.substring(1));
    } else {
      importPath = resolvePath(filePath, importPath);
    }
    
    if (!fileExists(importPath)) {
      issues.push(`❌ ${fileName}: Dynamic import not found: ${match[1]} -> ${importPath}`);
    } else {
      console.log(`✅ ${fileName}: Dynamic import found: ${match[1]}`);
    }
  }
}

/**
 * Check JS files for broken imports
 */
function checkJsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Check ES6 imports
  const importMatches = content.matchAll(/import\s+.*\s+from\s*['"]([^'"]+)['"];/g);
  for (const match of importMatches) {
    const importPath = resolvePath(filePath, match[1]);
    if (!fileExists(importPath)) {
      issues.push(`❌ ${fileName}: Import not found: ${match[1]} -> ${importPath}`);
    } else {
      console.log(`✅ ${fileName}: Import found: ${match[1]}`);
    }
  }
  
  // Check dynamic imports
  const dynamicImportMatches = content.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const match of dynamicImportMatches) {
    const importPath = resolvePath(filePath, match[1]);
    if (!fileExists(importPath)) {
      issues.push(`❌ ${fileName}: Dynamic import not found: ${match[1]} -> ${importPath}`);
    } else {
      console.log(`✅ ${fileName}: Dynamic import found: ${match[1]}`);
    }
  }
}

/**
 * Recursively scan directory for files to check
 */
function scanDirectory(dirPath, fileExtensions) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        files.push(...scanDirectory(fullPath, fileExtensions));
      } else if (stat.isFile() && fileExtensions.some(ext => entry.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Cannot read directory: ${dirPath}`);
  }
  
  return files;
}

/**
 * Main validation function
 */
function validateRoutes() {
  console.log('🔍 Starting route validation for Shattered Timeline...\n');
  
  const srcDir = path.join(__dirname, 'src');
  
  // Find all HTML files
  const htmlFiles = scanDirectory(srcDir, ['.html']);
  console.log(`📄 Found ${htmlFiles.length} HTML files`);
  
  for (const htmlFile of htmlFiles) {
    console.log(`\n📋 Checking: ${path.relative(srcDir, htmlFile)}`);
    checkHtmlFile(htmlFile);
  }
  
  // Find all JS files
  const jsFiles = scanDirectory(srcDir, ['.js']);
  console.log(`\n📜 Found ${jsFiles.length} JS files`);
  
  for (const jsFile of jsFiles) {
    if (jsFile.includes('validate_routes.js')) continue; // Skip this file
    console.log(`\n📋 Checking: ${path.relative(srcDir, jsFile)}`);
    checkJsFile(jsFile);
  }
  
  // Report results
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION RESULTS');
  console.log('='.repeat(60));
  
  if (issues.length === 0) {
    console.log('🎉 All routes are valid! No broken links found.');
  } else {
    console.log(`❌ Found ${issues.length} issues:\n`);
    issues.forEach(issue => console.log(issue));
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Fix the broken file paths shown above');
    console.log('2. Make sure your server.js serves all necessary directories');
    console.log('3. Use absolute paths for server-served files (starting with /)');
    console.log('4. Use relative paths for file-to-file imports (starting with ./ or ../)');
  }
  
  console.log('\n📋 Server configuration check:');
  console.log('Make sure server.js serves these paths:');
  console.log('  ✅ /pages/ (HTML, CSS, JS)');
  console.log('  ✅ /assets/ (images, sprites)');
  console.log('  ✅ /utils/ (utility scripts)');
  console.log('  ✅ /classes/ (game classes)');
  console.log('  ✅ /constants/ (game constants)');
  console.log('  ✅ /main.js (game entry point)');
  
  process.exit(issues.length > 0 ? 1 : 0);
}

// Run validation
validateRoutes(); 