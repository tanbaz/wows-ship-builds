const express = require('express');
const wowsData = require('../services/wowsData');

const router = express.Router();

// In-memory cache for WoWS API icon data (fetched once, refreshed every 24h)
let iconCache = { skills: null, upgrades: null, skillGrids: null, ts: 0 };
const ICON_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchIconMaps() {
    const now = Date.now();
    if (iconCache.skills && iconCache.upgrades && iconCache.skillGrids && (now - iconCache.ts) < ICON_CACHE_TTL) {
        return iconCache;
    }
    const API_KEY = 'bf9056d37ea85f3cb737b7e12300aab8';
    const BASE = 'https://api.worldofwarships.eu/wows/encyclopedia';

    // Fetch skill icons + full grid layout per class
    const skillRes = await fetch(`${BASE}/crewskills/?application_id=${API_KEY}`);
    const skillData = await skillRes.json();
    const skills = {};
    const skillGrids = {}; // { Battleship: [[{name,icon,tier,col},...], ...], ... }

    if (skillData.status === 'ok' && skillData.data) {
        for (const [id, sk] of Object.entries(skillData.data)) {
            if (sk.name && sk.icon) {
                if (!skills[sk.name]) skills[sk.name] = sk.icon;
            }
            // Build per-class grid layout
            for (const [cls, info] of Object.entries(sk.customization || {})) {
                if (!skillGrids[cls]) skillGrids[cls] = [];
                skillGrids[cls].push({
                    name: sk.name,
                    icon: sk.icon,
                    tier: info.tier,
                    col: info.column
                });
            }
        }
        // Sort each class grid by tier then column
        for (const cls of Object.keys(skillGrids)) {
            skillGrids[cls].sort((a, b) => a.tier - b.tier || a.col - b.col);
        }
    }

    // Fetch upgrade/modernization icons (paginated, up to 200)
    const upgrades = {};
    for (let page = 1; page <= 3; page++) {
        const ugRes = await fetch(`${BASE}/consumables/?application_id=${API_KEY}&type=Modernization&limit=100&page_no=${page}`);
        const ugData = await ugRes.json();
        if (ugData.status !== 'ok' || !ugData.data) break;
        for (const [id, ug] of Object.entries(ugData.data)) {
            if (ug.name && ug.image) {
                upgrades[ug.name] = ug.image;
            }
        }
        if (Object.keys(ugData.data).length < 100) break;
    }

    iconCache = { skills, upgrades, skillGrids, ts: now };
    console.log(`Icon cache refreshed: ${Object.keys(skills).length} skills, ${Object.keys(upgrades).length} upgrades, ${Object.keys(skillGrids).length} class grids`);
    return iconCache;
}

// GET /api/ships/icons - Skill & upgrade icon URL maps + skill grid layouts
router.get('/icons', async (req, res) => {
    try {
        const { skills, upgrades, skillGrids } = await fetchIconMaps();
        res.json({ skills, upgrades, skillGrids });
    } catch (err) {
        console.error('Icons fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch icon data' });
    }
});

// GET /api/ships - List all ships
router.get('/', (req, res) => {
    try {
        const ships = wowsData.getShips(req.query);
        res.json(ships);
    } catch (err) {
        console.error('Ships list error:', err);
        res.status(500).json({ error: 'Failed to fetch ships data' });
    }
});

// GET /api/ships/nations - Get all nations
router.get('/nations', (req, res) => {
    try {
        const nations = wowsData.getNations();
        res.json(nations);
    } catch (err) {
        console.error('Nations error:', err);
        res.status(500).json({ error: 'Failed to fetch nations' });
    }
});

// GET /api/ships/skills/all - Captain skills
router.get('/skills/all', (req, res) => {
    try {
        const skills = wowsData.getSkills(req.query.ship_type);
        res.json(skills);
    } catch (err) {
        console.error('Skills error:', err);
        res.status(500).json({ error: 'Failed to fetch captain skills' });
    }
});

// GET /api/ships/upgrades/all - Upgrades
router.get('/upgrades/all', (req, res) => {
    try {
        const upgrades = wowsData.getUpgrades();
        res.json(upgrades);
    } catch (err) {
        console.error('Upgrades error:', err);
        res.status(500).json({ error: 'Failed to fetch upgrades' });
    }
});

// GET /api/ships/:id/upgrades - Upgrades available for a ship, grouped by slot
router.get('/:id/upgrades', (req, res) => {
    try {
        const data = wowsData.getUpgradesForShip(req.params.id);
        res.json(data);
    } catch (err) {
        console.error('Ship upgrades error:', err);
        res.status(500).json({ error: 'Failed to fetch ship upgrades' });
    }
});

// GET /api/ships/:id - Single ship
router.get('/:id', (req, res) => {
    try {
        const ship = wowsData.getShip(req.params.id);
        if (!ship) return res.status(404).json({ error: 'Ship not found' });
        res.json(ship);
    } catch (err) {
        console.error('Ship data error:', err);
        res.status(500).json({ error: 'Failed to fetch ship data' });
    }
});

module.exports = router;
