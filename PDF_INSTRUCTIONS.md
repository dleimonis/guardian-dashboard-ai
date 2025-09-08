# How to Generate PDF Presentation

## Quick Instructions

### Option 1: Using Chrome/Edge (Recommended)

1. **Open the presentation file:**
   - Navigate to the project folder
   - Open `presentation-pdf.html` in Chrome or Edge browser

2. **Generate PDF:**
   - Press `Ctrl + P` (Windows) or `Cmd + P` (Mac)
   - In the print dialog:
     - **Destination:** Select "Save as PDF"
     - **Layout:** Landscape (should be auto-selected)
     - **Paper size:** A4 or Letter
     - **Margins:** None or Default
     - **Scale:** 100% (or "Default")
     - **Options:** ✅ Check "Background graphics"
     - **Pages per sheet:** 1
   - Click "Save"
   - Name it: `Guardian-AI-Presentation.pdf`

### Option 2: Using Firefox

1. Open `presentation-pdf.html` in Firefox
2. Press `Ctrl + P` (Windows) or `Cmd + P` (Mac)
3. Click "Print" button → Select "Microsoft Print to PDF" or "Save to PDF"
4. Ensure landscape orientation is selected
5. Save the file

## File Locations

- **HTML Presentation (PDF-Ready):** `presentation-pdf.html`
- **Interactive Presentation:** `hackathon-presentation.html`
- **Output PDF:** Save as `Guardian-AI-Presentation.pdf`

## Features of the PDF Version

✅ **Print-Optimized:** Each slide fits perfectly on one page
✅ **High Quality:** Vector graphics and clear text
✅ **Professional Layout:** Clean design for judges
✅ **Self-Contained:** All styles embedded, no external dependencies
✅ **A4 Landscape:** Standard presentation format
✅ **Page Numbers:** Easy navigation (1/10, 2/10, etc.)

## Troubleshooting

### Slides are cut off or broken
- Ensure "Landscape" orientation is selected
- Set margins to "None" or "Minimum"
- Check "Fit to page" option if available

### Colors look washed out
- Make sure "Background graphics" is checked
- Try using Chrome for best color reproduction

### Text is too small
- The presentation is optimized for A4/Letter size
- Don't scale down the content in print settings

### Multiple slides on one page
- Ensure you're opening `presentation-pdf.html` (not the interactive version)
- Each slide should automatically break to a new page

## Final PDF Checklist

Before submitting, verify:
- [ ] All 10 slides are included
- [ ] Text is readable and clear
- [ ] Colors and graphics are visible
- [ ] Page numbers show correctly
- [ ] No content is cut off
- [ ] File size is reasonable (< 5MB)

## Sharing the PDF

Once generated, the PDF can be:
- Uploaded to the hackathon submission platform
- Shared via email with judges
- Uploaded to cloud storage (Google Drive, Dropbox)
- Included in the GitHub repository

---

**Note:** The PDF version is static. For the interactive experience with animations, judges should use `hackathon-presentation.html` in a browser.