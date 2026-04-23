# Release Checklist - ProjectPolda

Gunakan checklist ini sebelum melakukan release versi baru.

---

## Pre-Release Checklist

### Code Quality & Testing
- [ ] Semua test passes: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No critical warnings
- [ ] All PRs reviewed & merged
- [ ] Features tested in staging

### Version & Documentation
- [ ] Decide version type: MAJOR / MINOR / PATCH
- [ ] Update `VERSION` file
- [ ] Update `package.json` (all 3 files)
- [ ] Update `CHANGELOG.md` dengan lengkap
- [ ] Update `documentations/file_md_V2/` dengan release notes
- [ ] Review CHANGELOG untuk accuracy

### Database & Migration
- [ ] Database migrations tested
- [ ] Schema changes documented
- [ ] Rollback plan ready
- [ ] Backup available

### Security
- [ ] Security scanning passed
- [ ] No exposed credentials
- [ ] Dependencies updated & audited
- [ ] SBOM (Software Bill of Materials) generated
- [ ] No critical CVEs

### Performance
- [ ] Bundle size checked: `npm run build`
- [ ] Performance metrics verified
- [ ] No regressions vs last version
- [ ] Database queries optimized

---

## Release Execution

### Step 1: Final Validation
- [ ] Pull latest main branch
- [ ] Run full test suite locally
- [ ] Verify version numbers match everywhere
- [ ] Build artifact generated successfully

### Step 2: Version & Documentation Update
- [ ] `VERSION` file updated: `echo "X.Y.Z" > VERSION`
- [ ] All `package.json` files updated
- [ ] `CHANGELOG.md` completed with all changes
- [ ] Commit message follows convention: `chore: release version X.Y.Z`

### Step 3: Git & Tags
- [ ] Commit created: `git commit -m "chore: release version X.Y.Z"`
- [ ] Tag created: `git tag -a vX.Y.Z -m "Release version X.Y.Z: [description]"`
- [ ] Tag verified: `git show vX.Y.Z`
- [ ] Tag pushed: `git push origin vX.Y.Z`

### Step 4: Deployment Preparation
- [ ] Staging deployment tested
- [ ] Staging verified working
- [ ] Production checklist reviewed
- [ ] Rollback procedure documented

### Step 5: Production Release
- [ ] Approval obtained (if required)
- [ ] Production deployed
- [ ] Health checks passed
- [ ] Monitoring alerts active
- [ ] Team notified

### Step 6: Post-Release
- [ ] Release notes published
- [ ] Changelog visible to users
- [ ] Monitoring dashboard checked
- [ ] User feedback channel open
- [ ] Documentation updated

---

## Post-Release Checklist

### Immediate (Within 1 hour)
- [ ] Monitor error rates (should be normal)
- [ ] Check application logs for issues
- [ ] Verify critical user flows working
- [ ] Monitor database performance
- [ ] Check API response times

### Short-term (Within 24 hours)
- [ ] No critical bugs reported
- [ ] User feedback positive
- [ ] All metrics normal
- [ ] Support team informed
- [ ] Next sprint planned

### Long-term (Within 1 week)
- [ ] Security audit complete (if needed)
- [ ] Performance analysis done
- [ ] Documentation reviewed
- [ ] Lessons learned captured
- [ ] Release notes shared internally

---

## Rollback Procedure

If critical issues found:

### Emergency Rollback
```bash
# 1. Verify issue severity
# 2. Notify team immediately
# 3. Checkout last stable version
git checkout v[PREVIOUS_VERSION]

# 4. Deploy previous version
npm run build
npm run deploy:prod

# 5. Verify rollback successful
# 6. Create incident report
# 7. Investigate root cause
```

### Documentation After Rollback
- [ ] Incident report created
- [ ] Root cause identified
- [ ] Fix planned for next release
- [ ] Team debriefing completed
- [ ] Lessons documented

---

## Version-Specific Checklists

### PATCH Release (X.Y.Z → X.Y.Z+1)
Used for: Bug fixes, hotfixes, security patches

Pre-release specific:
- [ ] Only bug fixes merged
- [ ] No new features
- [ ] All fixes tested
- [ ] Affected users notified

### MINOR Release (X.Y.Z → X.Y+1.0)
Used for: New features, improvements

Pre-release specific:
- [ ] Feature branches merged & tested
- [ ] Feature documentation ready
- [ ] Breaking changes? (if yes, should be MAJOR)
- [ ] API backward compatible
- [ ] Database migrations non-breaking

### MAJOR Release (X.Y.Z → X+1.0.0)
Used for: Major features, breaking changes, architecture changes

Pre-release specific:
- [ ] Migration guide prepared
- [ ] Breaking changes clearly documented
- [ ] Database migration path clear
- [ ] User communication plan ready
- [ ] Extensive testing completed
- [ ] Performance benchmarks validated
- [ ] Security audit completed

---

## Communication Template

### Release Announcement

```markdown
🎉 **ProjectPolda Version X.Y.Z Released!**

**Release Date**: [YYYY-MM-DD]

**What's New:**
- ✨ Feature 1
- ✨ Feature 2
- 🐛 Fixed critical bug X
- 🚀 Performance improvement Y

**Breaking Changes**: [List if any]

**Upgrade Guide**: See CHANGELOG.md

**Known Issues**: [If any]

**Support**: Contact @support-team

See full details: [Link to CHANGELOG.md]
```

### Hotfix Announcement

```markdown
🔥 **Hotfix Released: ProjectPolda X.Y.Z**

**Issue**: [Brief description]

**Status**: Applied to production

**Action Required**: 
- [ ] Restart services (if manual)
- [ ] No action needed (auto-deployed)

**Verification**: [How to verify fix]

See CHANGELOG.md for details.
```

---

## Common Issues & Solutions

### Issue: Version Mismatch Between Files

```bash
# Problem: VERSION, package.json files have different versions

# Solution:
VERSION=$(cat VERSION)
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" apps/web/package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" backend/package.json

# Verify
grep '"version"' VERSION package.json apps/web/package.json backend/package.json
```

### Issue: Tag Already Exists

```bash
# Problem: git tag fails because tag exists

# Solution:
# Option 1: Use different version number
git tag -a v[NEW_VERSION] -m "description"

# Option 2: Delete old tag (only if not pushed)
git tag -d vX.Y.Z
git tag -a vX.Y.Z -m "description"

# Option 3: Force update remote (dangerous!)
git push origin vX.Y.Z --force
```

### Issue: Merge Conflicts in CHANGELOG

```bash
# Problem: Multiple people edited CHANGELOG

# Solution:
# 1. Open CHANGELOG.md
# 2. Find conflict markers (<<<<<<, ======, >>>>>>>)
# 3. Manually merge changes
# 4. Keep both entries organized
# 5. Commit resolved version
```

### Issue: Deployment Failed After Release

```bash
# Problem: Release tagged but deployment failed

# Solution:
# 1. Investigate deployment logs
# 2. Fix issue in code
# 3. Create new patch version (X.Y.Z+1)
# 4. Re-release with fix
# OR rollback to previous version
```

---

## Tools & Scripts

### Quick Version Update Script

```bash
#!/bin/bash
# scripts/update-version.sh

if [ -z "$1" ]; then
  echo "Usage: ./scripts/update-version.sh X.Y.Z"
  exit 1
fi

NEW_VERSION=$1
OLD_VERSION=$(cat VERSION)

echo "Updating from $OLD_VERSION to $NEW_VERSION..."

# Update VERSION file
echo "$NEW_VERSION" > VERSION

# Update package.json files
for file in package.json apps/web/package.json backend/package.json; do
  sed -i "s/\"version\": \"$OLD_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$file"
done

echo "✅ Version updated to $NEW_VERSION"
echo "⏭️  Next: Update CHANGELOG.md"
```

### Verify Release Ready Script

```bash
#!/bin/bash
# scripts/verify-release.sh

echo "🔍 Checking release readiness..."

# Check tests
echo -n "Tests... "
npm test > /dev/null 2>&1 && echo "✅" || echo "❌"

# Check lint
echo -n "Lint... "
npm run lint > /dev/null 2>&1 && echo "✅" || echo "❌"

# Check build
echo -n "Build... "
npm run build > /dev/null 2>&1 && echo "✅" || echo "❌"

# Check version consistency
echo -n "Version consistency... "
VERSION=$(cat VERSION)
if grep -q "\"version\": \"$VERSION\"" package.json && \
   grep -q "\"version\": \"$VERSION\"" apps/web/package.json && \
   grep -q "\"version\": \"$VERSION\"" backend/package.json; then
  echo "✅"
else
  echo "❌"
fi

echo "✅ Ready for release!"
```

---

## Related Documents

- [VERSIONING.md](./VERSIONING.md) - Complete versioning guide
- [CHANGELOG.md](./CHANGELOG.md) - Release history
- [VERSION](./VERSION) - Current version
- [contributing-guide.md](./documentations/) - Contributing guidelines (if exists)

---

## Contact & Support

- **Release Questions**: Check VERSIONING.md
- **Release Issues**: See "Common Issues" section
- **Need Help**: Contact @project-lead

---

_Last Updated: 2026-04-23_
_Used for: Managing releases efficiently_
