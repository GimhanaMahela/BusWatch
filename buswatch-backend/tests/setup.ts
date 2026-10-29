// Runs before each test file, before any app module reads the environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.MONGO_URI ??= "mongodb://placeholder"; // replaced by the in-memory server per test
