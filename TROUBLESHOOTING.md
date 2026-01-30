# Troubleshooting Guide

## Issue 1: Keys Being Hijacked on Regular Keyboard

### Problem
When mapping keys like "a" or "5" from the Temu keyboard, those same keys on your regular Mac keyboard would also trigger the shortcuts. For example, pressing "a" on your regular keyboard would trigger `cmd+c` instead of typing "a".

### Root Cause
The initial Karabiner rules were mapping keys globally across ALL keyboards, not just the Temu SIDE-KEYBOARD device.

### Solution
Added **device-specific conditions** to Karabiner rules so they only apply to the Temu keyboard:

**Device Information:**
- Vendor ID: `2070`
- Product ID: `9332`
- Device Name: `SIDE-KEYBOARD (SDINNOVATION)`

**Implementation:**
In `server.js`, we added a `conditions` block to each Karabiner manipulator:

```javascript
conditions: [{
    type: 'device_if',
    identifiers: [{
        vendor_id: 2070,
        product_id: 9332
    }]
}]
```

This ensures that mappings ONLY trigger when keys are pressed on the Temu SIDE-KEYBOARD, leaving your regular keyboard untouched.

---

## Issue 2: Number Keys Not Working

### Problem
After fixing the device condition, the "a" key mapping worked, but number keys (like "5") still typed their original values instead of triggering the mapped shortcuts.

### Root Cause
The Temu keyboard's number buttons send **keypad key codes** (e.g., `keypad_5`) rather than regular number key codes (e.g., `5`).

The browser's `KeyboardEvent.key` property returns just "5" for both keypad and regular number keys, causing a mismatch between what the web interface detected and what Karabiner actually received.

### Solution
Updated the key detection logic in `public/index.html` to use `KeyboardEvent.code` instead of just `KeyboardEvent.key`:

**Before:**
```javascript
let key = e.key.toLowerCase(); // Returns "5" for both regular and keypad keys
```

**After:**
```javascript
if (e.code && e.code.startsWith('Numpad')) {
    // Convert "Numpad5" to "keypad_5"
    key = 'keypad_' + e.code.substring(6).toLowerCase();
} else if (e.code && e.code.startsWith('Digit')) {
    // Regular number keys - just use the number
    key = e.code.substring(5).toLowerCase();
}
```

This properly detects:
- `keypad_0` through `keypad_9` for numpad keys
- `keypad_enter`, `keypad_plus`, etc. for other keypad keys
- Regular digit keys as `0-9`

---

## How to Use

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open the web interface:**
   ```
   http://localhost:3000
   ```

3. **Detect buttons:**
   - Click the detection box
   - Press a button on your Temu keyboard
   - It will now correctly show `keypad_5` instead of just `5`

4. **Map to shortcuts:**
   - Enter a Mac shortcut (e.g., `cmd+c`, `cmd+v`)
   - Click "Add"

5. **Save:**
   - Click "Save All"
   - Rules are automatically applied to Karabiner-Elements

6. **Enable in Karabiner (first time only):**
   - Open Karabiner-Elements app
   - Go to Complex Modifications tab
   - Both Temu rules should already be there and enabled

---

## Key Technical Details

### Karabiner Rule Structure
Each mapping generates a rule like this:

```json
{
    "description": "Temu: Button: keypad_5",
    "manipulators": [{
        "type": "basic",
        "from": {
            "key_code": "keypad_5",
            "modifiers": {
                "optional": ["any"]
            }
        },
        "to": [{
            "key_code": "v",
            "modifiers": ["command"]
        }],
        "conditions": [{
            "type": "device_if",
            "identifiers": [{
                "vendor_id": 2070,
                "product_id": 9332
            }]
        }]
    }]
}
```

**Key components:**
- `from.key_code`: The keypad key (e.g., `keypad_5`)
- `from.modifiers.optional`: Allows the key to be pressed with or without modifiers
- `to`: The output shortcut (e.g., `cmd+v`)
- `conditions.device_if`: Only applies to Temu SIDE-KEYBOARD

### Finding Device IDs
To find device information for any USB keyboard:

```bash
ioreg -p IOUSB -l -w 0 | grep -B 5 -A 15 "YOUR-DEVICE-NAME"
```

Look for:
- `idVendor` (decimal number)
- `idProduct` (decimal number)

---

## Common Issues

### "Button still types original key"
**Cause:** Karabiner might need a restart or the rule isn't enabled.

**Fix:**
```bash
killall karabiner_grabber karabiner_observer
open -a "Karabiner-Elements"
```

### "Regular keyboard affected"
**Cause:** Device condition not applied or vendor/product ID is wrong.

**Fix:** Check that the Karabiner rules have the correct `device_if` condition with vendor_id `2070` and product_id `9332`.

### "Detection shows wrong key"
**Cause:** Browser detection vs Karabiner mismatch (especially for special keys).

**Fix:**
1. Test the mapping
2. If it doesn't work, try with `keypad_` prefix for number keys
3. Or check Karabiner documentation for correct key codes

---

## Files Modified

1. **server.js**
   - Added device condition to Karabiner rule generation
   - Added `optional: ["any"]` modifiers for better key matching

2. **public/index.html**
   - Updated key detection to use `KeyboardEvent.code`
   - Properly distinguishes keypad vs regular number keys

3. **keyboard-config.json**
   - Stores your button mappings
   - Updated to use `keypad_*` key codes for number buttons

---

## Testing Checklist

- [ ] Regular keyboard unaffected (typing "a" still types "a")
- [ ] Temu keyboard "a" button triggers mapped shortcut
- [ ] Temu keyboard number buttons work with `keypad_*` codes
- [ ] Mappings persist after server restart
- [ ] Karabiner rules auto-update when clicking "Save All"

---

Built with Claude Code 🎹
