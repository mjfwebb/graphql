import path from "path";
import graphQLJestConfig from "./jest.config";

const config = {
    ...graphQLJestConfig,
    displayName: "@neo4j/graphql",
    globalSetup: path.join(__dirname, "jest.minimal.global-setup.js"),
    globalTeardown: undefined,
};

export default config;
