/**
 * alioss
 * @author ydr.me
 * @create 2014-11-27 21:47
 * @update 2017年07月05日14:58:15
 */

'use strict';

var crypto = require('crypto');
var random = require('blear.utils.random');
var typeis = require('blear.utils.typeis');
var path = require('blear.utils.path');
var url = require('blear.utils.url');
var object = require('blear.utils.object');
var access = require('blear.utils.access');
var mime = require('blear.node.mime');


var defaults = {
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    host: 'oss-cn-hangzhou.aliyuncs.com',
    cacheControl: 'public',
    // 1年，单位 秒
    expires: 31536000,
    domain: '',
    // 保存目录
    dirname: '/',
    // 生成资源链接协议
    https: true
};

exports.defaults = defaults;

/**
 * 设置配置
 * @param key
 * @param val
 * @returns {*}
 */
exports.config = function (key, val) {
    return access.getSet({
        get: function () {
            return defaults[key];
        },
        set: function (key, val) {
            defaults[key] = val;
        }
    }, arguments);
};


/**
 *
 * @param configs {Boolean}
 * @param configs.accessKeyId {String} 访问KEY
 * @param configs.accessKeySecret {String} 访问密钥
 * @param configs.bucket {String} 仓库
 * @param configs.host {String} 仓库地址
 * @param configs.cacheControl {String}
 * @param configs.expires {String}
 * @param configs.domain {String}
 * @param configs.dirname {String}
 * @param configs.https {Boolean} 是否
 */

exports.signature = function (configs) {
    configs = object.assign({}, defaults, configs);


};


/**
 * 操作签名
 * @param method {String} 请求方式
 * @param [filename] {String} 文件名
 * @param [headers] {Object} 头信息
 * @returns {{url: *, headers: *}}
 */
exports.signatureOld = function (method, filename, headers) {
    var args = access.args(arguments);

    // signature(method, headers);
    if (args.length === 2 && typeis(args[1]) === 'object') {
        filename = random.guid() + random.string();
        headers = args[1];
    }
    // signature(method)
    else if (args.length === 1) {
        filename = random.guid() + random.string();
    }

    headers = headers || {};
    var auth = 'OSS ' + defaults.accessKeyId + ':';
    var date = headers.date || new Date().toUTCString();
    var contentType = headers['content-type'] || mime.get(path.extname(filename));
    var contentMD5 = headers['content-md5'] || '';
    var params = [
        method.toUpperCase(),
        contentMD5,
        contentType,
        date
    ];
    var object = path.join(defaults.dirname, filename);
    var resource = '/' + path.join(defaults.bucket, object);
    var signature;
    var ossHeaders = {};

    object.each(headers, function (key, val) {
        var lkey = key.toLowerCase().trim();

        if (lkey.indexOf('x-oss-') === 0) {
            ossHeaders[lkey] = ossHeaders[lkey] || [];
            ossHeaders[lkey].push(val.trim());
        }
    });

    Object.keys(ossHeaders).sort().forEach(function (key) {
        params.push(key + ':' + ossHeaders[key].join(','));
    });

    params.push(resource);
    signature = crypto.createHmac('sha1', defaults.accessKeySecret);
    signature = signature.update(params.join('\n'), 'utf-8').digest('base64');

    var protocol = defaults.https ? 'https://' : 'http://';
    var originDomain = defaults.bucket + '.' + defaults.host;
    var customDomain = defaults.domain || originDomain;
    // fix: 中文文件名的 BUG
    object = object.split('/').map(function (item) {
        return encodeURIComponent(item);
    }).join('/');
    var objectURL = path.joinURI(protocol, customDomain, object);
    var requestURL = path.joinURI(protocol, originDomain, object);

    object.extend(headers, {
        'content-type': contentType,
        authorization: auth + signature,
        date: date,
        'cache-control': defaults.cacheControl,
        expires: new Date(Date.now() + defaults.expires * 1000).toUTCString()
    });

    return {
        requestURL: requestURL,
        objectURL: objectURL,
        headers: headers
    };
};


