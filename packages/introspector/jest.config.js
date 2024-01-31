import globalConf from "../../jest.config.base.js";

const config = {
    ...globalConf,
    displayName: "@neo4j/introspector",
    roots: ["<rootDir>/packages/introspector/src/", "<rootDir>/packages/introspector/tests/"],
    coverageDirectory: "<rootDir>/packages/introspector/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/introspector/tsconfig.json",
            },
        ],
    },
};

export default config;
