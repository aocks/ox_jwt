
/* ************************************************************
 *
 * Simple command line application for nodejs to provide utility
 * commands for ojwt. Run it via something like
 *
 *    node otools.js
 *
 * on the command line.
 *
 * ***********************************************************/

const jwt = require('jwt-simple')
const fs = require('fs')
const { exec } = require('child_process');

const { Command } = require('commander');

const program = new Command();

// Define the main program.
program
  .name('otools')
  .description('Command line utilities for ojwt.')
  .version('0.1.0')


function _do_make_priv_key(options, cmd) {
  exec(`openssl genrsa -out ${options.output}`, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
      console.log(
        `\n---\\/---stderr---\\/---\n${stderr}\n---^^---stderr---^^---\n`);
      // Sometimes genrsa writes to stderr even when there is no error
      // so do not exit or return just because we see data in stderr
    }
    if (stdout) {
      console.log(`stdout: ${stdout}`)
    }
    console.log(`Your new private key should be in: ${options.output}`)
  })
}

function _do_make_pub_key(options, cmd) {
  exec(`openssl rsa -in ${options.input} -pubout -out ${options.output}`,
       (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
      console.log(
        `\n---\\/---stderr---\\/---\n${stderr}\n---^^---stderr---^^---\n`);
      // Sometimes genrsa writes to stderr even when there is no error
      // so do not exit or return just because we see data in stderr
    }
    if (stdout) {
      console.log(`stdout: ${stdout}`)
    }
    console.log(`Your new public key should be in: ${options.output}`)
  })
}

function _do_make_keys(options, cmd) {
  let content = []
  content.push('const public_key = ' + '`' +
               fs.readFileSync(options.pubkey, 'utf8') + '`')
  content.push('const test_pub_key = ' + '`' +
               fs.readFileSync(options.testPubkey, 'utf8') + '`')
  content.push('const test_priv_key = ' + '`' +
               fs.readFileSync(options.testPrivkey, 'utf8') + '`')
  content.push('module.exports = { public_key, test_pub_key, test_priv_key }\n')

  fs.writeFile(options.output, content.join('\n'), err => {
    if (err) {
      console.error(err);
    }
  });
  console.log(`Wrote keys to ${options.output}.`)
}

// Function to run package command to combine everything into final package.
function _do_package(options, cmd) {
  const data = fs.readFileSync(options.input)
  fs.writeFileSync(options.output, data + `

// This is a hack to make the decode_jwt function visible at top level
// and export it so that an nginx njs script can see it.

var decode_jwt = auth_tools["decode_jwt"];
export default {decode_jwt}
`)

}

function _do_encode(options, cmd) {
  key = fs.readFileSync(options.key).toString()
  let payload = {
    message: options.message,
    exp: options.exp,
    host: options.host,
  }
  for(var name in payload) {
    if (! payload[name]) {
      delete payload[name]
    }
  }
  const result = jwt.encode(
    payload, key, 'RS256'
  );
  if (options.output) {
    fs.writeFileSync(options.output, result)
  } else {
    console.log(result)
  }
}


function _do_decode(options, cmd) {
  let my_jwt = fs.readFileSync(options.input).toString()
  let req = {
    args: {
      jwt: my_jwt
    },
    headersIn: {
    },
    headersOut: {
    },
    log: console.log
  }
  let result = auth_tools.decode_jwt(req)
  console.log(`Result of decoding JWT:\n${result}\n`)
}


program.command('package')
  .description(
    `Package up everything into final ojwt.js file.

You run this after creating main.js to create the final ojwt.js package
in a way that is suitable for an nginx jjs script.`)
  .option('-i, --input <path>',
          'input path for main javascript (default main.js).',
          './main.js')
  .option('-o, --output <path>', 'Output path for full package (default ojwt.js)',
          './ojwt.js')
  .action((options, cmd) => {
    _do_package(options, cmd)
  })

program.command('make_priv_key')
  .description(
    `Make a private RSA key.`
  )
  .option('-o, --output <path>',
          'Output path for new private key.',
          './private_key.pem')
  .action((options, cmd) => {
    _do_make_priv_key(options, cmd)
  })

program.command('make_pub_key')
  .description(
    `Make a public RSA key from a private key.`
  )
  .option('-i, --input <path>',
          'Input path for private key (e.g. created by make_priv_key).',
          './private_key.pem')
  .option('-o, --output <path>',
          'Output path for public key.',
          './public_key.pem')
  .action((options, cmd) => {
    _do_make_pub_key(options, cmd)
  })

program.command('make_keys')
  .description(`Make JavaScript file containing keys.
  `)
  .option('-p, --pubkey <path>',
          'Input path for official public key (e.g. created by make_pub_key).',
          './public_key.pem')
  .option('--test-pubkey <path>',
          'Input path for test public key (e.g. created by make_pub_key).',
          './test_pub_key.pem')
  .option('--test-privkey <path>',
          'Input path for test private key (e.g. created by make_priv_key).',
          './test_priv_key.pem')
  .option('-o, --output <path>',
          'Output path for keys file to create.',
          './my_keys.js')
  .action((options, cmd) => {
    _do_make_keys(options, cmd)
  })


program.command('encode')
  .description(
    'Encode data into a a signed JSON Web Token (JWT).')
  .requiredOption('-k, --key <path>',
                  'Path to private key used to sign JWT.')
  .requiredOption('-m, --message <value>',
                  'String message value to sign.')
  .option('-h, --host <value>', 'Optional hostname to add to payload.')
  .option('-e, --exp <value>', 'Expiration time for JWT.')
  .option('-o, --output <path>', 'Output file to write JWT to.')
  .action((options, cmd) => {
    _do_encode(options, cmd)
  })

program.command('decode')
  .description(
    'Decode and veriy a signed JSON Web Token (JWT).')
  .requiredOption('-i, --input <path>',
                  'Path to file containing signed JWT.')
  .action((options, cmd) => {
    _do_decode(options, cmd)
  })


// Parse command line and run the program.
program.parse(process.argv)
