// PowerShell x AI Harness CLIs slide deck
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

const Fa = require("react-icons/fa");
const Hi = require("react-icons/hi");

// ============================================================
// Palette
// ============================================================
const C = {
  bg:        "0A0F1E", // deep navy black
  panel:     "121A2E", // card base
  panel2:    "1A2238", // card alt
  code:      "050810", // code block bg
  border:    "1E2A4A",
  text:      "F8FAFC",
  muted:     "94A3B8",
  dim:       "64748B",
  cyan:      "38BDF8", // electric cyan (primary accent)
  psBlue:    "2563EB", // PowerShell-ish blue
  gold:      "FBBF24", // highlight
  green:     "34D399", // terminal green
  pink:      "F472B6", // accent
};

const F = {
  head: "Calibri",        // headers
  body: "Calibri",        // body
  mono: "Consolas",       // code
};

// ============================================================
// Icon rasterization helpers
// ============================================================
function renderSvg(IconComponent, color, size) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function icon(IconComponent, color = "#38BDF8", size = 256) {
  const svg = renderSvg(IconComponent, color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ============================================================
// Reusable slide chrome
// ============================================================
function bg(slide) {
  slide.background = { color: C.bg };
}

function topBar(slide, kicker) {
  // subtle top accent line + kicker label
  slide.addShape("rect", {
    x: 0.5, y: 0.35, w: 0.18, h: 0.18,
    fill: { color: C.cyan }, line: { color: C.cyan },
  });
  slide.addText(kicker, {
    x: 0.75, y: 0.3, w: 8, h: 0.3,
    fontFace: F.body, fontSize: 11, color: C.cyan, bold: true, charSpacing: 4,
    margin: 0,
  });
}

function footer(slide, page, total) {
  slide.addText("PowerShell x AI Harness CLIs", {
    x: 0.5, y: 5.28, w: 5, h: 0.25,
    fontFace: F.body, fontSize: 9, color: C.dim, margin: 0,
  });
  slide.addText(`${page} / ${total}`, {
    x: 8.7, y: 5.28, w: 0.8, h: 0.25,
    fontFace: F.mono, fontSize: 9, color: C.dim, align: "right", margin: 0,
  });
}

// Card with optional left accent bar
function card(slide, x, y, w, h, accent = null) {
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: C.panel },
    line: { color: C.border, width: 0.75 },
  });
  if (accent) {
    slide.addShape("rect", {
      x, y, w: 0.06, h,
      fill: { color: accent }, line: { color: accent },
    });
  }
}

// Code block
function codeBlock(slide, x, y, w, h, lines) {
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: C.code }, line: { color: C.border, width: 0.5 },
  });
  // Prompt indicator dot
  slide.addShape("ellipse", {
    x: x + 0.12, y: y + 0.12, w: 0.1, h: 0.1,
    fill: { color: "F87171" }, line: { color: "F87171" },
  });
  slide.addShape("ellipse", {
    x: x + 0.28, y: y + 0.12, w: 0.1, h: 0.1,
    fill: { color: "FBBF24" }, line: { color: "FBBF24" },
  });
  slide.addShape("ellipse", {
    x: x + 0.44, y: y + 0.12, w: 0.1, h: 0.1,
    fill: { color: "34D399" }, line: { color: "34D399" },
  });
  slide.addText(lines, {
    x: x + 0.15, y: y + 0.38, w: w - 0.3, h: h - 0.48,
    fontFace: F.mono, fontSize: 9, color: C.text,
    margin: 0, valign: "top",
  });
}

// ============================================================
// MAIN
// ============================================================
async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10" x 5.625"
  pres.author = "Chris Huffman";
  pres.title = "PowerShell x AI Harness CLIs";

  // Pre-render icons we'll need
  const ic = {
    terminal:  await icon(Fa.FaTerminal,  "#38BDF8", 256),
    bolt:      await icon(Fa.FaBolt,      "#FBBF24", 256),
    wrench:    await icon(Fa.FaWrench,    "#38BDF8", 256),
    cog:       await icon(Fa.FaCogs,      "#94A3B8", 256),
    box:       await icon(Fa.FaBoxOpen,   "#F472B6", 256),
    powershell:await icon(Fa.FaTerminal,  "#38BDF8", 256),
    envelope:  await icon(Fa.FaEnvelope,  "#38BDF8", 256),
    userShield:await icon(Fa.FaUserShield,"#FBBF24", 256),
    check:     await icon(Fa.FaCheckCircle,"#34D399",256),
    database:  await icon(Fa.FaDatabase,  "#38BDF8", 256),
    code:      await icon(Fa.FaCode,      "#F472B6", 256),
    archive:   await icon(Fa.FaFileArchive,"#FBBF24",256),
    server:    await icon(Fa.FaServer,    "#38BDF8", 256),
    key:       await icon(Fa.FaKey,       "#FBBF24", 256),
    shield:    await icon(Fa.FaShieldAlt, "#34D399", 256),
    folder:    await icon(Fa.FaFolderOpen,"#F472B6", 256),
    win:       await icon(Fa.FaWindows,   "#38BDF8", 256),
    apple:     await icon(Fa.FaApple,     "#F8FAFC", 256),
    linux:     await icon(Fa.FaLinux,     "#FBBF24", 256),
    typed:     await icon(Fa.FaSitemap,   "#38BDF8", 256),
    pipe:      await icon(Fa.FaStream,    "#34D399", 256),
    plug:      await icon(Fa.FaPlug,      "#F472B6", 256),
    rocket:    await icon(Fa.FaRocket,    "#FBBF24", 256),
    eye:       await icon(Hi.HiOutlineLightBulb,"#FBBF24",256),
  };

  const TOTAL = 10;

  // ----------------------------------------------------------
  // SLIDE 1 — TITLE
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    bg(s);
    // Faint grid accent bottom-right (a vertical stripe)
    s.addShape("rect", {
      x: 9.4, y: 0, w: 0.6, h: 5.625,
      fill: { color: C.psBlue, transparency: 75 }, line: { color: C.psBlue, transparency: 100 },
    });
    s.addShape("rect", {
      x: 9.55, y: 0, w: 0.18, h: 5.625,
      fill: { color: C.cyan }, line: { color: C.cyan },
    });

    // Terminal mark
    s.addImage({ data: ic.powershell, x: 0.6, y: 0.6, w: 0.5, h: 0.5 });
    s.addText("PS>", {
      x: 1.15, y: 0.6, w: 1.1, h: 0.5,
      fontFace: F.mono, fontSize: 22, color: C.cyan, bold: true, valign: "middle", margin: 0,
    });

    // Big title
    s.addText([
      { text: "PowerShell ", options: { color: C.text, bold: true } },
      { text: "x ", options: { color: C.gold, bold: true } },
      { text: "AI Harness CLIs", options: { color: C.cyan, bold: true } },
    ], {
      x: 0.6, y: 1.55, w: 8.6, h: 1.2,
      fontFace: F.head, fontSize: 50, valign: "middle", margin: 0,
    });

    s.addText("Every cmdlet is already an agent tool.", {
      x: 0.6, y: 2.75, w: 9, h: 0.55,
      fontFace: F.head, fontSize: 24, color: C.muted, italic: true, margin: 0,
    });

    // Tag row
    s.addShape("rect", {
      x: 0.6, y: 3.7, w: 0.18, h: 0.18,
      fill: { color: C.gold }, line: { color: C.gold },
    });
    s.addText("Claude Code  ·  Codex  ·  any agent that calls tools", {
      x: 0.85, y: 3.62, w: 7, h: 0.35,
      fontFace: F.body, fontSize: 14, color: C.muted, margin: 0,
    });

    // Author chip
    s.addShape("rect", {
      x: 0.6, y: 4.7, w: 2.3, h: 0.45,
      fill: { color: C.panel }, line: { color: C.border, width: 0.75 },
    });
    s.addText("Chris Huffman  ·  2026", {
      x: 0.6, y: 4.7, w: 2.3, h: 0.45,
      fontFace: F.body, fontSize: 12, color: C.text, align: "center", valign: "middle", margin: 0,
    });
  }

  // ----------------------------------------------------------
  // SLIDE 2 — THE PREMISE
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    bg(s);
    topBar(s, "THE PREMISE");

    s.addText("Agents don't do things. They call things that do.", {
      x: 0.5, y: 0.7, w: 9, h: 0.7,
      fontFace: F.head, fontSize: 32, color: C.text, bold: true, margin: 0,
    });
    s.addText("Claude Code and Codex are reasoning loops wrapped around a tool-call interface. Their reach equals the tools you wire up. Your edges become their edges.", {
      x: 0.5, y: 1.5, w: 9, h: 0.7,
      fontFace: F.body, fontSize: 14, color: C.muted, margin: 0,
    });

    // Three cards
    const cardY = 2.55, cardH = 2.2, cardW = 2.95, gap = 0.15;
    const xs = [0.5, 0.5 + cardW + gap, 0.5 + 2 * (cardW + gap)];
    const cards = [
      { ic: ic.wrench,  hd: "Define",   sub: "Strongly typed inputs.", body: "Param attributes describe shape, types, and required-ness. Agents read this like an API spec." , accent: C.cyan },
      { ic: ic.pipe,    hd: "Compose",  sub: "Objects, not text.",     body: "PowerShell pipelines pass objects between cmdlets. No JSON glue between steps." , accent: C.green },
      { ic: ic.plug,    hd: "Invoke",   sub: "Direct to the OS.",      body: "AD, SQL, WMI, NTFS, REST, .NET — all reachable with one cmdlet. No subprocess gymnastics.", accent: C.pink },
    ];
    cards.forEach((c, i) => {
      card(s, xs[i], cardY, cardW, cardH, c.accent);
      s.addImage({ data: c.ic, x: xs[i] + 0.3, y: cardY + 0.3, w: 0.5, h: 0.5 });
      s.addText(c.hd, {
        x: xs[i] + 0.95, y: cardY + 0.28, w: 2, h: 0.4,
        fontFace: F.head, fontSize: 22, color: C.text, bold: true, margin: 0,
      });
      s.addText(c.sub, {
        x: xs[i] + 0.3, y: cardY + 0.95, w: cardW - 0.5, h: 0.35,
        fontFace: F.body, fontSize: 13, color: c.accent, bold: true, margin: 0,
      });
      s.addText(c.body, {
        x: xs[i] + 0.3, y: cardY + 1.3, w: cardW - 0.5, h: 0.85,
        fontFace: F.body, fontSize: 12, color: C.muted, margin: 0,
      });
    });

    footer(s, 2, TOTAL);
  }

  // ----------------------------------------------------------
  // SLIDE 3 — TWO PATHS
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    bg(s);
    topBar(s, "TWO PATHS TO THE SAME TOOL");

    s.addText("One path you build. One path you already have.", {
      x: 0.5, y: 0.7, w: 9, h: 0.55,
      fontFace: F.head, fontSize: 28, color: C.text, bold: true, margin: 0,
    });

    // Left card — conventional
    const lx = 0.5, ly = 1.55, lw = 4.4, lh = 3.55;
    card(s, lx, ly, lw, lh, "F87171");
    s.addText("The conventional path", {
      x: lx + 0.3, y: ly + 0.25, w: lw - 0.5, h: 0.4,
      fontFace: F.head, fontSize: 18, color: C.text, bold: true, margin: 0,
    });
    s.addText("Stand up a Python or Node toolbox, then bolt it onto the agent.", {
      x: lx + 0.3, y: ly + 0.7, w: lw - 0.5, h: 0.35,
      fontFace: F.body, fontSize: 11, color: "F87171", italic: true, margin: 0,
    });
    s.addText([
      { text: "pip install / npm install for every capability", options: { bullet: true, breakLine: true } },
      { text: "Re-implement REST wrappers around AD, SQL, SMB, NTFS", options: { bullet: true, breakLine: true } },
      { text: "Manage venvs, lockfiles, transitive CVEs", options: { bullet: true, breakLine: true } },
      { text: "Marshal JSON between every step yourself", options: { bullet: true, breakLine: true } },
      { text: "Hope the runtime is on the target box", options: { bullet: true } },
    ], {
      x: lx + 0.3, y: ly + 1.2, w: lw - 0.6, h: 2.2,
      fontFace: F.body, fontSize: 13, color: C.muted, paraSpaceAfter: 6, margin: 0,
    });

    // Right card — PowerShell
    const rx = 5.1, ry = 1.55, rw = 4.4, rh = 3.55;
    card(s, rx, ry, rw, rh, C.cyan);
    s.addImage({ data: ic.powershell, x: rx + 0.25, y: ry + 0.22, w: 0.45, h: 0.45 });
    s.addText("The PowerShell path", {
      x: rx + 0.8, y: ry + 0.25, w: rw - 1, h: 0.4,
      fontFace: F.head, fontSize: 18, color: C.text, bold: true, margin: 0,
    });
    s.addText("Cmdlets that already speak the enterprise. Zero install.", {
      x: rx + 0.3, y: ry + 0.75, w: rw - 0.5, h: 0.35,
      fontFace: F.body, fontSize: 11, color: C.cyan, italic: true, margin: 0,
    });
    s.addText([
      { text: ".NET base class library always available", options: { bullet: true, breakLine: true } },
      { text: "AD via DirectoryServices, SQL via SqlClient, SMB via CIM", options: { bullet: true, breakLine: true } },
      { text: "Pipelines pass typed PSCustomObjects natively", options: { bullet: true, breakLine: true } },
      { text: "Param blocks self-describe inputs to the agent", options: { bullet: true, breakLine: true } },
      { text: "Same shell on Windows, macOS, and Linux (PS 7+)", options: { bullet: true } },
    ], {
      x: rx + 0.3, y: ry + 1.2, w: rw - 0.6, h: 2.2,
      fontFace: F.body, fontSize: 13, color: C.text, paraSpaceAfter: 6, margin: 0,
    });

    footer(s, 3, TOTAL);
  }

  // ----------------------------------------------------------
  // SLIDE 4 — TEN CMDLETS GRID
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    bg(s);
    topBar(s, "THE DEMO SCRIPT");

    s.addText("10 cmdlets. Zero installs.", {
      x: 0.5, y: 0.7, w: 9, h: 0.55,
      fontFace: F.head, fontSize: 28, color: C.text, bold: true, margin: 0,
    });
    s.addText("Every function below ships natively with PowerShell 7+ and .NET. Each one is a candidate agent tool.", {
      x: 0.5, y: 1.25, w: 9, h: 0.3,
      fontFace: F.body, fontSize: 12, color: C.muted, margin: 0,
    });

    const items = [
      { ic: ic.envelope,   name: "Send-Email",                hint: "SMTP via System.Net.Mail",    color: C.cyan },
      { ic: ic.userShield, name: "Get-ADUserDetails",         hint: "AD via DirectoryServices",    color: C.gold },
      { ic: ic.database,   name: "Export-SqlQueryToCsv",      hint: "SQL via SqlClient",           color: C.cyan },
      { ic: ic.check,      name: "Test-EmailAddress",         hint: "Regex validation",            color: C.green },
      { ic: ic.server,     name: "Get-NetworkShareInventory", hint: "SMB shares via CIM",          color: C.pink },
      { ic: ic.archive,    name: "Compress-FilesByAge",       hint: "ZIP via System.IO.Compression", color: C.gold },
      { ic: ic.shield,     name: "Get-ServiceHealth",         hint: "Service state via CIM",       color: C.green },
      { ic: ic.key,        name: "New-SecurePassword",        hint: "Crypto RNG",                  color: C.gold },
      { ic: ic.code,       name: "Invoke-RestApiToFlatObject",hint: "REST + recursive flatten",    color: C.pink },
      { ic: ic.folder,     name: "Get-FilePermissionAudit",   hint: "NTFS ACLs via Get-Acl",       color: C.cyan },
    ];

    const cols = 2, rows = 5;
    const gridX = 0.5, gridY = 1.7;
    const cellW = 4.5, cellH = 0.62, gapX = 0.1, gapY = 0.06;

    items.forEach((it, idx) => {
      const c = idx % cols, r = Math.floor(idx / cols);
      const x = gridX + c * (cellW + gapX);
      const y = gridY + r * (cellH + gapY);
      card(s, x, y, cellW, cellH, it.color);
      s.addImage({ data: it.ic, x: x + 0.18, y: y + 0.15, w: 0.32, h: 0.32 });
      s.addText(it.name, {
        x: x + 0.62, y: y + 0.07, w: 2.6, h: 0.28,
        fontFace: F.mono, fontSize: 12, color: C.text, bold: true, margin: 0,
      });
      s.addText(it.hint, {
        x: x + 0.62, y: y + 0.33, w: cellW - 0.7, h: 0.25,
        fontFace: F.body, fontSize: 10, color: C.muted, margin: 0,
      });
    });

    footer(s, 4, TOTAL);
  }

  // ----------------------------------------------------------
  // SHARED helper for deep-dive slides
  // ----------------------------------------------------------
  function deepDive(s, kicker, title, sub, funcs) {
    bg(s);
    topBar(s, kicker);
    s.addText(title, {
      x: 0.5, y: 0.7, w: 9, h: 0.55,
      fontFace: F.head, fontSize: 28, color: C.text, bold: true, margin: 0,
    });
    s.addText(sub, {
      x: 0.5, y: 1.25, w: 9, h: 0.32,
      fontFace: F.body, fontSize: 12, color: C.muted, margin: 0,
    });

    // 3 vertical cards
    const cardY = 1.7, cardH = 3.45, cardW = 2.95, gap = 0.15;
    const xs = [0.5, 0.5 + cardW + gap, 0.5 + 2 * (cardW + gap)];
    funcs.forEach((f, i) => {
      card(s, xs[i], cardY, cardW, cardH, f.accent);
      s.addImage({ data: f.ic, x: xs[i] + 0.22, y: cardY + 0.27, w: 0.38, h: 0.38 });
      s.addText(f.name, {
        x: xs[i] + 0.68, y: cardY + 0.22, w: cardW - 0.78, h: 0.5,
        fontFace: F.mono, fontSize: 11, color: C.text, bold: true, valign: "middle", margin: 0,
      });
      s.addText(f.desc, {
        x: xs[i] + 0.22, y: cardY + 0.78, w: cardW - 0.44, h: 0.85,
        fontFace: F.body, fontSize: 10.5, color: C.muted, margin: 0,
      });
      // mini code
      codeBlock(s, xs[i] + 0.22, cardY + 1.7, cardW - 0.44, 1.65, f.code);
    });
  }

  // ----------------------------------------------------------
  // SLIDE 5 — Identity & Comms
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    deepDive(
      s,
      "DEEP DIVE  ·  01",
      "Identity & communication",
      "Talking to people, looking up who they are, and validating what they sent — all without leaving the box.",
      [
        {
          name: "Send-Email", accent: C.cyan, ic: ic.envelope,
          desc: "SMTP via System.Net.Mail. Attachments, custom relay, no third-party SDK.",
          code: [
            { text: "PS> Send-Email `", options: { color: C.green, breakLine: true } },
            { text: "    -From it@corp.local `", options: { color: C.text, breakLine: true } },
            { text: "    -To ceo@corp.local `", options: { color: C.text, breakLine: true } },
            { text: "    -Subject 'Audit done' `", options: { color: C.text, breakLine: true } },
            { text: "    -Body $summary", options: { color: C.text } },
          ],
        },
        {
          name: "Get-ADUserDetails", accent: C.gold, ic: ic.userShield,
          desc: "DirectoryServices LDAP query. No RSAT, no AD module — just the namespace.",
          code: [
            { text: "PS> Get-ADUserDetails -Sam jdoe", options: { color: C.green, breakLine: true } },
            { text: "", options: { breakLine: true } },
            { text: "DisplayName : Jane Doe", options: { color: C.text, breakLine: true } },
            { text: "Department  : Finance", options: { color: C.text, breakLine: true } },
            { text: "LastLogon   : 2026-05-18", options: { color: C.text } },
          ],
        },
        {
          name: "Test-EmailAddress", accent: C.green, ic: ic.check,
          desc: "Pipeline-friendly validator. Returns structured pass/fail records per address.",
          code: [
            { text: "PS> $list | Test-EmailAddress", options: { color: C.green, breakLine: true } },
            { text: "", options: { breakLine: true } },
            { text: "Address      IsValid", options: { color: C.muted, breakLine: true } },
            { text: "a@corp.local True", options: { color: C.text, breakLine: true } },
            { text: "bad@         False", options: { color: C.text } },
          ],
        },
      ]
    );
    footer(s, 5, TOTAL);
  }

  // ----------------------------------------------------------
  // SLIDE 6 — Data & APIs
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    deepDive(
      s,
      "DEEP DIVE  ·  02",
      "Data & APIs",
      "Pulling rows from SQL, hitting REST endpoints, and archiving the results. All structured output, ready for the next tool call.",
      [
        {
          name: "Export-SqlQueryToCsv", accent: C.cyan, ic: ic.database,
          desc: "SqlClient + DataTable + Export-Csv. No SSMS or ODBC driver required.",
          code: [
            { text: "PS> Export-SqlQueryToCsv `", options: { color: C.green, breakLine: true } },
            { text: "    -Server prod-db `", options: { color: C.text, breakLine: true } },
            { text: "    -Database Sales `", options: { color: C.text, breakLine: true } },
            { text: "    -Query 'SELECT * FROM Orders' `", options: { color: C.text, breakLine: true } },
            { text: "    -OutputPath orders.csv", options: { color: C.text } },
          ],
        },
        {
          name: "Invoke-RestApiToFlatObject", accent: C.pink, ic: ic.code,
          desc: "Invoke-RestMethod + recursive flatten. Nested JSON becomes dot-notation columns.",
          code: [
            { text: "PS> Invoke-RestApiToFlatObject `", options: { color: C.green, breakLine: true } },
            { text: "    -Uri https://api/items/42 |", options: { color: C.text, breakLine: true } },
            { text: "  Export-Csv items.csv", options: { color: C.text, breakLine: true } },
            { text: "", options: { breakLine: true } },
            { text: "owner.name | tags.0 | tags.1", options: { color: C.muted } },
          ],
        },
        {
          name: "Compress-FilesByAge", accent: C.gold, ic: ic.archive,
          desc: "System.IO.Compression. Age-filter then ZIP. No 7-Zip, no external binary.",
          code: [
            { text: "PS> Compress-FilesByAge `", options: { color: C.green, breakLine: true } },
            { text: "    -SourcePath C:\\logs `", options: { color: C.text, breakLine: true } },
            { text: "    -DaysOld 30 `", options: { color: C.text, breakLine: true } },
            { text: "    -DestinationZip old.zip", options: { color: C.text } },
          ],
        },
      ]
    );
    footer(s, 6, TOTAL);
  }

  // ----------------------------------------------------------
  // SLIDE 7 — Infrastructure & Security
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    deepDive(
      s,
      "DEEP DIVE  ·  03",
      "Infrastructure & security",
      "Auditing the box itself: services, shares, ACLs, and generating credentials with a real crypto RNG.",
      [
        {
          name: "Get-ServiceHealth", accent: C.green, ic: ic.shield,
          desc: "CIM query across one or many hosts. State, start mode, and process uptime in one shot.",
          code: [
            { text: "PS> Get-ServiceHealth `", options: { color: C.green, breakLine: true } },
            { text: "    -ComputerName srv1,srv2 `", options: { color: C.text, breakLine: true } },
            { text: "    -ServiceName W3SVC,MSSQL", options: { color: C.text, breakLine: true } },
            { text: "", options: { breakLine: true } },
            { text: "srv1  MSSQL  Running  Auto", options: { color: C.text } },
          ],
        },
        {
          name: "New-SecurePassword", accent: C.gold, ic: ic.key,
          desc: "RandomNumberGenerator (not Get-Random). Configurable length and symbol set.",
          code: [
            { text: "PS> New-SecurePassword `", options: { color: C.green, breakLine: true } },
            { text: "    -Length 24 -IncludeSymbols", options: { color: C.text, breakLine: true } },
            { text: "", options: { breakLine: true } },
            { text: "P9k!hQz@xT2#fLm$8Yc&Vb7d", options: { color: C.cyan } },
          ],
        },
        {
          name: "Get-FilePermissionAudit", accent: C.cyan, ic: ic.folder,
          desc: "Walks a tree, emits one row per ACE. Flat, CSV-ready output for compliance reviews.",
          code: [
            { text: "PS> Get-FilePermissionAudit `", options: { color: C.green, breakLine: true } },
            { text: "    -Path D:\\Finance -Recurse |", options: { color: C.text, breakLine: true } },
            { text: "  Export-Csv acl.csv", options: { color: C.text, breakLine: true } },
            { text: "", options: { breakLine: true } },
            { text: "Path  Identity  Rights  Type", options: { color: C.muted } },
          ],
        },
      ]
    );
    footer(s, 7, TOTAL);
  }

  // ----------------------------------------------------------
  // SLIDE 8 — Why agents love this
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    bg(s);
    topBar(s, "WHY THIS MAPS TO TOOL CALLING");

    s.addText("The shape PowerShell emits is the shape agents expect.", {
      x: 0.5, y: 0.7, w: 9, h: 0.55,
      fontFace: F.head, fontSize: 26, color: C.text, bold: true, margin: 0,
    });

    const q = [
      { ic: ic.typed,  hd: "Typed params",       body: "param() blocks declare name, type, mandatory. Agents read this as a tool schema with zero ceremony.", accent: C.cyan },
      { ic: ic.pipe,   hd: "Structured output",  body: "PSCustomObject is JSON-shaped by default. ConvertTo-Json hands the agent something it can reason about.", accent: C.green },
      { ic: ic.cog,    hd: "Composable",         body: "Pipe one cmdlet into the next. The agent picks the steps; PowerShell handles the wiring between them.", accent: C.pink },
      { ic: ic.rocket, hd: "Zero install",       body: "No pip, no npm, no compiler. Drop a .ps1 next to claude-code and every function becomes a callable tool.", accent: C.gold },
    ];

    const qX = [0.5, 5.1], qY = [1.55, 3.4];
    const qW = 4.4, qH = 1.7;
    q.forEach((item, i) => {
      const x = qX[i % 2], y = qY[Math.floor(i / 2)];
      card(s, x, y, qW, qH, item.accent);
      s.addImage({ data: item.ic, x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5 });
      s.addText(item.hd, {
        x: x + 1.0, y: y + 0.3, w: qW - 1.2, h: 0.5,
        fontFace: F.head, fontSize: 20, color: C.text, bold: true, valign: "middle", margin: 0,
      });
      s.addText(item.body, {
        x: x + 0.3, y: y + 0.9, w: qW - 0.5, h: 0.75,
        fontFace: F.body, fontSize: 11.5, color: C.muted, margin: 0,
      });
    });

    footer(s, 8, TOTAL);
  }

  // ----------------------------------------------------------
  // SLIDE 9 — Cross platform
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    bg(s);
    topBar(s, "CROSS-PLATFORM");

    s.addText("Same script. Three operating systems.", {
      x: 0.5, y: 0.7, w: 9, h: 0.55,
      fontFace: F.head, fontSize: 28, color: C.text, bold: true, margin: 0,
    });
    s.addText("PowerShell 7+ is built on .NET 8 and ships first-class binaries for Windows, macOS, and Linux. Most of these cmdlets run unchanged across all three.", {
      x: 0.5, y: 1.3, w: 9, h: 0.7,
      fontFace: F.body, fontSize: 13, color: C.muted, margin: 0,
    });

    // OS cards
    const os = [
      { ic: ic.win,   name: "Windows",      bullets: ["All 10 functions", "AD, WMI, NTFS native"], accent: C.cyan },
      { ic: ic.apple, name: "macOS",        bullets: ["8 of 10 cross-platform", "Brew or .pkg install"], accent: C.pink },
      { ic: ic.linux, name: "Linux",        bullets: ["8 of 10 cross-platform", "apt / dnf / tarball"], accent: C.gold },
    ];
    const oy = 2.3, oh = 2.4, ow = 2.95, og = 0.15;
    const oxs = [0.5, 0.5 + ow + og, 0.5 + 2 * (ow + og)];
    os.forEach((o, i) => {
      card(s, oxs[i], oy, ow, oh, o.accent);
      s.addImage({ data: o.ic, x: oxs[i] + (ow - 0.7) / 2, y: oy + 0.3, w: 0.7, h: 0.7 });
      s.addText(o.name, {
        x: oxs[i] + 0.2, y: oy + 1.1, w: ow - 0.4, h: 0.4,
        fontFace: F.head, fontSize: 20, color: C.text, bold: true, align: "center", margin: 0,
      });
      s.addText(o.bullets.map((b, idx) => ({
        text: b, options: { bullet: true, breakLine: idx < o.bullets.length - 1 },
      })), {
        x: oxs[i] + 0.35, y: oy + 1.55, w: ow - 0.6, h: 0.75,
        fontFace: F.body, fontSize: 12, color: C.muted, paraSpaceAfter: 4, margin: 0,
      });
    });

    // Bottom callout
    s.addShape("rect", {
      x: 0.7, y: 4.85, w: 8.6, h: 0.35,
      fill: { color: C.panel2 }, line: { color: C.cyan, width: 0.75 },
    });
    s.addText("Same .ps1, same tool registration in your agent harness. One source of truth.", {
      x: 0.7, y: 4.85, w: 8.6, h: 0.35,
      fontFace: F.body, fontSize: 12, color: C.cyan, italic: true, align: "center", valign: "middle", margin: 0,
    });

    footer(s, 9, TOTAL);
  }

  // ----------------------------------------------------------
  // SLIDE 10 — Reveal / close
  // ----------------------------------------------------------
  {
    const s = pres.addSlide();
    bg(s);
    // Big vertical accent
    s.addShape("rect", {
      x: 0, y: 0, w: 0.18, h: 5.625,
      fill: { color: C.cyan }, line: { color: C.cyan },
    });

    topBar(s, "THE REVEAL");

    s.addImage({ data: ic.eye, x: 0.5, y: 1.85, w: 0.55, h: 0.55 });

    s.addText("You already have the runtime.", {
      x: 1.15, y: 1.8, w: 8, h: 0.7,
      fontFace: F.head, fontSize: 40, color: C.text, bold: true, valign: "middle", margin: 0,
    });
    s.addText("You just need to expose it.", {
      x: 0.5, y: 2.65, w: 9, h: 0.6,
      fontFace: F.head, fontSize: 30, color: C.cyan, italic: true, margin: 0,
    });

    // Next-steps card
    card(s, 0.5, 3.55, 9, 1.55, C.gold);
    s.addText("Wiring it up", {
      x: 0.7, y: 3.65, w: 8.6, h: 0.35,
      fontFace: F.head, fontSize: 15, color: C.gold, bold: true, margin: 0,
    });
    s.addText([
      { text: "1.  ", options: { color: C.gold, bold: true } },
      { text: "Dot-source the .ps1 into your agent's shell tool.", options: { color: C.text, breakLine: true } },
      { text: "2.  ", options: { color: C.gold, bold: true } },
      { text: "Register each function name as a tool.", options: { color: C.text, breakLine: true } },
      { text: "3.  ", options: { color: C.gold, bold: true } },
      { text: "Let the agent pipe outputs between calls.", options: { color: C.text } },
    ], {
      x: 0.7, y: 4.0, w: 8.6, h: 1.05,
      fontFace: F.body, fontSize: 13, paraSpaceAfter: 4, margin: 0,
    });

    footer(s, 10, TOTAL);
  }

  await pres.writeFile({ fileName: "PowerShell-x-AI-Harness-CLIs.pptx" });
  console.log("Wrote PowerShell-x-AI-Harness-CLIs.pptx");
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
