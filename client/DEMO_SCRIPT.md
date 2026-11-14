# 3-Minute Demo Script — Accessible Onboarding & Career Gateway

**Hero Journey:** *"A refugee with no kebele ID registers by voice in Amharic, asks for support privately, saves and resumes, then applies to an accessible job."*

---

## Segment 1 (0:00 – 0:30): Main Gateway, Honest Demo Banner & Language Switch
1. **Point to the top Demo Mode banner:**
   - *Spoken:* "Notice the honest Demo Mode banner—this uses sample data and never fakes a server save or SMS delivery."
2. **Click Language selector -> choose `አማርኛ (AM)`:**
   - *Spoken:* "Switching to Amharic lazy-loads the plain-language Amharic dictionary with Ethiopic font fallbacks, and marks strings as needing native-speaker review until verified."
3. **Click `ምዝገባ ጀምር` (Start registration).**

## Segment 2 (0:30 – 1:30): Screen-Reader & Eyes-Closed Keyboard Segment
1. **Focus on Step 1 (Shared device check):**
   - *Spoken:* "For the next 30 seconds, we navigate with keyboard only—no mouse."
   - Press `Tab` to `"አይ፣ የራሴ ስልክ ነው"` (No, this is my own device), press `Enter`, `Tab` to `ቀጥል` (Continue), press `Enter`.
   - *Spoken:* "Notice focus moves automatically to the new step heading, and every question explains *Why do we ask this?* and offers *Read question aloud*."
2. **Step 2 (Full name with Voice Input):**
   - Press `Tab` to `ማይክሮፎን ጀምር` (Start microphone) if supported on the demo browser, speak name, review in the editable transcript box, and click `ይህን ጽሁፍ ተጠቀም` (Use this text)—or type `"Selam Tadesse"` if browser blocks mic in demo room.
   - *Spoken:* "Voice input never auto-submits; the learner always reviews, edits, or discards the transcript."
3. **Step 3 (Contact) -> Click `ይህን ጥያቄ እለፍ` (Skip this question).**
4. **Step 4 (Identity alternatives):**
   - Select `የስደተኛ መታወቂያ` (Refugee ID) or `እነዚህ ሰነዶች የሉኝም` (I do not have these documents).
   - *Spoken:* "If a learner selects an ID document, voice input is disabled on the ID number field so nobody overhears sensitive numbers."
5. **Step 5 (Private support request):**
   - Check `አማራጭ የመማሪያ ቁሳቁስ` (Alternative learning materials) -> Click `መልሶቼን ገምግም` (Review my answers).
   - Scroll to **Save and resume** panel -> Click `Save non-sensitive answers on this phone` -> Click `Submit registration`.
   - *Spoken:* "Non-sensitive fields save opt-in to IndexedDB—never localStorage—while ID numbers and private support requests stay out of device storage."

## Segment 3 (1:30 – 2:30): Career Gateway, Schema.org JSON-LD & Employer Safeguards
1. **From Confirmation, click `Explore accessible jobs next`:**
   - Click private filter `Screen-reader-compatible tools`.
   - *Spoken:* "Filter choices stay private and never rank applicants. Each job card embeds valid Schema.org `JobPosting` JSON-LD."
2. **Click `Apply to this job` on `Junior Customer Support Specialist`:**
   - Step through the same one-question-per-screen engine, keeping accommodation sharing OFF by default, and submit.
3. **Click `For Employers` in the top navigation:**
   - Type `"Must provide medical certificate"` in Interview Accommodations -> show the red D4 safeguard blocker preventing publication until removed.

## Segment 4 (2:30 – 3:00): Partner Branding & Embeddable Web Component
1. **Click `Partner Theme & API` in the utility bar:**
   - Switch between `Savanna / ALX Learning` and `Civic Open Learning Partner`, then click `Test Low Contrast` (`#facc15`) to demonstrate automatic WCAG 2.2 AA contrast fallback.
2. **Click `Judge Checklist` -> open `Open Plain HTML Host Demo`:**
   - *Spoken:* "Here is the exact same module running inside a third-party plain HTML page with conflicting CSS and zero React on the host, via one `<script>` tag and Shadow DOM."
