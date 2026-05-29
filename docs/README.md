# Insurance PDF Training Corpus

This folder is intended to hold fictitious insurance documents for AI ingestion
training. The files are synthetic and do not describe real people, companies,
policies, or claims.

Run the generator from the repository root:

```powershell
.\docs\generate-training-pdfs.ps1
```

The generator creates 10 PDFs:

| File | Document type | PDF mode |
| --- | --- | --- |
| `01-auto-policy-renewal-riverbend.pdf` | Auto policy renewal declaration | Selectable text |
| `02-homeowners-policy-harborstone.pdf` | Homeowners policy summary | Selectable text |
| `03-property-claim-first-notice-crescent.pdf` | Property claim first notice of loss | Image-only scan |
| `04-commercial-liability-claim-summit.pdf` | Commercial liability claim notice | Image-only scan |
| `05-workers-comp-claim-northstar.pdf` | Workers compensation claim intake | Selectable text |
| `06-umbrella-policy-briarfield.pdf` | Personal umbrella policy declaration | Selectable text |
| `07-auto-claim-estimate-silvergate.pdf` | Auto physical damage estimate | Image-only scan |
| `08-life-policy-beneficiary-maple.pdf` | Term life beneficiary confirmation | Selectable text |
| `09-cyber-policy-endorsement-evergreen.pdf` | Cyber liability endorsement schedule | Image-only scan |
| `10-marine-cargo-claim-atlas.pdf` | Inland marine cargo claim report | Image-only scan |

The mixed format is intentional. Selectable-text PDFs should parse through a
normal PDF text extraction path, while image-only scan PDFs require OCR before
the content can be normalized into Markdown or a structured schema.
