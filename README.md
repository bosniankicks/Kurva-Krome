Hi, My name is Amel. I love automation frameworks. 

How does KURVA-KROME work? 

KURVA-KROME works with custom CDP connections and the functionality of playwright and selenium. KK currently passes Akamai, Kasada, Cloudflare, Datadome, and PerimeterX in a headful environment. When using the BY.XPATH functionality, I have it strictly set to XPATH, this will not work with CSS selectors or IDs for the time being. 


Why did I make this? I noticed that driverless/nodriver is strictly written in Python, and I wanted to offer a way for NodeJS developers to have access to a undetected browser framework. Kurva-Krome uses playwright and selenium functionality and will be getting updates as the time goes on. 

Usage is shown in script.js 


    const kurva = new Kurvaaa();
    const browser = await kurva.browser(); -- starts the browser initialization

    await browser.get("https://www.nike.com/login"); -- gets the URL the user wants to visit

    browser.stop() -- basically a sleep timer in ms

    const inputElement = await browser.findElement(By.XPATH, xpath); -- selenium findelement functionality

    click() -- clicks an xpath

    await inputElement.sendKeys(inputText); -- sends input text to an input xpath element

    await kurva.end(); -- closes the browser and session



PLEASE EDIT THE CHROME BINARY LOCATION THAT FITS TO YOUR BROWSER (line 283 in browser.js) (I run on MacOS)

PLEASE Leave a star! I greatly appreciate the recognition


Dm me on discord @pickumaternu or join https://discord.gg/pCDsrSXQa9 for help :D


I am not responsible how you use this code in any possible way. Please refrain from using it for any malicous intent! It ruins the experience for people who want a JS framework to work! 
