# Setup Guide - Bon Air Media Centralized Codebase

This guide will help you set up the Bon Air Media centralized repository and get started with development.

## Prerequisites

- **Git**: Version control
- **Node.js**: v18+ (for Next.js and web projects)
- **Python**: 3.9+ (for Python tools and scraper)
- **pip**: Python package manager

## Initial Setup

### 1. Navigate to the Repository

```bash
cd /Users/christianbryant/Sites/bon-air-media
```

### 2. Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: Bon Air Media centralized repository"
```

### 3. Set Up Python Web Scraper

```bash
cd shared/python-webscraper

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
.\venv\Scripts\activate  # On Windows

# Install the scraper
pip install -e .

# Install Playwright browsers (for JavaScript rendering)
playwright install chromium

# Run tests/examples
python examples/basic_usage.py
```

### 4. Set Up Main Website

```bash
cd sites/bonairmedia.com

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project-Specific Setup

### Setting Up a New SaaS Project

```bash
cd saas/

# Create new project directory
mkdir my-saas-project
cd my-saas-project

# Example: Python-based SaaS
python3 -m venv venv
source venv/bin/activate
pip install -e ../../shared/python-webscraper

# OR Node.js-based SaaS
npm init -y
npm install next react react-dom

# Create your project structure
```

### Setting Up a New Client Site

```bash
cd sites/

# Create new Next.js site
npx create-next-app@latest client-name --typescript --tailwind --app

# OR move existing project
mv /path/to/existing/project ./client-name
```

### Setting Up a New App

```bash
# Mobile app (React Native)
cd apps/mobile-apps/
npx react-native init MyApp

# Desktop app (Electron)
cd apps/desktop-apps/
npm init
npm install electron
```

## Using Shared Tools in Your Projects

### Python Projects

Add the web scraper to your Python project:

```bash
# From your project directory
pip install -e ../../shared/python-webscraper

# In your code
from bam_scraper import Scraper

scraper = Scraper()
result = scraper.scrape("https://example.com")
```

### Node.js Projects

Link shared Node.js packages (when available):

```json
{
  "dependencies": {
    "@bam/design-system": "file:../../shared/design-system"
  }
}
```

## Development Workflow

### Daily Workflow

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make changes and test**
   ```bash
   # Run tests, dev servers, etc.
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Add: description of changes"
   git push origin feature/my-feature
   ```

### Testing Changes

#### Python Web Scraper
```bash
cd shared/python-webscraper
source venv/bin/activate

# Run examples
python examples/basic_usage.py
python examples/advanced_usage.py
python examples/agent_integration.py

# Run tests (when available)
pytest
```

#### Next.js Sites
```bash
cd sites/bonairmedia.com

# Development
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Environment Variables

### Python Projects

Create `.env` file in your project root:
```env
# Example for web scraper
PROXY_URL=http://proxy.example.com:8080
RATE_LIMIT_DELAY=2.0
```

### Next.js Projects

Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...
```

## Troubleshooting

### Python Issues

**Virtual environment not activating:**
```bash
# Make sure you're in the right directory
cd shared/python-webscraper

# Try explicit path
source ./venv/bin/activate
```

**Playwright browsers not installed:**
```bash
playwright install chromium
```

**Import errors:**
```bash
# Reinstall in editable mode
pip install -e .
```

### Node.js Issues

**Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

## Best Practices

### 1. Keep Shared Tools Updated

When you improve a shared tool, test it across all projects that use it:

```bash
# Update the tool
cd shared/python-webscraper
# Make changes...

# Test in project A
cd ../../saas/project-a
python test_scraper.py

# Test in project B
cd ../../saas/project-b
python test_scraper.py
```

### 2. Use Version Control Properly

- Commit early and often
- Write clear commit messages
- Keep commits focused (one feature/fix per commit)
- Use branches for features

### 3. Document Everything

Every project should have:
- README.md with setup instructions
- Clear code comments
- API documentation (for libraries)
- Usage examples

### 4. Test Before Committing

- Run tests
- Check for errors
- Test in a clean environment when possible

## Getting Help

- Check project-specific READMEs
- Review example code in `examples/` directories
- Contact team members
- Document solutions to help others

## Next Steps

1. ✅ Repository structure is set up
2. ✅ Python web scraper is ready
3. ✅ Main website is in place

**To Do:**
- [x] Set up remote Git repository → [github.com/XtianBDevn/bonair](https://github.com/XtianBDevn/bonair)
- [ ] Add continuous integration (CI/CD) at monorepo root
- [ ] Create shared design system
- [ ] Build your first SaaS project
- [ ] Document internal processes
- [ ] Set up project management tools

---

**Questions?** Contact: info@bonairmedia.com

**Happy coding!** 🚀
