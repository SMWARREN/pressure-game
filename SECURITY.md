# Security Guidelines for Pressure Game

## ⚠️ Sensitive Data Protection

### What Should NEVER Be Committed
- ❌ API Keys (SonarQube tokens, GitHub tokens, etc.)
- ❌ Database passwords or connection strings
- ❌ Private keys or certificates
- ❌ OAuth tokens or session secrets
- ❌ User credentials
- ❌ `.env` files with actual values

### What IS Committed
- ✅ `.env.example` - Template only, no real values
- ✅ Configuration templates
- ✅ Public API documentation

## 📋 Setup Instructions

### For SonarQube Analysis

1. **Copy the example env file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your SonarQube token to `.env`:**
   ```
   SONAR_TOKEN=squ_your_actual_token_here
   ```

3. **Make sure `.env` is in `.gitignore`:**
   ```bash
   # Already configured - .gitignore contains: .env*
   ```

4. **Use the token in scripts:**
   ```bash
   # The npm script reads from environment variable
   npm run sonar:analyze
   ```

### For Database Connections

1. **Never hardcode credentials:**
   ```javascript
   // ❌ BAD - Never do this
   const password = 'my_password';
   
   // ✅ GOOD - Use environment variables
   const password = process.env.MYSQL_PASSWORD;
   ```

2. **Add to `.env`:**
   ```
   MYSQL_PASSWORD=your_password_here
   MYSQL_HOST=localhost
   MYSQL_USER=root
   ```

3. **Reference in code:**
   ```javascript
   const config = {
     host: process.env.MYSQL_HOST,
     user: process.env.MYSQL_USER,
     password: process.env.MYSQL_PASSWORD,
   };
   ```

## 🔐 Pre-Commit Checklist

Before committing, ensure:
- [ ] No hardcoded API keys or tokens
- [ ] No database passwords in code
- [ ] No `.env` files (only `.env.example`)
- [ ] All secrets are in environment variables
- [ ] No sensitive data in comments or commit messages

## 🚨 If Sensitive Data Gets Committed

If you accidentally commit sensitive data:

1. **Immediately invalidate/rotate the token:**
   ```bash
   # Regenerate your SonarQube token in SonarQube admin panel
   ```

2. **Remove from git history:**
   ```bash
   # Use git-filter-repo (recommended)
   pip install git-filter-repo
   git filter-repo --replace-text /path/to/replacements.txt
   ```

3. **Force push (only in private repos):**
   ```bash
   git push --force-with-lease
   ```

## 📚 Additional Resources

- [GitHub - Protecting Sensitive Data](https://docs.github.com/en/code-security/secret-scanning)
- [git-filter-repo Documentation](https://htmlpreview.github.io/?https://github.com/newren/git-filter-repo/blob/docs/html/git-filter-repo.html)
- [OWASP - Sensitive Data Exposure](https://owasp.org/www-project-top-ten/)

## 🤖 Automated Checks

Consider using:
- **pre-commit hooks** to detect secrets before committing
- **GitHub secret scanning** to detect exposed credentials
- **git-secrets** to prevent committing known patterns

Example pre-commit hook (add to `.git/hooks/pre-commit`):
```bash
#!/bin/bash
if git diff --cached | grep -iE 'password|token|secret|api.key'; then
  echo "❌ Sensitive data detected in commit. Aborting."
  exit 1
fi
```

---

**Remember: Security is everyone's responsibility!** 🔒
