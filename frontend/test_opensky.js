const clientId = "realtwo-api-client";
const clientSecret = "oTVrSAMdxWjr3fDvXLx0z7UVuagUWYMm";
const headers = {
    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
};

const url = 'https://opensky-network.org/api/states/all?lamin=40&lomin=-80&lamax=75&lomax=30';
console.log("Fetching...", url);
try {
    const res = await fetch(url, { headers });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 200));
} catch (err) {
    console.error("Fetch Error:", err);
}
