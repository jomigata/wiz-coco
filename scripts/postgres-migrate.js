/**
 * Apply dispatch_recipients migration via running Postgres container.
 * Requires: docker compose -f docker-compose.postgres.yml up -d
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const docker =
  process.platform === 'win32'
    ? '"C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"'
    : 'docker';
const container = 'wizcoco-postgres-1';
const sqlPath = path.join(__dirname, '..', 'backend', 'db', 'migrations', '001_dispatch_recipients.sql');

if (!fs.existsSync(sqlPath)) {
  console.error('Missing migration:', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');
try {
  execSync(`${docker} exec -i ${container} psql -U wizcoco -d wizcoco_dispatch`, {
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  console.log('Migration applied.');
} catch (e) {
  console.error('Migration failed. Is container running? Try: npm run postgres:up');
  process.exit(1);
}
