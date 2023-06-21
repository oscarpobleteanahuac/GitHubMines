const fs = require("fs");
const path = require('path');

const configV3 = require("./config.json");
const moment = require("moment");
var axios = require("axios");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const {
  save2JSON,
  save2CSV,
} = require("./save");
require("dotenv").config();
const { extractionApi, extractionApiSingle } = require("./service");
const { queryRepoCount } = require("./graphql");
const { config } = require("dotenv");

module.exports = {

  //Extraction parameters
  extractionSetup: async () => {
    // Slice the first three elements since they are the "node" command, the filename and the module
    let args = process.argv.slice(3);
  
    // Minimist code to retrieve the arguments
    const argv = require("minimist")(args, {
     alias: {
      q: "query",
    //  t: "type",
      d: "dateType",
      b: "startDate", //DD-MM-YYYY
      e: "endDate",
    }
  });
  
  // Print options if user puts --help as an argument
  if (process.argv.includes('--help')) {
    printExtractionHelp();
    process.exit(0);
  }
  
  function printExtractionHelp() {
    console.log('Options:');
    console.log('  -q, --query       Specify the search query. DEFAULT: mobile AND (android OR ios)');
    // console.log('  -t, --type        Specify the type of search (default: REPOSITORY)');
    console.log('  -d, --dateType    Specify the date type. DEFAULT: created');
    console.log('  -b, --startDate   Specify the start date in the format YYYY-MM-DD. DEFAULT: 2013-01-01)');
    console.log('  -e, --endDate     Specify the end date in the format YYYY-MM-DD. DEFAULT: 2023-01-30)');
  }
  // Check the retrieved arguments
  //console.log(argv);
  
  // Define the data object
  let data = {
  query: argv.query || configV3.extraction.query,
  //type: argv.type || "REPOSITORY", //NEEDS ATTENTION IN service.js and graphQL.js 
  type: configV3.extraction.type,
  dateType: argv.dateType || configV3.extraction.dateType,
  startDate: argv.startDate || configV3.extraction.startDate,
  endDate: argv.endDate || configV3.extraction.endDate,
  cursor: configV3.extraction.cursor,
  first: configV3.extraction.first,
  file: configV3.query.fileName,
  folder: configV3.query.folderName
  };
  
  // Export the extraction function with the data object
  module.exports.extraction(data);
  },
  
  // Extract query data
  extraction: async (dataModule) => {
    // console.log(dataModule);
    var repoCount = 0;
    let startDate = dataModule.startDate
    let endDate = dataModule.endDate
    //console.log(startDate, endDate);
    // query like `android created:2020-01-01..2020-12-31 stars:>=3` can be converted in below format
    // this can be edited according to need of the data required
    console.log("Query extraction:")
    const data = {
      query: dataModule.query,
      type: dataModule.type,
      startDate: startDate,
      endDate: endDate,
      cursor: null,
      dateType: dataModule.dateType,
      first: dataModule.first, //number of data in single API Call, can be increased just be careful about Github limit.
      fileName: dataModule.file,
      folderName: dataModule.folder,
    };
    console.log(data);
  
    var dataApi = JSON.stringify({
      query: queryRepoCount(
        data.query +
          ` ${dataModule.dateType}:` +
          startDate+
          ".." +
          endDate
      ),
      variables: {},
    });
    var config = {
      method: "post",
      url: "https://api.github.com/graphql",
      headers: {
        Authorization: `Bearer ${configV3.extraction.githubTokens[0]}`,
        //Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: dataApi,
    };
    await axios(config)
      .then(async function (response) {
        repoCount = response.data.data.search.repositoryCount;
        console.log("Results: "+ repoCount);        
      })
      .catch(function (err) {
        console.log(err);
      });
  //PONER VALIDACION DE FECHAS Y SI NO PONER QUE ELIGIO *..*
      if (repoCount === 0) {
        console.log("No matching results.\nTry another query, verify arguments or enter 'node main extract --help' to get more information.");
        process.exit(0);
      } else if (repoCount > 1000) {
        console.log("Flag: data more than 1000");
        extractionApi(data, (err, results) => {
          if (err) {
            console.log(err);
          }
          console.log(results);
          console.log("\nComplete.");
          module.exports.jsonArrayCount();
        });
      } else {
        console.log("Flag: data less than 1000");
        extractionApiSingle(data, (err, results) => {
          if (err) {
            console.log(err);
          }
          console.log(results);
          console.log("\nComplete.");
          module.exports.jsonArrayCount();
        });
    }
  },
  
  // Count the number of JSON files in the data folder
  jsonArrayCount: async () => {
    setTimeout(() => {
      const file = require(configV3.vault.folderName+configV3.query.folderName+configV3.query.fileName+".json");
      const data = file;
  
      data.forEach((ele, i) => {
        console.log(i+1);
      });
      console.log("Complete.");
      module.exports.topicsExtract();
    }, 2500);
  },
  
  // Extract topics to create a dictionary
  topicsExtract: async () => {
    let dict = [];
    // If extractions are in multiple files, that files can be added to array and it will combine all the results inside single file
    extract = [configV3.vault.folderName+configV3.query.folderName+configV3.query.fileName+".json"]; //REPLACE with extraction file!! (samplextract)
    // extract = ["./SavedFiles/sampleExtract.json"];
    setTimeout(() => {
      console.log("\nTopic extraction:")
    try {
      extract.forEach((elem, i) => {
        const data = require(elem);
        data.forEach((element) => {
          // console.log(element.node.repositoryTopics.edges);
          repoTopics = element.node.repositoryTopics.edges;
          repoTopics.forEach((element2) => {
           // console.log(element2.node.topic.name);
            const found = dict.find(
              //check for existence
              (el) => el.tag === element2.node.topic.name
            );
            if (!found) {
              dict.push({
                tag: element2.node.topic.name,
                occurence: 1,
              });
            } else {
              dict.find((v) => v.tag === found["tag"]).occurence =
                found["occurence"] + 1;
            }
          });
        });
      });
      const data = {
        foldertoname: configV3.topics.folderName,
        filetoname: configV3.topics.fileName,
        response: dict,
      };
  
     save2JSON(data, (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results);
        module.exports.langExtract();
      });
      save2CSV(data, (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results);
      });
    } catch (err) {
      console.error(err);
    }
  }, 1500);
  },
  
  //Extract languages to create a dictionary
  langExtract: async () => {
    let dict = [];
    // If extractions are in multiple files, that files can be added to array and it will combine all the results inside single file
    extract = [configV3.vault.folderName+configV3.query.folderName+configV3.query.fileName+".json"]; //REPLACE WITH EXTRACTION FILES
    setTimeout(() => {
      console.log("\nLanguage extraction:")
    try {
      extract.forEach((elem, i) => {
        const data = require(elem);
        data.forEach((element) => {
          repoTopics = element.node.languages.edges;
          repoTopics.forEach((element2) => {
           // console.log(element2.node.name);
            const found = dict.find((el) => el.tag === element2.node.name); //check for existence
            if (!found) {
              dict.push({
                tag: element2.node.name,
                occurence: 1,
              });
            } else {
              dict.find((v) => v.tag === found["tag"]).occurence =
                found["occurence"] + 1;
            }
          });
        });
      });
      const data = {
        foldertoname: configV3.languages.folderName,
        filetoname: configV3.languages.fileName, // REPLACE WITH SOMETHING THAT INDICATES THE EXTRACED LANGUAJES
        response: dict,
      };
  
      save2JSON(data, (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results)
        module.exports.mergeDict();
      });
      save2CSV(data, (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results);
      });
    } catch (err) {
      console.error(err);
    }
  }, 1500);
  },
  
  //Merge topics, languages and stackoverflow dictionaries
  mergeDict: async () => {
    let i = 0;
    let mainDict = [];
    const files = [
      configV3.vault.folderName+configV3.languages.folderName+configV3.languages.fileName+".json",
      configV3.vault.folderName+configV3.topics.folderName+configV3.topics.fileName+".json",
      configV3.stackoverflow.folderName+configV3.stackoverflow.fileName
    ];
    try {
      while (i < files.length) {
        const dict = require(files[i]);
        await dict.forEach((element) => {
          //console.log(element.tag);
          const found = mainDict.find(
            (el) => el.tag === element.tag.toLowerCase()
          );
          if (!found) {
            mainDict.push({
              tag: element.tag.toLowerCase(),
              occurence: element.occurence,
            });
          } else {
            mainDict.find((v) => v.tag === found["tag"]).occurence =
              found["occurence"] + element.occurence;
          }
        });
        i += 1;
      }
    } catch (error) {
      console.log(error);
    }
    setTimeout(() => {
    console.log("\nDictionary merge:")
    const data = {
      foldertoname: configV3.dictionary.folderName,
      filetoname: configV3.dictionary.fileName, // REPLACE NAME WITH SOMETHING THAT INDICATES THE COMBINATION OF LANGS AND TOPICS
      response: mainDict,
    };
  
    save2JSON(data, (err, results) => {
      if (err) {
        console.log(err);
      }
      console.log(results);
      module.exports.dataAugm();
    });
    save2CSV(data, (err, results) => {
      if (err) {
        console.log(err);
      }
      console.log(results);
    });
  }, 1500);
  },
  
  //Summarize data
  dataAugm: async () => {
  console.log("\nAugmenting data...");
  const filePath = `${configV3.vault.folderName}${configV3.query.folderName}/${configV3.query.fileName}.json`; // Replace with the extracted data file path
  const results = []; // Array to store the generated data

  try {
    const data = require(filePath);
    const dict = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, `${configV3.vault.folderName}${configV3.dictionary.folderName}/${configV3.dictionary.fileName}.json`), "utf8")
    );

    for (const element of data) {
      const languageCount = [];
      const topicCount = [];
      const environmentCount = [];
      const submoduleCount = [];
      const mainCount = {};
      const newAdded = [];
      const repoDesc = element.node.description;

      for (const elemen of element.node.languages.edges) {
        languageCount.push(elemen.node.name);
        mainCount[elemen.node.name] = true;
      }

      for (const elemen of element.node.repositoryTopics.edges) {
        topicCount.push(elemen.node.topic.name);
        mainCount[elemen.node.topic.name] = true;
      }

      for (const elemen of element.node.environments.edges) {
        environmentCount.push(elemen.node.name);
        mainCount[elemen.node.name] = true;
      }

      for (const elemen of element.node.submodules.edges) {
        submoduleCount.push(elemen.node.name);
        mainCount[elemen.node.name] = true;
      }

 //     if (repoDesc !== null) {
        const receivedData = getTagsInDescription(dict, repoDesc, 10);
        for (const ele2 of receivedData) {
          if (!(ele2 in mainCount)) {
            newAdded.push(ele2);
          }
        }
        const response = {
          name: element.node.nameWithOwner.split("/")[1],
          owner: element.node.nameWithOwner.split("/")[0],
          createdAt: moment(element.node.createdAt).format('YYYY-MM-DD'),
          users: element.node.assignableUsers.totalCount,
          watchers: element.node.watchers.totalCount,
          stars: element.node.stargazerCount,
          forks: element.node.forkCount,
          projects: element.node.projects.totalCount,
          issues: element.node.issues.totalCount,
          diskUsage: element.node.diskUsage,
          url: element.node.url,
          description: element.node.description,
          languages: languageCount,
          primaryLanguage: element.node.primaryLanguage.name,
          environments: environmentCount,
          submodules: submoduleCount,
          tags: receivedData, // Combination of previous tags with new added (extracted) tags
          topics: topicCount,
        };
        results.push(response);
 //     }
    }
  } catch (err) {
    console.error(err);
  }
    
    setTimeout(() => {
    // Call decriptJSON and decriptTxt after the loop with the generated data
    const data = {
      foldertoname: configV3.augmentation.folderName,
      filetoname: configV3.augmentation.fileName,
      response: results,
    };
      save2JSON(data, (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results);

      // Prompt the user to keep only the 'Results' folder
      const resultsPath = path.normalize(configV3.vault.folderName+configV3.augmentation.folderName)
      rl.question('\nDo you want to keep only the "Results" folder? (y/n): ', (choice) => {
        rl.close();
        
        if (choice.toLowerCase() === 'yes' || choice.toLowerCase() === 'y') {
          fs.readdirSync(configV3.vault.folderName).forEach((directory) => {
            const directoryPath = path.join(configV3.vault.folderName, directory);
            if (fs.statSync(directoryPath).isDirectory() && directoryPath !== resultsPath) {
              deleteDirectory(directoryPath);
            }
          });
          console.log('Done.\n');
        } else {
          console.log('No directories were deleted.\n');
        }
      });

      });
      save2CSV(data, (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results);
      });  
    }, 1500);
  }
};
  
  var getTagsInDescription = function (dict, description, tagThreshold) {
    let res = [];
    if (!description) {
      return res; // Return an empty array if description is null or empty
    }
    for (var j = 0; j < dict.length; j++) {
      var _topic = dict[j].tag.toLowerCase();
      if (dict[j].occurence < tagThreshold) continue;
      var splittedTag = _topic.split("-");
      var splittedDescription = description.toLowerCase().split(" ");
      if (
        arrayWithinArray(splittedTag, splittedDescription) ||
        arrayIncludes(splittedDescription, _topic)
      )
        res.push(_topic);
    }
  //  console.log(description);
  //  console.log(res);
    return res;
  };
  
  var arrayIncludes = function (arr2, topic) {
    var res = false;
    if (arr2.length == 0) return false;
    for (var j = 0; j < arr2.length; j++) {
      if (arr2[j] == topic) {
        return true;
      }
    }
    return false;
  };
  
  var arrayWithinArray = function (arr1, arr2) {
    var res = false;
    if (arr1.length == 0) return false;
    for (var j = 0; j < arr2.length; j++) {
      if (arr2[j] == arr1[0]) {
        var matched = 1;
        for (var i = 1; i < arr1.length && j + i < arr2.length; i++)
          if (arr1[i] == arr2[j + i]) matched++;
        if (matched == arr1.length) return true;
      }
    }
    return false;
  };
  
  var deleteDirectory = function(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file) => {
        const curPath = path + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          deleteDirectory(curPath); // Recursively delete subdirectories
        } else {
          fs.unlinkSync(curPath); // Delete files
        }
      });
      fs.rmdirSync(path); // Delete empty directory
      console.log(`Deleted directory: ${path}`);
    }
  };

  // Call program as an argument with node
  //console.log(process.argv)
  if (process.argv[2] == "extract") //node main extract <arguments>. Need to be in the api path.
    module.exports.extractionSetup();