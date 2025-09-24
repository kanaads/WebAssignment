## Web Assessment
### Overview


This project implements the provided Figma design for the Interview Test Web Page, adds microphone access per the web.dev tutorial, and renders the Chrome Music Lab Spectrogram directly inside the visualization panel via an iframe.

I initially attempted to vendor and build the open-source spectrogram locally, but the upstream repo relies on a legacy gulp 3 / node-sass 3 / jade toolchain that’s incompatible with modern environments (Node 22, Python 3). The build expects Python 2.7 for node-gyp and also encounters Windows binary issues with imagemin tools (gifsicle/jpegtran/optipng EBUSY). Given these constraints, embedding the official spectrogram page was the most reliable approach while keeping the UI faithful to Figma.


## Requirements

- Node.js (LTS recommended)

- npm or pnpm

- Modern browser (Chrome/Edge/Safari) running over HTTPS or localhost (required for mic)

## Setup
### install dependencies
npm install

### start Vite dev server
npm run dev

## Run on Web
### production build
npm run build

### preview the production build locally
npm run preview


Open the printed URL. Click Start Recording, grant microphone permission, then the Chrome Music Lab Spectrogram appears inside the panel (embedded via iframe).

## Implementation Details
- Start/Stop Controls

- Two-state flow matching Figma (Idle → Recording).

- Status line updates when recording begins.

- Microphone Access (web.dev pattern)

- Code path: public/worklets/processor.js (AudioWorklet) + usage in src/App.tsx.


Spectrogram

The visualization panel embeds the official Chrome Music Lab Spectrogram via an iframe so users can start mic capture within it.

Source: https://musiclab.chromeexperiments.com/Spectrogram/ (permissions allowed via allow="microphone").

(Attempted vendor build noted in Architecture below.)

## Architecture

WebAssignment/

├─ public/

│  ├─ worklets/processor.js           # AudioWorklet (pass-through)

│  └─ spectrogram/                    # (optional) local CML build output if used

├─ src/

│  ├─ App.tsx                         # main page and Start/Stop logic

│  ├─ main.tsx

│  ├─ styles.css                      # Figma-faithful styles (green frame = container edge)

│  └─ vite-env.d.ts

├─ vendor/                            # attempted integration of open-source spectrogram

│  └─ chrome-music-lab/

│     └─ spectrogram/                 # upstream gulp project (not served directly)

│        ├─ src/                      # jade/sass/js (legacy toolchain)

│        ├─ gulpfile.js

│        └─ build/                    # if built, copy to /public/spectrogram/

├─ index.html                         # loads Metamorphous + Gloria Hallelujah fonts

└─ tsconfig.json

## Assumptions

Fonts: Metamorphous (heading) and Gloria Hallelujah (all other text) loaded via Google Fonts in index.html.

The spectrogram is rendered via iframe (no “[Visualization Goes Here]” overlay).

If a local spectrogram build is desired, copy build artifacts into public/spectrogram/ and change the iframe src to /spectrogram/index.html.

## Future Improvements

- Replace iframe with a native spectrogram for tighter control and auto-start.

- Add unit/UI tests for Start/Stop and permission flows.

- Extract design tokens (colors/typography/spacing) into a theme for easier theming/dark mode.

- Enhance accessibility (focus management, ARIA live regions for status).


## Citation 
-https://musiclab.chromeexperiments.com/Spectrogram/

-https://github.com/googlecreativelab/chrome-music-lab/tree/master/spectrogram

-Generative AI (ChatGPT) was used to help draft documentation and suggest code structure/styling patterns. All code was reviewed, edited, and tested by me.
