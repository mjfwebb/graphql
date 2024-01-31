import setTZ from "set-tz";

const TZ = "Etc/UTC";

function globalSetup() {
    process.env.NODE_ENV = "test";

    setTZ(TZ);
}

export default globalSetup;
