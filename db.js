// Tiny facade that picks a database backend based on environment:
//
//   DATABASE_URL set  -> Postgres backend (Render Postgres in production)
//   DATABASE_URL unset -> JSON-file backend (good for local dev and tests)
//
// Both backends expose the same async interface, so server.js doesn't care
// which one it's talking to.

const backend = process.env.DATABASE_URL
  ? require('./db-postgres')
  : require('./db-jsonfile');

module.exports = backend;
