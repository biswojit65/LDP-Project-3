module.exports = {
  testEnvironment: 'node',
  transform: {},
  transformIgnorePatterns: ['node_modules/(?!(sucrase)/)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],
};

