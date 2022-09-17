# CommID
CommID is a ID generator (and decoder), for communication connection.
The ID is 54bit length random number.
Generator returns raw ID number(BigInt) and it's base64 and base32 (with CRC) encoded string.
Decoder decodes base32 encoded string, check CRC and returns raw ID and base64 encoded string.

## usage
```
import { genCommID, decodeCommID } from 'commid';

// generate CommID
let id = genCommID();
/*
{
  id: 17236558284383144n,
  b32: 'jv9zhrqr1wt8',
  b64: 'zc8yvRCCP',
  crc: 39,
  commID: 'jv9-zhr-qr1-wt8'
}
*/

// decode base32 encoded CommID
let decoded = decodeCommID(id.commID);
/*
{
  id: 17236558284383144n,
  b32: 'jv9zhrqr1wt8',
  b64: 'zc8yvRCCP',
  crc: 39n,
  commID: 'jv9-zhr-qr1-wt8'
}
*/
```