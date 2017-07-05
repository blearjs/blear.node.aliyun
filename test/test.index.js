/**
 * mocha 测试 文件
 * @author ydr.me
 * @create 2016-05-17 12:13
 */


'use strict';

var expect = require('chai-jasmine').expect;
var aliyun = require('../src/index.js');

describe('测试文件', function () {
    it('.aliossSignature', function () {
        var ret = aliyun.aliossSignature({
            accessKeyId: '1',
            accessKeySecret: '2',
            bucket: 'test',
            endPoint: 'oss-cn-shanghai.aliyuncs.com',
            origin: 'https://cdn.mydomain.com',
            dirname: '/path/to/',
            filename: 'abc.js'
        });

        console.log(ret);
    });
});

