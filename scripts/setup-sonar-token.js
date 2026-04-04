#!/usr/bin/env node

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, '..', 'package.json');

const SONAR_HOST = process.env.SONAR_HOST || 'http://localhost:9000';
const SONAR_ADMIN = process.env.SONAR_ADMIN || 'admin';
const SONAR_PASSWORD = process.env.SONAR_PASSWORD || 'admin';

async function deleteOldToken() {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${SONAR_ADMIN}:${SONAR_PASSWORD}`).toString('base64');
    const url = new URL(`${SONAR_HOST}/api/user_tokens/revoke?name=pressure-game-token`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    };

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, () => resolve());
    req.on('error', () => resolve());
    req.end();
  });
}

async function generateSonarToken() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${SONAR_ADMIN}:${SONAR_PASSWORD}`).toString('base64');

    const url = new URL(`${SONAR_HOST}/api/user_tokens/generate`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            resolve(parsed.token);
          } else {
            reject(new Error(`SonarQube token generation failed: ${res.statusCode} ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse SonarQube response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write('name=pressure-game-token&type=GLOBAL_ANALYSIS_TOKEN');
    req.end();
  });
}

async function updatePackageJson(token) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const oldScript = packageJson.scripts['sonar:analyze'];

  // Replace the token in sonar:analyze script
  const newScript = oldScript.replace(
    /-Dsonar\.token=[^ ]+/,
    `-Dsonar.token=${token}`
  );

  packageJson.scripts['sonar:analyze'] = newScript;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log('✓ Updated package.json with new SonarQube token');
}

async function main() {
  try {
    console.log('Cleaning up old token...');
    await deleteOldToken();

    console.log('Generating SonarQube token...');
    const token = await generateSonarToken();
    console.log(`✓ Generated token: ${token.substring(0, 20)}...`);

    await updatePackageJson(token);
    console.log('✓ SonarQube ready');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up SonarQube token:', error.message);
    process.exit(1);
  }
}

main();
