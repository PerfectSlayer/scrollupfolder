// Include add-on module
const main = require("../index");
// Include SDK modules
const SimplePrefs = require('sdk/simple-prefs');
const Test = require("sdk/test");

/**
 * Compute paths from URL.
 * @param	url		The URL to compute paths.
 * @param			The array of computed paths.
 */
function computePaths(url) {
	// Declare path array
	var paths = [];
	// Append each URL until null
	while (url !== null) {
		// Append URL
		paths.push(url);
		// Compute upper URL
		url = main.computeUpperUrl(url);
	}
	// Return computed paths
	return paths;
}

/*
 * Declare test cases.
 */
exports["test http paths"] = function(assert) {
	var url = "http://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4#anchor";
	var paths = [
		"http://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4#anchor",
		"http://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4",
		"http://domain.site.com/level1/level2/?param=1&param2=value2&param3",
		"http://domain.site.com/level1/level2/?param=1&param2=value2",
		"http://domain.site.com/level1/level2/?param=1",
		"http://domain.site.com/level1/level2/",
		"http://domain.site.com/level1/",
		"http://domain.site.com/",
		"http://www.site.com/"
	];
	assert.deepEqual(paths, computePaths(url), "HTTP paths");
};

exports["test https paths"] = function(assert) {
	var url = "https://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4#anchor";
	var paths = [
		"https://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4#anchor",
		"https://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4",
		"https://domain.site.com/level1/level2/?param=1&param2=value2&param3",
		"https://domain.site.com/level1/level2/?param=1&param2=value2",
		"https://domain.site.com/level1/level2/?param=1",
		"https://domain.site.com/level1/level2/",
		"https://domain.site.com/level1/",
		"https://domain.site.com/",
		"https://www.site.com/"
	];
	assert.deepEqual(paths, computePaths(url), "HTTPS paths");
};

exports["test http ip paths"] = function(assert) {
	var url = "http://123.1.12.123/level1/level2/";
	var paths = [
		"http://123.1.12.123/level1/level2/",
		"http://123.1.12.123/level1/",
		"http://123.1.12.123/"
	];
	assert.deepEqual(paths, computePaths(url), "HTTP IP paths");
};

exports["test ftp paths"] = function(assert) {
	var url = "ftp://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4#anchor";
	var paths = [
		"ftp://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4#anchor",
		"ftp://domain.site.com/level1/level2/?param=1&param2=value2&param3&param4=value4",
		"ftp://domain.site.com/level1/level2/?param=1&param2=value2&param3",
		"ftp://domain.site.com/level1/level2/?param=1&param2=value2",
		"ftp://domain.site.com/level1/level2/?param=1",
		"ftp://domain.site.com/level1/level2/",
		"ftp://domain.site.com/level1/",
		"ftp://domain.site.com/",
		"ftp://www.site.com/"
	];
	assert.deepEqual(paths, computePaths(url), "FTP paths");
};

exports["test ftp ip paths"] = function(assert) {
	var url = "ftp://123.1.12.123/level1/level2/";
	var paths = [
		"ftp://123.1.12.123/level1/level2/",
		"ftp://123.1.12.123/level1/",
		"ftp://123.1.12.123/"
	];
	assert.deepEqual(paths, computePaths(url), "FTP IP paths");
};

/*
 * Run tests.
 */
// Run tests
Test.run(exports);
