# WoWS Builds Migration Project
## Overview
This project is a migration of a static World of Warships captain-builds website into a structured, maintainable system with a backend, database, and admin tooling.
The original source material is a large static document/site containing:
- build screenshots exported from WoWs ShipBuilder
- notes and recommendations for each build
- ship and line-wide build groupings by class
- change-log style updates over time
The goal of this project is to preserve that information, convert it into structured data, and make it easier to search, manage, update, and publish.
## What This Project Contains
### 1. Static source content
The existing static site includes:
- `index.html` with all build sections and notes
- `assets/images/` containing build screenshots
- frontend assets for navigation and search
This is the original reference dataset.
### 2. Data extraction and migration scripts
Scripts in `backend/scripts/` are used to:
- parse the static HTML into structured build entries
- associate entries with images
- manually or semi-manually record captain skill selections from build screenshots
- prepare import-ready JSON for database insertion
This is the bridge between the old static content and the new backend-driven system.
### 3. Backend API and database
The backend is being built to support:
- storing structured build data
- listing and filtering builds
- viewing individual builds
- tracking updates and changelog entries
- supporting admin/editor workflows
The database is intended to become the authoritative source of build information.
### 4. Admin tooling
An admin interface exists to support:
- creating and editing builds
- managing published vs draft states
- maintaining data more easily than editing raw HTML
## Project Goal
The main objective is to transform a static build archive into a maintainable platform where build data is:
- structured
- searchable
- editable
- versionable
- easier to expand over time
## Current Workflow
The migration currently works in stages:
1. Extract build entries from the static site.
2. Identify build grouping, ship class, image, and notes.
3. Decode each build screenshot into ordered captain skill selections.
4. Convert build data into structured JSON.
5. Import those builds into the database.
6. Surface them through the API and admin/frontend tools.
## Data Model Intent
Each build entry is expected to contain, at minimum:
- ship or ship-line name
- ship class
- nation
- tier
- build title/variant
- captain skill order
- upgrades/modules where available
- descriptive notes
- publication metadata
## Scope of the Dataset
The current extracted dataset contains 229 build entries:
- Destroyer: 66
- Cruiser: 83
- Battleship: 51
- AirCarrier: 19
- Submarine: 10
Note: these are build entries, not necessarily one unique ship each. Some entries apply to an entire line or multiple ships.
## Important Context
This project mixes:
- legacy static content
- intermediate migration data
- new backend/API code
- manual transcription work from build screenshots
Because of that, not every extracted record is fully normalized yet. Some parts of the migration are still in progress.
## Intended End State
The intended end state is a WoWS build platform where:
- the static document is no longer the only source of truth
- builds can be updated through structured tools
- data is easier to search and maintain
- future updates are faster and less error-prone
## Notes for Contributors
When working on this project, keep in mind:
- the static site is the source reference
- build screenshots often need manual interpretation
- some entries represent lines or grouped ships, not single ships
- migration scripts and generated JSON are intermediate assets, not always final truth
- consistency of captain skill naming and ordering is critical
## Summary
This repository is a migration and productization effort for World of Warships build data: taking a community-maintained static build reference and turning it into a structured, maintainable, backend-supported system.
