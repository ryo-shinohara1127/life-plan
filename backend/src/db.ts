import pg from 'pg'

const { Pool, types } = pg

// date型(OID 1082)をJSのDateに変換させず、"YYYY-MM-DD"文字列のまま返す。
// Dateに変換するとタイムゾーンの影響で日付がずれるため。
types.setTypeParser(1082, (val) => val)

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
