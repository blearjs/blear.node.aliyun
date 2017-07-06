/**
 * alioss
 * @author ydr.me
 * @create 2014-11-27 21:47
 * @update 2017年07月05日14:58:15
 */

'use strict';

var crypto = require('crypto');
var path = require('blear.node.path');
var random = require('blear.utils.random');
var typeis = require('blear.utils.typeis');
var object = require('blear.utils.object');
var access = require('blear.utils.access');
var url = require('blear.utils.url');
var mime = require('blear.node.mime');

var defaults = {
    // 访问令牌
    accessKeyId: '',
    // 访问密钥
    accessKeySecret: '',
    // 仓库
    bucket: '',
    // 上传地址
    endPoint: 'oss-cn-hangzhou.aliyuncs.com',
    // 访问控制
    cacheControl: 'public',
    // 静态资源有效期 1年，单位 秒
    expires: 31536000,
    // 绑定的域（包含协议、域名和端口）
    origin: '',
    // 保存目录
    dirname: '/',
    method: 'put',
    headers: {}
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
 * alioss 前面
 * @param configs {Boolean}
 * @param configs.accessKeyId {String} 访问KEY
 * @param configs.accessKeySecret {String} 访问密钥
 * @param configs.bucket {String} 仓库
 * @param configs.endPoint {String} 上传地址
 * @param configs.cacheControl {String} 访问控制
 * @param configs.expires {String} 过期时间
 * @param configs.origin {String} 绑定的域（包含协议和域名端口）
 * @param configs.dirname {String} 上传的目录
 * @param configs.filename {String} 上传的文件
 * @param [configs.method="put"] {String} 自定义头信息
 * @param configs.headers {Object} 自定义头信息
 * @returns {{requestURL: String, objectURL: String, requestHeaders: {}}}
 */
exports.aliossSignature = function (configs) {
    configs = object.assign({}, defaults, configs);

    var date = configs.headers.date || new Date().toUTCString();
    var extname = path.extname(configs.filename);
    var contentType = configs.headers['content-type'] || mime.get(extname);
    var contentMD5 = configs.headers['content-md5'] || '';
    var params = [
        configs.method.toUpperCase(),
        contentMD5,
        contentType,
        date
    ];
    var requestObject = path.join(configs.dirname, configs.filename);
    var resource = '/' + path.join(configs.bucket, requestObject);
    var ossHeaders = {};

    object.each(configs.headers, function (key, val) {
        var lkey = key.toLowerCase().trim();

        if (/^x-oss/i.test(lkey)) {
            ossHeaders[lkey] = ossHeaders[lkey] || [];
            ossHeaders[lkey].push(val.trim());
        }
    });
    Object.keys(ossHeaders).sort().forEach(function (key) {
        params.push(key + ':' + ossHeaders[key].join(','));
    });
    params.push(resource);
    var signature = crypto.createHmac('sha1', configs.accessKeySecret);
    signature = signature.update(params.join('\n'), 'utf-8').digest('base64');

    // fix: 中文文件名的 BUG
    requestObject = requestObject.split('/').map(function (item) {
        return encodeURIComponent(item);
    }).join('/');

    var requestOrigin = 'http://' + configs.bucket + '.' + configs.endPoint;
    var aliasOrigin = configs.origin || requestOrigin;
    var requestURL = url.join(requestOrigin, requestObject);
    var objectURL = url.join(aliasOrigin, requestObject);
    var requestHeaders = {};

    object.assign(requestHeaders, {
        'content-type': contentType,
        authorization: 'OSS ' + configs.accessKeyId + ':' + signature,
        date: date,
        'cache-control': configs.cacheControl,
        expires: new Date(Date.now() + configs.expires * 1000).toUTCString()
    });

    return {
        requestURL: requestURL,
        objectURL: objectURL,
        requestHeaders: requestHeaders
    };
};



