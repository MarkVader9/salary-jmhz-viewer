// Remove browsingTopics API if present
export function removeBrowsingTopics() {
    if (document.browsingTopics) {
        delete Document.prototype.browsingTopics;
        console.log(
            `Browsing Topics API removed from ${document.location.href} ` +
            `which is ${window === window.top ? "main frame" : "iframe"}`
        );
    } else {
        console.log(
            `Browsing Topics API not found, nothing to remove on ${document.location.href}, ` +
            `${window === window.top ? "main frame" : "iframe"}`
        );
    }
}
removeBrowsingTopics();
