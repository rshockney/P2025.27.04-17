# Deployment Best Practices - Version Control

## Critical Best Practice: Version Number Verification

### Issue Identified
During TZC-100 D.24.6 deployment (June 30, 2025), the production server was successfully updated to version D.24.6, but the version number displayed on the website remained at D.24.3, creating a discrepancy between the actual deployed version and the user-visible version identifier.

### Best Practice: Double-Check Release Version Display

**ALWAYS verify that the version number displayed on the deployed website matches the intended release version.**

#### Pre-Deployment Checklist:
1. **Source Code Verification**
   - [ ] Confirm version number is updated in source code
   - [ ] Check all locations where version is displayed (footer, about page, etc.)
   - [ ] Verify version matches the intended release (e.g., D.24.6)

2. **Build Process Verification**
   - [ ] Ensure build process includes version number updates
   - [ ] Confirm no cached or hardcoded version numbers remain
   - [ ] Validate that build artifacts contain correct version

3. **Post-Deployment Verification**
   - [ ] **CRITICAL**: Load the deployed website and visually confirm version number
   - [ ] Check version in multiple locations if displayed in several places
   - [ ] Document the verified version number in deployment records

#### Why This Matters:
- **Issue Identification**: Incorrect version numbers make troubleshooting extremely difficult
- **Support Clarity**: Support teams need accurate version information
- **Audit Trail**: Proper version tracking is essential for change management
- **User Confidence**: Accurate version displays build trust with users

#### Implementation:
- Add version verification as a mandatory step in deployment procedures
- Include screenshot of version display in deployment documentation
- Create automated tests to verify version number consistency where possible

**Priority**: CRITICAL - Version mismatches can lead to significant confusion during issue resolution and support scenarios.

---
*Documented: June 30, 2025*  
*Context: TZC-100 D.24.6 deployment verification*

