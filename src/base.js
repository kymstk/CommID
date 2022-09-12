/*
 * base32
 */
const _base32 = {
    replaceSrc: 'oilsOILS', // 混同しやすい文字
    replaceDst: 'wxyzWXYZ', // toString(32)した文字列中の、↑の文字の置き換え先
    regarded:   '01150115', // decode 字に replaceSrc な文字があった際に置き換える先
}
_base32.replaceSrcRegexp = new RegExp('[' + _base32.replaceSrc + ']', 'g');
_base32.replaceDstRegexp = new RegExp('[' + _base32.replaceDst + ']', 'g');

export function base32_encode(val){
    return val.toString(32).replace(
        _base32.replaceSrcRegexp,
        function(match){
            return _base32.replaceDst[_base32.replaceSrc.indexOf(match)];
        }
    );
}
export function base32_decode(strI){
    const plusminus = strI[0] == '-'? -1:1;
    if(plusminus < 0)
        strI = strI.substring(1);

    let valstr = strI;
    // 入力中の混同しやすい文字を、みなし文字に変換
    valstr = valstr.replace(_base32.replaceSrcRegexp, function(match){
        return _base32.regarded[_base32.replaceSrc.indexOf(match)];
    });
    // parseInt できるように、replaceDst に置き換えた文字を戻す
    valstr = valstr.replace(_base32.replaceDstRegexp, function(match){
        return _base32.replaceSrc[_base32.replaceDst.indexOf(match)];
    });

    // javascript の int の精度は 53bit が限界
    //   → https://qiita.com/uhyo/items/f9abb94bcc0374d7ed23
    // base64 で 10文字＝ 50bitなので、

    if(strI.length < 11){
        // 11文字以下なら Int
        return parseInt(valstr, 32) * plusminus;
    } else if(strI.length == 11 && strI[0] < '8'){
        // 11文字で先頭の文字が 0~7(3bit 以内)なら Int
        return parseInt(valstr, 32) * plusminus;
    } else{
        // それを超えたら BigInt

        // 50bit = 10文字ずつ分解して parseInt して連結
        let retval = 0n;
        let end = valstr.length % 10;
        if( !end )
            end = 10;
        for(let start = 0; valstr.length >= end; start = end, end += 10){
            retval = (retval << 50n) + BigInt(parseInt(valstr.substring(start, end), 32));
        }
        return retval * BigInt(plusminus);
    }
}
/*
function encodeToDisplay(val){
    return encode(val).replace(/.../g, '$&-').replace(/-$/, '');
}
function decodeFromDisplay(str){
    return decode(str.replace(/([^-]{3})-/g, '$1'))
}
*/

export const base32  = {
    encode: base32_encode,
    decode: base32_decode,
};

/*
 * base64
 */
const _base64 = {
    str:'0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz_.',
    table:{}
};
for(let i = 0; i < 64; i++){
    let _8 = i.toString(8).padStart(2, '0');
    _base64.table[_8] = _base64.str[i];
    _base64.table[_base64.str[i]] = _8;
}

export function base64_encode(val){
    let data = val.toString(8);
    let minus = false;
    if(data[0] == '-'){
        minus = true;
        data = data.substring(1);
    }
    if(data.length % 2) data = '0' + data;

    let b64 = '';
    for(let i = data.length; i > 1; i -= 2){
        let c = _base64.table[data.slice(i - 2, i)]
        b64 = c + b64;
    }
    if(minus)
        return('-' + b64);
    else
        return(b64);
}
export function base64_decode(strI){
    const plusminus = strI[0] == '-'? -1:1;
    if(plusminus < 0)
        strI = strI.substring(1);

    let valstr = '';
    for(let i = 0; i < strI.length; i++){
        if(strI[i] in _base64.table){
            valstr += _base64.table[strI[i]];
        }else{
            throw `invalid character: ${strI[i]}, in ${strI} at ${i}`;
        }
    }

    // javascript の int の精度は 53bit が限界
    //   → https://qiita.com/uhyo/items/f9abb94bcc0374d7ed23
    // base64 で 8文字＝ 48bitなので、
    if(strI.length < 9){
        // 8文字以下なら int値に変換
        return(parseInt(valstr, 8) * plusminus);
    }else if(strI.length > 9){
        // 10文字以上なら BigInt値に変換
        return(BigInt('0o' + valstr) * BigInt(plusminus));
    }else{
        // 9文字なら
        if(_base64.str.substring(0,32).includes(strI[0])){
            // 先頭の文字が basestr の前半32文字以内なら int値に変換
            return(parseInt(valstr, 8) * plusminus);
        }
        else{
            // それ以上の場合は BigInt値に変換
            return(BigInt('0o' + valstr) * BigInt(plusminus));
        }
    }
}

export const base64 = {
    encode: base64_encode,
    decode: base64_decode,
};