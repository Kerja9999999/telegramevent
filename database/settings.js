const db = require("../db");

async function getSetting(key) {

    const result = await db.execute({
        sql: "SELECT value FROM settings WHERE key = ?",
        args: [key]
    });

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0].value;

}

async function setSetting(key, value) {

    await db.execute({
        sql: `
            INSERT INTO settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key)
            DO UPDATE SET value = excluded.value
        `,
        args: [key, value]
    });

}

module.exports = {
    getSetting,
    setSetting
};
