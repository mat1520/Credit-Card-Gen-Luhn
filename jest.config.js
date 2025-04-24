module.exports = {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js'],
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    testMatch: ['**/src/tests/**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/src/tests/'
    ],
    setupFilesAfterEnv: ['@testing-library/jest-dom']
}; 