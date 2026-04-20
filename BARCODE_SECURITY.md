# How the Barcode System Keeps Your Data Safe

**Project:** PIC Barcode System — Gold Pawn Management
**Date:** 2026-04-20
**Written for:** Anyone who wants to understand how barcodes are protected in this system

---

## What Problem Are We Solving?

Every pawned item in this system gets a barcode. That barcode is printed on a ticket and stuck to the item. When staff scan it, the system looks up the item and shows its details.

The danger is: **what if someone fakes a barcode?** If barcodes were simple numbers like `000001`, `000002`, anyone could print a fake barcode and trick the system into releasing someone else's item.

This system is designed so that is impossible.

---

## How a Barcode Gets Created

When a new item is registered, the system creates a barcode in two steps.

### Step 1 — Generate a Random Code

The system asks the computer to generate **12 completely random bytes** and converts them into a 16-character code like:

```
xTy8P-DTizz9P94Q
```

Think of it like a lottery scratch card — the numbers are picked by a machine with no pattern, no order, and no connection to the customer or item. There are **79 billion billion billion** possible codes (2⁹⁶). Even if someone tried to guess codes one per second, it would take longer than the age of the universe to find a real one by chance.

**What this protects against:** Nobody can guess or predict another item's barcode.

### Step 2 — Store It Safely

The barcode is saved in the database with a rule: **no two items can ever share the same barcode.** The database enforces this as a hard constraint. The system also double-checks before saving, just in case.

---

## The Secret Seal (Encrypted Tokens)

For situations where a barcode needs to carry extra information — like the date it was created, which staff member issued it, and how many items the customer has — the system can wrap that data inside a **secret seal**.

Think of it like a wax seal on an envelope. You can see the envelope, but you cannot change what is inside without breaking the seal. If the seal is broken, the system knows the envelope was tampered with and rejects it.

### What Gets Sealed Inside

| Field | What It Means |
|---|---|
| Date | The day the barcode was issued (e.g. 20260405) |
| Initials | The two-letter code of the staff member |
| Count | How many items this customer currently has |

### How the Sealing Works

1. The three pieces of information are packaged together
2. The package is **locked** using a secret key known only to the server
3. A **tamper tag** is attached — like a security sticker that breaks if anyone touches the contents
4. The whole thing is converted into a short code safe for printing on a barcode

When the barcode is scanned later, the system unlocks it with the same secret key and checks the tamper tag. If anything was changed — even a single character — the tag does not match and the system **silently rejects** the barcode. No error message, no hints. It simply does not work.

### The Secret Key

The server uses a secret key (called `BARCODE_SECRET`) that must be:
- Exactly 64 characters long
- Made of random letters and numbers
- Stored only in the server's environment settings, never in the code

If the key is missing or wrong, the system **refuses to run** rather than silently using a weak key.

You can generate a safe key by running this once:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Who Can Access Barcodes?

No one can read or scan a barcode without being logged in first. Every request to the system must include a **login token** — a digital ID card that proves who you are.

### What Staff Can Do (After Logging In)

| Action | Who Can Do It |
|---|---|
| View item list (with barcodes) | Any logged-in staff |
| Register a new item | Any logged-in staff |
| Look up an item by scanning its barcode | Any logged-in staff |
| Verify / log a scan | Any logged-in staff |
| Update item details | Any logged-in staff |

Login tokens expire automatically after 7 days, so a forgotten session cannot be used forever.

The server also sets invisible security rules on every response that prevent common web attacks like hijacking or page embedding.

---

## Every Scan Is Recorded

Every time a barcode is scanned — for any reason — the system writes a record:

- **Which item** was scanned
- **Which staff member** did the scan
- **When** it happened
- **Why** (creating a new item, verifying an item, or doing a stock audit)

This means you always have a full history. If something suspicious happens — like an item being scanned at an unusual time — you can trace exactly who did it.

---

## What If Someone Tries to...

| Scenario | What Happens |
|---|---|
| ...guess a barcode by trying random codes | They would need to try 79 billion billion billion combinations. Not possible. |
| ...try barcodes in sequence (000001, 000002...) | Barcodes have no sequence. Each one is completely random. |
| ...modify a barcode token to change the date or initials | The tamper tag fails. The system rejects it silently. |
| ...use a barcode from a released item | The item's status is RELEASED in the database. The lookup will reflect that. |
| ...access barcode data without logging in | Every API route requires a valid login token. Access is denied. |
| ...read the secret key from the source code | The key is never written in the code. It lives only in the server's private settings. |
| ...use a weak or missing key | The server refuses to start encryption if the key is missing or too short. |

---

## Things That Could Be Improved

These are not current vulnerabilities — the system is safe as-is. But here are steps that would make it even stronger:

- [ ] **Add `BARCODE_SECRET` to the example settings file** so new deployments are reminded to set it. Right now it is not listed there and could be forgotten.

- [ ] **Restrict which websites can talk to the server.** Currently any website could send requests to the API. In production, only the official frontend should be allowed.

- [ ] **Shorten login session length.** 7 days is a long time for a stolen login token to remain valid. Reducing it to 8 hours with a refresh option is safer for a live deployment.

- [ ] **Add a version tag to encrypted tokens.** If the secret key ever needs to be changed, old tokens could not be read anymore. A version tag would allow the system to support multiple keys during a transition.

- [ ] **Limit how many times someone can scan in a short period.** This prevents automated scripts from rapidly scanning many codes looking for a match.

- [ ] **Digitally sign the printed barcode.** Right now the stored barcode is a random code verified only by the database. Adding a signature to the physical barcode label would let staff detect a physically forged sticker before it even hits the system.

---

## Summary

| What Is Protected | How |
|---|---|
| No one can guess a barcode | 96 bits of randomness — effectively unguessable |
| No two items share a barcode | Database enforces uniqueness |
| No one can fake or modify a token | Tamper-evident seal (AES-256-GCM) |
| No one can access data without logging in | JWT login tokens required on every request |
| Nothing is hidden in the code | Secret key lives only in server environment settings |
| Every scan is traceable | Full audit log with staff name, timestamp, and reason |
