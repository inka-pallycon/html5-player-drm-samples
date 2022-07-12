
function uInt8ArrayToString(array) {
    return String.fromCharCode.apply(null, array);
}

function stringToUInt8Array(str)
{
    return Uint8Array.from(str, c => c.charCodeAt(0));
}

function base64DecodeUint8Array(input) {
    return Uint8Array.from(atob(input), c => c.charCodeAt(0));
}

function base64EncodeUint8Array(input) {
    return btoa(uInt8ArrayToString(input));
}

function waitFor(target, type) {

    return new Promise(resolve => {
        target.addEventListener(type, resolve, { once: true });
    });

}

async function fetchBuffer(url) {
    let result = await fetch(url);
    let buffer = await result.arrayBuffer();
    return buffer;
}

async function fetchAndAppend(sourceBuffer, url) {
    let buffer = await fetchBuffer(url);
    sourceBuffer.appendBuffer(buffer);
    await waitFor(sourceBuffer, 'updateend');
}

async function fetchAndWaitForEncrypted(video, sourceBuffer, url) {
    let updateEndPromise = fetchAndAppend(sourceBuffer, url);
    let event = await waitFor(video, 'encrypted');
    let session = await encrypted(event);
    await updateEndPromise;
    return session;
}


const delay = async time => await new Promise(async res=>await setTimeout(res,time));
async function runAndWaitForLicenseRequest(session, serverProcessSPCPath, keyURI, callback) {
    let licenseRequestPromise = waitFor(session, 'message');

    await callback();

    let message = await licenseRequestPromise;
    let response = await getResponse(message, serverProcessSPCPath, keyURI);

    await session.update(response);

    await delay(600000);  // TODO set Renewal Interval milliseconds ( 10 minute )

    await runAndWaitForLicenseRequest(session, serverProcessSPCPath, keyURI, () => {
        session.update(stringToUInt8Array("renew"));
    });

}

async function loadCertificate()
{
    try {
        let response = await fetch(serverCertificatePath);
        window.certificate = await response.arrayBuffer();
        startVideo();
    } catch(e) {
        window.console.error(`Could not load certificate at ${serverCertificatePath}`);
    }
}

async function getResponse(event, spcPath, keyURI) { // ADAPT: Tailor this to your own protocol.
    let licenseResponse = await fetch(spcPath, {
        method: 'POST',
        headers: new Headers({'Content-type': 'application/x-www-form-urlencoded'}),
        body: "spc="+base64EncodeUint8Array(new Uint8Array(event.message))
    });

    return base64DecodeUint8Array(await licenseResponse.text());
}


