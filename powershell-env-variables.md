# PowerShell Environment Variables — A Practical Guide

> The `$env:` drive in PowerShell is your gateway to system, user, and shell context. This guide covers the variables you'll actually reach for in real work, ordered by how often you'll use them.

---

## What `$env:` Actually Is

In PowerShell, environment variables aren't a special construct — they're exposed through a **provider** called `Environment`, accessed via the `$env:` drive prefix. That means:

```powershell
$env:USERNAME              # Read
$env:MY_VAR = "hello"      # Write (current session only)
Get-ChildItem env:         # List ALL environment variables
Test-Path env:USERNAME     # Check if one exists
Remove-Item env:MY_VAR     # Unset
```

It behaves like a filesystem because, internally, it *is* one — just a virtual one backed by environment variables instead of files.

**Key distinction from bash:** In bash you'd write `$USERNAME` or `${USERNAME}`. In PowerShell, the `$env:` prefix is required. Plain `$USERNAME` is a regular PowerShell variable, completely separate from the environment.

---

## Scope: A Critical Concept

Environment variables exist in three scopes on Windows:

| Scope | Persistence | Set Via |
|-------|-------------|---------|
| **Process** | Current PowerShell session only — gone when you close it | `$env:VAR = "value"` |
| **User** | Persists for your user account across reboots | `[Environment]::SetEnvironmentVariable("VAR","value","User")` |
| **Machine** | Persists system-wide for all users (requires admin) | `[Environment]::SetEnvironmentVariable("VAR","value","Machine")` |

```powershell
# Read from a specific scope
[Environment]::GetEnvironmentVariable("PATH", "Machine")
[Environment]::GetEnvironmentVariable("PATH", "User")
[Environment]::GetEnvironmentVariable("PATH", "Process")
```

**Gotcha:** When you set a User or Machine variable, *existing PowerShell sessions don't see it* until they restart. New sessions inherit the updated environment at launch.

On Linux and macOS, only the Process scope exists from PowerShell's perspective. Persistent variables go in shell rc files (`~/.bashrc`, `~/.zshrc`) or `/etc/environment`, not through `$env:`.

---

# Tier 1: The Identity Variables (Used Daily)

## `$env:USERNAME`

**What it is:** The currently logged-in user's account name (no domain prefix).

```powershell
$env:USERNAME
# chuffman
```

**Why you'll use it:**

- Building user-specific paths: `"C:\Users\$env:USERNAME\Logs"`
- Logging *who* ran a script
- Conditional logic based on the running user
- Filenames that include the operator: `report-$env:USERNAME-$(Get-Date -f yyyyMMdd).csv`

**Cross-platform note:** On Linux/macOS, `$env:USERNAME` is empty. Use **`$env:USER`** instead — or better, the cross-platform variable shown next.

---

## `$env:USER` (Linux/macOS) and a Cross-Platform Pattern

On Unix-like systems, the convention is `$env:USER`. For scripts that need to run anywhere:

```powershell
$me = if ($IsWindows) { $env:USERNAME } else { $env:USER }
# Or simpler in PS7+:
$me = $env:USERNAME ?? $env:USER
```

`$IsWindows`, `$IsLinux`, and `$IsMacOS` are **automatic variables** (not env vars) that PowerShell sets at startup. They're how you write cross-platform code cleanly.

---

## `$env:COMPUTERNAME`

**What it is:** The Windows machine's NetBIOS hostname.

```powershell
$env:COMPUTERNAME
# HUFFTECH01
```

**Why you'll use it:**

- Logging which machine ran a script (critical in distributed environments)
- Conditional execution: *"only run this branch on my workstation"*
- Filenames and report headers
- Building UNC paths: `"\\$env:COMPUTERNAME\share"`

```powershell
# Common pattern: behave differently on your dev box vs production
if ($env:COMPUTERNAME -eq 'HUFFTECH01') {
    $model = 'qwen3.6:35b'   # Local model on the workstation
} else {
    $model = 'gpt-4'         # Cloud model elsewhere
}
```

**Cross-platform:** Empty on Linux/macOS. Use the automatic variable `[System.Net.Dns]::GetHostName()` or the env var `$env:HOSTNAME` (which not all shells set). The portable approach:

```powershell
$host = [System.Net.Dns]::GetHostName()
```

---

## `$env:USERDOMAIN`

**What it is:** The domain or workgroup the account belongs to. On a domain-joined machine, this is your AD domain. On a standalone workstation, it equals `$env:COMPUTERNAME`.

```powershell
$env:USERDOMAIN
# THEHARTFORD

# Full qualified user
"$env:USERDOMAIN\$env:USERNAME"
# THEHARTFORD\chuffman
```

**Why you'll use it:** Building DOMAIN\username strings for AD queries, credential prompts, and audit logs.

---

## `$env:USERDNSDOMAIN`

**What it is:** The DNS-style domain name (only present on domain-joined Windows machines).

```powershell
$env:USERDNSDOMAIN
# THEHARTFORD.COM
```

**Why you'll use it:** Constructing UPN-style identities (`user@domain.com`) and LDAP queries.

---

# Tier 2: Paths You'll Reference Constantly

## `$env:USERPROFILE`

**What it is:** The current user's profile directory. On Windows: `C:\Users\<username>`.

```powershell
$env:USERPROFILE
# C:\Users\chuffman
```

**Why you'll use it:**

- Reading and writing user-specific config files
- Locating Desktop, Documents, Downloads programmatically
- Storing app data outside system directories

```powershell
$configPath = Join-Path $env:USERPROFILE '.simplistiq\config.json'
```

**Cross-platform:** Use `$HOME` (a PowerShell automatic variable that works everywhere) instead. On Windows, `$HOME` equals `$env:USERPROFILE`; on Linux/macOS it's `/home/user` or `/Users/user`.

---

## `$env:APPDATA` and `$env:LOCALAPPDATA`

**What they are:** Two locations for user-specific application data on Windows.

| Variable | Path | Purpose |
|----------|------|---------|
| `$env:APPDATA` | `C:\Users\<user>\AppData\Roaming` | Data that *roams* with the user across domain machines |
| `$env:LOCALAPPDATA` | `C:\Users\<user>\AppData\Local` | Data tied to *this specific machine* — caches, large files |

```powershell
$env:APPDATA
# C:\Users\chuffman\AppData\Roaming

$env:LOCALAPPDATA
# C:\Users\chuffman\AppData\Local
```

**When to use which:**

- **Roaming (`$env:APPDATA`)**: small config files, preferences, anything you'd want to follow the user to another machine
- **Local (`$env:LOCALAPPDATA`)**: caches, downloaded models, databases, anything large or machine-specific

```powershell
# Example: storing a PowerBot config
$configDir = Join-Path $env:APPDATA 'PowerBot'
New-Item -Path $configDir -ItemType Directory -Force | Out-Null
$config | ConvertTo-Json | Out-File (Join-Path $configDir 'settings.json')
```

**Cross-platform:** Neither exists on Linux/macOS. The XDG convention is:
- Config → `~/.config/<appname>` (`$env:XDG_CONFIG_HOME` if set)
- Cache → `~/.cache/<appname>` (`$env:XDG_CACHE_HOME` if set)
- Data → `~/.local/share/<appname>` (`$env:XDG_DATA_HOME` if set)

A portable helper:

```powershell
function Get-AppConfigPath {
    param([string]$AppName)
    if ($IsWindows) {
        Join-Path $env:APPDATA $AppName
    } else {
        $base = $env:XDG_CONFIG_HOME ?? (Join-Path $HOME '.config')
        Join-Path $base $AppName
    }
}
```

---

## `$env:TEMP` and `$env:TMP`

**What they are:** The user's temporary files directory. Both point to the same place on Windows.

```powershell
$env:TEMP
# C:\Users\chuffman\AppData\Local\Temp
```

**Why you'll use it:** Anywhere you need to write scratch data — downloads in flight, intermediate processing, ephemeral logs.

```powershell
$tempFile = Join-Path $env:TEMP "download-$(New-Guid).bin"
Invoke-WebRequest $url -OutFile $tempFile
# ... use it ...
Remove-Item $tempFile -ErrorAction SilentlyContinue
```

**Cross-platform:** PowerShell sets `$env:TMPDIR` on macOS automatically. On Linux, `/tmp` is the convention but `$env:TMPDIR` may not be set. The portable way:

```powershell
$tmp = [System.IO.Path]::GetTempPath()
```

That works on every OS and respects the platform conventions.

---

## `$env:PATH`

**What it is:** The semicolon-separated (Windows) or colon-separated (Linux/macOS) list of directories the shell searches for executables.

```powershell
$env:PATH
# C:\Windows\System32;C:\Windows;C:\Program Files\PowerShell\7;...

# Split it for readability
$env:PATH -split [System.IO.Path]::PathSeparator
```

**Why you'll use it:**

- Troubleshooting "command not found" errors
- Temporarily adding a tool's directory for the current session
- Verifying installation order when multiple versions of a tool exist

**Adding to PATH for the current session:**

```powershell
$env:PATH = "C:\MyTools;$env:PATH"
```

**Adding to PATH permanently:**

```powershell
# User scope (no admin needed)
$current = [Environment]::GetEnvironmentVariable("PATH", "User")
[Environment]::SetEnvironmentVariable("PATH", "$current;C:\MyTools", "User")
```

**Critical gotcha:** Always use `[System.IO.Path]::PathSeparator` when splitting or joining PATH in cross-platform code. Hardcoding `;` breaks on Linux/macOS, and hardcoding `:` breaks on Windows.

---

## `$env:PATHEXT` (Windows-only)

**What it is:** The list of file extensions Windows treats as executable.

```powershell
$env:PATHEXT
# .COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC;.PY;.PYW
```

**Why you'll use it:** When you type `git` instead of `git.exe`, this is why it works. If you've installed Python and want `.py` files to be directly executable, you'd add it here.

---

# Tier 3: System Information

## `$env:PROCESSOR_ARCHITECTURE`

**What it is:** The CPU architecture of the running process.

```powershell
$env:PROCESSOR_ARCHITECTURE
# AMD64    (x64 Windows)
# ARM64    (ARM Windows / Apple Silicon under Windows)
```

**Why you'll use it:** Downloading the right binary for the platform, or branching install logic.

```powershell
$url = switch ($env:PROCESSOR_ARCHITECTURE) {
    'AMD64' { 'https://example.com/tool-x64.exe' }
    'ARM64' { 'https://example.com/tool-arm64.exe' }
    default { throw "Unsupported architecture: $env:PROCESSOR_ARCHITECTURE" }
}
```

**Better cross-platform alternative:** The automatic variable `[System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture` works everywhere and returns `X64`, `Arm64`, `X86`, etc.

---

## `$env:NUMBER_OF_PROCESSORS`

**What it is:** The number of logical CPU cores.

```powershell
$env:NUMBER_OF_PROCESSORS
# 24
```

**Why you'll use it:** Sizing parallel workloads.

```powershell
$cores = [int]$env:NUMBER_OF_PROCESSORS
gci *.log | ForEach-Object -Parallel { Get-FileHash $_ } -ThrottleLimit $cores
```

**Cross-platform:** Use `[Environment]::ProcessorCount` — it works everywhere and returns an integer directly.

---

## `$env:OS`

**What it is:** A coarse OS identifier on Windows. Almost always `Windows_NT`.

```powershell
$env:OS
# Windows_NT
```

**Why you'll use it:** Honestly, rarely. The automatic variables `$IsWindows`, `$IsLinux`, `$IsMacOS` are vastly better for OS detection in PS7+.

---

# Tier 4: Domain & Network Context

## `$env:LOGONSERVER`

**What it is:** The domain controller (or local machine) that authenticated the current session.

```powershell
$env:LOGONSERVER
# \\DC01    (domain-joined)
# \\HUFFTECH01    (local logon)
```

**Why you'll use it:** Troubleshooting authentication issues. If your script suddenly stops working after a network change, checking which DC authenticated you can be revealing.

---

## `$env:HOMEDRIVE` and `$env:HOMEPATH`

**What they are:** Two halves of the user's home directory location on Windows.

```powershell
$env:HOMEDRIVE
# C:

$env:HOMEPATH
# \Users\chuffman

# Combined:
"$env:HOMEDRIVE$env:HOMEPATH"
# C:\Users\chuffman
```

**Why you'll use it:** Honestly, just use `$env:USERPROFILE` or the automatic `$HOME` variable instead. These two exist primarily for legacy compatibility with environments where the home drive was a mapped network share (`H:\`).

---

# Tier 5: PowerShell-Specific Variables

## `$env:PSModulePath`

**What it is:** The semicolon/colon-separated list of directories PowerShell searches for modules.

```powershell
$env:PSModulePath -split [System.IO.Path]::PathSeparator
# C:\Users\chuffman\Documents\PowerShell\Modules
# C:\Program Files\PowerShell\Modules
# c:\program files\powershell\7\Modules
# C:\Windows\system32\WindowsPowerShell\v1.0\Modules
```

**Why you'll use it:**

- Adding a private module directory for development
- Diagnosing why `Import-Module` can't find something
- Verifying module precedence when duplicate versions exist

```powershell
# Add a custom modules directory for this session
$env:PSModulePath = "D:\SimplistiQ\Modules;$env:PSModulePath"
```

---

## `$env:PSExecutionPolicyPreference`

**What it is:** Overrides the configured execution policy for the current session only.

```powershell
$env:PSExecutionPolicyPreference = 'Bypass'
```

**Why you'll use it:** Rare, but useful when you can't or don't want to use `Set-ExecutionPolicy` (which writes to the registry). Setting this in a parent process affects child PowerShell processes too.

---

# Tier 6: Tooling & Application Variables

These aren't built-in to PowerShell, but you'll see them constantly in real environments.

## Editor & Pager

```powershell
$env:EDITOR     # nvim, code, vim, nano — what tools open for editing
$env:VISUAL     # similar; often used by git when EDITOR isn't set
$env:PAGER      # less, more — what shows long output
```

Git, Kubernetes, Docker, and many CLI tools respect these.

## Cloud Provider Credentials

```powershell
# AWS
$env:AWS_PROFILE
$env:AWS_REGION
$env:AWS_ACCESS_KEY_ID         # Avoid; use profiles or instance roles
$env:AWS_SECRET_ACCESS_KEY     # Avoid; use profiles or instance roles

# Azure
$env:AZURE_SUBSCRIPTION_ID
$env:AZURE_TENANT_ID
$env:AZURE_CLIENT_ID

# Google Cloud
$env:GOOGLE_APPLICATION_CREDENTIALS    # Path to service account JSON
```

**Security note:** Never hardcode secrets in scripts or shell profiles. Use a secrets manager (Microsoft.PowerShell.SecretManagement, AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) and load them at runtime.

## Anthropic & AI Tooling

```powershell
$env:ANTHROPIC_API_KEY            # Used by Claude SDK and Claude Code
$env:ANTHROPIC_MODEL              # Override default model
$env:OPENAI_API_KEY               # OpenAI SDK
$env:OLLAMA_HOST                  # Point Ollama at a remote instance
```

## Git

```powershell
$env:GIT_AUTHOR_NAME
$env:GIT_AUTHOR_EMAIL
$env:GIT_SSH_COMMAND              # Override SSH for git (e.g., custom key path)
```

---

# Practical Patterns

## Listing Every Environment Variable

```powershell
Get-ChildItem env: | Sort-Object Name
Get-ChildItem env: | Where-Object Name -like 'AWS*'
Get-ChildItem env: | Format-Table Name, Value -AutoSize
```

## Safe Check + Default

```powershell
$apiKey = $env:ANTHROPIC_API_KEY
if (-not $apiKey) {
    throw "ANTHROPIC_API_KEY is not set. Set it via: `$env:ANTHROPIC_API_KEY = '...'"
}

# PS7 null-coalescing operator makes defaults cleaner:
$region = $env:AWS_REGION ?? 'us-east-1'
$logLevel = $env:LOG_LEVEL ?? 'INFO'
```

## Temporary Override for a Single Command

```powershell
# Run a command with a different env var, restore after
$prev = $env:AWS_PROFILE
try {
    $env:AWS_PROFILE = 'production'
    aws s3 ls
} finally {
    $env:AWS_PROFILE = $prev
}
```

A cleaner version using a helper function:

```powershell
function Invoke-WithEnv {
    param(
        [hashtable]$Env,
        [scriptblock]$ScriptBlock
    )
    $original = @{}
    try {
        foreach ($k in $Env.Keys) {
            $original[$k] = [Environment]::GetEnvironmentVariable($k)
            Set-Item "env:$k" $Env[$k]
        }
        & $ScriptBlock
    } finally {
        foreach ($k in $original.Keys) {
            if ($null -eq $original[$k]) {
                Remove-Item "env:$k" -ErrorAction SilentlyContinue
            } else {
                Set-Item "env:$k" $original[$k]
            }
        }
    }
}

# Usage:
Invoke-WithEnv -Env @{ AWS_PROFILE = 'production'; AWS_REGION = 'eu-west-1' } -ScriptBlock {
    aws s3 ls
}
```

## Loading a `.env` File

`.env` files aren't natively understood by PowerShell, but a few lines of parsing handle the common case:

```powershell
function Import-DotEnv {
    param([string]$Path = '.env')
    if (-not (Test-Path $Path)) { return }
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line -match '^\s*([^=]+?)\s*=\s*(.*)\s*$') {
            $name = $Matches[1]
            $value = $Matches[2].Trim('"').Trim("'")
            Set-Item "env:$name" $value
        }
    }
}

Import-DotEnv
```

## Setting Persistent Variables Properly

```powershell
# WRONG — only lasts for this session
$env:MY_VAR = 'value'

# RIGHT for User scope
[Environment]::SetEnvironmentVariable('MY_VAR', 'value', 'User')

# RIGHT for Machine scope (requires admin)
[Environment]::SetEnvironmentVariable('MY_VAR', 'value', 'Machine')
```

Remember: existing sessions don't pick up scope changes until they restart. New sessions inherit the full merged environment automatically.

---

# Automatic Variables vs Environment Variables

A common source of confusion. PowerShell has **two distinct kinds** of preset variables:

| Type | Prefix | Examples | Where They Come From |
|------|--------|----------|----------------------|
| **Environment** | `$env:` | `$env:USERNAME`, `$env:PATH` | The OS environment |
| **Automatic** | `$` | `$PSVersionTable`, `$HOME`, `$IsWindows`, `$PWD`, `$_`, `$PSScriptRoot` | PowerShell itself sets these |

You can't write to automatic variables the same way (`$PSVersionTable = ...` will error). They're managed by the shell.

A few automatic variables worth knowing right alongside the env vars:

```powershell
$PSVersionTable             # PowerShell version, edition, OS info
$PSVersionTable.PSVersion   # Just the version number

$HOME                       # Cross-platform user home directory
$PWD                        # Current location (like `pwd` in bash)
$PSScriptRoot              # Directory containing the running script
$IsWindows, $IsLinux, $IsMacOS   # OS detection booleans
$Profile                   # Path to your PowerShell profile script
```

These are often what you actually want when you reach for an env var. For example: don't use `$env:USERPROFILE` in cross-platform scripts — use `$HOME`.

---

# The Cross-Platform Cheat Sheet

If you're writing scripts that need to run on Windows, Linux, and macOS:

| Need | Don't Use | Use Instead |
|------|-----------|-------------|
| Username | `$env:USERNAME` | `$env:USERNAME ?? $env:USER` |
| Hostname | `$env:COMPUTERNAME` | `[System.Net.Dns]::GetHostName()` |
| Home directory | `$env:USERPROFILE` | `$HOME` |
| Temp directory | `$env:TEMP` | `[System.IO.Path]::GetTempPath()` |
| PATH separator | `;` | `[System.IO.Path]::PathSeparator` |
| Directory separator | `\` | `[System.IO.Path]::DirectorySeparatorChar` or `Join-Path` |
| CPU count | `$env:NUMBER_OF_PROCESSORS` | `[Environment]::ProcessorCount` |
| OS detection | `$env:OS` | `$IsWindows` / `$IsLinux` / `$IsMacOS` |

---

# Common Gotchas

**1. Environment variables are strings.** Always. Even `$env:NUMBER_OF_PROCESSORS` is the string `"24"`, not the integer `24`. Cast with `[int]` when you need a number.

```powershell
$cores = [int]$env:NUMBER_OF_PROCESSORS   # 24
```

**2. Setting `$env:X` is session-local.** It does NOT persist. Use `[Environment]::SetEnvironmentVariable()` for persistence.

**3. Scope changes don't reach running sessions.** If you set a User-level variable in the Windows GUI or another shell, your current PowerShell session won't see it until you restart.

**4. `$env:` is case-insensitive on Windows, case-sensitive on Linux/macOS.** `$env:path` works on Windows but `$env:Path` is required on Linux. Stick with the canonical casing (`$env:PATH`) and you'll be safe everywhere.

**5. Removing a variable.** `$env:VAR = $null` doesn't remove it — it sets it to an empty string. Use `Remove-Item env:VAR` to truly unset it.

**6. The shell parses `$env:VAR` greedily.** In strings, wrap with `${}` if followed by other identifier characters:

```powershell
"User: $env:USERNAMEsuffix"        # Doesn't work as expected
"User: ${env:USERNAME}suffix"      # Correct
"User: $($env:USERNAME)suffix"     # Also correct
```

---

# Quick Reference Card

The five most-used environment variables for daily PowerShell work:

```powershell
$env:USERNAME       # Who am I?
$env:COMPUTERNAME   # Where am I?
$env:USERPROFILE    # My home directory (use $HOME for cross-platform)
$env:PATH           # Executable search path
$env:TEMP           # Scratch space
```

The five most-useful for automation and tooling:

```powershell
$env:APPDATA              # Where my apps store config
$env:LOCALAPPDATA         # Where my apps store caches
$env:PSModulePath         # Where modules live
$env:NUMBER_OF_PROCESSORS # How parallel can I go?
$env:USERDOMAIN           # AD context
```

---

*Run `Get-ChildItem env: | Sort-Object Name | Format-Table -AutoSize` right now to see everything currently set on your system. It's worth a look.*
