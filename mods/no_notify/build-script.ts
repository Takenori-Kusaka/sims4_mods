/**
 * Build Script for .ts4script packaging
 *
 * Packages Python source files into a .ts4script (ZIP) file
 * and deploys to the Sims 4 Mods folder.
 *
 * Usage: npx ts-node build-script.ts [--deploy]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { fileURLToPath } from 'url';

const __filename_esm = fileURLToPath(import.meta.url);
const __dirname_esm = path.dirname(__filename_esm);

const MOD_NAME = 'KokorNoNotify';
const PACKAGE_NAME = 'kokor_no_notify';
const SCRIPTS_DIR = path.join(__dirname_esm, 'src', 'scripts', PACKAGE_NAME);
const DIST_DIR = path.join(__dirname_esm, 'dist');
const MODS_DIR = 'C:\\Users\\kokor\\Documents\\Electronic Arts\\The Sims 4\\Mods';

const isDeploy = process.argv.includes('--deploy');

function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function buildTs4Script(): void {
    console.log(`\n=== Building ${MOD_NAME}.ts4script ===\n`);

    // Verify source files exist
    if (!fs.existsSync(SCRIPTS_DIR)) {
        console.error(`ERROR: Scripts directory not found: ${SCRIPTS_DIR}`);
        process.exit(1);
    }

    const pyFiles = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.py'));
    if (pyFiles.length === 0) {
        console.error('ERROR: No .py files found in scripts directory');
        process.exit(1);
    }

    console.log(`Found ${pyFiles.length} Python files:`);
    pyFiles.forEach(f => console.log(`  - ${f}`));

    ensureDir(DIST_DIR);

    // Create ZIP using PowerShell (available on Windows)
    const zipPath = path.join(DIST_DIR, `${MOD_NAME}.zip`);
    const ts4scriptPath = path.join(DIST_DIR, `${MOD_NAME}.ts4script`);

    // Remove existing files
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    if (fs.existsSync(ts4scriptPath)) fs.unlinkSync(ts4scriptPath);

    // Create ZIP with PowerShell's Compress-Archive
    const scriptsParentDir = path.join(__dirname_esm, 'src', 'scripts');

    const psCommand = [
        `$ErrorActionPreference = 'Stop'`,
        `Compress-Archive -Path '${path.join(scriptsParentDir, PACKAGE_NAME)}' -DestinationPath '${zipPath}' -Force`,
    ].join('; ');

    try {
        child_process.execSync(
            `powershell.exe -ExecutionPolicy Bypass -Command "${psCommand}"`,
            { stdio: 'inherit' }
        );
    } catch (e) {
        console.error('ERROR: Failed to create ZIP archive');
        process.exit(1);
    }

    // Rename .zip to .ts4script
    fs.renameSync(zipPath, ts4scriptPath);
    console.log(`\nCreated: ${ts4scriptPath}`);

    // Verify the archive
    const stat = fs.statSync(ts4scriptPath);
    console.log(`Size: ${stat.size} bytes`);

    // Deploy if requested
    if (isDeploy) {
        const deployPath = path.join(MODS_DIR, `${MOD_NAME}.ts4script`);
        try {
            fs.copyFileSync(ts4scriptPath, deployPath);
            console.log(`\nDeployed to: ${deployPath}`);
        } catch (e) {
            console.error(`ERROR: Failed to deploy to ${deployPath}`);
            console.error('Make sure the game is not running.');
            process.exit(1);
        }
    }

    console.log('\n=== Build complete ===\n');
}

buildTs4Script();
