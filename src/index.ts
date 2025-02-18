import type { Plugin } from '@elizaos/core';
import { initializeCompassActions } from './actions/compass_actions';


const actions = initializeCompassActions();

console.log("\n┌═════════════════════════════════════┐");
console.log("│           COMPASS PLUGIN            │");
console.log("│                N                    │");
console.log("│              ↗ ↑ ↖                  │");
console.log("│            W ← ⊕ → E                │");
console.log("│              ↘ ↓ ↙                  │");
console.log("│                S                    │");
console.log("├─────────────────────────────────────┤");
console.log("│  Initializing Compass Plugin...     │");
console.log("│  Version: 1.0.0                     │");
console.log("└═════════════════════════════════════┘");


export const compassPlugin: Plugin = {
    name: 'compass_plugin',
    actions: actions,
    description:
        'Plugin for communicating with the Compass Labs API, which is a RESTful API for interacting with protocols integrated in the API.',
};

export default compassPlugin;
