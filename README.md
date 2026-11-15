# Earth Information Jukebox

NASA Space Apps 2026 challenge: *The Earth Information Jukebox*.
Pick an Earth Information Center frame, hear it as music generated live in the browser.

## Run it

```bash
python app.py                 # use python3 if `python` is not on your PATH
python app.py --port 9000     # different port
python app.py --no-browser    # do not auto-open a tab
```

It serves `app/` on http://127.0.0.1:8765 and opens it in your browser. Ctrl+C stops it.
Python standard library only, no build step. Needs a modern browser (Web Audio API).

## What it does

- Two record crates: 10 curated Earth Portraits and all 23 entries from NASA's Earth Information Center Daily Visualizations catalog (`app/frames/`).
- Fire Pulse opens the Earth Right Now crate, followed by regularly updated weather, ocean, ice, atmosphere, hazard, vegetation, satellite, and solar visualizations.
- Local stills are representative snapshots for reliable offline sonification; each record links to its NASA SVS page for the latest visualization and authoritative description.
- A playhead sweeps west to east. Each column of a 64x32 grid becomes one eighth note step.
- Only cells that differ from the frame's average play, so quiet regions stay quiet.
- Drag across the image to scrub. Keyboard: Space, arrows (Shift = 8 columns), Home/End, N/P, Up/Down for volume.
- Each track has its own character (instruments, density, drums, drone, tempo, reverb), set in `STYLES` in `app/app.js` or alongside daily records in `app/daily-records.js`.
- Each track explains the Earth science shown, offers a listening cue, and links to its authoritative NASA SVS source.
- The collapsible Studio Mixer sits directly below playback controls and can override key, scale, instrument palette, note density, tempo, tone brightness, and reverb. Mixer settings persist across records until "Reset to NASA Mix" is pressed.
- An in-mixer reference explains the mood of each scale, the sound and pixel-color mapping of each instrument, and the difference between record defaults and the full ensemble.
- Additional synthesized voices include an orchestral ensemble, solo violin, viola, cello, double bass, acoustic guitar with plucked or strummed articulation, and electric guitar with plucked or sustained articulation.
- Bridge Scanner Ping adds an original retro-futurist voice with high FM sonar chirps, deterministic interval echoes, and stereo movement; it does not use soundtrack samples.
- "Download this loop as WAV" renders the same sound offline.
- "Use your own image" runs any local image through the same rules.

## Data and artistic direction

Image analysis determines note position, loudness, tone brightness, texture, key, and base tempo. A documented preset for each NASA track limits instruments and adjusts density, drums, drone, tempo, and reverb. These presets are the artistic layer that makes the generated result easier to follow and more pleasant to hear.

This project is an accessible artistic interpretation of rendered EIC imagery, not a scientific measurement instrument. Labels, coastlines, legends, and other graphic elements can affect the sound along with the visualized data. The source link shown for each track leads to NASA's authoritative scientific description.

## Mapping

| Picture | Sound |
|---|---|
| Vertical position | Pitch, quantized to a scale (north high) |
| Horizontal position | Time and stereo pan |
| Cell hue | Instrument: warm = saw pad, green = pluck, blue = FM bell, purple/gray = soft choir |
| Salience (distance from frame average, plus edges) | Loudness; below the 60th percentile = silent |
| Saturation | Filter brightness |
| Smooth vs busy texture | Long vs short notes, hi-hat on busy columns |
| Frame's average hue | Key and mode (Dorian, Mixolydian, Lydian, Aeolian) |
| Frame's average detail | Tempo, 64 to 118 BPM |
| Column brightness | Drone level and filter |

## Accessibility

- Every control is a real button or input with a visible focus ring.
- Each track has a written description. The page also describes the column under the playhead (live region, can be turned off).
- Full keyboard control of the playhead.

## Files

- `app/index.html`, `app/style.css`, `app/app.js` – the interface, analysis, and synthesizer.
- `app/daily-records.js` – metadata and sound direction for the 23 Earth Right Now records.
- `app/frames/*.jpg` – NASA SVS stills (source pages are linked by SVS ID in `TRACKS` in `app.js`).

## Credits

Imagery: NASA Scientific Visualization Studio. NASA does not endorse this project.
