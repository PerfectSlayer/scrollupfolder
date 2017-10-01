// var openPopup = function(tabId) {
//     browser.pageAction.setIcon({
//         "path": "icons/folder-open.png",
//         "tabId": tabId
//     });
// };
//
// var closePopup = function(tabId) {
//     browser.pageAction.setIcon({
//         "path": "icons/folder.png",
//         "tabId": tabId
//     });
// };

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("Tab update "+tabId);
    console.log(changeInfo);
    console.log(tab);
    // Check tab URL
    if (tab.url && tab.url.substr(0, 6) !== 'about:') {
        browser.pageAction.show(tabId);
    } else {
        browser.pageAction.hide(tabId);
    }
});
