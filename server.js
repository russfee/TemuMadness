const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const CONFIG_FILE = './keyboard-config.json';
const KARABINER_CONFIG = path.join(os.homedir(), '.config/karabiner/karabiner.json');

// Load our config
app.get('/config', (req, res) => {
    if (fs.existsSync(CONFIG_FILE)) {
        res.json(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')));
    } else {
        res.json({ mappings: [] });
    }
});

// Preview generated Karabiner rules without writing
app.get('/config/preview', (req, res) => {
    try {
        const current = fs.existsSync(CONFIG_FILE)
            ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
            : { mappings: [] };
        const mappings = current.mappings || [];
        const karabinerRules = buildKarabinerRules(mappings);
        res.json({ success: true, rules: karabinerRules });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Save config AND apply to Karabiner immediately
app.post('/config', (req, res) => {
    try {
        // Save our config
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(req.body, null, 2));

        // Check if we have mappings to apply
        const mappings = req.body.mappings || [];
        if (mappings.length === 0) {
            return res.json({ success: true, rulesApplied: 0 });
        }

        // Generate and apply Karabiner rules
        const karabinerRules = buildKarabinerRules(mappings);

        // Read existing Karabiner config
        let karabinerConfig = { profiles: [{ name: 'Default profile', selected: true, complex_modifications: { rules: [] } }] };
        if (fs.existsSync(KARABINER_CONFIG)) {
            karabinerConfig = JSON.parse(fs.readFileSync(KARABINER_CONFIG, 'utf-8'));
        }

        // Find selected profile and update rules
        const profile = karabinerConfig.profiles.find(p => p.selected) || karabinerConfig.profiles[0];
        if (!profile.complex_modifications) {
            profile.complex_modifications = { rules: [] };
        }

        // Remove old Temu rules, add new ones
        profile.complex_modifications.rules = profile.complex_modifications.rules.filter(
            r => !r.description?.startsWith('Temu')
        );
        profile.complex_modifications.rules.push(...karabinerRules.map(r => ({
            ...r,
            description: 'Temu: ' + r.description
        })));

        // Write back to Karabiner
        fs.writeFileSync(KARABINER_CONFIG, JSON.stringify(karabinerConfig, null, 4));

        res.json({ success: true, rulesApplied: karabinerRules.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Parse "ctrl+a" for "from" field (uses mandatory modifiers)
function parseFromKey(combo) {
    const parts = combo.toLowerCase().split('+').map(s => s.trim());
    const modifiers = [];
    let keyCode = '';

    const modifierMap = {
        'ctrl': 'control', 'control': 'control',
        'cmd': 'command', 'command': 'command',
        'alt': 'option', 'option': 'option',
        'shift': 'shift'
    };

    parts.forEach(part => {
        if (modifierMap[part]) {
            modifiers.push(modifierMap[part]);
        } else {
            keyCode = part;
        }
    });

    const result = { key_code: keyCode };
    if (modifiers.length > 0) {
        result.modifiers = { mandatory: modifiers };
    } else {
        // When no modifiers specified, allow any to be pressed
        result.modifiers = { optional: ['any'] };
    }
    return result;
}

// Parse "cmd+c" for "to" field (uses simple modifiers array)
function parseToKey(combo) {
    const parts = combo.toLowerCase().split('+').map(s => s.trim());
    const modifiers = [];
    let keyCode = '';

    const modifierMap = {
        'ctrl': 'control', 'control': 'control',
        'cmd': 'command', 'command': 'command',
        'alt': 'option', 'option': 'option',
        'shift': 'shift'
    };

    parts.forEach(part => {
        if (modifierMap[part]) {
            modifiers.push(modifierMap[part]);
        } else {
            keyCode = part;
        }
    });

    const result = { key_code: keyCode };
    if (modifiers.length > 0) {
        result.modifiers = modifiers;  // Simple array for "to"
    }
    return result;
}

function parseBundleIdentifiers(value) {
    if (!value || typeof value !== 'string') return [];
    return value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(id => `^${escapeRegex(id)}$`);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAppSpecificByFromKey(mappings) {
    const byFromKey = {};
    mappings.forEach(m => {
        const bundleIdentifiers = parseBundleIdentifiers(m.appBundle);
        if (bundleIdentifiers.length === 0) return;
        if (!byFromKey[m.fromKey]) {
            byFromKey[m.fromKey] = [];
        }
        const current = new Set(byFromKey[m.fromKey]);
        bundleIdentifiers.forEach(id => current.add(id));
        byFromKey[m.fromKey] = Array.from(current);
    });
    return byFromKey;
}

function buildKarabinerRules(mappings) {
    const validMappings = mappings.filter(m => m.fromKey && m.toShortcut);
    const appSpecificByFromKey = buildAppSpecificByFromKey(validMappings);

    return validMappings.map(m => {
        const conditions = [{
            type: 'device_if',
            identifiers: [{
                vendor_id: 2070,
                product_id: 9332
            }]
        }];

        const bundleIdentifiers = parseBundleIdentifiers(m.appBundle);
        if (bundleIdentifiers.length > 0) {
            conditions.push({
                type: 'frontmost_application_if',
                bundle_identifiers: bundleIdentifiers
            });
        } else {
            const excludedBundles = appSpecificByFromKey[m.fromKey] || [];
            if (excludedBundles.length > 0) {
                conditions.push({
                    type: 'frontmost_application_unless',
                    bundle_identifiers: excludedBundles
                });
            }
        }

        return {
            description: m.name || 'Temu Button',
            manipulators: [{
                type: 'basic',
                from: parseFromKey(m.fromKey),
                to: [parseToKey(m.toShortcut)],
                conditions
            }]
        };
    });
}

// SSE endpoint for key detection using ioreg
let detectProcess = null;

app.get('/detect/start', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write('data: {"status": "listening"}\n\n');

    // Use Karabiner's event viewer CLI if available, otherwise guide user
    const cliPath = '/Library/Application Support/org.pqrs/Karabiner-Elements/bin/karabiner_cli';

    if (fs.existsSync(cliPath)) {
        // Note: karabiner_cli doesn't have event capture, so we'll guide the user
        res.write('data: {"status": "ready", "message": "Press a button on your Temu keyboard..."}\n\n');
    }

    req.on('close', () => {
        if (detectProcess) {
            detectProcess.kill();
            detectProcess = null;
        }
    });
});

app.get('/status', (req, res) => {
    const karabinerExists = fs.existsSync(KARABINER_CONFIG);
    res.json({
        karabinerInstalled: karabinerExists,
        configFile: CONFIG_FILE
    });
});

// Temporarily disable Temu rules for detection
app.post('/detection-mode', (req, res) => {
    try {
        if (!fs.existsSync(KARABINER_CONFIG)) {
            return res.json({ success: true });
        }

        const karabinerConfig = JSON.parse(fs.readFileSync(KARABINER_CONFIG, 'utf-8'));
        const profile = karabinerConfig.profiles.find(p => p.selected) || karabinerConfig.profiles[0];

        if (req.body.enabled === false) {
            // Disable: remove Temu rules temporarily
            if (profile.complex_modifications?.rules) {
                profile._temu_backup = profile.complex_modifications.rules.filter(
                    r => r.description?.startsWith('Temu')
                );
                profile.complex_modifications.rules = profile.complex_modifications.rules.filter(
                    r => !r.description?.startsWith('Temu')
                );
            }
        } else {
            // Re-enable: restore Temu rules
            if (profile._temu_backup) {
                profile.complex_modifications.rules.push(...profile._temu_backup);
                delete profile._temu_backup;
            }
        }

        fs.writeFileSync(KARABINER_CONFIG, JSON.stringify(karabinerConfig, null, 4));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`\n🎹 Temu Keyboard Mapper`);
    console.log(`   http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
    console.error('Server failed to start:', err);
});
