# Sharefile

A responsive, hand-painted animated file-upload page recreated from the supplied screen recording. Open `dist/index.html`, or serve `dist` with any static server.

## Interactions

- Select or drop one PDF, image or ZIP file.
- Watch the balloon lift an envelope, cancel the flight, or see the success cloud.
- Try a 40 MB sample to see the overweight reaction and retry.
- Click the balloon to invite a UFO.
- Watch the sample flight without choosing a file.
- Pause motion; operating-system reduced-motion preferences are respected.

This is a browser-local demonstration. No file contents are read, uploaded, stored, or shared. The progress animation is simulated. A real upload service can be connected to `startFlight` later.

All artwork is inline SVG/CSS. Paper grain is generated locally on a canvas. Fonts are bundled locally (DynaPuff and Nunito Sans, Google Fonts, SIL Open Font License). Their licenses are included in `dist/assets`. No external requests or dependencies are required at runtime.

## Deployment

The Vercel project is named `sharefile` and connects to this GitHub repository. The production branch is `main`. Vercel serves the static `dist` directory using the checked-in `vercel.json`; no build command, package installation, environment variables or secrets are needed.

Push changes to `main` to publish an update. Other branches receive preview deployments through the Vercel Git integration.

## Validation

Run `node --check dist/app.js` to check JavaScript syntax. In the browser, use “Watch the flight” to exercise the success state, “Try a heavy file” for the size-limit state, and “Cancel” during a flight. File selection and drag-and-drop support one PDF, image or ZIP at a time.
