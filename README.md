Hi, My name is Amel. I love automation frameworks. 

How does KURVA-KROME work? 

KURVA-KROME works with custom CDP connections and the functionality of playwright and selenium. KK currently passes Akamai, Kasada, Cloudflare, Datadome, and PerimeterX in a headful environment. 


Why did I make this? I noticed that driverless/nodriver is strictly written in Python, and I wanted to offer a way for NodeJS developers to have access to a undetected browser framework. Kurva-Krome uses playwright and selenium functionality and will be getting updates as the time goes on. 

Usage is shown in scripts folder


    const kurva = new Kurvaaa();
    const browser = await kurva.browser(); -- starts the browser initialization

    await browser.get("https://www.nike.com/login"); -- gets the URL the user wants to visit

    browser.stop() -- basically a sleep timer in ms

    const inputElement = await browser.findElement(By.XPATH, xpath); -- selenium findelement functionality

    click() -- clicks an xpath

    await inputElement.sendKeys(inputText); -- sends input text to an input xpath element

    await browser.coordClick(100, 100); -- sends clicks to x,y coords

    const username = await browser.grabtxt(usernameClass, 'class'); -- grabs inner text of class name

    await browser.insert_js(
        `document.querySelector('a[href="/bosniankicks/Kurva-Krome"]').innerText = 'amels example';` -- lets user execute raw javascript inside the browser
        );

    await browser.picture('creep.png'); -- takes a screenshot of the browser window (doesnt take fullscreenshots, and must put filename of screenshot! , saves locally to where the script is ran from) 

    await browser.cookies('mycookies.json'); -- saves cookies to a json file by the users request

    await browser.holdclick(x,y, duration_in_ms) -- sends a hold click to a x, y coordinate and holds for the duration in ms for the click

    await kurva.end(); -- closes the browser and session



PLEASE EDIT THE CHROME BINARY LOCATION THAT FITS TO YOUR BROWSER (line 283 in browser.js) (I run on MacOS)

PLEASE Leave a star! I greatly appreciate the recognition

if you want to donate to the cause -- venmo(bosniankicks) - cashapp($bosniankicks) -- helps me buy my redbulls needed for these projects xD


Dm me on discord @pickumaternu or join https://discord.gg/pCDsrSXQa9 for help :D


I am not responsible how you use this code in any possible way. Please refrain from using it for any malicous intent! It ruins the experience for people who want a JS framework to work! 

# Capsolver Sponsor
[![CapSolver Ads](https://github.com/user-attachments/assets/793acd61-2ad9-46cf-bdec-60a61be962e1)](https://www.capsolver.com/?utm_source=github&utm_medium=repo&utm_campaign=scraping&utm_term=Kurva-Krome)

Alternatively, you may use Capsolver. For more information and to get started, visit the official [Capsolver website](https://www.capsolver.com/?utm_source=github&utm_medium=repo&utm_campaign=scraping&utm_term=Kurva-Krome).

