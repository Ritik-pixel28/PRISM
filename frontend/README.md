# PRISM frontend

See the repository README for setup, tests, model limitations and the demo guide.

Start the Python backend from the repository root with `python3 backend/server.py`, then run `npm run dev` here. The browser calls `/api/simulate`; the Next.js server forwards to `PRISM_API_URL` or the default local Python endpoint. Secrets stay server-side.
