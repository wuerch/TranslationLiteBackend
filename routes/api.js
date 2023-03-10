const router = require("express").Router();
const axios = require("axios");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const {db} = require("../util/firebase")
// const middleware = require('../util/middleware');


const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

function routes(app) {
  //router.post("/test2")
  // router.post("/test", middleware.decodeToken, async (req,res) => {
  //   return res.json({status: 200})
    
  // })
  router.post("/search", async (req, res) => {
    const data = await handleSearch(req.body.searchQuery);
    res.json({ status: 200, data: data });
  });


  router.post("/quicksearch", async (req, res) => {
    try {
      if(req.body.target){
        const target = req.body.target
      const data = await handleSearch(req.body.searchQuery);
      //console.log(JSON.stringify(data, null, 2))
      const artist = data.message.body.track_list[0].track.artist_name;
      const song = data.message.body.track_list[0].track.track_name;

      const scrapeURL = data.message.body.track_list[0].track.track_share_url.split('?')[0] //https://www.musixmatch.com/lyrics/Apache-207/Roller?
      //console.log(scrapeURL);
      var lyrics = await getLyrics(scrapeURL);
      const translatedLyrics = await handleTranslate(lyrics, target);
      //console.log(translatedLyrics)

      return res.json({
        status: 200,
        artist: artist,
        song: song,
        lyrics: lyrics,
        translatedLyrics: translatedLyrics,
      });
      }
    } catch (err) {}
  });

  router.post("/selected", async (req, res) => {
    const scrapeURL = req.body.selectedSong.result.url;
    const lyrics = await getLyrics(scrapeURL);

    res.json({ status: 200, lyrics: lyrics });
  });

  return router;
}

async function getHTML(URL) {
  var res = await fetch(URL, {
    method: "GET",
  });
  return await res.text();
}
async function handleSearch(searchQuery){
  var returnedData;
  await fetch(`https://api.musixmatch.com/ws/1.1/track.search?apikey=4429a9866ca299e3461a53362d9bc840&page_size=1&q_track_artist=${searchQuery}&s_track_rating=desc&page_size=10`, {
    method: "GET",
  })
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      returnedData = res;
    });
  return returnedData
}

async function getLyrics(URL){
  //"https://www.musixmatch.com/de/songtext/Fetty-Wap/Trap-Queen"
  const html = await getHTML(
    URL
  );
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const parentDiv = document.querySelector(".mxm-lyrics span");
 
  // Make sure the parent div exists
  if (parentDiv) {
    // Create a new span element to store the text content
    const span = document.createElement("span");
    span.style.whiteSpace = "pre-wrap";

    // Traverse the child nodes of the parent div and retrieve their text content
    const traverseNodes = function(node) {
      let text = "";
      for (let i = 0; i < node.childNodes.length; i++) {
        const childNode = node.childNodes[i];
        if (childNode.nodeType === 3) {
          // If the node is a text node, append its text content to the text variable
          text += childNode.nodeValue;
        } else if (childNode.nodeName !== "SCRIPT" && childNode.nodeName !== "BUTTON") {
          // If the node is an element that is not a script or button and has innerHTML, recursively traverse its child nodes
          let innerText = traverseNodes(childNode);
          if (innerText.length > 0) {
            text += innerText + "\n";
          }
        }
      }
      return text;
    };

    // Set the text content of the span to the retrieved text
    span.innerHTML = traverseNodes(parentDiv);

    // Replace the inner HTML of the parent div with the span
    parentDiv.innerHTML = span.outerHTML;
    //console.log(span.innerHTML);
    return span.innerHTML
  }
  
}

async function handleTranslate(text, targetLanguage) {
  var translatedLyrics;

  const data = {
    q: text,
    key: process.env.GOOGLETRANSLATEAPIKEY,
    target: targetLanguage,
    format: "text",
  };
  const searchParams = new URLSearchParams(data).toString();

  await fetch("https://translation.googleapis.com/language/translate/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: searchParams,
  })
    .then((res) => res.json())
    .then((res) => {
      //console.log(res.data.translations[0])
      translatedLyrics = res.data.translations[0].translatedText;
    })
    .catch((err) => console.error(err));

  return translatedLyrics;
}

module.exports = routes;