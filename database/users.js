const db = require("../db");

async function getAllUsers() {

    const result = await db.execute(`
        SELECT *
        FROM users
        ORDER BY phone
    `);

    return result.rows;

}

async function getUser(phone) {

    const result = await db.execute({
        sql: `
            SELECT *
            FROM users
            WHERE phone = ?
            LIMIT 1
        `,
        args: [phone]
    });

    return result.rows[0] || null;

}

async function saveUser(user) {

    await db.execute({

        sql: `
        INSERT INTO users (

            phone,
            name,
            color,
            music,
            relay1,
            relay2,
            vip,
            enabled,
            created,
            lastWash,
            washCount,
            totalSpent

        )

        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)

        ON CONFLICT(phone)

        DO UPDATE SET

            name=excluded.name,
            color=excluded.color,
            music=excluded.music,
            relay1=excluded.relay1,
            relay2=excluded.relay2,
            vip=excluded.vip,
            enabled=excluded.enabled,
            created=excluded.created,
            lastWash=excluded.lastWash,
            washCount=excluded.washCount,
            totalSpent=excluded.totalSpent
        `,

        args: [

            user.phone,
            user.name || "",
            user.color || "off",
            user.music || "",
            user.relay1 ? 1 : 0,
            user.relay2 ? 1 : 0,
            user.vip ? 1 : 0,
            user.enabled === false ? 0 : 1,
            user.created || new Date().toISOString(),
            user.lastWash || null,
            user.washCount || 0,
            user.totalSpent || 0

        ]

    });

}

async function deleteUser(phone){

    await db.execute({

        sql:"DELETE FROM users WHERE phone=?",

        args:[phone]

    });

}

module.exports={

    getAllUsers,
    getUser,
    saveUser,
    deleteUser

};
