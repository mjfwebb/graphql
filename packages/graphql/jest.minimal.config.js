import path from "path";
import graphQLJestConfig from "./jest.config";

export default {
    ...graphQLJestConfig,
    displayName: "@neo4j/graphql",
    globalSetup: path.join(__dirname, "jest.minimal.global-setup.js"),
    globalTeardown: undefined,
};
