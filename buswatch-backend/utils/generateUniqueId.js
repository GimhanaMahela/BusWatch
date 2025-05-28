const { v4: uuidv4 } = require("uuid"); // Install uuid: npm install uuid

module.exports = () => {
  return uuidv4(); // Generates a unique UUID
};
