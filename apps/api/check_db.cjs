const { execSync } = require('child_process')
const poolUrl = 'postgresql://postgres.ofidxgoxqdbzkvagnavu:CareerHub2026!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'

try {
  const result = execSync('npx prisma db execute --stdin', {
    env: { ...process.env, DATABASE_URL: poolUrl, DIRECT_URL: poolUrl },
    input: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_logs');",
    timeout: 30000,
    encoding: 'utf8'
  })
  console.log('Result:', result)
} catch (e) {
  console.log('Error:', e.message)
  if (e.stderr) console.log('Stderr:', e.stderr)
  if (e.stdout) console.log('Stdout:', e.stdout)
}
