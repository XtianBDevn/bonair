# Bon Air Media - Centralized Codebase

Welcome to the Bon Air Media centralized repository. This structure organizes all our projects into three main categories: SaaS products, client sites, and applications.

## Repository Structure

```
bon-air-media/
├── saas/                    # SaaS Products (for monetization)
│   ├── project-alpha/
│   └── project-beta/
├── sites/                   # Client Websites & Company Site
│   ├── bonairmedia.com/    # Our main website
│   └── client-sites/
├── apps/                    # Mobile & Desktop Applications
│   ├── mobile-apps/
│   └── desktop-apps/
└── shared/                  # Shared Libraries & Tools
    ├── python-webscraper/  # Modular web scraper
    ├── design-system/      # (Future) Shared UI components
    └── utils/              # (Future) Shared utilities
```

## Philosophy

As a web and app development company, we focus our efforts in two areas:

1. **Client Work**: Building websites and applications (in `sites/` and `apps/`)
2. **SaaS Development**: Creating monetizable products when not on client projects (in `saas/`)

This structure keeps everything organized while making it easy to share code and tools across projects.

## Shared Tools

### Python Web Scraper

Our modular, production-ready web scraper with:
- Adaptive scraping (basic HTTP + JavaScript rendering)
- Anti-detection features (rotating user agents, rate limiting, proxies)
- Clean API for easy integration with agents and projects

**Location**: `shared/python-webscraper/`

**Quick Start**:
```bash
cd shared/python-webscraper
pip install -e .
playwright install chromium

# Run examples
python examples/basic_usage.py
```

**Documentation**: See [shared/python-webscraper/README.md](shared/python-webscraper/README.md)

## Getting Started

### For New Projects

#### Starting a New SaaS Project
```bash
cd saas/
mkdir my-new-saas
cd my-new-saas
# Initialize your project (Python, Node.js, etc.)
```

#### Starting a New Client Site
```bash
cd sites/
mkdir client-name-site
cd client-name-site
# Initialize Next.js, React, or other framework
```

#### Starting a New App
```bash
cd apps/mobile-apps/  # or apps/desktop-apps/
mkdir app-name
cd app-name
# Initialize React Native, Electron, etc.
```

### Using Shared Tools

All shared tools can be imported/used from the `shared/` directory:

**Python Projects**:
```bash
# Install shared tools as dependencies
pip install -e ../../shared/python-webscraper
```

**Node.js Projects**:
```json
{
  "dependencies": {
    "@bam/design-system": "file:../../shared/design-system"
  }
}
```

## Current Projects

See **[PROJECTS.md](PROJECTS.md)** for the full index (paths, GitHub remotes, deploy targets, and quick-start commands).

Highlights:

All products are **git submodules** (separate repos). Clone with `--recurse-submodules`.

- **saas/** — [bon-air-ai](https://github.com/XtianBDevn/bon-air-ai) (Campaigns)
- **apps/bon-air-local-ai/** — [bon-air-local-ai](https://github.com/XtianBDevn/bon-air-local-ai)
- **apps/seren-legal/** — [seren-law](https://github.com/XtianBDevn/seren-law)
- **sites/bonairmedia.com/** — [bonairmedia](https://github.com/XtianBDevn/bonairmedia)
- **shared/python-webscraper/** — [bon-air-media-scraper](https://github.com/XtianBDevn/bon-air-media-scraper)
- **shared/ts-lib/** — `@bon-air/ts-lib` (lives in umbrella repo; npm workspace for both Next apps)

Umbrella: **[XtianBDevn/bonair](https://github.com/XtianBDevn/bonair)** · See **[PROJECTS.md](PROJECTS.md)**

## Best Practices

1. **Reuse Before Reinvent**: Check `shared/` for existing tools before building new ones
2. **Document Everything**: Each project should have a clear README
3. **Share What's Useful**: If you build something reusable, add it to `shared/`
4. **Consistent Structure**: Follow the established patterns in existing projects
5. **Test Your Code**: Especially shared tools that multiple projects depend on

## Development Workflows

### Working on Multiple Projects

```bash
# Terminal 1: Main website
cd sites/bonairmedia.com
npm run dev

# Terminal 2: SaaS project
cd saas/my-saas
python main.py

# Terminal 3: Testing shared tools
cd shared/python-webscraper
pytest
```

### Updating Shared Tools

When you update a shared tool, make sure to:
1. Test it thoroughly
2. Update its documentation
3. Bump the version number
4. Notify team members who use it

### Adding New Shared Tools

1. Create the tool in `shared/tool-name/`
2. Add a comprehensive README
3. Add usage examples
4. Document the API
5. Add tests if applicable

## Tech Stack Overview

### Current Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Animation**: GSAP, Three.js
- **Backend**: (To be determined per project)
- **Scraping**: Python (requests, BeautifulSoup, Playwright)

### Recommended for New Projects
- **Web Apps**: Next.js 16+ with TypeScript
- **Mobile Apps**: React Native
- **Desktop Apps**: Electron
- **Backend**: Node.js, Python, or Go (depending on needs)
- **SaaS**: Stack based on specific requirements

## Contact & Support

**Bon Air Media**
Richmond, Virginia

- Website: [bonairmedia.com](https://bonairmedia.com)
- Email: info@bonairmedia.com

---

**Made with ❤️ in Richmond, Virginia**
