import path from "path";
import { fileURLToPath } from "url";
import globalConfig from "../../jest.config.base.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    ...globalConfig,
    displayName: "@neo4j/graphql",
    globalSetup: path.join(__dirname, "jest.global-setup.js"),
    setupFilesAfterEnv: ["jest-extended/all"],
    roots: ["<rootDir>/packages/graphql/src/", "<rootDir>/packages/graphql/tests/"],
    coverageDirectory: "<rootDir>/packages/graphql/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql/tsconfig.json",
            },
        ],
    },
    // moduleFileExtensions: ["js", "json", "ts"],
    // testEnvironment: "node",
    // "testRegex": ".\\.spec.ts$",
    // transform: {
    //     "^.+\\.(t|j)s$": "ts-jest",
    // },
    // moduleDirectories: ["<rootDir>/../", "node_modules"],
};

export default config;
