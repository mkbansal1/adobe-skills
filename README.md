# Adobe Skills for AI Coding Agents

Repository of Adobe skills for AI coding agents.

## Installation

### Claude Code Plugins

```bash
# Add the Adobe Skills marketplace
/plugin marketplace add adobe/skills

# Install AEM Edge Delivery Services plugin (all 17 skills)
/plugin install aem-edge-delivery-services@adobe-skills

# Install AEM Cloud Dispatcher plugin
/plugin install aem-cloud-dispatcher@adobe-skills

# Install AEM 6.5 LTS Dispatcher plugin
/plugin install aem-6-5lts-dispatcher@adobe-skills
```

### Vercel Skills (npx skills)

```bash
# Install all AEM Edge Delivery Services skills
npx skills add https://github.com/adobe/skills/tree/main/skills/aem/edge-delivery-services --all

# Install all AEM Cloud Dispatcher skills
npx skills add https://github.com/adobe/skills/tree/main/skills/aem/cloud --all

# Install all AEM 6.5 LTS Dispatcher skills
npx skills add https://github.com/adobe/skills/tree/main/skills/aem/6.5lts --all

# Install dispatcher skills for a single agent (pick ONE mode only)
# Cloud mode:
npx skills add https://github.com/adobe/skills/tree/main/skills/aem/cloud --all -a cursor -y
# AMS 6.5 mode:
npx skills add https://github.com/adobe/skills/tree/main/skills/aem/6.5lts --all -a cursor -y

# Install specific skill(s)
npx skills add adobe/skills -s content-driven-development
npx skills add adobe/skills -s content-driven-development building-blocks testing-blocks

# Install a specific dispatcher skill from a mode-scoped source
npx skills add https://github.com/adobe/skills/tree/main/skills/aem/cloud -s config-authoring
npx skills add https://github.com/adobe/skills/tree/main/skills/aem/6.5lts -s config-authoring

# Install all skills discoverable at repository root (currently AEM Edge Delivery Services)
npx skills add adobe/skills --all
# Note: Dispatcher mode skills are grouped under mode-scoped paths and are not discovered from repository root.

# List skills discoverable at repository root (currently AEM Edge Delivery Services)
npx skills add adobe/skills --list
# For dispatcher skills, use mode-scoped --list:
# npx skills add https://github.com/adobe/skills/tree/main/skills/aem/cloud --list
# npx skills add https://github.com/adobe/skills/tree/main/skills/aem/6.5lts --list
```

### upskill (GitHub CLI Extension)

```bash
gh extension install trieloff/gh-upskill

# Install all skills discoverable at repository root
gh upskill adobe/skills --all
# Note: prefer mode-scoped --path installs for dispatcher skills.

# Install only AEM Edge Delivery Services skills
gh upskill adobe/skills --path skills/aem/edge-delivery-services --all

# Install only AEM Cloud Dispatcher skills
gh upskill adobe/skills --path skills/aem/cloud --all

# Install only AEM 6.5 LTS Dispatcher skills
gh upskill adobe/skills --path skills/aem/6.5lts --all

# Install a specific skill
gh upskill adobe/skills --path skills/aem/edge-delivery-services --skill content-driven-development
gh upskill adobe/skills --path skills/aem/cloud --skill config-authoring
gh upskill adobe/skills --path skills/aem/6.5lts --skill config-authoring

# List available skills in a subfolder
gh upskill adobe/skills --path skills/aem/edge-delivery-services --list
gh upskill adobe/skills --path skills/aem/cloud --list
gh upskill adobe/skills --path skills/aem/6.5lts --list
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

### AEM Dispatcher

Dispatcher skills are now split by upper-layer variant to avoid mode auto-detection and make extension to other AEM variants easier.
Install only one dispatcher mode plugin in a workspace (`cloud` or `6.5lts`).
Each dispatcher skill is self-contained and includes its own local `references/` folder so `npx skills add` installs remain portable.

#### AEM Cloud Dispatcher (`skills/aem/cloud/skills/dispatcher`)

| Skill | Description |
|-------|-------------|
| `config-authoring` | Create, modify, review, and harden Dispatcher/HTTPD config for AEMaaCS cloud mode |
| `technical-advisory` | Documentation-backed guidance and verification planning for cloud mode |
| `incident-response` | Investigate live incidents for cloud mode |
| `performance-tuning` | Analyze and tune cache efficiency/latency for cloud mode |
| `security-hardening` | Risk-based security audits and hardening plans for cloud mode |

#### AEM 6.5 LTS Dispatcher (`skills/aem/6.5lts/skills/dispatcher`)

| Skill | Description |
|-------|-------------|
| `config-authoring` | Create, modify, review, and harden Dispatcher/HTTPD config for AEM 6.5 LTS/AMS mode |
| `technical-advisory` | Documentation-backed guidance and verification planning for AEM 6.5 LTS/AMS mode |
| `incident-response` | Investigate live incidents for AEM 6.5 LTS/AMS mode |
| `performance-tuning` | Analyze and tune cache efficiency/latency for AEM 6.5 LTS/AMS mode |
| `security-hardening` | Risk-based security audits and hardening plans for AEM 6.5 LTS/AMS mode |

## Repository Structure

```
skills/
\-- aem/
    |-- edge-delivery-services/
    |   |-- .claude-plugin/
    |   |   \-- plugin.json
    |   \-- skills/
    |       |-- content-driven-development/
    |       |-- building-blocks/
    |       \-- ...
    |-- cloud/
    |   |-- .claude-plugin/
    |   |   \-- plugin.json
    |   \-- skills/
    |       \-- dispatcher/
    |           |-- config-authoring/
    |           |   |-- SKILL.md
    |           |   \-- references/
    |           |       \-- ...
    |           |-- technical-advisory/
    |           \-- ...
    |-- 6.5lts/
    |   |-- .claude-plugin/
    |   |   \-- plugin.json
    |   \-- skills/
    |       \-- dispatcher/
    |           |-- config-authoring/
    |           |   |-- SKILL.md
    |           |   \-- references/
    |           |       \-- ...
    |           |-- technical-advisory/
    |           \-- ...
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding or updating skills.

## Resources

- [agentskills.io Specification](https://agentskills.io)
- [Claude Code Plugins](https://code.claude.com/docs/en/discover-plugins)
- [Vercel Skills](https://github.com/vercel-labs/skills)
- [upskill GitHub Extension](https://github.com/trieloff/gh-upskill)

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.
