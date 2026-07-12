const fs = require("fs");
const path = require("path");

const { saveUser } = require("./database/users");

const USERS_FILE = path.join(__dirname, "data", "users.json");

async function main() {

    const users = JSON.parse(
        fs.readFileSync(USERS_FILE, "utf8")
    );

    let count = 0;

    for (const phone in users) {

        const user = users[phone];

        await saveUser(user);

        console.log("Imported:", phone);

        count++;

    }

    console.log();
    console.log("=========================");
    console.log("Imported users:", count);
    console.log("=========================");

}

main().catch(console.error);
