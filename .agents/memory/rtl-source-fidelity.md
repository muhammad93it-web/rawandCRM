---
name: RTL source-fidelity checks
description: How to avoid mirrored layouts when reproducing the audited infoCRM interface.
---

For this project, do not assume that `dir="rtl"` or an RTL flex container will
place mixed action and utility groups like the audited source. Use explicit DOM
order and alignment for headers, toolbars, tabs, and accordion rows, then compare
the result against the corresponding 1440×900 audit capture.

**Why:** Multiple visually plausible passes still mirrored the header utilities,
item actions, tabs, wordmark, or chevrons even though the page was globally RTL.
The mismatch was only obvious in direct same-viewport screenshot comparison.

**How to apply:** For every reproduced screen, compare source and app screenshots
at 1440×900. Check the physical left/right origin of each group—not just text
direction—before considering the screen faithful.