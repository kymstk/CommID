/**************************************************************************
    commid.js -- a communication connection id generator and decoder -- is
    Copyright (C) 2022 kymstk <kymstkpm+oss@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 **************************************************************************/
const License_polycrc = `
polycrc (https://github.com/latysheff/node-polycrc) is
    Copyright (c) 2018 Vladimir Latyshev.
    Licensed under MIT license.
`;
import polycrc from 'polycrc';
import { base32, base64 } from './base.js';

const crclen = 6;
const bitlen = 54;
const lowerBitLen = 27;
const upperBitLen = bitlen - lowerBitLen;

function calcCRC(id){
    const rawidA = new Uint8Array(7);

    const b16 = id.toString(16).padStart(Math.ceil(bitlen / 4), '0');

    for(let i = b16.length, j = 0; i > 0; i -= 2, j++){
        rawidA[j] = parseInt(b16.slice(i - 2, i), 16);
    }

    return polycrc.crc6(rawidA);
}

export function genCommID(){
    const lower = Math.floor(Math.random() * 2 ** lowerBitLen);
    const upper = Math.floor(Math.random() * 2 ** upperBitLen);

    const id = ( BigInt(upper) << BigInt(lowerBitLen) ) + BigInt(lower);

    const crc = calcCRC(id);
    
    const b32 = base32.encode( ( BigInt(crc) << BigInt(bitlen) ) + id);
    const commID = b32.padStart((bitlen + crclen) / 5, '0').replace(/.../g, '$&-').replace(/-$/, '');

    const b64 = base64.encode(id);

    return { id:id, b32: b32, b64: b64, crc:crc, commID: commID };
}

export function decodeCommID(commID){
    const _bitlen = BigInt(bitlen);

    const b32 = commID.replaceAll('-', '');
    const crc_id = base32.decode(b32);
    const id = crc_id & ( 2n ** _bitlen - 1n);
    const crc = crc_id >> _bitlen;

    const crc_check = calcCRC(id);

    if(crc != crc_check){
        throw `Error: CRC check: ${crc}, ${crc_check}, ${id}, ${crc_id}`;
    }
    
    const b64 = base64.encode(id);

    return { id:id, b32: b32, b64: b64, crc:crc, commID: commID };
}