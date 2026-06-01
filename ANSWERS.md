## 1. How to run

Requirements: Node.js 18 or higher, npm 9 or higher.

```bash
git clone <your-repo-url>
cd BILL-AND-TIP
npm install
npm run dev
```

Open http://localhost:5173 in your browser. That's it — no environment
variables, no database, no build step needed to see it running.

To build for production:

```bash
npm run build
npm run preview
```

Not deployed anywhere currently.



## 2. Stack & design choices

**Stack:** React 18 with Vite. I picked this because the app is entirely
UI state — bill amount, tip mode, people count, derived totals. React's
useState makes that straightforward to reason about. Vite gives fast HMR
so the feedback loop while building was tight. No component library — the
design was specific enough that pulling in something like MUI would have
meant fighting the defaults more than writing from scratch.

**Decision 1 — tip buttons and custom input live in the same row**

Most calculators put the preset buttons and the custom input on separate
lines. I kept them in one flex row because the interaction is mutually
exclusive — you're either using a preset or typing a custom value, never
both. Putting them on the same line makes that relationship obvious
visually. Selecting a preset clears the custom field; typing in the custom
field deactivates the presets. The active state (filled terracotta button,
or highlighted border on the custom input) always tells you exactly which
mode you're in. This affects the tip percentage section in the middle of
the card.

**Decision 2 — summary updates live, no calculate button**

I removed the calculate button entirely. The summary section at the bottom
of the card recalculates on every keystroke. The reasoning was that a
calculate button in a single-purpose calculator adds one interaction with
no benefit — you still have to fill in the same three fields. The tradeoff
is that invalid states are visible immediately, so the validation had to be
careful: errors only appear after a field has been touched (blurred or
typed in), not the moment the page loads. This affects the summary panel
and the error messages under each field.



## 3. Responsive & accessibility

**Responsive behavior**

On a 360px phone the card padding tightens from 36px to 20px and the
heading scales down via clamp(). The tip row wraps naturally with flexbox
— on very narrow screens the custom input drops below the three preset
buttons rather than squishing them. The summary rows stay readable because
the per-person value is right-aligned and white-space: nowrap prevents it
from line-breaking mid-number. On 1440px the card caps at 480px wide and
centers, so it doesn't stretch into an unreadable wide form.

**Accessibility consideration handled**

Every input has an explicit label connected by htmlFor/id. The tip preset
buttons use aria-pressed so a screen reader announces which one is active.
The summary section has aria-live="polite" so when the totals update, a
screen reader reads the new values without interrupting whatever the user
was doing. Focus states are visible on all interactive elements — inputs
get a terracotta glow on focus, buttons get an outline on focus-visible.

**Accessibility consideration knowingly skipped**

I didn't implement a custom number stepper with +/- buttons for the people
field. Arrow keys work (up increments, down decrements, floored at 1) but
there are no visible buttons for it. On a touchscreen you can't use arrow
keys, so mobile users have to type the number directly. I skipped it
because it added UI complexity and the tap target of a small +/- button
would have been a worse experience than a full-width input that opens the
numeric keyboard. With more time I'd add proper stepper buttons with
adequate tap size.



## 4. AI usage

I used Claude to generate the initial component structure and CSS. I gave
it the assignment brief, a screenshot of the target design, and asked for
a working React implementation.

**What it gave me:** A single App.jsx with all state in one component,
plus CSS with the color tokens and layout. The summary section originally
used a simple Math.round() for the per-person amount.

**What I changed and why:**

The AI used Math.round() for the per-person calculation. I changed it to
Math.ceil() (ceiling to 2 decimal places) because round-to-nearest means
the group can collectively underpay the restaurant by up to one paisa when
there's a remainder. Ceiling means the maximum overpayment is under one
paisa per person total — negligible — and the restaurant is never shorted.
The full reasoning is in the rounding policy section of this file.

I also changed how validation timing works. The AI showed errors
immediately on page load (all three fields were pre-marked invalid before
the user touched anything). I added a touched flag per field so errors only
surface after the user has interacted with that field. This is standard
form UX but the AI defaulted to the simpler always-validate approach.



## Honest gap

The custom tip input has a minor UX rough edge: if you type a number,
switch to a preset, then click back into the custom field, the old number
is still there and the field activates again immediately on focus. Ideally
clicking a preset should clear the custom input visually, and the custom
field should only reactivate when you actually start typing, not just on
focus. The fix would be to clear customTip when a preset is selected and
only set tipMode to 'custom' on the onChange event, not onFocus. I noticed
it late and ran out of time to handle all the edge cases around it without
breaking the keyboard flow.
