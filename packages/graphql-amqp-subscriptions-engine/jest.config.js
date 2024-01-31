import globalConf from "../../jest.config.base.js";

const config = {
    ...globalConf,
    displayName: "@neo4j/graphql-amqp-subscriptions-engine",
    roots: [
        "<rootDir>/packages/graphql-amqp-subscriptions-engine/src",
        // "<rootDir>/packages/graphql-amqp-subscriptions-engine/tests",
    ],
    coverageDirectory: "<rootDir>/packages/graphql-amqp-subscriptions-engine/coverage/",
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/packages/graphql-amqp-subscriptions-engine/tsconfig.json",
            },
        ],
    },
};

export default config;
