var axios = require("axios");
const configV3 = require("./config.json");
const moment = require("moment");
const { queryCreated, queryCreatedCursor } = require("./graphql");
const { save2JSON, save2CSV} = require("./save");
require("dotenv").config();

module.exports = {
  extractionApiSingle: async (data, callback) => {
    let first = data.first; //number of repository data should be in single call. Make sure not to exceed nodes limit in GithubExplorer!
    var cursor = data.cursor; // cursor is default null and updates automatically.
    var startDate = data.startDate;
    var endDate = data.endDate;
    var queryData = data.query;
    var FileToNamed = data.fileName;
    var folderTOName = data.folderName;
    var dateType = data.dateType;
    let limit = null;
    let nodeCount = null;
    var hasNextpage = true;
   // let responses = [];
    let n = 0;
    let updateQuery = queryData + ` ${dateType}:` + startDate + ".." + endDate;
    console.log(updateQuery);
    while (hasNextpage == true) {
      try {
        console.log(n);
        console.log(cursor);
        var data = JSON.stringify({
          query:
            cursor == null
              ? queryCreated(updateQuery, first)
              : queryCreatedCursor(updateQuery, first, cursor),
          variables: {},
        });
        var tokens = configV3.extraction.githubTokens;
        const random = Math.floor(Math.random() * tokens.length); //picks random token from the array so that no token reach to it't limit
        var config = {
          method: "post",
          url: "https://api.github.com/graphql",
          headers: {
            Authorization: `Bearer ${tokens[random]}`,
            "Content-Type": "application/json",
          },
          data: data,
        };
        await axios(config)
          .then(async function (response) {
            cursor = response.data.data.search.pageInfo.endCursor;
            hasNextpage = response.data.data.search.pageInfo.hasNextPage;
            limit = response.data.data.rateLimit.remaining;
            nodeCount = response.data.data.rateLimit.nodeCount;
            // filter to get only results with code and non-null descriptions
            const filteredEdges = response.data.data.search.edges.filter(edge => {
              const node = edge.node;
              return node.languages.totalCount > 0;
            });
            // responses.push(response.data.data.search.edges);
            const saveData = {
              filetoname: FileToNamed,
              response: filteredEdges,
              foldertoname: folderTOName,
            };
            await save2JSON(saveData, (err, results) => {
              if (err) {
                console.log(err);
              }
              console.log(results);
            });
            /*
             save2CSV(saveData, (err, results) => {
              if (err) {
                console.log(err);
              }
              console.log(results);
            });
            */
          })
          .catch(function (err) {
            console.log(err);
            return callback(err);
          });
        // }
      } catch (error) {
        console.log(error);
      }
      n = n + 1;
    }
    //promises = [];
    // responses = [];
    
    return callback(null, {
      cursor,
      hasNextpage,
      nodeCount,
      limit,
    }),
    setTimeout(() => {
      console.log("\nCounting filtered results..."); //in main extraction module
    }, 1000);
  },


  // extraction based on the dates.
  extractionApi: async (data, callback) => {
    let first = data.first; //number of repository data should be in single call. Make sure not to exceed nodes limit in GithubExplorer!
    var cursor = data.cursor; // cursor is default null and updates automatically.
    var startDate = data.startDate;
    var endDate = data.endDate;
    var queryData = data.query;
    var FileToNamed = data.fileName;
    var folderTOName = data.folderName;
    var dateType = data.dateType;
    let limit = null;
    let nodeCount = null;
    var hasNextpage = true;
  //  let responses = [];
    let n = 0;
    while (
      moment(startDate).isSameOrBefore(endDate) 
    ) {
      //console.log(startDate);
      hasNextpage = true;
      cursor = null;
      while (hasNextpage) {
        let updateQuery =
          queryData + ` ${dateType}:` + startDate;
        //console.log(updateQuery);
        try {
          console.log(n);
          console.log(cursor);
          console.log(updateQuery);
          var data = JSON.stringify({
            query:
              cursor == null
                ? queryCreated(updateQuery, first)
                : queryCreatedCursor(updateQuery, first, cursor),
            variables: {},
          });
          //extraction github tokens
          var tokens = configV3.extraction.githubTokens;
          const random = Math.floor(Math.random() * tokens.length); //picks random token from the array so that no token reach to it't limit
          var config = {
            method: "post",
            url: "https://api.github.com/graphql",
            headers: {
              Authorization: `Bearer ${tokens[random]}`,
              "Content-Type": "application/json",
            },
            data: data,
          };
          await axios(config)
            .then(async function (response) {
              // console.log(response.data.data.search.edges);
              cursor = response.data.data.search.pageInfo.endCursor;
              hasNextpage = response.data.data.search.pageInfo.hasNextPage;
              limit = response.data.data.rateLimit.remaining;
              nodeCount = response.data.data.rateLimit.nodeCount;
            // filter to get only results with code and non-null descriptions
            const filteredEdges = response.data.data.search.edges.filter(edge => {
              const node = edge.node;
              return node.languages.totalCount > 0;
            });
            //  responses.push(JSON.stringify(filteredEdges));
              const saveData = {
                filetoname: FileToNamed,
                response: filteredEdges,
                foldertoname: folderTOName,
              };
              await save2JSON(saveData, (err, results) => {
                if (err) {
                  console.log(err);
                }
                console.log(results);
              });
              /*
                save2CSV(saveData, (err, results) => {
                if (err) {
                  console.log(err);
                }
                console.log(results);
              });
              */
            })
            .catch(function (err) {
              console.log(err);
              return callback(err);
            });
        } catch (error) {
          console.log(error);
        }
        n = n + 1;
      }
      startDate = moment(startDate).add(1, "d").format("YYYY-MM-DD");
    }
   // promises = [];
   // responses = [];

    return callback(null, {
      cursor,
      hasNextpage,
      nodeCount,
      limit,
    }),
    setTimeout(() => {
      console.log("\nCounting filtered results...");
    }, 1000);
  },
};
