#!/usr/bin/env node

require("./dist/backend/main.js")
    .main()
    .catch((err) => {
        console.error("Fatal Error:\n", err);
    });
