# Verification Before Completion

## Overview

**Iron Law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check |
| Build succeeds | Build command: exit 0 | Linter passing |
| Bug fixed | Test original symptom: passes | Code changed |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- Trusting agent success reports blindly
- ANY wording implying success without running verification

## Evidence for WBS

When marking a WBS task `done`, the evidence IS the verification output.

```
WBS Update:
Task 2 completed.
Evidence: `npm test` → 47/47 pass, exit 0
```
