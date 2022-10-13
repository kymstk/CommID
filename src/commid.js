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

const isNumber = function(value) {
    return ( (typeof value === 'number') && (isFinite(value)) ) || typeof value === 'bigint';
};

function calcCRC(id, bits){
    const digit = Math.ceil(bits / 8);
    const rawidA = new Uint8Array(digit);

    const b16 = id.toString(16).padStart(digit * 2, '0');

    for(let i = b16.length, j = 0; i > 0; i -= 2, j++){
        rawidA[j] = parseInt(b16.slice(i - 2, i), 16);
    }

    return polycrc.crc6(rawidA);
}

export function genCommID(id, extend){
    if( !isNumber(id) ){
        const lower = Math.floor(Math.random() * 2 ** lowerBitLen);
        const upper = Math.floor(Math.random() * 2 ** upperBitLen);

        id = ( BigInt(upper) << BigInt(lowerBitLen) ) + BigInt(lower);
    }else{
        id = BigInt(id);
        if(id.toString(2).length > bitlen)
            id = id & ( 1n << BigInt(bitlen) ) - 1n;
    }
    
    let ext_id = id;
    let extbitlength = 0;
    if( isNumber(extend) ){
        ext_id = ( BigInt(extend) << BigInt(bitlen) ) + ext_id
        extbitlength = extend.toString(2).length;
    }

    const crc = calcCRC(ext_id, bitlen + extbitlength);
    
    const b32 = base32.encode( ( ext_id << BigInt(crclen) ) + BigInt(crc) );
    const commID = b32.padStart(Math.ceil( (extbitlength + bitlen + crclen) / 5 ), '0').replace(/..../g, '$&-').replace(/-$/, '');

    const b64 = base64.encode(id);

    return { id:id, b32:b32, b64:b64, crc:crc, commID:commID, extend:extend };
}

export function decodeCommID(commID){
    const _bitlen = BigInt(bitlen);

    const b32 = commID.replaceAll('-', '');
    const ext_id_crc = base32.decode(b32);
    const crc = ext_id_crc & BigInt((1 << crclen) - 1);
    const ext_id = ext_id_crc >> BigInt(crclen);
    const id =  ext_id & ( (1n << _bitlen) - 1n);
    const extend = ext_id >> _bitlen;

    const crc_check = calcCRC(ext_id, bitlen + extend.toString(2).length);

    if(crc != crc_check){
        throw `Error: CRC check: ${crc}, ${crc_check}, ${ext_id}, ${ext_id_crc}`;
    }
    
    const b64 = base64.encode(id);

    return { id:id, b32:b32, b64:b64, crc:crc, commID:commID, extend:extend };
}