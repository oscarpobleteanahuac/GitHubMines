# Github Extraction tool 

## About Github GraphQL API

### https://docs.github.com/en/graphql

### https://docs.github.com/en/graphql/overview/about-the-graphql-api


## Instructions
1. To generate the required GraphQL query for extracting the desired data, you can access the GraphQL explorer located at https://docs.github.com/en/graphql/overview/explorer. It is important to note that the ***graphql.js*** file already contains a default GraphQL query.

2. Generate as many GitHub tokens as you need; these tokens are necessary for extracting data through GitHub GraphQL APIs https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token. This is particularly important because GitHub GraphQL limits the amount of data that can be extracted. Creating multiple GitHub accounts and tokens is a way to bypass these extraction limits and ensure efficient data retrieval.

3. Paste the generated Github tokens inside ***githubTokens*** key in ***config.json***

4. To initiate the extraction and its pipeline, navigate to the GithubMines/api path in the terminal and execute the following command: 'node main extract `-q <query> -d <dateType> -b <startDate> -e <endDate>`. For additional details on the arguments and their default values, enter the command `node extract --help`. Keep in mind that a filter is being applied on ***service.js***, ensuring that the extracted data contains only results with code.

5. To review the extracted information, navigate to the ***Vault*** folder that was generated. Inside this folder, you will find separate folders containing the extracted data in both CSV and JSON formats. Please note that if another extraction command is executed, the data will be appended to the existing records, allowing the incorporation of supplementary information. To generate a new file, it is recommended to either rename the latest file or delete it before running another extraction command. This ensures that the new data is stored separately.

### api/Vault

All the extracted data is being stored separately inside this folder

### api/Vault/Query

This folder contains all the preprocessed results of the query.

### api/Vault/Languages

This folder contains all the extracted languages and their occurrences.

### api/Vault/Topics

This folder contains all the extracted topics and their occurrences.

### api/Vault/Dictionary

This folder contains the merged dictionary of topics, languages and data extracted from Stack Overflow in the past.

### api/Vault/Results

This folder contains a clean, augmented version of all the data extracted from the query.
