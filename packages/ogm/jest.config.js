import globalConf from "../../jest.config.base.js";

const config = {
    ...globalConf,
    displayName: "@neo4j/graphql-ogm",
    roots: ["<rootDir>/packages/ogm/src", "<rootDir>/packages/ogm/tests"],
    coverageDirectory: "<rootDir>/packages/ogm/coverage/",
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/ogm/tsconfig.json",
            },
            {
                useESM: true,
            },
        ],
    },
};

export default config;
