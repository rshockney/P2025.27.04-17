# TZC-200 Development & Deployment Process

## Overview
This document outlines the standardized development and deployment process used for the TZC-200 Time Zone Converter project. This process ensures consistent, reliable deployments while maintaining proper documentation and file organization.

## File Organization

### Application Structure
All application files are organized relative to the **app install directory** (`/home/ubuntu/tzc-200/`):

```
tzc-200/                          # App install directory (root)
├── src/                          # Source code
│   ├── App.jsx                   # Main application component
│   ├── App.css                   # Application styles
│   ├── OldConverterButton.jsx    # Component files
│   └── ...
├── public/                       # Public assets
│   ├── config.json               # Application configuration
│   └── assets/                   # Static assets
├── dist/                         # Build output directory
│   ├── index.html                # Built application entry
│   ├── favicon.ico               # Site icon
│   └── assets/                   # Built assets
├── package.json                  # Dependencies and scripts
└── vite.config.js               # Build configuration
```

### Production File Structure
The production deployment follows a strict organization:

**ROOT LEVEL:**
- `index.html` (application entry point)
- `favicon.ico` (site icon)

**ASSETS DIRECTORY:**
- All other files (JS, CSS, JSON, images, etc.)

## Delivery Inventory

Each deployment includes a standardized delivery package:

### 1. Build Environment Package
- **File**: `d[VERSION]-build-files.zip`
- **Contents**: Complete build directory (`dist/`) including all files
- **Purpose**: Full build environment for development reference

### 2. Deployment Environment Package
- **File**: `d[VERSION]-server-files.tar.gz`
- **Contents**: Production-ready files only (following tar.gz rules)
- **Purpose**: Clean deployment package for production servers

### 3. Documentation Package
- **File**: `D[VERSION]_CHANGES.md`
- **Contents**: Rolling change log with latest changes at top
- **Purpose**: Version history and deployment notes

### 4. Process Documentation
- **File**: `TZC-200_DEPLOYMENT_PROCESS.md` (this document)
- **Contents**: Complete process documentation
- **Purpose**: Standardized procedures for future deployments

## Rolling Change Log Format

### Structure
Change logs follow a consistent format with **latest changes at the top**:

```markdown
# D[VERSION] Changes Documentation

## Version: D.[VERSION]
## Date: [DATE]

## Summary
[Brief description of changes]

## Changes Made
### 1. [Change Category]
- **[Change Type]**: [Description]
- **Before**: [Previous state]
- **After**: [New state]

## Technical Details
### Files Modified
- [List of modified files]

### Testing Results
✅ [Test results with checkmarks]

## User Impact
- [Impact on user experience]

## Verification Steps
1. ✅ [Verification checklist]
```

### Version History Order
- D32.2 (Latest - at top)
- D32.1
- D32.0
- [Previous versions...]

## tar.gz File Rules

### Rule #1: Only Required Application Files
- Include **ONLY** files necessary for the application to run
- **EXCLUDE**: Documentation, development files, guides, etc.
- **INCLUDE**: HTML, JS, CSS, JSON data, images, favicon

### Rule #2: Proper File Organization
- All files **except `index.html` and `favicon.ico`** must be in the `assets` directory
- **ROOT LEVEL**: `index.html`, `favicon.ico`
- **ASSETS DIRECTORY**: Everything else

### Rule #3: Rules Review Process
- **Every deployment must include a review of these rules**
- Verify compliance before creating distribution packages
- Document rule adherence in deployment notes

### Implementation
```bash
# Correct tar.gz creation
cd /path/to/dist
tar -czf /output/d[VERSION]-server-files.tar.gz \
    index.html \
    favicon.ico \
    assets/[required-js-file].js \
    assets/[required-css-file].css \
    assets/[required-json-files].json \
    assets/[required-images]
```

### Verification
```bash
# Verify structure
tar -tzf d[VERSION]-server-files.tar.gz

# Expected output:
# index.html
# favicon.ico
# assets/[files...]
```

## Development Workflow

### 1. Implementation Phase
- Make code changes in source files
- Update version number in `App.jsx`
- Test changes locally (`npm run dev`)

### 2. Build Phase
- Run production build (`npm run build`)
- Verify build success and output

### 3. Testing Phase
- Test local build functionality
- Verify all features working
- Check version number display

### 4. Documentation Phase
- Create version-specific change log
- Document all modifications
- Update process documentation if needed

### 5. Deployment Phase
- Deploy to production (`service_deploy_frontend`)
- Verify production deployment
- Test all functionality in production

### 6. Package Creation Phase
- Create build environment zip
- Create deployment tar.gz (following rules)
- Verify package contents
- Review deployment rules compliance

### 7. Delivery Phase
- Provide all delivery inventory files
- Include complete documentation
- Confirm milestone achievement

## Version Numbering

### Format
- **Major.Minor.Patch** (e.g., D.32.2)
- **D** prefix indicates development/deployment version

### Increment Rules
- **Patch** (+0.1): Minor fixes, text changes, small improvements
- **Minor** (+1.0): Feature additions, significant changes
- **Major** (+10.0): Major overhauls, architecture changes

## Quality Assurance

### Pre-Deployment Checklist
- [ ] All functionality tested locally
- [ ] Production build successful
- [ ] Version number updated
- [ ] Change log created
- [ ] tar.gz rules reviewed and followed
- [ ] Production deployment verified
- [ ] All delivery files created

### Post-Deployment Verification
- [ ] Production URL accessible
- [ ] All features working in production
- [ ] Version number correct in production
- [ ] Button/navigation functionality verified
- [ ] Configuration toggles working

## File Naming Conventions

### Delivery Files
- Build package: `d[VERSION]-build-files.zip`
- Server package: `d[VERSION]-server-files.tar.gz`
- Change log: `D[VERSION]_CHANGES.md`
- Milestone: `TZC-200_MILESTONE.md`

### Version Format
- Use dots for version separation: `D.32.2`
- Consistent casing: `D` uppercase, version numbers

## Best Practices

### 1. Consistency
- Follow the same process for every deployment
- Use standardized file naming
- Maintain consistent documentation format

### 2. Verification
- Always verify tar.gz contents before delivery
- Test production deployment thoroughly
- Confirm all delivery files are included

### 3. Documentation
- Keep change logs up to date
- Document all rule changes
- Maintain process documentation

### 4. Quality Control
- Review deployment rules every time
- Verify file organization compliance
- Test all functionality before delivery

## Troubleshooting

### Common Issues
1. **tar.gz contains extra directories**: Use `cd` to source directory first
2. **Missing files in deployment**: Review Rule #1 (required files only)
3. **Wrong file organization**: Review Rule #2 (assets directory structure)
4. **Build failures**: Check dependencies and source code syntax

### Resolution Steps
1. Identify the issue category
2. Review relevant rules/procedures
3. Fix the underlying problem
4. Re-run the affected process steps
5. Verify resolution before proceeding

---

## Summary

This process ensures:
- **Consistent** deployments across all versions
- **Clean** production packages following established rules
- **Complete** documentation for every release
- **Reliable** quality control and verification
- **Standardized** file organization and naming

Following this process guarantees professional, maintainable deployments that can be easily reproduced and understood by any team member.

---
*TZC-200 Deployment Process Documentation - Version 1.0 - July 2, 2025*

