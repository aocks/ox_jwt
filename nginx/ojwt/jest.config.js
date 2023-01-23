
/**
 * @fileoverview This is a configuration file for jest.
 *
 * The main purpose is to set the configuration for jest and also
 * to do some global setup and verification using the `verify_pre_reqs`
 * function.
 * 
 */

const fs = require('fs')

// Verify files required to run tests exist.
function verify_pre_reqs() {
  const jwt_path = "./prod_test_jwt.txt"
  let requiredFiles = {}
  requiredFiles[jwt_path] = `JWT created using actual private key.

This file should be created using the production private key so that
tests can verify decoding with the production public key works.
You can use otools.js to create a private key and encode a JWT via:

  node otools.js make_priv_key -o ./private_key.pem
  node otools.js encode -k ./private_key.pem -m "jwt via otools.js" -o ${jwt_path}

`
  for(var key in requiredFiles) {
    if (! fs.existsSync(key) ) {
      let content = []
      content.push(`
****************************************
*
*  Cannot run tests since missing file:
*  ${key}
*
*  Description of necessary file:`)
      let msg = requiredFiles[key].split('\n')
      for (let i=0; i<msg.length; i++) {
        content.push('* ' + msg[i])
      }
      content.push(`*
****************************************\n\n`)
      throw new Error(content.join("\n"))
    }
  }
}


module.exports = () => {
  verify_pre_reqs()
  return {
    verbose: true,
  };
};

