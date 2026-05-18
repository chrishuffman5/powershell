<#
================================================================================
 PowerShell Native Capabilities Demonstration
================================================================================
 Purpose : Showcase 10 business automation functions built using ONLY native
           PowerShell and .NET classes. No external modules, no compilers,
           no pip/npm installs. These run on any standard PowerShell 7+ install.

 Audience: Engineers exploring CLI tooling for agentic AI harnesses.

 Reveal  : Every function below is a candidate "tool" that an AI agent can
           invoke directly. PowerShell already speaks the language of the
           enterprise (AD, SQL, WMI, REST, NTFS, .NET) — no glue code needed.
================================================================================
#>

#region ============================================================
# FUNCTION 1: Send-Email
# ------------------------------------------------------------------
# Sends an email via SMTP using the native .NET System.Net.Mail class.
# Defaults to the corporate mail relay. Supports optional attachments.
# ------------------------------------------------------------------
function Send-Email {
    param(
        [Parameter(Mandatory)][string]$From,
        [Parameter(Mandatory)][string]$To,
        [Parameter(Mandatory)][string]$Subject,
        [Parameter(Mandatory)][string]$Body,
        [string[]]$Attachments,
        [string]$SmtpServer = 'smtp.corporate.local'
    )

    # Build the mail message object from .NET
    $msg = [System.Net.Mail.MailMessage]::new($From, $To, $Subject, $Body)

    # Attach files if any were provided
    if ($Attachments) {
        foreach ($file in $Attachments) {
            $msg.Attachments.Add([System.Net.Mail.Attachment]::new($file))
        }
    }

    # Send via SMTP client and dispose cleanly
    $smtp = [System.Net.Mail.SmtpClient]::new($SmtpServer)
    $smtp.Send($msg)
    $msg.Dispose()
}
#endregion


#region ============================================================
# FUNCTION 2: Get-ADUserDetails
# ------------------------------------------------------------------
# Pulls Active Directory user details (department, manager, last logon,
# group memberships) using the native System.DirectoryServices namespace.
# No RSAT or ActiveDirectory module required.
# ------------------------------------------------------------------
function Get-ADUserDetails {
    param(
        [Parameter(Mandatory)][string]$SamAccountName
    )

    # Bind to the default domain via LDAP
    $searcher = [System.DirectoryServices.DirectorySearcher]::new()
    $searcher.Filter = "(&(objectClass=user)(samAccountName=$SamAccountName))"
    $searcher.PropertiesToLoad.AddRange(@('displayName','department','manager','lastLogon','memberOf','mail'))

    $result = $searcher.FindOne()
    if (-not $result) { Write-Warning "User '$SamAccountName' not found"; return }

    # Project into a clean PSCustomObject for easy formatting/export
    [pscustomobject]@{
        DisplayName = $result.Properties['displayname'][0]
        Email       = $result.Properties['mail'][0]
        Department  = $result.Properties['department'][0]
        Manager     = $result.Properties['manager'][0]
        LastLogon   = [datetime]::FromFileTime($result.Properties['lastlogon'][0])
        Groups      = $result.Properties['memberof']
    }
}
#endregion


#region ============================================================
# FUNCTION 3: Export-SqlQueryToCsv
# ------------------------------------------------------------------
# Runs a T-SQL query against any SQL Server instance and writes results
# directly to a CSV file. Uses System.Data.SqlClient — no SSMS, no
# SqlServer module, no ODBC drivers needed.
# ------------------------------------------------------------------
function Export-SqlQueryToCsv {
    param(
        [Parameter(Mandatory)][string]$Server,
        [Parameter(Mandatory)][string]$Database,
        [Parameter(Mandatory)][string]$Query,
        [Parameter(Mandatory)][string]$OutputPath
    )

    # Trusted (Windows auth) connection string
    $connStr = "Server=$Server;Database=$Database;Integrated Security=True;"
    $conn = [System.Data.SqlClient.SqlConnection]::new($connStr)
    $conn.Open()

    # Execute and load into a DataTable for easy CSV export
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $Query
    $reader = $cmd.ExecuteReader()
    $table = [System.Data.DataTable]::new()
    $table.Load($reader)
    $conn.Close()

    # Pipe through Export-Csv (also native PowerShell)
    $table | Export-Csv -Path $OutputPath -NoTypeInformation
    Write-Host "Exported $($table.Rows.Count) rows to $OutputPath"
}
#endregion


#region ============================================================
# FUNCTION 4: Test-EmailAddress
# ------------------------------------------------------------------
# Validates one or many email addresses using regex. Returns a structured
# object per address with a pass/fail flag and reason code.
# ------------------------------------------------------------------
function Test-EmailAddress {
    param(
        [Parameter(Mandatory)][string[]]$Address
    )

    # RFC-5322-lite pattern — good enough for 99% of business use cases
    $pattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    foreach ($a in $Address) {
        $isValid = $a -match $pattern
        [pscustomobject]@{
            Address = $a
            IsValid = $isValid
            Reason  = if ($isValid) { 'OK' } else { 'Invalid format' }
        }
    }
}
#endregion


#region ============================================================
# FUNCTION 5: Get-NetworkShareInventory
# ------------------------------------------------------------------
# Enumerates all SMB shares on a target server via WMI. Returns share
# name, local path, type, and description. Useful for storage audits.
# ------------------------------------------------------------------
function Get-NetworkShareInventory {
    param(
        [string]$ComputerName = $env:COMPUTERNAME
    )

    # Win32_Share is the classic WMI class for SMB shares
    Get-CimInstance -ClassName Win32_Share -ComputerName $ComputerName |
        Select-Object @{N='Server';E={$ComputerName}},
                      Name,
                      Path,
                      Description,
                      @{N='Type';E={
                          switch ($_.Type) {
                              0 { 'Disk Drive' }
                              1 { 'Print Queue' }
                              2 { 'Device' }
                              3 { 'IPC' }
                              default { 'Other' }
                          }
                      }}
}
#endregion


#region ============================================================
# FUNCTION 6: Compress-FilesByAge
# ------------------------------------------------------------------
# Zips files from a source folder into an archive, optionally filtering
# by last-modified age. Uses System.IO.Compression — no 7-Zip required.
# ------------------------------------------------------------------
function Compress-FilesByAge {
    param(
        [Parameter(Mandatory)][string]$SourcePath,
        [Parameter(Mandatory)][string]$DestinationZip,
        [int]$DaysOld = 0   # 0 = include everything
    )

    Add-Type -AssemblyName System.IO.Compression.FileSystem

    # Filter files by age
    $cutoff = (Get-Date).AddDays(-$DaysOld)
    $files  = Get-ChildItem -Path $SourcePath -Recurse -File |
              Where-Object { $_.LastWriteTime -ge $cutoff -or $DaysOld -eq 0 }

    # Open a new zip for writing
    $zip = [System.IO.Compression.ZipFile]::Open($DestinationZip, 'Create')
    foreach ($f in $files) {
        $relativePath = $f.FullName.Substring($SourcePath.Length).TrimStart('\','/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $relativePath) | Out-Null
    }
    $zip.Dispose()

    Write-Host "Archived $($files.Count) files to $DestinationZip"
}
#endregion


#region ============================================================
# FUNCTION 7: Get-ServiceHealth
# ------------------------------------------------------------------
# Reports the running state, startup type, and last-start time for one
# or more Windows services across one or more servers. Pure WMI/CIM.
# ------------------------------------------------------------------
function Get-ServiceHealth {
    param(
        [Parameter(Mandatory)][string[]]$ServiceName,
        [string[]]$ComputerName = $env:COMPUTERNAME
    )

    foreach ($computer in $ComputerName) {
        foreach ($svc in $ServiceName) {
            $cimSvc = Get-CimInstance -ClassName Win32_Service -ComputerName $computer `
                        -Filter "Name = '$svc'" -ErrorAction SilentlyContinue
            if (-not $cimSvc) { continue }

            # Process start time gives us "service uptime"
            $proc = Get-CimInstance -ClassName Win32_Process -ComputerName $computer `
                        -Filter "ProcessId = $($cimSvc.ProcessId)" -ErrorAction SilentlyContinue

            [pscustomobject]@{
                Server      = $computer
                Service     = $cimSvc.Name
                DisplayName = $cimSvc.DisplayName
                State       = $cimSvc.State
                StartMode   = $cimSvc.StartMode
                StartedAt   = $proc.CreationDate
            }
        }
    }
}
#endregion


#region ============================================================
# FUNCTION 8: New-SecurePassword
# ------------------------------------------------------------------
# Generates a cryptographically-secure random password using the
# System.Security.Cryptography RNG. Configurable length and character
# classes — useful for service-account provisioning.
# ------------------------------------------------------------------
function New-SecurePassword {
    param(
        [int]$Length = 20,
        [switch]$IncludeSymbols
    )

    # Build the candidate character set
    $chars  = [char[]]('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    if ($IncludeSymbols) { $chars += [char[]]'!@#$%^&*()-_=+[]{}' }

    # Use the cryptographic RNG, not Get-Random (which is not secure)
    $rng   = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = [byte[]]::new($Length)
    $rng.GetBytes($bytes)
    $rng.Dispose()

    # Map random bytes onto the character set
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}
#endregion


#region ============================================================
# FUNCTION 9: Invoke-RestApiToFlatObject
# ------------------------------------------------------------------
# Calls a REST endpoint, parses the JSON response, and flattens nested
# objects into a flat property bag. Useful for piping API data into
# CSVs, SQL tables, or downstream tools.
# ------------------------------------------------------------------
function Invoke-RestApiToFlatObject {
    param(
        [Parameter(Mandatory)][string]$Uri,
        [hashtable]$Headers,
        [string]$Method = 'GET'
    )

    # Invoke-RestMethod parses JSON automatically into PSObjects
    $response = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers

    # Helper: recursively flatten a nested object into dot-notation keys
    function Flatten-Object {
        param($Object, [string]$Prefix = '')
        $result = [ordered]@{}
        foreach ($prop in $Object.PSObject.Properties) {
            $key = if ($Prefix) { "$Prefix.$($prop.Name)" } else { $prop.Name }
            if ($prop.Value -is [pscustomobject]) {
                # Recurse into nested objects
                $nested = Flatten-Object -Object $prop.Value -Prefix $key
                foreach ($k in $nested.Keys) { $result[$k] = $nested[$k] }
            } else {
                $result[$key] = $prop.Value
            }
        }
        return $result
    }

    # Handle both single object and array responses
    if ($response -is [array]) {
        $response | ForEach-Object { [pscustomobject](Flatten-Object -Object $_) }
    } else {
        [pscustomobject](Flatten-Object -Object $response)
    }
}
#endregion


#region ============================================================
# FUNCTION 10: Get-FilePermissionAudit
# ------------------------------------------------------------------
# Walks a directory tree and reports the NTFS access control entries
# (who, what rights, allow/deny) for every folder. Output is flat and
# CSV-ready — perfect for compliance reviews.
# ------------------------------------------------------------------
function Get-FilePermissionAudit {
    param(
        [Parameter(Mandatory)][string]$Path,
        [switch]$Recurse
    )

    # Gather target folders
    $targets = if ($Recurse) {
        Get-ChildItem -Path $Path -Directory -Recurse
    } else {
        Get-Item -Path $Path
    }

    foreach ($folder in $targets) {
        # Get-Acl returns the .NET FileSystemSecurity object directly
        $acl = Get-Acl -Path $folder.FullName
        foreach ($ace in $acl.Access) {
            [pscustomobject]@{
                Path              = $folder.FullName
                Identity          = $ace.IdentityReference.Value
                Rights            = $ace.FileSystemRights
                AccessControlType = $ace.AccessControlType
                IsInherited       = $ace.IsInherited
            }
        }
    }
}
#endregion


<#
================================================================================
 THE REVEAL
================================================================================
 Every function above is:
   * Native PowerShell + .NET — no module installs, no compiler, no Python.
   * Under ~40 lines of code.
   * Strongly typed input/output — ideal for AI agent tool calling.
   * Composable — pipe one into the next without glue code.

 Your agentic harness can register each of these as a tool. The agent reasons
 about WHEN to call them; PowerShell handles HOW. That's the punchline:
 you already have the runtime. You just need to expose it.
================================================================================
#>
