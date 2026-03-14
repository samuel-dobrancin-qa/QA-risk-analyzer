import { useState } from "react";

// ─── Secret scrubber ──────────────────────────────────────────────────────────
const SECRET_PATTERNS = [
  { label: "AWS Access Key",        regex: /AKIA[0-9A-Z]{16}/g },
  { label: "GitHub Token",          regex: /gh[pousr]_[A-Za-z0-9]{36,}/g },
  { label: "Generic API Key",       regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([A-Za-z0-9\-_.]{16,64})['"]?/gi },
  { label: "Bearer Token",          regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi },
  { label: "Private Key Block",     regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { label: "Generic Secret",        regex: /(?:secret|password|passwd|pwd|token)\s*[:=]\s*['"]?([^\s'"]{8,64})['"]?/gi },
  { label: "Connection String",     regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s"']+/gi },
  { label: "Email Address",         regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { label: "URL with Credentials",  regex: /https?:\/\/[^:@\s]+:[^@\s]+@[^\s]+/g },
  { label: "Internal IP",           regex: /\b(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g },
];

function scrubSecrets(text) {
  let scrubbed = text;
  const found = [];
  SECRET_PATTERNS.forEach(({ label, regex }) => {
    const hits = text.match(regex);
    if (hits) {
      found.push({ label, count: [...new Set(hits)].length });
      scrubbed = scrubbed.replace(regex, `[REDACTED:${label.replace(/ /g,"_").toUpperCase()}]`);
    }
  });
  return { scrubbed, found };
}

// ─── Workflow configs ─────────────────────────────────────────────────────────
const WORKFLOWS = [
  {
    id: "github",
    label: "GitHub PR",
    icon: "🐙",
    color: "#24292e",
    urlPlaceholder: "https://github.com/owner/repo/pull/123",
    urlLabel: "GitHub PR URL",
    urlRequired: true,
    contextLabel: "PR Description & Files Changed",
    contextPlaceholder: `Paste from the GitHub PR page:

Title: Fix memory leak in editor model
Description: This PR fixes a memory leak that occurs when opening large files...
Files changed:
- src/editor/model.ts (+45, -12)
- src/editor/widget.ts (+8, -3)`,
    hint: "Open the PR on GitHub → copy the title, description, and files changed list"
  },
  {
    id: "gitlab",
    label: "GitLab MR",
    icon: "🦊",
    color: "#fc6d26",
    urlPlaceholder: "https://gitlab.com/group/project/-/merge_requests/123",
    urlLabel: "GitLab MR URL",
    urlRequired: true,
    contextLabel: "MR Description & Files Changed",
    contextPlaceholder: `Paste from the GitLab MR page:

Title: Refactor authentication middleware
Description: Replaces legacy session handling with JWT tokens...
Files changed:
- app/middleware/auth.rb (+120, -45)
- spec/middleware/auth_spec.rb (+60, -10)`,
    hint: "Open the MR on GitLab → copy the title, description, and changed files"
  },
  {
    id: "jira",
    label: "Jira Ticket",
    icon: "📋",
    color: "#0052cc",
    urlPlaceholder: "https://yourcompany.atlassian.net/browse/PROJ-123",
    urlLabel: "Jira Ticket URL",
    urlRequired: false,
    contextLabel: "Ticket Description & Acceptance Criteria",
    contextPlaceholder: `Paste from your Jira ticket:

Ticket: PROJ-123
Summary: Add two-factor authentication to login flow
Description: Users should be able to enable 2FA via authenticator app...
Acceptance Criteria:
- User can enable/disable 2FA in account settings
- Login requires TOTP code when 2FA is enabled
- Recovery codes are generated on 2FA setup
Linked PRs / branches: feature/2fa-auth`,
    hint: "Open the Jira ticket → copy the summary, description, and acceptance criteria"
  },
  {
    id: "azure",
    label: "Azure DevOps",
    icon: "🔷",
    color: "#0078d4",
    urlPlaceholder: "https://dev.azure.com/org/project/_git/repo/pullrequest/123",
    urlLabel: "Azure DevOps PR URL",
    urlRequired: true,
    contextLabel: "PR Description & Files Changed",
    contextPlaceholder: `Paste from the Azure DevOps PR:

Title: Update payment processing API client
Description: Updates the payment client to use the new v3 API endpoints...
Work items linked: #456 - Migrate to Payment API v3
Files changed:
- src/payments/client.cs (+89, -34)
- tests/payments/client_tests.cs (+45, -8)`,
    hint: "Open the PR in Azure DevOps → copy the title, description, and file changes"
  },
  {
    id: "bitbucket",
    label: "Bitbucket PR",
    icon: "🪣",
    color: "#0052cc",
    urlPlaceholder: "https://bitbucket.org/workspace/repo/pull-requests/123",
    urlLabel: "Bitbucket PR URL",
    urlRequired: true,
    contextLabel: "PR Description & Files Changed",
    contextPlaceholder: `Paste from the Bitbucket PR:

Title: Optimise database query performance
Description: Adds indexes and rewrites slow queries in the reporting module...
Files changed:
- src/reports/queries.py (+34, -67)
- migrations/0045_add_report_indexes.py (+28, -0)`,
    hint: "Open the PR in Bitbucket → copy the title, description, and diff summary"
  },
  {
    id: "plain",
    label: "Plain Text",
    icon: "📝",
    color: "#6366f1",
    urlPlaceholder: "https://... (optional reference link)",
    urlLabel: "Reference URL (optional)",
    urlRequired: false,
    contextLabel: "Change Description",
    contextPlaceholder: `Describe what changed in plain language:

Feature / bug being addressed:
We are adding a new user notification system that sends email and in-app alerts when a payment fails.

What was changed:
- New NotificationService class added
- Email templates created for payment failure scenarios  
- Background job added to retry failed payment notifications
- User preferences table updated with notification settings

Risk areas:
- Email sending could fail silently
- Background job scheduling needs testing under load`,
    hint: "Works with any tool — just describe what changed and what it does"
  },
];

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO = {
  workflow: "github",
  url: "https://github.com/facebook/react/pull/31734",
  title: "Fix useEffect cleanup timing in StrictMode",
  repo: "facebook/react",
  files: 12, additions: 347, deletions: 89,
  diff_summary: `PR #31734: Fix useEffect cleanup timing in StrictMode
Author: sebmarkbage
Base: main <- Head: fix/strict-mode-cleanup

Description:
Fixes incorrect cleanup timing when effects run twice in StrictMode during development. The double-invocation was not properly cleaning up subscriptions, causing memory leaks in components that use external stores.

Files changed (12):
- packages/react-reconciler/src/ReactFiberHooks.js (+120, -45): Core hook lifecycle changes
- packages/react-reconciler/src/ReactFiberCommitWork.js (+80, -20): Commit phase cleanup
- packages/react-dom/src/__tests__/ReactHooksWithNoopRenderer-test.js (+90, -10): Test updates
- packages/react/src/ReactHooks.js (+15, -5): Public API surface
- packages/react-reconciler/src/ReactFiberWorkLoop.js (+42, -9): Work loop modifications`
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function RiskBadge({ score }) {
  const level = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";
  const C = { critical:["#fee2e2","#991b1b","#fca5a5","#ef4444"], high:["#ffedd5","#9a3412","#fdba74","#f97316"], medium:["#fef9c3","#854d0e","#fde047","#eab308"], low:["#dcfce7","#166534","#86efac","#22c55e"] };
  const [bg,text,border,dot] = C[level];
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:bg,border:`1px solid ${border}`}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:dot,boxShadow:`0 0 6px ${dot}`}}/>
      <span style={{fontSize:13,fontWeight:600,color:text,fontFamily:"'DM Mono',monospace",letterSpacing:.5}}>{level.toUpperCase()} RISK · {score}/100</span>
    </div>
  );
}

function ScoreRing({ score }) {
  const norm = 54 - 7/2, circ = 2*Math.PI*norm, dash = (score/100)*circ;
  const color = score>=75?"#ef4444":score>=50?"#f97316":score>=25?"#eab308":"#22c55e";
  return (
    <div style={{position:"relative",width:120,height:120,flexShrink:0}}>
      <svg width={120} height={120} style={{transform:"rotate(-90deg)"}}>
        <circle cx={60} cy={60} r={norm} fill="none" stroke="#e5e7eb" strokeWidth={7}/>
        <circle cx={60} cy={60} r={norm} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)",filter:`drop-shadow(0 0 8px ${color}80)`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:28,fontWeight:800,color,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{score}</span>
        <span style={{fontSize:10,color:"#9ca3af",fontFamily:"'DM Mono',monospace",letterSpacing:1}}>RISK</span>
      </div>
    </div>
  );
}

function Pill({ label, color="#6366f1" }) {
  return <span style={{display:"inline-block",padding:"2px 10px",borderRadius:12,background:color+"18",border:`1px solid ${color}40`,fontSize:12,fontWeight:500,color,fontFamily:"'DM Mono',monospace"}}>{label}</span>;
}

function Card({ title, icon, children, delay=0 }) {
  return (
    <div style={{background:"#fff",borderRadius:16,border:"1px solid #e5e7eb",padding:24,animation:`fadeUp 0.5s ease ${delay}s both`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <span style={{fontSize:18}}>{icon}</span>
        <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#111827",fontFamily:"'Sora',sans-serif"}}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CheckItem({ text }) {
  const [done, setDone] = useState(false);
  return (
    <div onClick={()=>setDone(d=>!d)} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:"1px solid #f3f4f6",alignItems:"flex-start",cursor:"pointer"}}>
      <div style={{width:20,height:20,borderRadius:6,flexShrink:0,marginTop:1,background:done?"#dcfce7":"#f9fafb",border:`1px solid ${done?"#86efac":"#e5e7eb"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,transition:"all .15s"}}>
        {done?"✓":""}
      </div>
      <span style={{fontSize:13.5,color:done?"#9ca3af":"#374151",lineHeight:1.5,textDecoration:done?"line-through":"none",transition:"all .15s"}}>{text}</span>
    </div>
  );
}

function ComponentTag({ name, risk, reason }) {
  const c = {high:"#ef4444",medium:"#f97316",low:"#22c55e"}[risk]||"#6b7280";
  return (
    <div style={{border:`1px solid ${c}30`,borderRadius:10,padding:"10px 14px",marginBottom:8,background:c+"0a"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:reason?4:0}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#1f2937",fontWeight:500}}>{name}</span>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:c}}/>
          <span style={{fontSize:11,color:c,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{risk}</span>
        </div>
      </div>
      {reason&&<p style={{margin:0,fontSize:12,color:"#6b7280",lineHeight:1.5}}>{reason}</p>}
    </div>
  );
}

// ─── Transparency Panel ───────────────────────────────────────────────────────
function TransparencyPanel({ prData, workflow, onConfirm, onCancel }) {
  const { scrubbed, found } = scrubSecrets(prData.diff_summary || "");
  const rows = [
    { label:"Source",      value: workflow.label },
    { label:"Reference",   value: prData.url || "Not provided" },
    { label:"Title",       value: prData.title },
    { label:"Context",     value: found.length ? `Sent with ${found.length} secret type(s) redacted` : "Sent — no secrets detected" },
  ];
  const neverSent = ["API keys","Auth tokens","Full source code","Your identity","Browser cookies"];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"#fff",borderRadius:20,maxWidth:560,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.25)",overflow:"hidden",animation:"fadeUp .25s ease"}}>
        <div style={{background:"linear-gradient(135deg,#0f172a,#1e293b)",padding:"22px 26px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{fontSize:22}}>🔒</span>
            <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#f8fafc",fontFamily:"'Sora',sans-serif"}}>What gets sent to AI</h2>
          </div>
          <p style={{margin:0,fontSize:13,color:"#94a3b8",lineHeight:1.5}}>Review exactly what leaves your browser. Secrets are automatically redacted before anything is sent.</p>
        </div>
        <div style={{padding:24}}>
          {found.length > 0 ? (
            <div style={{background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:12,padding:14,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span>⚠️</span><span style={{fontWeight:700,fontSize:14,color:"#92400e"}}>Secrets detected &amp; redacted</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {found.map((f,i)=><span key={i} style={{padding:"2px 10px",borderRadius:10,background:"#fde68a",fontSize:12,fontWeight:600,color:"#78350f",fontFamily:"'DM Mono',monospace"}}>{f.label} ×{f.count}</span>)}
              </div>
            </div>
          ) : (
            <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:12,padding:14,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span>✅</span><span style={{fontWeight:700,fontSize:14,color:"#166534"}}>No secrets detected</span>
              </div>
            </div>
          )}
          <p style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#374151"}}>Data sent to AI:</p>
          <div style={{background:"#f8fafc",borderRadius:10,border:"1px solid #e5e7eb",overflow:"hidden",marginBottom:16}}>
            {rows.map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:i<rows.length-1?"1px solid #f3f4f6":"none",gap:12}}>
                <span style={{fontSize:13,color:"#6b7280",fontFamily:"'DM Mono',monospace",flexShrink:0,minWidth:80}}>{r.label}</span>
                <span style={{fontSize:13,color:"#111827",flex:1,wordBreak:"break-all"}}>{r.value}</span>
                <span style={{fontSize:15,flexShrink:0}}>✅</span>
              </div>
            ))}
          </div>
          {found.length > 0 && (
            <details style={{marginBottom:16}}>
              <summary style={{fontSize:13,color:"#6366f1",cursor:"pointer",fontWeight:600,marginBottom:8,userSelect:"none"}}>View redacted preview ▾</summary>
              <pre style={{background:"#1e293b",color:"#94a3b8",borderRadius:10,padding:14,fontSize:11,overflow:"auto",maxHeight:150,fontFamily:"'DM Mono',monospace",lineHeight:1.6,margin:0}}>
                {scrubbed.slice(0,800)}{scrubbed.length>800?"\n…":""}
              </pre>
            </details>
          )}
          <div style={{background:"#f8fafc",borderRadius:10,border:"1px solid #e5e7eb",padding:14,marginBottom:22}}>
            <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#374151"}}>🚫 Never sent:</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {neverSent.map(t=><span key={t} style={{padding:"2px 10px",borderRadius:10,background:"#f3f4f6",fontSize:12,color:"#6b7280",fontFamily:"'DM Mono',monospace"}}>{t}</span>)}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onCancel} style={{flex:1,padding:13,borderRadius:10,border:"1.5px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:14,fontWeight:600,color:"#6b7280",fontFamily:"'Sora',sans-serif"}}>Cancel</button>
            <button onClick={()=>onConfirm(scrubbed)} style={{flex:2,padding:13,borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#7c3aed)",cursor:"pointer",fontSize:14,fontWeight:700,color:"#fff",fontFamily:"'Sora',sans-serif",boxShadow:"0 4px 15px rgba(99,102,241,0.3)"}}>Looks good — Run Analysis →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeWorkflow, setActiveWorkflow] = useState("github");
  const [url, setUrl]                       = useState("");
  const [context, setContext]               = useState("");
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState(null);
  const [error, setError]                   = useState(null);
  const [activeTab, setActiveTab]           = useState("overview");
  const [showPanel, setShowPanel]           = useState(false);
  const [pendingData, setPendingData]       = useState(null);

  const workflow = WORKFLOWS.find(w => w.id === activeWorkflow);

  const parseJSON = text => {
    try { return JSON.parse(text.replace(/```json|```/g,"").trim()); }
    catch { const m = text.match(/\{[\s\S]*\}/); if(m) return JSON.parse(m[0]); throw new Error("Could not parse AI response."); }
  };

  const requestAnalysis = (demo=false) => {
    if (demo) {
      const w = WORKFLOWS.find(w=>w.id==="github");
      setPendingData({ ...DEMO, workflow: w });
      setShowPanel(true);
      return;
    }
    if (!context.trim()) { setError("Please paste your change description before analyzing."); return; }
    if (workflow.urlRequired && !url.trim()) { setError(`Please enter the ${workflow.label} URL.`); return; }
    setError(null);

    // Parse title/repo from context or URL
    let title = "Change Analysis";
    let repo = workflow.label;
    const urlMatch = url.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/) ||
                     url.match(/gitlab\.com\/(.+?)\/-\/merge_requests\/(\d+)/) ||
                     url.match(/bitbucket\.org\/([^/]+\/[^/]+)\/pull-requests\/(\d+)/);
    if (urlMatch) { repo = urlMatch[1]; title = `#${urlMatch[2]} in ${urlMatch[1]}`; }
    const titleLine = context.match(/(?:title|summary):\s*(.+)/i);
    if (titleLine) title = titleLine[1].trim();

    setPendingData({
      url: url.trim() || "Not provided",
      title,
      repo,
      files: null, additions: null, deletions: null,
      diff_summary: context.trim(),
      workflow
    });
    setShowPanel(true);
  };

  const runAnalysis = async (scrubbedDiff) => {
    setShowPanel(false);
    setLoading(true); setError(null); setResult(null);
    const pr = pendingData;

    const workflowLabel = pr.workflow?.label || "GitHub PR";
    const prompt = `You are a senior QA engineer. Analyze this ${workflowLabel} and produce a thorough QA risk assessment.

Source: ${workflowLabel}
Reference: ${pr.url}
Repository/Project: ${pr.repo}

--- CHANGE DESCRIPTION ---
${scrubbedDiff}
--- END ---

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "risk_score": <integer 0-100>,
  "risk_summary": "<2 specific sentences about the actual risks>",
  "affected_components": [{"name":"<file or component>","risk":"high|medium|low","reason":"<specific reason>"}],
  "test_cases": [{"id":"TC-001","area":"<area>","title":"<specific title>","steps":["step 1","step 2","step 3"],"type":"functional|regression|edge_case|integration"}],
  "regression_checklist": ["<specific item based on actual changes>"],
  "slack_message": "<emoji slack alert with risk score and key changes, under 200 chars>"
}

Generate AS MANY test cases as the change requires:
- Tiny change (typo, 1 line): 1-2 test cases
- Small bug fix: 2-4 test cases
- Medium feature/refactor: 4-8 test cases
- Large or risky change: 8-15 test cases

Generate AS MANY checklist items as needed (min 3, max 15).
Be specific to the actual change — no generic answers. Return ONLY the JSON.`;

    try {
      const res = await fetch("/api/analyze", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:4000,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content.map(b=>b.text||"").join("");
      setResult({...parseJSON(text), pr});
      setActiveTab("overview");
    } catch(e) {
      setError(e.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    {id:"overview",   label:"Overview",    icon:"📊"},
    {id:"testcases",  label:"Test Cases",  icon:"🧪"},
    {id:"components", label:"Components",  icon:"🗂️"},
    {id:"regression", label:"Regression",  icon:"🔁"},
    {id:"slack",      label:"Slack Bot",   icon:"💬"},
  ];
  const TYPE_COLOR = {functional:"#6366f1",regression:"#f97316",edge_case:"#ec4899",integration:"#0ea5e9"};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box} body{margin:0;background:#f8fafc}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tb:hover{background:#f3f4f6!important}
        .tb.on{background:#fff!important;color:#111827!important;box-shadow:0 1px 3px rgba(0,0,0,.1)!important}
        .wf-btn{transition:all .2s;border:2px solid #e5e7eb!important}
        .wf-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.08)!important}
        .wf-btn.active{border-color:currentColor!important;box-shadow:0 4px 12px rgba(0,0,0,.1)!important}
        .ab:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 25px rgba(99,102,241,.4)!important}
        .inp:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.1)!important}
        .db:hover{background:#f3f4f6!important}
      `}</style>

      {showPanel && pendingData && (
        <TransparencyPanel
          prData={pendingData}
          workflow={pendingData.workflow || workflow}
          onConfirm={runAnalysis}
          onCancel={()=>setShowPanel(false)}
        />
      )}

      <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Sora',sans-serif"}}>

        {/* Nav */}
        <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 32px",position:"sticky",top:0,zIndex:100}}>
          <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔬</div>
              <span style={{fontSize:17,fontWeight:800,color:"#111827",letterSpacing:-.5}}>QA Risk Analyzer</span>
              <span style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:"#ede9fe",color:"#7c3aed",fontWeight:600,fontFamily:"'DM Mono',monospace"}}>BETA</span>
            </div>
            <span style={{fontSize:12,color:"#22c55e",fontWeight:600,fontFamily:"'DM Mono',monospace"}}>🔒 Secret scrubbing ON</span>
          </div>
        </div>

        <div style={{maxWidth:900,margin:"0 auto",padding:"40px 24px"}}>

          {/* Hero */}
          <div style={{textAlign:"center",marginBottom:40,animation:"fadeUp .5s ease"}}>
            <h1 style={{fontSize:38,fontWeight:800,color:"#111827",margin:"0 0 12px",letterSpacing:-1.5,lineHeight:1.15}}>
              Know What to Test<br/>
              <span style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Before You Merge</span>
            </h1>
            <p style={{fontSize:16,color:"#6b7280",maxWidth:520,margin:"0 auto",lineHeight:1.6}}>
              AI-powered risk analysis, test cases &amp; regression checklists for any workflow — GitHub, GitLab, Jira, Azure DevOps, Bitbucket, or plain text.
            </p>
          </div>

          {/* Input card */}
          <div style={{background:"#fff",borderRadius:20,border:"1px solid #e5e7eb",padding:28,marginBottom:32,animation:"fadeUp .5s ease .1s both",boxShadow:"0 4px 20px rgba(0,0,0,.04)"}}>

            {/* Workflow selector */}
            <p style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#374151"}}>Select your workflow</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
              {WORKFLOWS.map(w=>(
                <button key={w.id} className={`wf-btn${activeWorkflow===w.id?" active":""}`}
                  onClick={()=>{setActiveWorkflow(w.id);setUrl("");setContext("");setError(null);setResult(null);}}
                  style={{
                    padding:"8px 14px",borderRadius:10,cursor:"pointer",fontFamily:"'Sora',sans-serif",
                    fontSize:13,fontWeight:activeWorkflow===w.id?700:500,
                    background:activeWorkflow===w.id?w.color+"10":"#fff",
                    color:activeWorkflow===w.id?w.color:"#6b7280",
                    borderColor:activeWorkflow===w.id?w.color:"#e5e7eb",
                  }}>
                  {w.icon} {w.label}
                </button>
              ))}
            </div>

            {/* URL input */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>
                {workflow.urlLabel} {workflow.urlRequired && <span style={{color:"#ef4444"}}>*</span>}
              </label>
              <input className="inp" type="text" value={url} onChange={e=>setUrl(e.target.value)}
                placeholder={workflow.urlPlaceholder}
                style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1.5px solid #e5e7eb",fontSize:13,color:"#111827",fontFamily:"'DM Mono',monospace",background:"#fafafa",transition:"all .2s"}}
              />
            </div>

            {/* Context textarea */}
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>
                  {workflow.contextLabel} <span style={{color:"#ef4444"}}>*</span>
                </label>
              </div>
              <textarea className="inp" value={context} onChange={e=>setContext(e.target.value)}
                placeholder={workflow.contextPlaceholder}
                style={{width:"100%",minHeight:140,padding:"12px 16px",borderRadius:12,border:"1.5px solid #e5e7eb",fontSize:13,color:"#111827",fontFamily:"'DM Mono',monospace",background:"#fafafa",transition:"all .2s",resize:"vertical",lineHeight:1.6}}
              />
            </div>

            {/* Hint */}
            <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:14,flexShrink:0}}>💡</span>
              <p style={{margin:0,fontSize:12,color:"#0369a1",lineHeight:1.6}}>{workflow.hint}</p>
            </div>

            {/* Analyze button */}
            <button className="ab" onClick={()=>requestAnalysis()} disabled={loading||!context.trim()||(workflow.urlRequired&&!url.trim())}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
                cursor:loading||!context.trim()||(workflow.urlRequired&&!url.trim())?"not-allowed":"pointer",
                background:loading||!context.trim()||(workflow.urlRequired&&!url.trim())?"#e5e7eb":"linear-gradient(135deg,#6366f1,#7c3aed)",
                color:loading||!context.trim()||(workflow.urlRequired&&!url.trim())?"#9ca3af":"#fff",
                fontSize:14,fontWeight:700,fontFamily:"'Sora',sans-serif",transition:"all .2s",boxShadow:"0 4px 15px rgba(99,102,241,.25)"}}>
              {loading?"Analyzing…":"Analyze →"}
            </button>

            {/* Demo */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginTop:16}}>
              <div style={{flex:1,height:1,background:"#f3f4f6"}}/><span style={{fontSize:12,color:"#9ca3af"}}>or try a demo</span><div style={{flex:1,height:1,background:"#f3f4f6"}}/>
            </div>
            <button className="db" onClick={()=>requestAnalysis(true)} disabled={loading}
              style={{width:"100%",marginTop:14,padding:12,borderRadius:10,border:"1.5px dashed #d1d5db",background:"transparent",cursor:loading?"not-allowed":"pointer",fontSize:13,color:"#6b7280",fontFamily:"'DM Mono',monospace",transition:"all .2s"}}>
              📦 facebook/react · Fix useEffect cleanup timing in StrictMode
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:60,animation:"fadeUp .3s ease"}}>
              <div style={{width:48,height:48,borderRadius:"50%",border:"3px solid #e5e7eb",borderTopColor:"#6366f1",animation:"spin .8s linear infinite"}}/>
              <div style={{textAlign:"center"}}>
                <p style={{margin:0,fontWeight:600,color:"#111827"}}>Analyzing…</p>
                <p style={{margin:"4px 0 0",fontSize:13,color:"#9ca3af"}}>Assessing risk, generating test cases</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:16,marginBottom:24,color:"#991b1b",fontSize:14}}>⚠️ {error}</div>}

          {/* Results */}
          {result && !loading && (
            <div style={{animation:"fadeUp .4s ease"}}>
              <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <span style={{fontSize:18}}>{result.pr.workflow?.icon||"🔀"}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#111827"}}>{result.pr.title}</div>
                  <div style={{fontSize:12,color:"#6b7280",fontFamily:"'DM Mono',monospace"}}>{result.pr.repo} · {result.pr.workflow?.label||"GitHub PR"}</div>
                </div>
                <RiskBadge score={result.risk_score}/>
              </div>

              {/* Tabs */}
              <div style={{display:"flex",gap:4,background:"#f3f4f6",padding:4,borderRadius:12,marginBottom:20,overflowX:"auto"}}>
                {TABS.map(t=>(
                  <button key={t.id} className={`tb${activeTab===t.id?" on":""}`} onClick={()=>setActiveTab(t.id)}
                    style={{flex:1,minWidth:80,padding:"8px 12px",borderRadius:9,border:"none",cursor:"pointer",background:"transparent",fontSize:13,fontWeight:activeTab===t.id?700:500,color:activeTab===t.id?"#111827":"#6b7280",fontFamily:"'Sora',sans-serif",transition:"all .15s",whiteSpace:"nowrap"}}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {activeTab==="overview" && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div style={{gridColumn:"1 / -1"}}>
                    <Card title="Risk Assessment" icon="🎯">
                      <div style={{display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
                        <ScoreRing score={result.risk_score}/>
                        <div style={{flex:1}}>
                          <p style={{margin:"0 0 12px",fontSize:14,color:"#374151",lineHeight:1.7}}>{result.risk_summary}</p>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                            <Pill label={`${result.test_cases?.length||0} test cases`} color="#6366f1"/>
                            <Pill label={`${result.affected_components?.length||0} components`} color="#f97316"/>
                            <Pill label={`${result.regression_checklist?.length||0} checks`} color="#0ea5e9"/>
                          </div>
                          <p style={{margin:0,fontSize:12,color:"#9ca3af",fontStyle:"italic"}}>Test case count is proportional to change scope and risk.</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <Card title="Quick Stats" icon="📈" delay={.05}>
                    {[
                      ["Source", result.pr.workflow?.label||"GitHub PR"],
                      ["Files Changed", result.pr.files||"—"],
                      ["Lines Added", result.pr.additions?`+${result.pr.additions}`:"—"],
                      ["High-Risk Components", result.affected_components?.filter(c=>c.risk==="high").length||0],
                    ].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f3f4f6"}}>
                        <span style={{fontSize:13,color:"#6b7280"}}>{l}</span>
                        <span style={{fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace",color:"#111827"}}>{v}</span>
                      </div>
                    ))}
                  </Card>
                  <Card title="Top Risks" icon="⚠️" delay={.1}>
                    {result.affected_components?.slice(0,4).map((c,i)=><ComponentTag key={i} name={c.name} risk={c.risk}/>)}
                  </Card>
                </div>
              )}

              {activeTab==="testcases" && (
                <Card title={`Generated Test Cases (${result.test_cases?.length||0})`} icon="🧪">
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {result.test_cases?.map((tc,i)=>(
                      <div key={i} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:16,background:"#fafafa"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#9ca3af"}}>{tc.id}</span>
                          <span style={{fontWeight:700,fontSize:14,color:"#111827",flex:1}}>{tc.title}</span>
                          <Pill label={tc.type?.replace("_"," ")} color={TYPE_COLOR[tc.type]||"#6366f1"}/>
                          <Pill label={tc.area} color="#0ea5e9"/>
                        </div>
                        <ol style={{margin:0,paddingLeft:20}}>
                          {tc.steps?.map((s,j)=><li key={j} style={{fontSize:13,color:"#374151",marginBottom:4,lineHeight:1.5}}>{s}</li>)}
                        </ol>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {activeTab==="components" && (
                <Card title="Affected Component Map" icon="🗂️">
                  {result.affected_components?.map((c,i)=><ComponentTag key={i} name={c.name} risk={c.risk} reason={c.reason}/>)}
                </Card>
              )}

              {activeTab==="regression" && (
                <Card title="Regression Checklist" icon="🔁">
                  <p style={{margin:"0 0 12px",fontSize:13,color:"#9ca3af"}}>{result.regression_checklist?.length} items · Click to check off as you test</p>
                  {result.regression_checklist?.map((item,i)=><CheckItem key={i} text={item}/>)}
                </Card>
              )}

              {activeTab==="slack" && (
                <Card title="Slack Bot Message Preview" icon="💬">
                  <p style={{margin:"0 0 16px",fontSize:13,color:"#6b7280"}}>Message your QA bot would post to #qa-alerts.</p>
                  <div style={{background:"#1a1d21",borderRadius:12,padding:16,fontFamily:"'DM Mono',monospace"}}>
                    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{width:36,height:36,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:6}}>
                          <span style={{color:"#e8e8e8",fontWeight:700,fontSize:14}}>QA Risk Bot</span>
                          <span style={{color:"#616061",fontSize:11}}>Today at {new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                        </div>
                        <div style={{color:"#d1d2d3",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{result.slack_message}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {!result && !loading && !error && (
            <div style={{textAlign:"center",padding:"60px 0",animation:"fadeUp .5s ease .2s both"}}>
              <div style={{fontSize:64,marginBottom:16}}>🔬</div>
              <p style={{fontSize:15,color:"#9ca3af"}}>Select a workflow above and paste your change description to get started</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
