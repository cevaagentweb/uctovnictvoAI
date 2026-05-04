# UctoBot Render MVP

Static MVP accounting dashboard prepared for GitHub and Render.

## Demo access

- `Admin` - full demo access to create, edit, delete, export, and reset data
- `User` - read-only demo access to dashboard, invoices, assistant, and exports

The role chooser is frontend-only and stored in browser `localStorage`. It is useful for demos on Render, but it is not real authentication.

## Current functional flows

- Create an issued invoice in `Faktury`, then download it as PDF or open the print/PDF view.
- Add expenses manually in `Vydavky`, including cash purchases.
- Upload or photograph a receipt in `Vydavky`; OCR tries to prefill supplier, date, amount, VAT rate, category, and payment method.

## Structure

- `public/index.html` - app entrypoint
- `public/styles.css` - UI styles
- `public/app.js` - client-side app logic
- `render.yaml` - Render blueprint for static hosting

## Run locally

You can open `public/index.html` directly in a browser, or serve the folder with any static server.

## Deploy on Render

1. Push this repository to GitHub.
2. In Render, create a new Blueprint, Static Site, or Docker Web Service.
3. Select the GitHub repository.
4. If using the blueprint, Render will read `render.yaml` automatically.
5. If creating the site manually, use:
   - Build Command: `echo "Static app - no build required"`
   - Publish Directory: `public`
6. If the Render service is already configured as Docker, Render will use the included `Dockerfile`.

## Notes

- Data is stored in the browser via `localStorage`.
- This is a frontend-only MVP with no backend, real authentication, or database.
