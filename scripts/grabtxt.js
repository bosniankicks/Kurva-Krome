const { Kurvaaa, By, BrowserConnectionError, NoSuchElementException } = require('../browser');

async function main() {
    const kurva = new Kurvaaa();
    try {
        const browser = await kurva.browser();
        await browser.get("https://github.com/bosniankicks");
        await browser.stop(5000); // Wait for the page to load

        // Use the new grabtxt() function to get the username by class name
        const usernameClass = 'p-name vcard-fullname d-block overflow-hidden';
        const username = await browser.grabtxt(usernameClass, 'class');
        console.log(`GitHub username: ${username || 'Not found'}`);

        // Get the number of repositories (let's try to find it by class as well)
        const repoCountClass = 'Counter';
        const repoCount = await browser.grabtxt(repoCountClass, 'class');
        console.log(`Number of repositories: ${repoCount || 'Not found'}`);

    } catch (e) {
        if (e instanceof BrowserConnectionError) {
            console.log(`Browser connection error: ${e.message}`);
        } else if (e instanceof NoSuchElementException) {
            console.log(`Element not found: ${e.message}`);
        } else {
            console.log(`An unexpected error occurred: ${e.message}`);
        }
    } finally {
        await kurva.end();
    }
}

main().catch(console.error);
