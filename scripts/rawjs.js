const { Kurvaaa, By, BrowserConnectionError, NoSuchElementException } = require('../browser');

async function main() {
    const kurva = new Kurvaaa();
    try {
        const browser = await kurva.browser();
        await browser.get("https://github.com/bosniankicks/Kurva-Krome/");
        await browser.stop(5000); 

        await browser.insert_js(
            `document.querySelector('a[href="/bosniankicks/Kurva-Krome"]').innerText = 'amels example';`
        );
        
        await browser.stop(5000);


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
