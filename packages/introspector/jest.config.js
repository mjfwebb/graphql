import globalConf from "../../jest.config.base.js";

const config = {
    ...globalConf,
    displayName: "@neo4j/introspector",
    roots: ["<rootDir>/packages/introspector/src/", "<rootDir>/packages/introspector/tests/"],
    coverageDirectory: "<rootDir>/packages/introspector/coverage/",
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/introspector/tsconfig.json",
            },
            {
                useESM: true,
            },
        ],
    },
};

export default config;
