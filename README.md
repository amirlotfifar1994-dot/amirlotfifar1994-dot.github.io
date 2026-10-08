# GitHub Pages home

This repository serves the account homepage at https://amirlotfifar1994-dot.github.io/.

KAVICO is published separately at https://amirlotfifar1994-dot.github.io/kavico/ from
the `amirlotfifar1994-dot/kavico` repository and its GitHub Actions Pages workflow.
Do not copy the KAVICO build to this repository's root.

The first commit (`a81b0295a21b3f4ae7491b6df113e0f07cffa701`) contains the former
accidental root preview and remains available in Git history.

`sw.js` retires that preview's root service worker. The homepage also unregisters
that exact root worker without touching service workers scoped to project paths.
