Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Generates fictitious insurance customer/policy/claims data for AI ingestion
# training. Every record is synthetic and does not describe real people,
# companies, policies, or claims. Each output file has its own schema shape but
# is internally consistent across all of its records.

$outDir = Split-Path -Parent $PSCommandPath
$rng = [System.Random]::new(20260528)

function Get-Int { param([int]$Min, [int]$Max) return $rng.Next($Min, $Max + 1) }
function Pick { param([object[]]$Items) return $Items[$rng.Next(0, $Items.Count)] }
function Get-Money { param([double]$Min, [double]$Max) return [Math]::Round($Min + ($rng.NextDouble() * ($Max - $Min)), 2) }
function Get-Bool { param([double]$TrueChance = 0.5) return ($rng.NextDouble() -lt $TrueChance) }

function Get-Date {
    param([int]$StartYear = 2023, [int]$EndYear = 2026)
    $start = [datetime]::new($StartYear, 1, 1)
    $days = ([datetime]::new($EndYear, 12, 31) - $start).Days
    return $start.AddDays($rng.Next(0, $days)).ToString("yyyy-MM-dd")
}

$firstNames = @("Elena","Marcus","Denise","Robert","Thomas","Hannah","Arjun","Lydia","Grant","Bethany",
    "Owen","Leah","Carla","Miles","Naomi","Adrian","Sofia","Mateo","Priya","Nadine",
    "Jamie","Devin","Imani","Caleb","Rosa","Victor","Yuki","Omar","Greta","Felix",
    "Tara","Wesley","Nina","Hugo","Camila","Derek","Sana","Lionel","Brooke","Pavel")
$lastNames = @("Marquez","Whitaker","Kapoor","Ellison","Becker","Cho","Mehta","Santoro","Ivers","Cole",
    "Patel","Morimoto","Jennings","Dorsey","Brooks","Tran","Price","Ellis","Novak","Reyes",
    "Holloway","Fairchild","Underwood","Bautista","Schreiber","Okafor","Lindqvist","Delgado","Vance","Romero",
    "Castellano","Beaumont","Nakamura","Ferraro","Adeyemi","Sokolov","Larkin","Hwang","Mercado","Pruitt")
$cities = @(
    @{ City = "Fairview"; State = "OH"; Zip = "44126" },
    @{ City = "Ashton"; State = "NC"; Zip = "27513" },
    @{ City = "Joliet"; State = "IL"; Zip = "60431" },
    @{ City = "Meridian"; State = "ID"; Zip = "83642" },
    @{ City = "Plano"; State = "TX"; Zip = "75024" },
    @{ City = "Lakeside"; State = "MN"; Zip = "55014" },
    @{ City = "Charlotte"; State = "NC"; Zip = "28202" },
    @{ City = "Boulder"; State = "CO"; Zip = "80302" },
    @{ City = "Tacoma"; State = "WA"; Zip = "98402" },
    @{ City = "Savannah"; State = "GA"; Zip = "31401" },
    @{ City = "Tempe"; State = "AZ"; Zip = "85281" },
    @{ City = "Worcester"; State = "MA"; Zip = "01608" }
)
$streets = @("Cedar Hollow Lane","Willow Gate Drive","Magnolia Ridge Court","Pine Street","Orchard Meadow Way",
    "Birchwood Trail","Sycamore Bend","Harbor Point Road","Sterling Crest","Juniper Hollow",
    "Maplewood Circle","Granite Field Way","Aspen Grove Lane","Clearwater Drive","Foxglove Court")
$carriers = @("Riverbend Mutual","Harborstone Casualty","Crescent Valley Assurance","Summit Prairie Indemnity",
    "Northstar Employers Mutual","Briarfield Excess","Silvergate National","Maple Crown Life",
    "Evergreen Ridge Specialty","Atlas Bay Marine")
$lobs = @("Auto","Homeowners","Umbrella","WorkersComp","CommercialGL","Life","Cyber","InlandMarine")
$claimCauses = @("Water damage","Collision","Theft","Fire","Wind/Hail","Liability - slip and fall",
    "Cargo water intrusion","Equipment breakdown","Vandalism","Hail","Rear-end collision","Pipe burst")
$claimStatuses = @("Open","Under Review","Investigation","Approved","Denied","Closed","Reopened","Pending Docs")
$paymentMethods = @("EFT","Check","Credit Card","Lockbox")
$vehicleMakes = @("Subaru Outback","Toyota Camry","Honda Accord","Ford F-150","Tesla Model 3",
    "Mazda CX-5","Chevrolet Equinox","Jeep Wrangler","Hyundai Tucson","Volkswagen Jetta")

function New-Name { return @{ First = (Pick $firstNames); Last = (Pick $lastNames) } }
function New-Address {
    $c = Pick $cities
    return @{
        Line1 = "$([int](Get-Int 50 9800)) $(Pick $streets)"
        City  = $c.City
        State = $c.State
        Zip   = $c.Zip
    }
}
function New-Email { param($First, $Last) return "$($First.ToLower()).$($Last.ToLower())@example-mail.test" }
function New-Phone { return "($([int](Get-Int 200 989))) $([int](Get-Int 200 989))-$('{0:D4}' -f (Get-Int 0 9999))" }

$results = [System.Collections.Generic.List[string]]::new()

function Save-Csv {
    param([string]$Name, [System.Collections.IList]$Rows)
    $path = Join-Path $outDir $Name
    $Rows | Export-Csv -Path $path -NoTypeInformation -Encoding UTF8
    $results.Add(("{0,-34} {1,6} records" -f $Name, $Rows.Count))
}
function Save-Json {
    param([string]$Name, [object]$Object, [int]$Count, [int]$Depth = 8)
    $path = Join-Path $outDir $Name
    $json = $Object | ConvertTo-Json -Depth $Depth
    [System.IO.File]::WriteAllText($path, $json, [System.Text.UTF8Encoding]::new($false))
    $results.Add(("{0,-34} {1,6} records" -f $Name, $Count))
}

# ---------------------------------------------------------------------------
# 1. customers.csv  - flat customer master (one row per customer)
# ---------------------------------------------------------------------------
$n = Get-Int 4800 5400
$rows = [System.Collections.Generic.List[object]]::new()
for ($i = 1; $i -le $n; $i++) {
    $name = New-Name; $addr = New-Address
    $rows.Add([PSCustomObject][ordered]@{
        customer_id   = "CUST-{0:D6}" -f $i
        first_name    = $name.First
        last_name     = $name.Last
        email         = New-Email $name.First $name.Last
        phone         = New-Phone
        date_of_birth = Get-Date -StartYear 1955 -EndYear 2004
        street        = $addr.Line1
        city          = $addr.City
        state         = $addr.State
        zip           = $addr.Zip
        segment       = Pick @("Personal","Small Business","Affluent","Standard")
        loyalty_years = Get-Int 0 28
        marketing_opt_in = (Get-Bool 0.55)
        created_date  = Get-Date -StartYear 2015 -EndYear 2026
    })
}
Save-Csv "customers.csv" $rows

# ---------------------------------------------------------------------------
# 2. policies.json  - policy objects with nested insured + coverages array
# ---------------------------------------------------------------------------
$n = Get-Int 2800 3400
$policies = [System.Collections.Generic.List[object]]::new()
for ($i = 1; $i -le $n; $i++) {
    $name = New-Name; $addr = New-Address
    $lob = Pick $lobs
    $eff = Get-Date -StartYear 2024 -EndYear 2026
    $covCount = Get-Int 1 4
    $coverages = [System.Collections.Generic.List[object]]::new()
    $premiumSum = 0.0
    for ($c = 0; $c -lt $covCount; $c++) {
        $prem = Get-Money 80 4200
        $premiumSum += $prem
        $coverages.Add([ordered]@{
            code       = Pick @("BI","PD","COMP","COLL","DWELL","LIAB","UM","MED","CYBER","CARGO")
            limit      = Pick @(25000, 50000, 100000, 250000, 500000, 1000000, 2000000)
            deductible = Pick @(0, 250, 500, 1000, 2500, 5000, 10000)
            premium    = $prem
        })
    }
    $pfx = Pick @("RMI","HCF","BES","NEM","SPI")
    $policies.Add([ordered]@{
        policy_number = ("{0}-{1:D6}-26" -f $pfx, $i)
        line_of_business = $lob
        carrier       = Pick $carriers
        status        = Pick @("Active","Lapsed","Cancelled","Pending Renewal")
        effective_date = $eff
        expiration_date = ([datetime]::Parse($eff)).AddYears(1).ToString("yyyy-MM-dd")
        insured = [ordered]@{
            full_name = "$($name.First) $($name.Last)"
            address   = [ordered]@{ line1 = $addr.Line1; city = $addr.City; state = $addr.State; zip = $addr.Zip }
        }
        coverages = $coverages
        annual_premium = [Math]::Round($premiumSum, 2)
        payment_method = Pick $paymentMethods
        paperless     = (Get-Bool 0.6)
    })
}
Save-Json "policies.json" $policies $n

# ---------------------------------------------------------------------------
# 3. claims.csv  - flat claim transactions (one row per claim)
# ---------------------------------------------------------------------------
$n = Get-Int 7200 8200
$rows = [System.Collections.Generic.List[object]]::new()
for ($i = 1; $i -le $n; $i++) {
    $loss = Get-Date -StartYear 2024 -EndYear 2026
    $reported = ([datetime]::Parse($loss)).AddDays((Get-Int 0 21)).ToString("yyyy-MM-dd")
    $reserve = Get-Money 500 95000
    $paid = [Math]::Round($reserve * $rng.NextDouble(), 2)
    $pfx = Pick @("RMI","HCF","BES","NEM","SPI")
    $polNum = Get-Int 1 3400
    $rows.Add([PSCustomObject][ordered]@{
        claim_number   = "CLM-2026-{0:D7}" -f $i
        policy_number  = ("{0}-{1:D6}-26" -f $pfx, $polNum)
        line_of_business = Pick $lobs
        cause_of_loss  = Pick $claimCauses
        date_of_loss   = $loss
        reported_date  = $reported
        status         = Pick $claimStatuses
        reserve_amount = $reserve
        paid_to_date   = $paid
        deductible     = Pick @(250, 500, 1000, 2500, 5000)
        adjuster       = "$(Pick $firstNames) $(Pick $lastNames)"
        litigation     = (Get-Bool 0.08)
        catastrophe    = (Get-Bool 0.12)
    })
}
Save-Csv "claims.csv" $rows

# ---------------------------------------------------------------------------
# 4. policyholders.json  - deeply nested person with addresses[] + contacts[]
# ---------------------------------------------------------------------------
$n = Get-Int 1500 2000
$holders = [System.Collections.Generic.List[object]]::new()
for ($i = 1; $i -le $n; $i++) {
    $name = New-Name
    $addrCount = Get-Int 1 2
    $addresses = [System.Collections.Generic.List[object]]::new()
    for ($a = 0; $a -lt $addrCount; $a++) {
        $ad = New-Address
        $addresses.Add([ordered]@{
            type = ($(if ($a -eq 0) { "mailing" } else { "property" }))
            line1 = $ad.Line1; city = $ad.City; state = $ad.State; zip = $ad.Zip
        })
    }
    $holders.Add([ordered]@{
        party_id = "PH-{0:D6}" -f $i
        person = [ordered]@{
            first = $name.First
            last  = $name.Last
            dob   = Get-Date -StartYear 1950 -EndYear 2003
        }
        addresses = $addresses
        contacts = @(
            [ordered]@{ channel = "email"; value = (New-Email $name.First $name.Last); preferred = $true }
            [ordered]@{ channel = "phone"; value = (New-Phone); preferred = $false }
        )
        policy_count = Get-Int 1 5
        household_score = [Math]::Round($rng.NextDouble() * 100, 1)
        active = (Get-Bool 0.85)
    })
}
Save-Json "policyholders.json" $holders $n

# ---------------------------------------------------------------------------
# 5. auto-policies.csv  - auto-specific flat schema (distinct columns)
# ---------------------------------------------------------------------------
$n = Get-Int 2400 3000
$rows = [System.Collections.Generic.List[object]]::new()
for ($i = 1; $i -le $n; $i++) {
    $rows.Add([PSCustomObject][ordered]@{
        auto_policy_id = "AU-{0:D6}" -f $i
        insured_name   = "$(Pick $firstNames) $(Pick $lastNames)"
        vehicle_year   = Get-Int 2008 2026
        vehicle_make_model = Pick $vehicleMakes
        vin_last4      = "{0:D4}" -f (Get-Int 0 9999)
        annual_mileage = (Get-Int 4 30) * 1000
        primary_use    = Pick @("Commute","Pleasure","Business","Farm")
        bi_limit_per_person = Pick @(25000, 50000, 100000, 250000)
        pd_limit       = Pick @(25000, 50000, 100000)
        comp_deductible = Pick @(250, 500, 1000)
        coll_deductible = Pick @(500, 1000, 2000)
        good_driver    = (Get-Bool 0.7)
        annual_premium = Get-Money 640 3200
        territory_code = "TR{0:D3}" -f (Get-Int 1 220)
    })
}
Save-Csv "auto-policies.csv" $rows

# ---------------------------------------------------------------------------
# 6. claim-activity.json  - event-log style activity entries (one per event)
# ---------------------------------------------------------------------------
$n = Get-Int 8500 9800
$events = [System.Collections.Generic.List[object]]::new()
$eventTypes = @("FNOL_RECEIVED","RESERVE_SET","ADJUSTER_ASSIGNED","INSPECTION_SCHEDULED",
    "DOCUMENT_UPLOADED","PAYMENT_ISSUED","STATUS_CHANGED","NOTE_ADDED","SUBROGATION_OPENED","CLAIM_CLOSED")
for ($i = 1; $i -le $n; $i++) {
    $ts = (Get-Date -StartYear 2025 -EndYear 2026)
    $events.Add([ordered]@{
        event_id   = "EVT-{0:D8}" -f $i
        claim_number = "CLM-2026-{0:D7}" -f (Get-Int 1 8200)
        event_type = Pick $eventTypes
        timestamp  = "$($ts)T$('{0:D2}' -f (Get-Int 0 23)):$('{0:D2}' -f (Get-Int 0 59)):00Z"
        actor      = Pick @("system","adjuster","supervisor","agent","insured")
        amount     = ($(if ((Get-Bool 0.3)) { Get-Money 50 25000 } else { $null }))
        channel    = Pick @("web","phone","email","mobile","batch")
    })
}
Save-Json "claim-activity.json" $events $n 6

# ---------------------------------------------------------------------------
"Generated data files in $outDir"
$results | ForEach-Object { "  $_" }
