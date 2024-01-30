import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const globalConfig = {
    globalSetup: path.join(__dirname, "jest.global-setup.js"),
    rootDir: __dirname,
    verbose: true,
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    // Windows builds are incredibly slow, and filesystem operations tend
    // to take that long.
    testTimeout: 120000,
    testMatch: [`./**/*.test.ts`],
    moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node", "md"],
    moduleNameMapper: {
        "@neo4j/graphql/dist/types": "<rootDir>/packages/graphql/src/types",
        "@neo4j/introspector(.*)$": "<rootDir>/packages/introspector/src/$1",
        "@neo4j/graphql-ogm(.*)$": "<rootDir>/packages/ogm/src/$1",
        "@neo4j/graphql-amqp-subscriptions-engine(.*)$": "<rootDir>/packages/graphql-amqp-subscriptions-engine/src/$1",
        "@neo4j/graphql(.*)$": "<rootDir>/packages/graphql/src/$1",
    },
    snapshotFormat: {
        escapeString: true,
        printBasicPrototype: true,
    },
};

export default globalConfig;
