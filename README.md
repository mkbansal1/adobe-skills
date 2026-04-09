# Adobe Skills for AI Coding Agents

Repository of Adobe skills for AI coding agents.

## Installation

### Claude Code Plugins

```bash
# Add the Adobe Skills marketplace
/plugin marketplace add adobe/skills

# Install AEM Edge Delivery Services plugin (all 17 skills)
/plugin install aem-edge-delivery-services@adobe-skills

# Install AEM Project Management plugin (6 skills)
/plugin install aem-project-management@adobe-skills

# Install App Builder plugin (6 skills)
/plugin install app-builder@adobe-skills
```

### Vercel Skills (npx skills)

```bash
# Install all AEM Edge Delivery Services skills
npx skills add https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services --all

# Install all App Builder skills
npx skills add https://github.com/adobe/skills/tree/main/skills/app-builder --all

# Install specific skill(s)
npx skills add adobe/skills -s content-driven-development
npx skills add adobe/skills -s content-driven-development building-blocks testing-blocks

# Install all Adobe skills (all products)
npx skills add adobe/skills --all

# List available skills
npx skills add adobe/skills --list
```

### upskill (GitHub CLI Extension)

```bash
gh extension install trieloff/gh-upskill

# Install all skills from this repo
gh upskill adobe/skills --all

# Install only AEM Edge Delivery Services skills
gh upskill adobe/skills --path skills/aem/edge-delivery-services --all

# Install a specific skill
gh upskill adobe/skills --path skills/aem/edge-delivery-services --skill content-driven-development

# List available skills in a subfolder
gh upskill adobe/skills --path skills/aem/edge-delivery-services --list
```

## Available Skills

### AEM Edge Delivery Services

#### Core Development

| Skill | Description |
|-------|-------------|
| `content-driven-development` | Orchestrates the CDD workflow for all code changes |
| `analyze-and-plan` | Analyze requirements and define acceptance criteria |
| `building-blocks` | Implement blocks and core functionality |
| `testing-blocks` | Browser testing and validation |
| `content-modeling` | Design author-friendly content models |
| `code-review` | Self-review and PR review |

#### Discovery

| Skill | Description |
|-------|-------------|
| `block-inventory` | Survey available blocks in project and Block Collection |
| `block-collection-and-party` | Search reference implementations |
| `docs-search` | Search aem.live documentation |
| `find-test-content` | Find existing content for testing |

#### Migration

| Skill | Description |
|-------|-------------|
| `page-import` | Import webpages (orchestrator) |
| `scrape-webpage` | Scrape and analyze webpage content |
| `identify-page-structure` | Analyze page sections |
| `page-decomposition` | Analyze content sequences |
| `authoring-analysis` | Determine authoring approach |
| `generate-import-html` | Generate structured HTML |
| `preview-import` | Preview imported content |

### AEM Project Management

Project lifecycle management for AEM Edge Delivery Services including handover documentation, PDF generation, and authentication.

> **Requirement:** This plugin is exclusively for AEM Edge Delivery Services projects. It validates projects by checking for `scripts/aem.js`. For non-Edge Delivery projects, the plugin exits early — use standard documentation approaches instead.

**Quick Start:**
```bash
cd your-edge-delivery-project   # or any subdirectory within it
# Say: "create handover documentation for this project"
```

**Setup:** You will be prompted for your Config Service organization name (the `{org}` in `https://main--site--{org}.aem.page`). A browser window will open for authentication — sign in and **close the browser window** to continue.

**Permissions:** Admin access to the project organization is required. The plugin queries the Config Service API to gather project configuration, site settings, and access controls for comprehensive documentation.

**Output:** Professional PDFs generated in `project-guides/` folder:
- `project-guides/AUTHOR-GUIDE.pdf` - For content authors
- `project-guides/DEVELOPER-GUIDE.pdf` - For developers
- `project-guides/ADMIN-GUIDE.pdf` - For administrators

| Skill | Description |
|-------|-------------|
| `handover` | Orchestrates project documentation generation |
| `authoring` | Generate comprehensive authoring guide for content authors |
| `development` | Generate technical documentation for developers |
| `admin` | Generate admin guide for site administrators |
| `whitepaper` | Create professional PDF whitepapers from Markdown |
| `auth` | Authenticate with AEM Config Service API |

### App Builder

Development, customization, testing, and deployment skills for Adobe App Builder projects.

**Skill chaining:**
- **Actions path:** `appbuilder-project-init` → `appbuilder-action-scaffolder` → `appbuilder-testing` → `appbuilder-cicd-pipeline`
- **UI path:** `appbuilder-project-init` → `appbuilder-ui-scaffolder` → `appbuilder-testing` → `appbuilder-cicd-pipeline`
- **E2E path:** `appbuilder-ui-scaffolder` or `appbuilder-testing` → `appbuilder-e2e-testing` → `appbuilder-cicd-pipeline`

| Skill | Description |
|-------|-------------|
| `appbuilder-project-init` | Initialize new Adobe App Builder projects and choose the right bootstrap path |
| `appbuilder-action-scaffolder` | Scaffold, implement, deploy, and debug Adobe Runtime actions |
| `appbuilder-ui-scaffolder` | Generate React Spectrum UI components for ExC Shell SPAs and AEM UI Extensions |
| `appbuilder-testing` | Generate and run Jest unit, integration, and contract tests for actions and UI components |
| `appbuilder-e2e-testing` | Playwright browser E2E tests for ExC Shell SPAs and AEM extensions |
| `appbuilder-cicd-pipeline` | Set up CI/CD pipelines for GitHub Actions, Azure DevOps, and GitLab CI |

## Repository Structure

```
skills/
├── aem/
│   ├── edge-delivery-services/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   └── skills/
│   │       ├── content-driven-development/
│   │       ├── building-blocks/
│   │       └── ...
│   └── project-management/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── fonts/
│       ├── hooks/
│       │   └── pdf-lifecycle.js
│       ├── templates/
│       │   └── whitepaper.typ
│       └── skills/
│           ├── handover/
│           ├── authoring/
│           ├── development/
│           ├── admin/
│           ├── whitepaper/
│           └── auth/
└── app-builder/
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        ├── _shared/
        ├── appbuilder-project-init/
        ├── appbuilder-action-scaffolder/
        ├── appbuilder-ui-scaffolder/
        ├── appbuilder-testing/
        ├── appbuilder-e2e-testing/
        └── appbuilder-cicd-pipeline/
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding or updating skills. Join [#agentskills](https://adobe.enterprise.slack.com/archives/C0APTKDNPEY) on Adobe Slack for questions and discussion.

## Resources

- [agentskills.io Specification](https://agentskills.io)
- [Claude Code Plugins](https://code.claude.com/docs/en/discover-plugins)
- [Vercel Skills](https://github.com/vercel-labs/skills)
- [upskill GitHub Extension](https://github.com/trieloff/gh-upskill)
- [#agentskills Slack Channel](https://adobe.enterprise.slack.com/archives/C0APTKDNPEY)

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.
