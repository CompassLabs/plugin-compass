import type { Plugin } from '@elizaos/core';
import { initializeCompassActions } from './actions/compass_actions';
import chalk from 'chalk';
import Table from 'cli-table3';


const actions = initializeCompassActions();

console.log('\n' + chalk.cyan('┌────────────────────────────────────────┐'));
console.log(
    chalk.cyan('│') +
        chalk.yellow.bold('          COMPASS API PLUGIN             ') +
        chalk.cyan(' │')
);
console.log(chalk.cyan('├────────────────────────────────────────┤'));
console.log(
    chalk.cyan('│') + chalk.white('  Initializing Compass API Plugin ...    ') + chalk.cyan('│')
);
console.log(
    chalk.cyan('│') + chalk.white('  Version: 1.0.0                        ') + chalk.cyan('│')
);
console.log(chalk.cyan('└────────────────────────────────────────┘'));

const actionTable = new Table({
    head: [
        chalk.cyan('Action'),
        chalk.cyan('H'),
        chalk.cyan('V'),
        chalk.cyan('E'),
        chalk.cyan('Similes'),
    ],
    style: {
        head: [],
        border: ['cyan'],
    },
});

// Format and add action information
actions.forEach((action) => {
    actionTable.push([
        chalk.white(action.name),
        typeof action.handler === 'function' ? chalk.green('✓') : chalk.red('✗'),
        typeof action.validate === 'function' ? chalk.green('✓') : chalk.red('✗'),
        action.examples?.length > 0 ? chalk.green('✓') : chalk.red('✗'),
        chalk.gray(action.similes?.join(', ') || 'none'),
    ]);
});

console.log('\n' + actionTable.toString());

export const compassPlugin: Plugin = {
    name: 'compass_plugin',
    actions: actions,
    description:
        'Plugin for communicating with the Compass Labs API, which is a RESTful API for interacting with protocols integrated in the API.',
};

export default compassPlugin;
