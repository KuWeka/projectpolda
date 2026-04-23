Tanggal: 2026-04-17


## Scope
This document defines supply-chain controls for the backend service.

## Controls

1. Secret scanning
- Tool: gitleaks
- Workflow: backend-supply-chain.yml

2. Dependency vulnerability scanning
- Tool: Trivy filesystem scan + npm audit in governance workflows

3. Container image scanning
- Tool: Trivy image scan on CI-built image

4. SBOM generation
- Lightweight CycloneDX-like JSON artifact via script
- Artifact path: backend/artifacts/sbom-lite.cdx.json

5. Release gating
- Supply chain workflow must pass before release readiness gates

## Response Policy

1. HIGH/CRITICAL findings
- Block release pipeline
- Create remediation issue and patch before redeploy

2. False positives
- Document justification in PR
- Add time-boxed exception with follow-up date

## Verification Commands

1. Generate SBOM
- npm run security:sbom

2. Run readiness checks
- npm run phase7:readiness

3. Run synthetic checks
- npm run ops:synthetic

