# 🔬 QA Risk Analyzer

> **AI-powered risk analysis, test cases & regression checklists for any development workflow.**

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL_1.1-blue?style=for-the-badge)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange?style=for-the-badge)](https://anthropic.com)

---

![Dizajn bez názvu(1)](https://github.com/user-attachments/assets/5c2d90a7-7912-4705-b601-5fecb130c142)

## 🚀 Live Demo

**[[qa-risk-analyzer-demo.vercel.app](https://qa-risk-analyzer.vercel.app/)]**

No sign-up required. Paste any PR, ticket, or change description and get instant QA analysis.

---

## 💡 Why I Built This

I've spent 4+ years as a QA engineer watching the same problem repeat itself: PRs come in, QA teams spend 20–30 minutes manually figuring out what to test, writing test cases from scratch, and deciding what regression to run.

The knowledge to do this well exists — it's just locked inside experienced QA engineers' heads. This tool is an attempt to make that knowledge available instantly, for any team, on any workflow.

It's also a demonstration that AI doesn't replace QA engineers. It amplifies them.

---

## 🤔 The Problem

Every time a developer opens a PR, a QA engineer has to manually decide:
- What's the risk level of this change?
- Which areas need testing?
- What test cases should I write?
- What regression checks are needed?

This takes time, relies on experience, and is inconsistent across team members. For large teams merging dozens of PRs a day, it becomes a bottleneck.

---

## ✅ The Solution

QA Risk Analyzer connects to your existing workflow and generates in seconds:

- **Risk Score** (0–100) with clear reasoning
- **Proportional test cases** — scaled to the actual complexity of the change
- **Affected component map** — what could break and why
- **Regression checklist** — clickable, specific to the actual change
- **Slack bot message** — ready to post to your #qa-alerts channel

---

## 🔧 Supported Workflows

Works with any development tool — no integration required. Just paste your change description.

| Workflow | Input |
|---|---|
| 🐙 **GitHub PR** | PR URL + description |
| 🦊 **GitLab MR** | MR URL + description |
| 📋 **Jira Ticket** | Ticket URL + acceptance criteria |
| 🔷 **Azure DevOps** | PR URL + description |
| 🪣 **Bitbucket PR** | PR URL + description |
| 📝 **Plain Text** | Describe the change in your own words |

---

## 🔒 Security First

QA engineers deal with sensitive codebases. This tool was built with security as a core feature, not an afterthought.

### Secret Scrubbing
Before any data leaves your browser, an automatic scrubbing engine detects and redacts:
- AWS access keys and secret keys
- GitHub, GitLab, and API tokens
- Bearer tokens and auth headers
- Passwords and connection strings
- Private key blocks
- Email addresses
- Internal IP addresses
- Hardcoded credentials in URLs

### Transparency Panel
Every analysis shows you **exactly what gets sent to the AI** before you confirm. You stay in control.

### What is never sent
- Your full source code
- Authentication tokens
- Browser cookies or session data
- Your identity or personal information

See [SECURITY.md](SECURITY.md) for full details.

---

## 🖥️ Screenshots

<img width="762" height="730" alt="Snímka obrazovky 2026-03-19 o 21 11 52" src="https://github.com/user-attachments/assets/36922b25-435a-481f-be59-b17e658468ca" />
<img width="762" height="730" alt="Snímka obrazovky 2026-03-19 o 21 12 08" src="https://github.com/user-attachments/assets/1ee00a17-2c64-45a9-a7a0-4ca84e4dc0ab" />
<img width="762" height="730" alt="Snímka obrazovky 2026-03-19 o 21 13 16" src="https://github.com/user-attachments/assets/b7ae00e3-de06-43ce-a6d1-29d40467b29a" />
<img width="762" height="730" alt="Snímka obrazovky 2026-03-19 o 21 13 39" src="https://github.com/user-attachments/assets/2c3233fa-90fe-47d4-aaec-7ea86ea04007" />
<img width="762" height="730" alt="Snímka obrazovky 2026-03-19 o 21 13 58" src="https://github.com/user-attachments/assets/9873422e-ee66-4f71-b747-993d07f3d9fa" />

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| AI Engine | Anthropic Claude (claude-haiku) |
| Styling | Inline CSS with custom design system |
| Deployment | Vercel (serverless) |
| API Proxy | Vercel Edge Functions |
| Secret Scrubbing | Custom regex engine (client-side) |

---

## 🏃 Run Locally

```bash
# Clone the repo
git clone https://github.com/samuel-dobrancin-qa/qa-risk-analyzer-demo.git
cd qa-risk-analyzer-demo

# Install dependencies
npm install

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🚢 Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/samuel-dobrancin-qa/qa-risk-analyzer-demo)

1. Click the button above
2. Add `ANTHROPIC_API_KEY` in Vercel environment variables
3. Deploy

---

## 📄 License

This project is source-available under the [Business Source License 1.1](LICENSE).

- ✅ Free for personal use and evaluation
- ✅ Free to fork and learn from
- ❌ Commercial use requires written permission

Contact: s.dobrancin@live.com

---

## 👤 Author

**Samuel Dobrančin** — Quality Engineer & Creator

- GitHub: [@samuel-dobrancin-qa](https://github.com/samuel-dobrancin-qa)
- LinkedIn: [samuel-dobrancin-8a203a273](https://linkedin.com/in/samuel-dobrancin-8a203a273)
- Email: s.dobrancin@live.com
