# SwiftStack (SS) — Interactive 3D Web Platform & Dynamic Full-Stack CMS

Founded & Owned by **Muhammad Sarib Randhawa** (*Founder & CEO*).

An immersive, dark-mode spatial 3D digital agency platform, interactive Bitmoji-style 3D Avatar stage with speech synthesis & lip-sync choreography, AI portrait biometric scanner studio, client portal, and hidden full-CRUD dynamic CMS engine.

---

## Core Architecture & Features

### 1. Spatial 3D & Scroll-Driven Visual Engine
- **Dark-Mode Spatial Canvas (`slate-950`)**: Real-time Three.js / React Three Fiber background stage (`ScrollScene3D`) featuring scroll-driven lighting transitions across glowing cyan (`#06b6d4`), vibrant electric blue (`#3b82f6`), and luminous indigo (`#6366f1`).
- **Real-Time Scroll Morphing**: Mesh distortion, orbital gyro-rings, camera depth parallax, and floating geometric polyhedra smoothly transition across scroll zones.

### 2. Interactive 3D Avatar Stage & Speech Engine
- **3D Twin of Muhammad Sarib Randhawa**: Sculpted 3D Bitmoji-style rig featuring modern textured short dark hair, groomed full dark beard & mustache coupled to an articulated lower jaw, warm subsurface skin tone, dual eye catchlights, natural blinking eyelids, signature white collared polo shirt with dual red & royal-blue trims, dark tailored trousers, and smart chronograph watch.
- **Floating Circular Voice Trigger**: Clicking the glowing circular microphone button above the 3D Avatar triggers studio harmonic feedback, spoken greeting playback, live word-by-word highlighted transcript HUD, 60fps phoneme-to-viseme lip synchronization, and hand-wave gesture choreography.

### 3. 3D Avatar Customizer Studio & AI Photo Scanner
- **Manual Studio**: 6 granular tabs (*Hair*, *Beard*, *Skin*, *Eyes*, *Outfit*, *Accessories*) synced live across both the Studio viewport and Hero stage, plus high-resolution `.PNG` snapshot export.
- **AI Photo Scanner**: Drag-and-drop portrait dropzone with animated sweeping laser matrix and real HTML5 `<canvas>` biometric colorimetry analysis that extracts skin chroma, hair volume/color, facial hair density, eyewear contrast, and shirt palette to automatically configure the 3D Avatar.

### 4. Dynamic SwiftStack Services & Featured Projects Showcase
- **7 Flagship SwiftStack Offerings**: Interactive 3D perspective tilt cards with cursor spotlight glow, category filtering, deliverable checklists, pricing, and one-click quote pre-selection.
- **Featured Projects Gallery**: Widescreen showcase with interactive case study lightbox previews (including `@SoulSyllables`, 3D spatial product configurators, full-stack cloud orchestrators, and signed mobile APK suites).

### 5. Unified Authentication & Silent Owner Elevation
- **Clean Public UI**: Zero visible Admin/CMS links anywhere on the public frontend.
- **Unified Sign-In Modal**: Supports **Continue with Google** OAuth flow, Client Account creation, and Credential Sign-In.
- **Client Portal**: Clients inspect live quote statuses, official price quotes, and architect responses from Muhammad Sarib Randhawa.
- **Silent Owner Elevation (`admin` / `admin`)**: Authenticating as owner dynamically unlocks the full **SwiftStack Owner Customization Studio** with persistent SQLite CRUD over Hero & Bio, Services, Projects, Theme & 3D FX, Global 3D Avatar Defaults, and Client Leads & Accounts.

---

## Running Locally

```bash
npm install
npm run dev
```

Production build & server:
```bash
npm run build
npm start
```
