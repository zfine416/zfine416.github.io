# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Zachary Fine, deployed via GitHub Pages at `zachary-fine.com`. This is a **static site with no build process** — plain HTML, CSS, and vanilla JavaScript.

## Development

**No build tools or package manager.** Edit files directly and serve locally with:
```bash
python3 -m http.server 8080
```

Push to `master` to deploy (GitHub Pages deploys automatically).

## Architecture

### Main Portfolio (`index.html` + `app.js` + `css/`)

Single-page portfolio with four sections: home, about, projects, footer. CSS is modular — `css/style.css` is the master file that imports all section-specific stylesheets (`home.css`, `about.css`, `projects.css`, `footer.css`, `navbar.css`, `social-media.css`, `flicker.css`).

`app.js` handles scroll-triggered animations using jQuery: chevron click scrolls to `#about`, and a window scroll listener adds a `pulse` CSS class to section headers as they come into view.

### Games (`pong/`, `snake/`, `connect4/`, `chopper/`)

Standalone mini-projects, each with their own `index.html`, CSS, and JS. The pong and snake games use `<canvas>`; connect4 uses DOM manipulation.

### Alternate/Experimental Pages (`test/`, `zfine/`)

Earlier portfolio variants using parallax (jQuery Stellar). Not linked from the main portfolio.

## External Dependencies (CDN only)

- jQuery 3.2.1
- Font Awesome 4.7.0
- Google Fonts: Monoton, Raleway
- Masonry 4.2.0 (loaded but currently commented out in `app.js`)
- Animate.css 3.5.2

## Color Palette

| Name   | Hex       |
|--------|-----------|
| Peach  | `#FEA680` |
| Azure  | `#01ABAA` |
| Butter | `#FEDC3D` |
