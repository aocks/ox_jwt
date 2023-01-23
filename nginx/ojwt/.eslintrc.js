
// .eslintrc.js example
module.exports = {
  "plugins": ["jest"],  
  "env": {
    "es2021": true,
    "jest": true,
    "node": true // required for things like require(...) to be OK
  },
  "extends": "eslint:recommended",
  "parserOptions": {
      "ecmaVersion": "latest",
      "sourceType": "module"
  },
}
