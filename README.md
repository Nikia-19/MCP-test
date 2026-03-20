# SAP Sales Order Dashboard

A Fiori-style Sales Order CRUD dashboard built with vanilla HTML/CSS/JS — designed to demonstrate **MCP + GitHub integration** with any LLM (Claude, GPT-4o, Gemini, etc.)

## Features

- Full CRUD — Create, Read, Update, Delete sales orders
- KPI strip with animated counters
- Filter by status and region, free-text search
- Sortable columns, pagination
- CSV export
- LocalStorage persistence
- SAP Fiori design language (IBM Plex Sans, blue topbar, status badges)

## Run locally

```bash
# No build step needed — pure HTML/JS
open index.html
# Or serve with any static server:
npx serve .
python3 -m http.server 8080
```

---

## GitHub Repo Structure

```
sap-sales-dashboard/
├── index.html          # Main app shell
├── css/
│   └── style.css       # SAP Fiori-style stylesheet
├── js/
│   ├── data.js         # Seed data (15 orders)
│   └── app.js          # CRUD logic, filtering, export
├── .github/
│   └── workflows/
│       └── security-scan.yml   # CodeQL security scan
└── README.md
```

---

## MCP + GitHub Demo Guide

### Prerequisites
- GitHub repo created (e.g. `your-org/sap-sales-dashboard`)
- MCP connected to your LLM client:
  - **Claude**: Settings → Connectors → GitHub
  - **VS Code (Copilot)**: `.vscode/mcp.json`
  - **GPT-4o / other LLMs**: Use `github-mcp-server` via stdio

---

### Demo 1 — Browse repo files via Claude

Ask your LLM:
> "Show me all files in the sap-sales-dashboard repo and summarise what each one does."

What happens behind the scenes:
```
LLM → MCP → get_file_contents(repo, path) × N files → LLM summarises
```

---

### Demo 2 — Create an issue via Claude

Ask your LLM:
> "Create a GitHub issue titled 'Add currency selector for multi-region support' with label enhancement."

What happens:
```
LLM → MCP → create_issue({ title, labels, body }) → Issue #1 created
```

---

### Demo 3 — Create a PR via Claude

Ask your LLM:
> "Create a branch called feature/add-export-excel, then open a PR to main titled 'Add Excel export support'."

What happens:
```
LLM → MCP → create_branch() → create_pull_request() → PR opened
```

---

### Demo 4 — Security scan via MCP + CodeQL

The repo includes `.github/workflows/security-scan.yml`.

Ask your LLM:
> "Read the security-scan.yml file, check if there are any hardcoded secrets or XSS risks in app.js, and open an issue with findings."

What happens:
```
LLM → MCP → get_file_contents(app.js)
           → search_code(query: "innerHTML")
           → create_issue("Security Review: XSS risk in innerHTML usage", label: security)
```

Manual trigger:
```bash
# Push to GitHub and go to Actions tab → Run "Security Scan" workflow
```

---

### Demo 5 — Any LLM via stdio MCP

Not just Claude — GPT-4o, Gemini, Mistral, or any OpenAI-compatible model can connect to the same GitHub MCP server:

```json
// For Claude Desktop
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

```python
# For any OpenAI-compatible LLM via Python MCP client
# pip install mcp anthropic openai
from mcp import ClientSession, StdioServerParameters
# ... connect any LLM to the same MCP server
```

The MCP protocol is **model-agnostic** — same server, any brain.

---

## Security Scan Workflow

The included GitHub Actions workflow runs CodeQL analysis on every push:

- Scans for XSS vulnerabilities (innerHTML, eval usage)
- Checks for hardcoded secrets
- Reports findings as GitHub Security Advisories

Results visible at: `github.com/your-org/sap-sales-dashboard/security`

---

## Suggested MCP test prompts 

| Prompt | MCP Tools Used |
|---|---|
| "List all open issues in this repo" | `list_issues` |
| "What files changed in the last 3 commits?" | `list_commits`, `get_commit` |
| "Find any use of eval() or innerHTML in the JS files" | `search_code` |
| "Create a bug report issue for the pagination reset bug" | `create_issue` |
| "Show me the contents of app.js" | `get_file_contents` |
| "Open a PR from feature/fix-sort to main" | `create_pull_request` |
