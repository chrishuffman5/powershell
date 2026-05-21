# The Top 50 PowerShell Cmdlets

> A practical, opinionated guide for engineers new to PowerShell — ordered by how often you'll actually use these in real work, not alphabetically.

---

## Who This Is For

You've opened `pwsh` (or `powershell.exe`) for the first time, or you've been using it casually and want to level up. This guide assumes:

- You have **PowerShell 7+** (`pwsh`) installed. If you're on Windows PowerShell 5.1, most of this still works, but PS7 is cross-platform and the modern path forward.
- You're comfortable in *some* shell (bash, zsh, cmd) and want to understand how PowerShell differs.
- You want to know the *why*, not just the *what*.

If you're on Windows and don't have PS7 yet:

```powershell
winget install --id Microsoft.PowerShell
```

On macOS: `brew install powershell`. On Linux: see the [official install docs](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell).

---

## The Big Mental Shift

Before the cmdlet list, the one idea that makes everything else click:

> **PowerShell pipes objects, not text.**

In bash, `ls | grep foo` passes strings between commands. In PowerShell, `Get-ChildItem | Where-Object Name -like "*foo*"` passes actual file objects with properties, methods, and types. This is why you'll see `.Property` access and structured filtering everywhere — you're working with real objects, not parsing text.

The corollary: **`Get-Member` is your best friend.** Whenever you don't know what an object can do, pipe it to `Get-Member` and PowerShell will show you every property and method available.

---

## Naming Convention

Every cmdlet follows **`Verb-Noun`** form:

- `Get-Process` — retrieve processes
- `Stop-Service` — stop a service
- `New-Item` — create something

Once you internalize the approved verbs (`Get`, `Set`, `New`, `Remove`, `Start`, `Stop`, `Invoke`, `Test`, `Import`, `Export`, etc.), you can often *guess* the cmdlet name. That's the whole design philosophy.

Run `Get-Verb` to see the full list.

---

## How to Read This Guide

Each cmdlet entry includes:

- **What it does** — one-line description
- **Aliases** — the shortcuts you'll see and use
- **Example** — a real command you'd actually type
- **Why it matters** — context for when and why you'd reach for it
- **Module** — if it requires something beyond the built-in shell

---

# Tier 1: The Daily Drivers (1–10)

These are the cmdlets you'll use within your first hour. If you only learn ten things, learn these.

## 1. `Get-Help`

**What it does:** Shows documentation for any cmdlet.

**Aliases:** `help`, `man`

```powershell
Get-Help Get-Process
Get-Help Get-Process -Examples       # Show usage examples
Get-Help Get-Process -Full           # Everything
Get-Help Get-Process -Online         # Open the web docs
```

**Why it matters:** This is the *most* important cmdlet. Every cmdlet has structured help built in. The `-Examples` flag in particular is the fastest way to learn anything.

**First-time setup:** Run `Update-Help` once (as admin) to download the latest help content locally.

**Module:** Built-in.

---

## 2. `Get-Command`

**What it does:** Lists available commands. Wildcard-friendly.

**Aliases:** `gcm`

```powershell
Get-Command *user*                   # Anything with "user" in the name
Get-Command -Module Microsoft.PowerShell.Management
Get-Command -Verb Get                # Everything that starts with Get-
```

**Why it matters:** Discovery. You don't need to memorize cmdlets — you need to know how to find them. `Get-Command *aduser*` will surface every Active Directory user cmdlet once the module is loaded.

**Module:** Built-in.

---

## 3. `Get-ChildItem`

**What it does:** Lists files and directories (or any "child items" — registry keys, certificates, etc.).

**Aliases:** `gci`, `ls`, `dir`

```powershell
Get-ChildItem                        # Current directory
gci -Recurse -Filter *.log           # Recursive, filtered
ls -Force                            # Include hidden files
gci -File | Where Length -gt 1MB     # Files over 1MB
```

**Why it matters:** Probably your single most-typed command after `Get-Help`. Aliases `ls` and `dir` work cross-platform in pwsh.

**Module:** Built-in.

---

## 4. `Get-Content`

**What it does:** Reads the contents of a file.

**Aliases:** `gc`, `cat`, `type`

```powershell
Get-Content app.log
Get-Content app.log -Tail 50         # Last 50 lines
Get-Content app.log -Tail 50 -Wait   # tail -f equivalent
gc config.json | ConvertFrom-Json    # Read & parse JSON
```

**Why it matters:** `-Tail -Wait` is the PowerShell equivalent of `tail -f`. The `cat` alias works cross-platform.

**Gotcha:** `Get-Content` returns an *array of lines* by default, not a single string. Use `-Raw` to get the whole file as one string.

**Module:** Built-in.

---

## 5. `Set-Location`

**What it does:** Changes the current working directory.

**Aliases:** `cd`, `sl`, `chdir`

```powershell
Set-Location C:\Projects
cd ~                                 # Home directory
cd -                                 # Back to previous directory (PS7+)
```

**Why it matters:** You'll never type `Set-Location` — you'll type `cd`. But it's worth knowing the real name because PowerShell's "locations" extend beyond the filesystem (you can `cd HKLM:\Software` into the registry).

**Module:** Built-in.

---

## 6. `Where-Object`

**What it does:** Filters objects in the pipeline.

**Aliases:** `?`, `where`

```powershell
Get-Process | Where-Object CPU -gt 100
gci | ? Length -gt 1MB
Get-Service | where { $_.Status -eq 'Running' -and $_.Name -like 'W*' }
```

**Why it matters:** Half of every pipeline you write will have a `Where-Object` in it. The `$_` variable means "the current object in the pipeline."

**Tip:** The simplified syntax (`Where-Object CPU -gt 100`) works for single comparisons. For complex logic, use the script block form with `{ }`.

**Module:** Built-in.

---

## 7. `ForEach-Object`

**What it does:** Runs a script block for each object in the pipeline.

**Aliases:** `%`, `foreach`

```powershell
1..10 | ForEach-Object { $_ * 2 }
Get-ChildItem *.log | % { Rename-Item $_ "$($_.BaseName).archived.log" }
gci -File | ForEach-Object -Parallel { Get-FileHash $_ } -ThrottleLimit 5   # PS7+
```

**Why it matters:** The other half of every pipeline. And in PS7, `-Parallel` gives you concurrent execution — a huge upgrade.

**Module:** Built-in.

---

## 8. `Select-Object`

**What it does:** Picks specific properties from objects, or selects a subset (first/last N).

**Aliases:** `select`

```powershell
Get-Process | Select-Object Name, CPU, Id
gci | select -First 5
Get-Process | select -ExpandProperty Name    # Returns strings, not objects
```

**Why it matters:** Object shaping. `-ExpandProperty` is especially important — it "unwraps" a property so you get the raw values instead of a wrapper object.

**Module:** Built-in.

---

## 9. `Select-String`

**What it does:** Finds text patterns in files or pipeline input. This is `grep`.

**Aliases:** `sls`

```powershell
Select-String -Path *.log -Pattern "ERROR"
gci -Recurse *.ps1 | sls "TODO"
Get-Process | Out-String | sls "chrome"
sls -Pattern "fail" -Path *.log -Context 2,5  # Show 2 lines before, 5 after
```

**Why it matters:** Cross-platform `grep` with proper object output (each match has a `LineNumber`, `Filename`, `Line` property, etc.).

**Module:** Built-in.

---

## 10. `Get-Member`

**What it does:** Inspects an object's properties and methods.

**Aliases:** `gm`

```powershell
Get-Process | Get-Member
(Get-Date) | gm
$obj | gm -MemberType Method
```

**Why it matters:** Possibly the most underused cmdlet by beginners and the most valuable for learning. Whenever you don't know what you can *do* with an object, pipe it to `Get-Member` and PowerShell tells you everything.

**Module:** Built-in.

---

# Tier 2: Files & Output (11–17)

## 11. `Out-File`

**What it does:** Writes pipeline output to a file.

```powershell
Get-Process | Out-File processes.txt
gci | Out-File -Append -Encoding utf8 listing.txt
```

**Why it matters:** The `>` and `>>` operators are syntactic sugar for this. Use `-Encoding utf8` if you care about cross-platform compatibility (the Windows PS5.1 default was UTF-16 with BOM, which surprised many people).

**Module:** Built-in.

---

## 12. `Write-Host`

**What it does:** Writes directly to the console (not the pipeline).

```powershell
Write-Host "Starting deployment..." -ForegroundColor Cyan
Write-Host "Error!" -ForegroundColor Red -BackgroundColor Yellow
```

**Why it matters:** Use this for *user-facing* messages only. It doesn't emit to the pipeline, so you can't capture or redirect it the normal way.

**Gotcha:** Don't use `Write-Host` for data. Use `Write-Output` (or just leave a value bare) so it flows through the pipeline.

**Module:** Built-in.

---

## 13. `Write-Output`

**What it does:** Emits objects into the pipeline.

**Aliases:** `echo`, `write`

```powershell
Write-Output "Hello"                 # Same as just: "Hello"
function Get-Stuff { Write-Output (Get-Process | select -First 5) }
```

**Why it matters:** This is what functions and scripts use to return values. Anything not captured into a variable or piped onward becomes the function's return value.

**Module:** Built-in.

---

## 14. `Invoke-RestMethod`

**What it does:** Calls an HTTP/REST endpoint and automatically parses JSON/XML responses.

**Aliases:** `irm`

```powershell
$data = Invoke-RestMethod https://api.github.com/users/chrishuffman5
$data.public_repos

irm -Uri https://api.example.com/items -Method POST -Body ($payload | ConvertTo-Json) -ContentType 'application/json'
```

**Why it matters:** When you're consuming a JSON API, `irm` is what you want — you get back deserialized PowerShell objects directly. This is *huge* for API work, automation, and integration scripts.

**Module:** Built-in.

---

## 15. `Invoke-WebRequest`

**What it does:** Makes HTTP requests and returns the full response object (headers, status, raw content).

**Aliases:** `iwr`, `curl`, `wget` (the aliases are PS-specific; the actual `curl`/`wget` binaries are different tools)

```powershell
$r = Invoke-WebRequest https://example.com
$r.StatusCode
$r.Headers
iwr https://example.com/file.zip -OutFile file.zip
```

**Why it matters:** Use `irm` when you want the parsed body. Use `iwr` when you need the *whole response* — headers, status codes, raw bytes, or you're downloading a file.

**Gotcha:** On Windows PS5.1, the `curl` alias points here, *not* to the real curl. In PS7, the aliases were removed on non-Windows platforms to avoid the conflict.

**Module:** Built-in.

---

## 16. `ConvertTo-Json` / `ConvertFrom-Json`

**What they do:** Serialize PowerShell objects to JSON, and parse JSON back into objects.

```powershell
@{ name = "Chris"; role = "Engineer" } | ConvertTo-Json
'{"name":"Chris"}' | ConvertFrom-Json
Get-Content config.json -Raw | ConvertFrom-Json
```

**Why it matters:** Modern automation lives and dies by JSON. These two cmdlets are the bridge between PowerShell's object world and every API you'll ever touch.

**Gotcha:** `ConvertTo-Json` defaults to a depth of 2. If your object has deeper nesting, pass `-Depth 10` (or higher).

**Module:** Built-in.

---

## 17. `Import-Csv` / `Export-Csv`

**What they do:** Read CSV files into objects; write objects to CSV.

```powershell
$users = Import-Csv users.csv
$users | Where Department -eq 'IT' | Export-Csv it-users.csv -NoTypeInformation
```

**Why it matters:** Round-tripping tabular data is a one-liner. Always pass `-NoTypeInformation` on export (or use PS7 where it's the default) so you don't get that ugly `#TYPE` header in your CSV.

**Module:** Built-in.

---

# Tier 3: Process & Service Control (18–21)

## 18. `Get-Process`

**What it does:** Lists running processes.

**Aliases:** `gps`, `ps`

```powershell
Get-Process
Get-Process chrome
gps | Sort CPU -Descending | select -First 10
```

**Module:** Built-in.

---

## 19. `Stop-Process`

**What it does:** Terminates processes.

**Aliases:** `kill`, `spps`

```powershell
Stop-Process -Name chrome
Stop-Process -Id 1234 -Force
gps notepad | Stop-Process
```

**Module:** Built-in.

---

## 20. `Get-Service`

**What it does:** Lists Windows services and their state.

```powershell
Get-Service
Get-Service -Name 'W32Time'
Get-Service | Where Status -eq 'Running'
```

**Why it matters:** Windows-centric, but in pwsh 7 on Linux/macOS this returns empty (or errors). For Linux services, you'd shell out to `systemctl` via `Start-Process` or just call it directly — pwsh treats native binaries as first-class citizens.

**Module:** Built-in (Windows).

---

## 21. `Start-Service` / `Stop-Service` / `Restart-Service`

**What they do:** Control Windows services.

```powershell
Start-Service -Name 'Spooler'
Restart-Service -Name 'W32Time' -Force
Get-Service -Name 'W3*' | Stop-Service
```

**Why it matters:** Requires elevation (admin rights) for most services. Pair with `Get-Service` to do bulk operations.

**Module:** Built-in (Windows).

---

# Tier 4: Filesystem Operations (22–28)

## 22. `Test-Path`

**What it does:** Returns `$true`/`$false` for whether a path exists.

```powershell
if (Test-Path C:\Logs) { gci C:\Logs }
Test-Path HKLM:\Software\MyApp        # Works on registry too
Test-Path C:\Temp\file.txt -PathType Leaf
```

**Why it matters:** The first line of half your scripts. Always check before reading, creating, or assuming.

**Module:** Built-in.

---

## 23. `New-Item`

**What it does:** Creates files, folders, registry keys, symlinks — anything a provider supports.

```powershell
New-Item -Path . -Name "newfile.txt" -ItemType File
New-Item -Path C:\Projects\MyApp -ItemType Directory   # mkdir
New-Item -ItemType SymbolicLink -Path link -Target target
```

**Why it matters:** The general-purpose creator. `mkdir` is an alias for the directory form.

**Module:** Built-in.

---

## 24. `Remove-Item`

**What it does:** Deletes files, folders, or anything else.

**Aliases:** `rm`, `del`, `rmdir`, `erase`

```powershell
Remove-Item old.log
Remove-Item .\build -Recurse -Force
rm *.tmp
```

**Why it matters:** `-Recurse -Force` is the "I really mean it" combo. Be careful — there's no recycle bin from PowerShell.

**Module:** Built-in.

---

## 25. `Copy-Item`

**What it does:** Copies files and folders.

**Aliases:** `cp`, `copy`, `cpi`

```powershell
Copy-Item source.txt dest.txt
Copy-Item C:\Source\* C:\Dest\ -Recurse
cp file.txt server01:C:\Backup\ -ToSession $session    # Copy over PSSession
```

**Module:** Built-in.

---

## 26. `Move-Item`

**What it does:** Moves or renames files and folders.

**Aliases:** `mv`, `move`, `mi`

```powershell
Move-Item old.txt archive\old.txt
mv *.log .\logs\
```

**Module:** Built-in.

---

## 27. `Rename-Item`

**What it does:** Renames a file or folder without moving it.

**Aliases:** `ren`, `rni`

```powershell
Rename-Item draft.txt final.txt
gci *.txt | Rename-Item -NewName { $_.Name -replace '\.txt$', '.md' }
```

**Module:** Built-in.

---

## 28. `Get-Item`

**What it does:** Retrieves a single filesystem object with full metadata.

```powershell
Get-Item C:\Windows\notepad.exe
(Get-Item config.json).LastWriteTime
```

**Why it matters:** Use this when you want details on *one specific thing*. `Get-ChildItem` lists things; `Get-Item` retrieves one.

**Module:** Built-in.

---

# Tier 5: Remoting & Execution (29–34)

## 29. `Invoke-Command`

**What it does:** Runs a script block locally or on remote machines.

**Aliases:** `icm`

```powershell
Invoke-Command -ScriptBlock { Get-Service }
Invoke-Command -ComputerName SERVER01,SERVER02 -ScriptBlock { hostname; Get-Date }
icm -Session $s -ScriptBlock { Get-Process }
```

**Why it matters:** The backbone of PowerShell remoting. Uses **WinRM** on Windows by default; can use **SSH** with `-HostName` instead of `-ComputerName`.

**Module:** Built-in.

---

## 30. `Enter-PSSession` / `New-PSSession`

**What they do:** Start an interactive remote session (`Enter-`) or create a reusable session object (`New-`).

```powershell
Enter-PSSession -ComputerName SERVER01
# now you're "inside" SERVER01, type exit to leave

$s = New-PSSession -ComputerName SERVER01
Invoke-Command -Session $s -ScriptBlock { Get-Service }
Remove-PSSession $s

# SSH-based (PS7+)
Enter-PSSession -HostName user@host
```

**Why it matters:** Persistent sessions are *much* faster than reconnecting on every call. Create one, reuse it.

**Module:** Built-in.

---

## 31. `Invoke-Expression`

**What it does:** Executes a string as PowerShell code.

**Aliases:** `iex`

```powershell
$cmd = "Get-Process | select -First 3"
Invoke-Expression $cmd
iex (irm https://get.scoop.sh)         # Common install pattern
```

**Why it matters:** Powerful and dangerous. You'll see it in install scripts (`irm <url> | iex`). Never `iex` untrusted input — it's an arbitrary code execution vector by definition.

**Module:** Built-in.

---

## 32. `Start-Process`

**What it does:** Launches external executables with full control over arguments, working directory, credentials, window state, etc.

**Aliases:** `start`, `saps`

```powershell
Start-Process notepad
Start-Process -FilePath ".\installer.exe" -ArgumentList "/quiet","/norestart" -Wait
Start-Process pwsh -Verb RunAs          # Elevated
```

**Why it matters:** When you just type `notepad`, PowerShell runs it directly. `Start-Process` is for when you need elevation, redirected output, wait behavior, or specific window handling.

**Module:** Built-in.

---

## 33. `Wait-Process` / `Wait-Job`

**What they do:** Block until a process or background job completes.

```powershell
Start-Process longtask.exe -PassThru | Wait-Process
$job = Start-Job { Start-Sleep 10; "done" }
Wait-Job $job
Receive-Job $job
```

**Module:** Built-in.

---

## 34. `Start-Job` / `Get-Job` / `Receive-Job`

**What they do:** Run script blocks in the background and retrieve their results.

```powershell
$job = Start-Job -ScriptBlock { gci C:\ -Recurse -ErrorAction SilentlyContinue }
Get-Job
$results = Receive-Job $job -Wait
Remove-Job $job
```

**Why it matters:** Traditional jobs run in a separate process — heavy but isolated. In PS7, prefer **`Start-ThreadJob`** (in-process, much faster) or `ForEach-Object -Parallel` for most parallel work.

**Module:** Built-in. `Start-ThreadJob` requires **ThreadJob** (ships with PS7).

---

# Tier 6: Data Shaping & Display (35–40)

## 35. `Sort-Object`

**What it does:** Sorts pipeline objects.

**Aliases:** `sort`

```powershell
Get-Process | Sort-Object CPU -Descending
gci | sort Length -Descending | select -First 5
gci | sort Extension -Unique
```

**Module:** Built-in.

---

## 36. `Group-Object`

**What it does:** Groups objects by a property and gives you counts.

**Aliases:** `group`

```powershell
Get-Process | Group-Object -Property Company
gci -Recurse | group Extension | sort Count -Descending
```

**Why it matters:** The PowerShell equivalent of SQL's `GROUP BY`. Pairs naturally with `Sort-Object` and `Measure-Object`.

**Module:** Built-in.

---

## 37. `Measure-Object`

**What it does:** Counts, sums, averages, and gets min/max of objects or properties.

**Aliases:** `measure`

```powershell
gci -File | Measure-Object -Property Length -Sum -Average -Max
gc bigfile.txt | Measure-Object -Line -Word -Character
```

**Why it matters:** The `wc -l` equivalent and far more. Use this whenever you want statistics on a dataset.

**Module:** Built-in.

---

## 38. `Format-Table` / `Format-List`

**What they do:** Control how output is *displayed* (not what data is in it).

**Aliases:** `ft`, `fl`

```powershell
Get-Process | Format-Table Name, CPU, Id -AutoSize
Get-Process chrome | Format-List *
```

**Why it matters — and the #1 beginner mistake:** Format cmdlets emit *display formatting objects*, not data. Use them only at the **end of a pipeline**, never in the middle. This breaks:

```powershell
# WRONG - the result is unusable for further processing
Get-Process | Format-Table | Export-Csv out.csv
```

```powershell
# RIGHT
Get-Process | Select Name, CPU, Id | Export-Csv out.csv
```

**Module:** Built-in.

---

## 39. `ConvertTo-Csv` / `ConvertFrom-Csv`

**What they do:** Like `Export-Csv` / `Import-Csv` but to/from strings instead of files.

```powershell
$csvString = $data | ConvertTo-Csv -NoTypeInformation
$objects = $csvString | ConvertFrom-Csv
```

**Why it matters:** When you're working with CSV in-memory — passing through pipelines, sending over HTTP, embedding in scripts — these are the in-memory versions.

**Module:** Built-in.

---

## 40. `Get-Date`

**What it does:** Returns the current date/time, formats dates, does date arithmetic.

```powershell
Get-Date
Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
(Get-Date).AddDays(-7)
$start = Get-Date; doSomething; (Get-Date) - $start
```

**Why it matters:** Logging, timestamps, expiration calculations, performance measurement. Returns a real `[DateTime]` object with all the .NET methods available.

**Module:** Built-in.

---

# Tier 7: System & Security (41–45)

## 41. `Set-ExecutionPolicy`

**What it does:** Controls whether PowerShell scripts can run on this system.

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Get-ExecutionPolicy -List              # See all scopes
```

**Why it matters:** On a fresh Windows install, scripts often won't run until you set this. `RemoteSigned` is a sensible default: local scripts run; downloaded scripts must be signed.

**For one-off use:** `pwsh -ExecutionPolicy Bypass -File script.ps1` skips the check for a single invocation.

**Module:** Built-in (Windows). No-op on Linux/macOS.

---

## 42. `Get-ItemProperty` / `Set-ItemProperty`

**What they do:** Read and write properties on items — most commonly registry values, but also file metadata.

```powershell
Get-ItemProperty -Path 'HKLM:\Software\Microsoft\Windows NT\CurrentVersion'
Set-ItemProperty -Path 'HKCU:\Software\MyApp' -Name 'Version' -Value '2.0'
```

**Why it matters:** Registry editing without leaving PowerShell. The `HKLM:` and `HKCU:` drives are mapped automatically.

**Module:** Built-in.

---

## 43. `New-Object`

**What it does:** Instantiates .NET objects.

```powershell
$client = New-Object System.Net.WebClient
$creds = New-Object System.Management.Automation.PSCredential('user', $securePass)
```

**Why it matters:** Bridges PowerShell to the full .NET ecosystem. In modern code, you'll more often use `[Type]::new()` syntax — `[System.Net.WebClient]::new()` — but `New-Object` is still everywhere in older scripts.

**Module:** Built-in.

---

## 44. `Add-Member`

**What it does:** Adds properties or methods to an existing object on the fly.

```powershell
$obj = [PSCustomObject]@{ Name = 'Chris' }
$obj | Add-Member -MemberType NoteProperty -Name 'Role' -Value 'Engineer'
$obj | Add-Member -MemberType ScriptMethod -Name 'Greet' -Value { "Hi, $($this.Name)" }
```

**Why it matters:** Lets you enrich objects mid-pipeline. Particularly useful when joining data from multiple sources.

**Module:** Built-in.

---

## 45. `Import-Module` / `Get-Module` / `Remove-Module`

**What they do:** Load, list, and unload PowerShell modules.

```powershell
Import-Module ActiveDirectory
Get-Module                           # Currently loaded
Get-Module -ListAvailable            # Installed but not necessarily loaded
Remove-Module ActiveDirectory
```

**Why it matters:** Everything beyond the built-in cmdlets lives in modules. Most modules **auto-load** when you call one of their cmdlets — but understanding the lifecycle matters when troubleshooting.

**Module:** Built-in.

---

# Tier 8: Modules, Credentials, Networking (46–50)

## 46. `Install-Module`

**What it does:** Installs modules from the PowerShell Gallery (or other registered repositories).

```powershell
Install-Module -Name Az -Scope CurrentUser
Install-Module -Name dbatools -Scope CurrentUser -Force
Find-Module -Name *azure*            # Search the gallery first
```

**Why it matters:** This is your `pip install` / `npm install`. Always use `-Scope CurrentUser` unless you genuinely need machine-wide installation (which requires admin).

**Module:** **PowerShellGet** (ships with PS7).

---

## 47. `Get-Credential`

**What it does:** Securely prompts for a username and password, returning a `PSCredential` object.

```powershell
$cred = Get-Credential
Invoke-Command -ComputerName SERVER01 -Credential $cred -ScriptBlock { whoami }
```

**Why it matters:** Never put passwords in plaintext in scripts. `Get-Credential` is how you collect them interactively in a secure way. For automation, store credentials with `Export-Clixml` (Windows DPAPI-protected) or use a secrets manager.

**Module:** Built-in.

---

## 48. `ConvertTo-SecureString` / `ConvertFrom-SecureString`

**What they do:** Work with `SecureString` for handling secrets in memory and persistence.

```powershell
$secure = ConvertTo-SecureString 'plaintext' -AsPlainText -Force
$encoded = $secure | ConvertFrom-SecureString    # DPAPI-encrypted on Windows
$cred = New-Object PSCredential('user', $secure)
```

**Why it matters:** The plumbing under `Get-Credential`. For real production secrets, use **Microsoft.PowerShell.SecretManagement** (`Install-Module Microsoft.PowerShell.SecretManagement`) — a vault-agnostic interface to Azure Key Vault, AWS Secrets Manager, KeePass, and others.

**Module:** Built-in.

---

## 49. `Test-Connection`

**What it does:** ICMP ping. In PS7, also supports TCP port testing.

**Aliases:** `ping` (PS7+, when no native ping is shadowing)

```powershell
Test-Connection google.com -Count 4
Test-Connection -TargetName server01 -TcpPort 443      # PS7+
```

**Why it matters:** Cross-platform connectivity testing. On Windows, **`Test-NetConnection`** (`tnc`) gives you richer output including TCP port checks, routing info, and DNS — but it requires the NetTCPIP module and is Windows-only.

**Module:** Built-in. `Test-NetConnection` requires **NetTCPIP** (Windows).

---

## 50. `Get-WinEvent` / `Get-EventLog`

**What they do:** Query Windows event logs.

```powershell
Get-WinEvent -LogName System -MaxEvents 50
Get-WinEvent -FilterHashtable @{ LogName='System'; Level=2; StartTime=(Get-Date).AddDays(-1) }
```

**Why it matters:** `Get-WinEvent` is the modern, fast one — use it. `Get-EventLog` is legacy and much slower for large logs. Both are Windows-only.

**Module:** Built-in (Windows).

---

# Honorable Mentions: Module-Specific Power Tools

These didn't make the top 50 because they're domain-specific, but in their world they're indispensable:

| Cmdlet | Module | Install Command | What It's For |
|--------|--------|-----------------|---------------|
| `Get-ADUser`, `Set-ADUser`, `Get-ADGroup` | **ActiveDirectory** | RSAT feature (Windows) | Active Directory administration |
| `Connect-AzAccount`, `Get-AzResource`, `Get-AzVM` | **Az** | `Install-Module Az -Scope CurrentUser` | Azure resource management |
| `Connect-ExchangeOnline`, `Get-Mailbox` | **ExchangeOnlineManagement** | `Install-Module ExchangeOnlineManagement` | Exchange Online / Microsoft 365 mail |
| `Connect-MgGraph`, `Get-MgUser` | **Microsoft.Graph** | `Install-Module Microsoft.Graph` | Microsoft Graph API / Entra ID |
| `Get-S3Object`, `Read-S3Object` | **AWS.Tools.S3** | `Install-Module AWS.Tools.Installer; Install-AWSToolsModule S3` | AWS S3 |
| `Get-VM`, `Start-VM` | **Hyper-V** | Windows feature | Hyper-V management |
| `Invoke-Sqlcmd` | **SqlServer** | `Install-Module SqlServer` | SQL Server queries |
| `Get-DbaDatabase` and ~700 others | **dbatools** | `Install-Module dbatools` | The community SQL Server toolkit — vastly more capable than the Microsoft module |
| `Get-VMHost` (VMware) | **VMware.PowerCLI** | `Install-Module VMware.PowerCLI` | VMware vSphere |

Most of these auto-load when you invoke one of their cmdlets, so once installed, you usually don't have to `Import-Module` them explicitly.

---

# Quick Reference: Pipeline Idioms

A few patterns you'll write again and again:

```powershell
# Top N largest files
gci -File -Recurse | sort Length -Descending | select -First 10 Name, Length

# Filter + transform + export
Get-Process | where CPU -gt 100 | select Name, CPU, Id | Export-Csv high-cpu.csv -NoTypeInformation

# Count by category
gci -Recurse | group Extension | sort Count -Descending

# Process each file in parallel (PS7+)
gci *.log | ForEach-Object -Parallel { Get-FileHash $_ } -ThrottleLimit 8

# Find errors in logs
sls -Path *.log -Pattern 'ERROR|FATAL' -Context 0,3

# Test-then-do
if (Test-Path config.json) { Get-Content config.json -Raw | ConvertFrom-Json }

# Bulk rename
gci *.txt | Rename-Item -NewName { $_.Name -replace '\.txt$', '.md' }
```

---

# The Approved Verbs Cheat Sheet

PowerShell has ~100 approved verbs. The ones you'll use 95% of the time:

| Verb | Meaning | Example |
|------|---------|---------|
| `Get` | Retrieve | `Get-Process` |
| `Set` | Modify | `Set-Location` |
| `New` | Create | `New-Item` |
| `Remove` | Delete | `Remove-Item` |
| `Start` | Begin | `Start-Service` |
| `Stop` | End | `Stop-Process` |
| `Restart` | Stop then start | `Restart-Service` |
| `Invoke` | Execute | `Invoke-RestMethod` |
| `Test` | Verify | `Test-Path` |
| `Import` | Bring in | `Import-Csv` |
| `Export` | Send out | `Export-Csv` |
| `Convert` / `ConvertTo` / `ConvertFrom` | Transform | `ConvertTo-Json` |
| `Select` | Pick | `Select-Object` |
| `Where` | Filter | `Where-Object` |
| `Sort` | Order | `Sort-Object` |
| `Measure` | Quantify | `Measure-Object` |

Run `Get-Verb` to see the rest.

---

# Where to Go Next

Once these 50 are second nature:

1. **Learn about `$_`, `$PSItem`, and parameter binding** — they explain why pipelines work the way they do
2. **Functions and advanced functions** — `function`, `param()`, `[CmdletBinding()]`, `[Parameter()]`
3. **Error handling** — `try/catch/finally`, `-ErrorAction`, `$Error`, `throw`
4. **Modules** — write your own, even just a personal utility module
5. **PSScriptAnalyzer** — `Install-Module PSScriptAnalyzer` for linting
6. **Pester** — the testing framework; `Install-Module Pester`
7. **Crescendo** — for wrapping native CLI tools as proper PowerShell cmdlets

---

# Final Advice

**Use `Get-Help` and `Get-Member` constantly.** They're not crutches — they're the design. The discoverability of PowerShell is its single biggest strength over other shells.

**Don't be afraid of long names.** Tab-completion makes `Get-ChildItem` no slower to type than `ls`. The verbose names self-document your scripts.

**Use aliases interactively, full names in scripts.** `gci | ? Length -gt 1MB` is great at the prompt; in a saved script, `Get-ChildItem | Where-Object Length -gt 1MB` is clearer for the next person reading it (probably you, six months from now).

**When something fails, pipe to `Get-Member`.** Nine times out of ten, the property you wanted is right there.

---

*Licensed under whatever license your repo uses. Contributions welcome.*
