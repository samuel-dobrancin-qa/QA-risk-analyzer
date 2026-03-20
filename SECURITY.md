# Security Policy

## Overview

QA Risk Analyzer was built with security as a core feature. 
This document explains exactly how your data is handled.

---

## What happens to your data

### Secret scrubbing — client side, before anything is sent

Before any text leaves your browser, an automatic scrubbing 
engine scans for and redacts sensitive patterns including:

- AWS access keys (`AKIA...`) and secret keys
- GitHub and GitLab personal access tokens
- Bearer tokens and authorization headers
- Passwords and connection strings (`password=`, `pwd=`)
- Private key blocks (`-----BEGIN PRIVATE KEY-----`)
- Email addresses
- Internal IP addresses (`192.168.x.x`, `10.x.x.x`)
- Hardcoded credentials in URLs

This scrubbing happens entirely in your browser. 
Redacted content is replaced with `[REDACTED]` placeholders 
before the AI ever sees it.

---

## Transparency panel

Every analysis includes a transparency panel showing you 
**exactly what text will be sent to the AI** before you confirm. 
You can review and cancel at any point.

---

## What is never sent to the AI

- Your full source code
- Authentication tokens or API keys
- Browser cookies or session data
- Your identity or personal information
- Any content you haven't explicitly pasted into the tool

---

## What is sent to the AI

Only the text you paste into the input field, after secret 
scrubbing has been applied. No metadata, no browser info, 
no tracking.

---

## Third party services

This tool uses the Anthropic Claude API to generate analysis. 
Anthropic's privacy policy applies to data processed through 
their API. See [anthropic.com/privacy](https://anthropic.com/privacy).

---

## Reporting a vulnerability

If you discover a security issue in this project, please 
contact me directly rather than opening a public issue.

**Email:** s.dobrancin@live.com

I'll respond within 48 hours.

---

## Responsible use

This tool is designed for QA engineers analysing their own 
team's PRs and tickets. Do not paste sensitive production 
secrets, customer data, or confidential code into any 
web-based tool including this one.
