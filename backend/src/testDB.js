const pool = require("./database.js");

async function testDatabase() {
    try {
        const res = await pool.query("SELECT NOW();");
        console.log("✅ Database Connected. Current Time:", res.rows[0].now);
    } catch (error) {
        console.error("❌ Database Connection Error:", error);
    } finally {
        pool.end();
    }
}

testDatabase();