# shared/longplay

Helpers for 30–60 minute browser games:

- `save.js` — `LongplaySave.create(key, version)`
- `pause.js` + `pause.css` — pause / new game / clear save

Longplay games may copy these files into their own folder for static self-containment, or reference `../../shared/longplay/*` when served from repo root.
