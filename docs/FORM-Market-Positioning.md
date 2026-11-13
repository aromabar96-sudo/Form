# FORM — Market Positioning
### Competitive Landscape · Product Gap · Go-To-Market

---

## What FORM Is

A **parametric, 3D, browser-based, video-exportable abstract background generator** built for web designers and creative directors who need unique motion textures — without installing software, learning node graphs, or paying enterprise prices.

---

## The Competitive Landscape

### Direct Competitors

| Tool | Closest To | Why It Falls Short |
|---|---|---|
| **Cables.gl** | Most direct WebGL equivalent | Node-based graph requires developer knowledge; steep learning curve for designers |
| **Rive** | Browser-based animation tool | Focused on UI micro-animations and character animation, not environmental texture |
| **Spline** | 3D browser design tool | Product visualization and 3D UI focus; not abstract/generative; watermarked free tier |
| **Theatre.js** | Three.js animation sequencer | Requires manual keyframing; not procedural; no standalone export |

### Tools FORM Draws From

| Tool | What FORM Borrows | What FORM Adds |
|---|---|---|
| **Shadertoy** | GLSL fragment shader approach | Wraps shader power in a designer-friendly parameter UI |
| **TouchDesigner** | Realtime generative visuals, audio reactivity | Browser-based, free, no install, no $600 license |
| **Processing / p5.js** | Creative coding philosophy | Specialized output, production-grade UI, no coding required |
| **Notch** | Broadcast-grade generative content | Accessible, instant, web-native, fraction of the cost |

### Adjacent Tools in the Designer Workflow

| Tool | Output | FORM Advantage |
|---|---|---|
| **Haikei** | Static SVG blobs and waves | FORM is animated, 3D, video output |
| **BGJar / SVGBackgrounds** | Static pattern PNGs | FORM produces motion, uniqueness, depth |
| **Vanta.js** | Pre-built Three.js animated backgrounds | Vanta has 20 fixed presets; FORM has infinite parametric variation |
| **Cavalry** | Data-driven 2D motion graphics | FORM is browser-based, 3D, no install, web-background focused |
| **Coolors / Realtime Colors** | Color palette generation | FORM planned palette system integrates color directly into scene export |

---

## Where FORM Sits

```
                    Static                    Animated
                      │                          │
                      │                          │
 Simple       Haikei · BGJar           Vanta.js (fixed presets)
                      │                          │
                      │                       [ FORM ]
                      │                  parametric · 3D
                      │                  exportable · yours
                      │                          │
Professional   After Effects            TouchDesigner · Notch
                      │                          │
                      │                          │
 Complex       Cables.gl · Spline      Notch · Cavalry
```

**FORM occupies a gap with no strong current player.**

---

## The Gap

Every existing tool is either:

- **Too simple** — static output, limited presets, no 3D, no motion
  *(Haikei, BGJar, SVGBackgrounds, Vanta.js)*

- **Too complex** — node graphs, scripting, local install required
  *(Cables.gl, TouchDesigner, Notch, Processing)*

- **Wrong output** — UI animation or product 3D, not web backgrounds
  *(Rive, Spline, Theatre.js)*

- **Wrong price** — enterprise licensing, annual subscription, GPU workstation required
  *(Notch, Cavalry, TouchDesigner)*

---

## Target User

**Primary**: Web designers and creative directors at agencies and studios who:
- Regularly need non-stock, non-generic background textures for client sites
- Work in tools like Figma, Webflow, and Framer
- Have no Three.js or WebGL knowledge
- Currently settle for Haikei SVGs, Vanta presets, or stock video loops

**Secondary**: Frontend developers who want to generate background assets without writing Three.js from scratch

**Not the target**: VJ artists, broadcast motion designers, game developers — these users have TouchDesigner, Notch, and Unity

---

## Core Value Proposition

> **FORM is the first tool that lets a web designer create a unique, 3D, animated background texture in minutes — and export it as a clean video loop, ready to drop into any website.**

No install. No code. No node graph. No watermark.

---

## Differentiators

**1. Parametric, not preset**
Unlike Vanta (20 fixed options) or Haikei (template-based), every FORM output is unique. Sliders, colors, and layer combinations produce infinite variation.

**2. Truly 3D**
Not flat SVG patterns or 2D canvas. Real WebGL geometry with lighting, reflections, depth, and camera movement. Looks like it cost a motion design studio days to produce.

**3. Seamless loop out of the box**
All animation is phase-based (`elapsed % duration`), guaranteeing a perfect seamless loop. No cross-fade workaround needed. Drop the video directly into a `<video loop autoplay muted>` tag.

**4. Designed for the web background use case**
Export resolutions match web needs (16:9, square, vertical). Transparent background option. File sizes appropriate for web delivery. Output tested specifically for CSS `background-video` and Webflow/Framer embeds.

**5. Browser-native, zero friction**
Open a URL, start creating, export. No account required on the free tier. Works on any machine with Chrome.

---

## Business Model

### Freemium SaaS

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 | All layers, all effects, WebM export with subtle FORM watermark, 720p max |
| **Pro** | $9 / month | Clean exports (no watermark), up to 4K, MP4 direct export, preset library, unlimited saves |
| **Studio** | $29 / month | Team presets, white-label exports, priority rendering, API access for batch generation |

### Why Freemium Works Here
- Free tier generates real finished work — users see value immediately
- Watermark on video creates passive brand awareness when designers share work
- Preset library is a natural upsell — once you've found a composition you love, you want to save it
- Studio tier targets agencies billing clients — the ROI is clear at $29/month

---

## Go-To-Market

**Phase 1 — Community Launch**
- Launch on Product Hunt as a free browser tool
- Submit to design resource newsletters: Sidebar.io, Dense Discovery, Web Designer Depot
- Post demos on Twitter/X and LinkedIn — generative art content performs strongly on both
- Target Webflow and Framer communities specifically — these designers have the exact need and budget

**Phase 2 — Content Engine**
- "How to create a [style] background for your site" — tutorial content targeting designers
- Template gallery of preset scenes (dark tech, organic, luxury, cyberpunk, soft gradient) to reduce cold-start friction
- YouTube shorts showing 30-second compositions being created

**Phase 3 — Integrations**
- Webflow App — generate and insert directly from Webflow Designer
- Framer Plugin — same workflow in Framer
- Figma Plugin — export as animated GIF or video for mockups

---

## Positioning Statement

**For** web designers and creative directors **who** need unique animated backgrounds for client websites, **FORM** is a browser-based generative art studio **that** produces professional 3D motion textures in minutes with no code and no install, **unlike** Vanta.js (which offers only fixed presets) or TouchDesigner (which requires expert knowledge and a paid license), **because** FORM was built specifically for the web background use case — parametric, seamless, and export-ready from day one.

---

## The One-Line Pitch

**"Vanta.js if you could design the preset yourself."**

---

*FORM · Built by DACP Studio AI · June 2026*
