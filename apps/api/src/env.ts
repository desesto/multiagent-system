// Indlæser .env fra apps/api-mappen, FØR resten af appen starter.
// Importeres som allerførste linje i server.ts og seed.ts.
// Node 20.12+ har indbygget .env-understøttelse — ingen dotenv-pakke nødvendig.

try {
  process.loadEnvFile();
} catch {
  // Ingen .env-fil — helt fint i fx CI eller hvis alt sættes i miljøet
}
