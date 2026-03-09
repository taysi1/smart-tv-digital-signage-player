# Smart TV Digital Signage Player

## Overview

This project is a modular Smart TV digital signage player built for Tizen-based TV environments.
It plays remote image/video playlists, supports MQTT-based remote control, uses local cache for offline fallback, and isolates platform-specific behavior behind adapter interfaces.

The application is written in TypeScript, developed with a Node.js-based workflow, and packaged as a Tizen Web Application deployment artifact.

## Scope

The implementation focuses on the following core case requirements:

- remote playlist fetch from an HTTP endpoint
- image/video playback in sequential loop
- MQTT-based remote command handling
- command result publishing over MQTT
- offline-first playlist cache
- version/hash-based playlist update detection
- Tizen-compatible deployment flow
- modular and maintainable architecture

## Key Capabilities

### Playlist Playback

- image playback with configurable duration
- video playback support
- sequential media loop
- skip/continue behavior when media fails to load

### MQTT Remote Control

Supported commands:

- `reload_playlist`
- `restart_player`
- `play`
- `pause`
- `set_volume`
- `screenshot`

Command flow:

1. subscribe to device-specific command topic
2. parse incoming JSON payload
3. validate command structure
4. dispatch to handler
5. publish `command_result` to event topic

### Offline-First Behavior

- playlist is fetched from network
- playlist is cached locally
- cached playlist is used when network fetch fails
- `version` / `hash` comparison prevents unnecessary reloads

### Logging

- structured log levels: `info`, `warn`, `error`
- transport-based logging design
- console output for development/debugging
- mock remote transport for future remote log forwarding

### Lifecycle Handling

- visibility change handling
- stop playback when app becomes hidden
- resume playback when app becomes visible
- soft restart flow for player restart command

## Architecture

The application is structured into the following layers:

- **core/domain**: shared business models such as playlist, media item, and command definitions
- **services**: orchestration logic such as playback, playlist loading, lifecycle coordination, and command handling
- **infrastructure**: config, logger, transports, and shared runtime utilities
- **player-engine**: media rendering and playback loop control
- **mqtt-layer**: MQTT client integration, parser, and topic mapping
- **network-layer**: remote playlist fetch logic
- **storage-layer**: cache and persistence abstractions
- **platform-adapter**: browser/Tizen environment isolation

This keeps business logic separated from platform-specific details and makes the code easier to extend and test.

## Why Node.js Was Used

Node.js is used in the development/build workflow rather than as a runtime on the TV.

It is used for:

- package management with `npm`
- TypeScript project tooling
- dependency management
- bundling/build workflow
- ecosystem integration such as the MQTT client library

The TV application itself runs as a Tizen web application, but the project structure and build pipeline are Node.js-based.

## Why a Single `app.js` Bundle Was Used

The codebase is modular during development. A single bundled `app.js` is produced only for deployment.

Reasons:

- simpler deployment into the Tizen project structure
- reduced module resolution/runtime issues in emulator environments
- easier replacement of the latest build artifact during iteration
- cleaner Tizen packaging flow

In short, the source remains modular, while the deployment output is bundled.

## Project Structure

```text
src/
├─ core/
│  └─ domain/
├─ services/
├─ infrastructure/
├─ player-engine/
├─ mqtt-layer/
├─ network-layer/
├─ storage-layer/
├─ platform-adapter/
└─ index.ts
```

## Requirements

### Development Requirements

- Node.js
- npm
- VS Code or equivalent editor

### Tizen Requirements

Install the following through **Tizen Studio Package Manager**:

- **TV Extensions-<version>**
- **Samsung Certificate Extension**
- **TV Emulator**

Additional requirement:

- **Google Chrome** (used for Tizen debug flow / Chrome DevTools console)

## Install and Build

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

This produces the deployment bundle:

```text
dist/app.js
```

## Configuration

Application configuration is defined in:

```text
src/infrastructure/config.ts
```

Typical configuration includes:

- MQTT broker URL
- optional MQTT credentials
- playlist endpoint URL

Example:

```ts
playlistEndpointUrl: "http://192.168.1.103:3000/playlist.json"
```

## Remote Playlist Contract

The player expects the remote endpoint to return JSON in this format:

```json
{
  "version": "1.0.0",
  "hash": "playlist-hash-v100",
  "playlist": [
    {
      "type": "image",
      "url": "http://192.168.1.103:3000/assets/image1.jpg",
      "duration": 10
    },
    {
      "type": "video",
      "url": "http://192.168.1.103:3000/assets/video1.mp4"
    }
  ]
}
```

Notes:

- `playlist` is the external API contract
- `duration` is interpreted in **seconds** for image items
- internally, the response is mapped into the player domain model
- `version` and `hash` are optional but recommended for cache/update logic

## MQTT Configuration

### Topic Format

- command topic: `players/{deviceId}/commands`
- event topic: `players/{deviceId}/events`

Examples:

- browser: `players/browser-device/commands`
- Tizen: `players/tizen-device/commands`

### Example Commands

#### Pause

```json
{
  "command": "pause",
  "correlationId": "cmd-pause-001",
  "timestamp": 1772881000000
}
```

#### Play

```json
{
  "command": "play",
  "correlationId": "cmd-play-001",
  "timestamp": 1772881001000
}
```

#### Reload Playlist

```json
{
  "command": "reload_playlist",
  "correlationId": "cmd-reload-001",
  "timestamp": 1772881002000
}
```

#### Screenshot

```json
{
  "command": "screenshot",
  "correlationId": "cmd-shot-001",
  "timestamp": 1772881003000
}
```

#### Set Volume

```json
{
  "command": "set_volume",
  "correlationId": "cmd-volume-001",
  "timestamp": 1772881004000,
  "payload": {
    "value": 15
  }
}
```

#### Restart Player

```json
{
  "command": "restart_player",
  "correlationId": "cmd-restart-001",
  "timestamp": 1772881005000
}
```

### Example Event Result

```json
{
  "type": "command_result",
  "command": "screenshot",
  "correlationId": "cmd-shot-001",
  "status": "success",
  "payload": {
    "format": "image/png",
    "base64": "MOCK_TIZEN_SCREENSHOT_DATA"
  }
}
```

## MQTT Delivery Strategy

### Current QoS Choice

The current implementation uses the MQTT client defaults, which means **QoS 0** is used unless explicitly overridden.

### Why QoS 0 Was Chosen

For this case implementation, QoS 0 keeps the integration simple and lightweight while remaining sufficient for the current command flow because:

- command handling is idempotent through `correlationId`
- duplicate command protection is implemented
- reconnect behavior is already present in the client
- this keeps emulator/browser interoperability simpler during development

### Trade-off

QoS 0 does not guarantee delivery.
For a production deployment, **QoS 1** could be considered for critical control commands depending on operational requirements.

## Reconnect Strategy

The current MQTT client uses a simple reconnect configuration through the MQTT library.

Current behavior:

- reconnect is enabled
- reconnect period is fixed
- connection timeout is configured

This is enough for the case implementation, but a production version would likely benefit from:

- exponential backoff
- retry caps
- connection health metrics
- alerting/heartbeat support

## Offline Cache Behavior

The application uses local storage to cache playlist data.

Behavior:

1. fetch playlist from network
2. compare with cached playlist using `hash` or `version`
3. if changed, save new playlist to cache
4. if unchanged, skip unnecessary reload
5. if network fails, fallback to cached playlist

Observed cases handled:

- network success + empty cache -> cache save + playback
- network success + unchanged playlist -> reload skipped
- network failure + valid cache -> playback from cache
- network failure + no cache -> playback failure screen

## Browser Test Flow

Run the app with a local static web server.

Required files at project root:

- `index.html`
- `playlist.json` (only if using local test mode)
- `assets/` (only if using local test mode)
- `dist/app.js`

## Remote Test Playlist Server (Optional)

During development, a simple local Node.js HTTP server can be used to expose:

- `/playlist.json`
- `/assets/*`

This makes it possible to simulate a real remote endpoint while testing in browser or Tizen emulator.

Important note:

- browser can often use `localhost`
- Tizen emulator typically requires the **host machine IP address**, not `localhost`

## Tizen Studio Setup and Emulator Test

### Recommended Development Flow

The project is developed in VS Code and then deployed into a Tizen Web Application project.

Recommended workflow:

1. develop and build in VS Code
2. copy the latest `dist/app.js` into the Tizen project as `js/app.js`
3. copy the latest `playlist.json` and `assets/` when local packaging mode is used
4. run/debug/package in Tizen Studio

## Tizen Project Structure

```text
TizenProject/
├─ config.xml
├─ index.html
├─ playlist.json
├─ assets/
│  ├─ image1.jpg
│  ├─ image2.jpg
│  └─ video1.mp4
├─ css/
│  └─ style.css
└─ js/
   └─ app.js
```

### Important File Mapping

After building in VS Code:

- `dist/app.js` -> `js/app.js`
- `playlist.json` -> project root
- `assets/*` -> `assets/*`

The Tizen `index.html` must load:

```html
<script src="js/app.js"></script>
```

## Importing the Project into Tizen Studio

1. Open Tizen Studio
2. Create or import a TV Web Application project
3. Confirm `config.xml` is in the root
4. Confirm `index.html` is in the root
5. Confirm `js/app.js` is the latest build output

## Certificate Profile and Signing

Tizen applications must be signed before emulator installation, packaging, or device deployment.

### Certificate Type

A **Samsung certificate profile** should be created through Tizen Studio Certificate Manager.

A profile contains:

- an **author certificate**
- one or more **distributor certificates**

### Certificate Creation Flow

1. Open **Tools > Certificate Manager**
2. Create a new certificate profile
3. Select **Samsung** as the certificate type/profile
4. Select the TV-related device profile where required
5. Create a new author certificate
6. Create/select the distributor certificate
7. Save the profile
8. Make sure the profile is active for the project

### Important Notes

- if the **Samsung** certificate option is missing, install/enable **Samsung Certificate Extension**
- the certificate profile must be active before run, debug, or package steps
- the same profile is required for `.wgt` generation

## Emulator Setup

### Emulator Used

The project was tested on a **TV emulator instance launched from Tizen Studio Emulator Manager**.

### Emulator Launch Flow

1. Open **Tools > Emulator Manager**
2. Start a TV emulator instance
3. If needed, create a new TV emulator from the available templates
4. Wait until it fully boots
5. In Tizen Studio, right click the project
6. Select **Run As > Tizen Web Application**

## Debugging and Logs

### Normal Run

Use:

- `Run As > Tizen Web Application`

### Debug Mode

Use:

- `Debug As > Tizen Web Application`

If Chrome cannot be found, set the Chrome executable path in Tizen Studio preferences.

### Where Logs Are Viewed

In the tested workflow, logs are viewed in the **Chrome DevTools console** window opened by Tizen debug mode.

This was used to inspect:

- application startup logs
- MQTT connection/subscription logs
- incoming command logs
- playback lifecycle logs
- runtime errors

Typical logs used for verification:

- application started
- MQTT connected
- subscribed command topic
- incoming command messages
- playback lifecycle logs

## Remote Content Access Notes

When remote playlist/media URLs are used, make sure:

- the remote endpoint is reachable from the emulator
- the local server is running if a local remote server is used
- playlist/media URLs are valid
- the host machine IP is used where required
- `config.xml` access policy allows the needed network access

## Packaging as `.wgt`

The final Tizen Web Application package is generated as a `.wgt` file.

### Packaging Flow

1. Build the latest application bundle in VS Code:

```bash
npm run build
```

2. Copy the latest files into the Tizen project:

- `dist/app.js` -> `js/app.js`
- latest `playlist.json` if applicable
- latest `assets/*` if applicable

3. Confirm the active certificate profile is selected
4. Build/package the project in Tizen Studio
5. Generate the `.wgt` package

### Before Packaging Checklist

- `config.xml` is valid
- `index.html` is in the project root
- `js/app.js` is the latest bundle
- remote/local playlist configuration is correct
- media files are present when local packaging mode is used
- certificate profile is active

## Logging Design

The logging design uses transports.

Current transports:

- `ConsoleTransport`
- `MockRemoteTransport`

This means logs are structured in a way that can later be forwarded to a real remote logging endpoint.

Current levels:

- `info`
- `warn`
- `error`

## Current Mocked / Simplified Areas

The following parts are intentionally simplified for the case implementation:

- screenshot returns a **mock base64 payload**
- volume control is adapter-level mock behavior
- remote logging uses **mock transport** instead of a real log collector
- reconnect uses a simple fixed strategy rather than a fully tuned production policy

## Known Limitations

- browser and Tizen runtime behavior may differ
- Tizen emulator codec support may be stricter than browser support
- a media URL can be valid while the actual video codec/container is still unsupported on emulator
- remote endpoint/network issues can still block playback if no cache exists
- first cold start without network and without cache results in playback failure by design

## Production Improvement Opportunities

- real screenshot capture per platform
- real volume API integration on target platform
- QoS policy tuning per command type
- exponential reconnect/backoff strategy
- health checks / heartbeat / monitoring
- richer asset pre-download and asset integrity validation
- automated tests for command parser and command handler logic
- improved cold-start offline UX

## Summary

This project delivers a modular Smart TV signage player with:

- TypeScript-based layered architecture
- Node.js-based build workflow
- Tizen-compatible deployment flow
- remote playlist fetch
- MQTT remote control
- offline-first playlist cache
- transport-based logging
- browser and Tizen emulator validation

It is designed as a solid technical foundation that can be extended toward a more production-ready signage platform.
