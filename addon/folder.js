/*
 * Check if URL exists from WebExtensions API.
 * Otherwise, load it as NodeJS module.
 */
if (typeof URL === 'undefined') {
    var { URL } = require('url');
}
/**
 * Compute folders from an URL.
 * @return An array of URL representing the hierarchy of the given URL.
 */
function computeFolders(url) {
    // Parse original URL into object
    var urlObject = new URL(url);
    // Declare folders with original URL
    var folders = Array.of(urlObject.href);
    // Check if should parse anchor and anchor is present
    if (parseAnchor && urlObject.hash) {
        // Clear anchor
        urlObject.hash = '';
        // Add folder
        folders.unshift(urlObject.href);
    }
    // Check if GET variables are present
    if (urlObject.search) {
        // Clear GET variables
        urlObject.search = '';
        // Check if should parse GET variables
        if (parseGetVariables) {
            // Append folder
            folders.unshift(urlObject.href);
        }

    }
    // Declare parent URL as current folder
    var parentUrlObject = new URL('.', urlObject);
    // Check if parent URL differs from current URL
    while (parentUrlObject.href != urlObject.href) {
        // Apppend folder
        folders.unshift(parentUrlObject.href);
        // Set current URL as parent URL
        urlObject = parentUrlObject;
        // Compute next parent URL
        parentUrlObject = new URL('..', urlObject);
    }
    // Check if should parse domain
    if (parseDomain) {
        // Get URL host name
        var host = urlObject.host;
        // Extract sub domains from host
        var subDomains = extractSubDomains(host);
        // Ensure www domain is included
        subDomains = ensureWwwDomain(host, subDomains);
        // Append each domain level
        for (const domain of subDomains) {
            urlObject.host = domain;
            folders.unshift(urlObject.href);
        }
    }
    // Return computed folders
    return folders;
}
/**
 * Extract sub-domains of a domain name.
 * @param domainName The domain name to get sub-domains.
 * @return The sub-domains in an array.
 */
function extractSubDomains(domainName) {
    // Check IPv4 address
    if (isIpv4Address(domainName)) {
        // Return no sub domain
        return [];
    }
    // Declare sub-domains
    var domains = [];
    // Split domain name by level
    var parts = domainName.split(".");
    // Check minimum required level
    if (parts.length > 2) {
        // Compute root domain name
        var domain = parts[parts.length - 2] + "." + parts[parts.length - 1];
        domains.push(domain);
        for (var i = parts.length - 3; i > 0; i--) {
            domain = parts[i] + "." + domain;
            domains.push(domain);
        }
    }
    // Return sub-domains
    return domains;
}
/**
 * Ensure www domain is included in sub domains.
 * @param subDomains The sub domains to include www domain.
 * @return The sub domains with www domain included.
 */
function ensureWwwDomain(host, subDomains) {
    // Ensure sub domains contain at least one domain
    if (subDomains.length === 0) {
        // Otherwise, return default www domain
        return Array.of('www.'+host);
    }
    // Copy sub domains
    var results = Array.from(subDomains);
    // Get top domain
    var topDomain = results[0];
    // Compute www domain
    var wwwDomain = 'www.'+topDomain;
    // Check if www domain is not already included or the host itself
    if (results.indexOf(wwwDomain) === -1 && host !== wwwDomain) {
        // Insert www domain on top of sub domains
        results.push(wwwDomain);
    }
    // Return sub domains with www domain
    return results;
}
/**
 * Check if a domain is an IPv4 address.
 * @param domain The domain to check.
 * @return true if the domain is an IPv4 address, false otherwise.
 */
function isIpv4Address(domain) {
    return domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) !== null;
}

/*
 * Check if module exists from NodeJS.
 * If so, export methods with module interface.
 */
if (typeof module !== 'undefined') {
    module.exports = {
        computeFolders: computeFolders,
        extractSubDomains: extractSubDomains,
        isIpv4Address: isIpv4Address
    };
}

