function defaults(passed, defaultz) {
    if (passed === undefined) { passed = {}; }
    Object.keys(defaultz).forEach(
        (key) => {
            if (passed[key] === undefined) {
                passed[key] = defaultz[key];
            } else if (typeof(defaultz[key]) === "object") {
                passed[key] = defaults(passed[key], defaultz[key]);
            }
        }
    );
    return passed
}