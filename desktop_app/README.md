# NetSentryX Desktop Launcher

This folder contains an Electron shell that wraps the API, ML model, and dashboard into a desktop installable application.

## Setup
1. Build the dashboard: `cd ../dashboard && npm install && npm run build`
2. Ensure the trained model is present at `../models/saved_models/rf_model.joblib`.
3. Install desktop dependencies:
   ```bash
   cd desktop_app
   npm install
   ```

## Development
- Run the app locally: `npm run start`. Electron will spawn `uvicorn` and open the built dashboard.
- You can add buttons/actions to the React UI that call `/api/*` as needed.
- The dashboard header now exposes a "Real Blocking" toggle that flips the backend `blocking_enabled` flag so you can enable or disable iptables enforcement without restarting the app.

## Packaging
1. Install `electron-builder` if not already bundled.
2. Build the NSIS installer:
   ```bash
   npm run build
   ```
3. The packaged installer lives in `desktop_app/dist/NetSentryX-Installer-<version>.exe`.
4. Distribute the `.exe` anywhere (GitHub Releases, website). The installer already contains the ML model and backend assets since they are listed under the `files` section of `package.json`.

## Notes
- Electron currently launches `uvicorn` with `--reload`; switch to `--workers` or remove `--reload` for production packaging.
- Be sure Python and the `.venv` are available on target machines, or bundle a portable Python interpreter alongside the app.
