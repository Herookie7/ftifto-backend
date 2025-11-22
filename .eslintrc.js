module.exports = {
  env: {
    node: true,
    es2022: true
  },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script'
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/no-unresolved': 'off'
  }
};

