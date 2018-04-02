var assert = require('assert');
var folder = require('../addon/folder.js');

describe('folder', function() {
    describe('#computeFolders()', function() {
        it('should parse anchor', function() {
            parseAnchor = true;
            parseGetVariables = false;
            parseDomain = false;
            var folders = folder.computeFolders('http://github.com/PerfectSlayer/scrollupfolder#anchor');
            var result = [
                'http://github.com/',
                'http://github.com/PerfectSlayer/',
                'http://github.com/PerfectSlayer/scrollupfolder',
                'http://github.com/PerfectSlayer/scrollupfolder#anchor'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should not parse anchor', function() {
            parseAnchor = false;
            parseGetVariables = false;
            parseDomain = false;
            var folders = folder.computeFolders('http://github.com/PerfectSlayer/scrollupfolder#anchor');
            var result = [
                'http://github.com/',
                'http://github.com/PerfectSlayer/',
                'http://github.com/PerfectSlayer/scrollupfolder#anchor'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should parse GET variables', function() {
            parseAnchor = false;
            parseGetVariables = true;
            parseDomain = false;
            var folders = folder.computeFolders('http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2');
            var result = [
                'http://github.com/',
                'http://github.com/PerfectSlayer/',
                'http://github.com/PerfectSlayer/scrollupfolder',
                'http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should not parse GET variables', function() {
            parseAnchor = false;
            parseGetVariables = false;
            parseDomain = false;
            var folders = folder.computeFolders('http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2');
            var result = [
                'http://github.com/',
                'http://github.com/PerfectSlayer/',
                'http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should parse GET variables and anchor', function() {
            parseAnchor = true;
            parseGetVariables = true;
            parseDomain = false;
            var folders = folder.computeFolders('http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2#anchor');
            var result = [
                'http://github.com/',
                'http://github.com/PerfectSlayer/',
                'http://github.com/PerfectSlayer/scrollupfolder',
                'http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2',
                'http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2#anchor'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should parse GET variables and leave anchor', function() {
            parseAnchor = false;
            parseGetVariables = true;
            parseDomain = false;
            var folders = folder.computeFolders('http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2#anchor');
            var result = [
                'http://github.com/',
                'http://github.com/PerfectSlayer/',
                'http://github.com/PerfectSlayer/scrollupfolder#anchor',
                'http://github.com/PerfectSlayer/scrollupfolder?key1=value1&key2=value2#anchor'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should not duplicate entry (1/2)', function() {
            parseAnchor = false;
            parseGetVariables = true;
            parseDomain = false;
            var folders = folder.computeFolders('http://github.com/?key1=value1&key2=value2');
            var result = [
                'http://github.com/',
                'http://github.com/?key1=value1&key2=value2'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should not duplicate entry (2/2)', function() {
            parseAnchor = false;
            parseGetVariables = false;
            parseDomain = false;
            var folders = folder.computeFolders('http://github.com/?key1=value1&key2=value2');
            var result = [
                'http://github.com/?key1=value1&key2=value2'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should parse domain', function() {
            parseAnchor = false;
            parseGetVariables = false;
            parseDomain = true;
            var folders = folder.computeFolders('http://debug.github.com/PerfectSlayer/scrollupfolder');
            var result = [
                'http://www.github.com/',
                'http://github.com/',
                'http://debug.github.com/',
                'http://debug.github.com/PerfectSlayer/',
                'http://debug.github.com/PerfectSlayer/scrollupfolder'
            ];
            assert.deepStrictEqual(folders, result);
        });
        it('should not duplicate www domain', function() {
            parseAnchor = false;
            parseGetVariables = false;
            parseDomain = true;
            var folders = folder.computeFolders('http://www.github.com/PerfectSlayer/scrollupfolder');
            var result = [
                'http://github.com/',
                'http://www.github.com/',
                'http://www.github.com/PerfectSlayer/',
                'http://www.github.com/PerfectSlayer/scrollupfolder'
            ];
            assert.deepStrictEqual(folders, result);
        });

        // TEST WITH AND WITHOUT ENDING SLASHES
    });

    describe('#extractSubDomains()', function() {
        it('should not find any more domain', function() {
            var subDomains = folder.extractSubDomains('github.com');
            var result = [];
            assert.deepStrictEqual(subDomains, result);
        });
        it('should find default root domain', function() {
            var subDomains = folder.extractSubDomains('test.github.com');
            var result = [
                'github.com'
            ];
            assert.deepStrictEqual(subDomains, result);
        });
        it('should find all domains', function() {
            var subDomains = folder.extractSubDomains('test5.test4.test3.test2.test1.github.com');
            var result = [
                'github.com',
                'test1.github.com',
                'test2.test1.github.com',
                'test3.test2.test1.github.com',
                'test4.test3.test2.test1.github.com'
            ];
            assert.deepStrictEqual(subDomains, result);
        });
        it('should not touch IPv4 address', function() {
            var subDomains = folder.extractSubDomains('127.0.0.1');
            var result = [];
            assert.deepStrictEqual(subDomains, result);
        });
    });
    describe('#isIpv4Address()', function() {
        it('should match IPv4 address', function() {
            var ipv4Address = folder.isIpv4Address('127.0.0.1');
            var result = true;
            assert.equal(ipv4Address, result);
        });
        it('should not match domain name', function() {
            var ipv4Address = folder.isIpv4Address('github.com');
            var result = false;
            assert.equal(ipv4Address, result);
        });
        it('should not match IPv4 address like domain name', function() {
            var ipv4Address = folder.isIpv4Address('123.456.github.com');
            var result = false;
            assert.equal(ipv4Address, result);
        });
    });
});

// folder courrant n'est pas bon dans le panneau

