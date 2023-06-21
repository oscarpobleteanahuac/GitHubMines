const fs = require("fs");
const JSONToCSV = require("json2csv").parse;
const configV3 = require("./config.json");
module.exports = {
  //Saving json formatted data
   save2JSON: async (data, callback) => {
    try {
      const dir = `${configV3.vault.folderName}${data.foldertoname}`;

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = `${configV3.vault.folderName}${data.foldertoname}${data.filetoname}.json`;
  
      fs.readFile(filePath, "utf8", function (err, fileContent) {
        if (err) {
          // File doesn't exist, create new file
          fs.writeFile(filePath, JSON.stringify(data.response, null, 4), function (err) {
            if (err) return callback(err);
            return callback(null, `Saved on ${filePath}`);
          });
        } else {
          // File exists, append to existing content
          let existingData = JSON.parse(fileContent);
          existingData = existingData.concat(data.response);
  
          fs.writeFile(filePath, JSON.stringify(existingData, null, 4), function (err) {
            if (err) return callback(err);
            return callback(null, `Appended to ${filePath}`);
          });
        }
      });
    } catch (error) {
      callback(error);
    }
  },
  //Saving CSV formatted data
  save2CSV: (data, callBack) => {
    try {
      const directory = `${configV3.vault.folderName}${data.foldertoname}`;
  
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
  
      const filePath = `${configV3.vault.folderName}${data.foldertoname}${data.filetoname}.csv`;
  
      const csv = JSONToCSV(data.response); 
  
      if (fs.existsSync(filePath)) {
        fs.appendFileSync(filePath, csv);
        return callBack(null, `Appended to ${filePath}`);
      } else {
        fs.writeFileSync(filePath, csv);
        return callBack(null, `Saved on ${filePath}`);
      }
    } catch (error) {
      callBack(error);
    }
  }
};
