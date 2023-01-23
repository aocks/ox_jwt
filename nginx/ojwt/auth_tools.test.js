
// Simple test file using the jest framework to test auth.js.


const jwt = require('jwt-simple')
const my_keys = require('./my_keys.js')
const fs = require('fs')
const auth_tools = require('./auth_tools.js')

// Simple test to make sure we can encode and decode a JWT
test('encode and verify', () => {
  let encoded = jwt.encode(
    {     // encode a JWT
      examplePayload: 'someValue'  // with an example payload
    },
    my_keys.test_priv_key,  // with our testing private key (create w/ otools.js)
    'RS256'  // using RSA
  )
  expect(        
    jwt.decode(encoded, my_keys.test_pub_key)
  ).toHaveProperty(
    'examplePayload', 'someValue'
  )
})

// SImple test to verify that using the wrong key causes decoding failure
test('encode and not verify', () => {
  expect.assertions(1)
  try {
    let decoded = jwt.decode(
      jwt.encode({anotherExample: 'value'}, my_keys.test_priv_key, 'RS256'),
      my_keys.public_key  // using wrong key to cause a failure
    )
    console.log(`Should have gotten verfication error not decoded = ${decoded}`)
  } catch (error) {
    expect(error).toHaveProperty('message', 'Signature verification failed')
  }
})

// Test that decoding the JWT in ./prod_test_jwt.txt with auth_tools.decode_jwt
// works. You should make sure that ./prod_test_jwt.txt is created using
// the **PRODUCTION** **PRIVATE** key. This will verify that things work
// correclty in production.  You can do that using
//
//   make prod_test_jwt.txt
//
// or see that makefile target for details on how you can do it manually
// using otools.js.
test('decode with auth_tools', () => {
  let r = {
    // Make sure to read the production test JWT so that it matches
    // the production public key.
    args: {jwt: fs.readFileSync(
      './prod_test_jwt.txt').toString().trim()},
    headersIn: {Cookie: null},
    headersOut: {Cookie: null},
    warn: console.log,
    log: console.log
  }
  let decoded_result = auth_tools.decode_jwt(r)
  console.log(`decoded_result is ${decoded_result}`)
  let result = JSON.parse(decoded_result)
  console.log(`result is ${result}`)
  expect(result).toHaveProperty(
    'message', 'test key'
  )
})

