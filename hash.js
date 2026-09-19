const bcrypt = require("bcryptjs");

(async () => {
    const password = "rohit@0909";

    const hash = await bcrypt.hash(password, 10);

    console.log("Password =", password);
    console.log("Hash =", hash);

    console.log(
        "Verify =",
        await bcrypt.compare(password, hash)
    );
})();