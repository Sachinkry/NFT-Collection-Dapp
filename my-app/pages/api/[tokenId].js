export default function handler(req, res) {
    // get the tokenId from the query params
    const tokenId = req.query.tokenId;

    // as all the images are uploaded on github, we can extract the images from the github directly
    const image_url =
        "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";

    // the api is sending back metadata for Crypto dev
    // to make our collection compatible with opensea, we need to follow some Metadata standards
    // when sending back the response from the api

    res.status(200).json({
        name: "Crypto Dev #" + tokenId,
        description: "Crypto Dev is a collection of developers in crypto",
        image: image_url + tokenId + ".svg",
    });
}