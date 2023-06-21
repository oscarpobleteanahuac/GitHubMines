function queryCreated(queryGit, first) {
  return `{
          rateLimit {
            limit
            cost
            remaining
            used  
            resetAt
            nodeCount
          }
          search(first:${first}, query:"${queryGit}", type: REPOSITORY) {
            pageInfo { # Retrieving page information
              hasNextPage 
              endCursor 
            }
            # GENERAL INFO
            repositoryCount # Total count of repositories matching the search query
            userCount 
            wikiCount 
            # PARTICULAR INFO
            edges { 
              cursor # The cursor for the current item in the list
              node { 
                ... on Repository {
                  name # Name of the repository
                  nameWithOwner # Name of the owner
                  id 
                  url #URL of the repository
                  mirrorUrl 
                  tempCloneToken 
                  assignableUsers { 
                    totalCount # Total count of users that can be assigned to issues in the repository
                  }
                  createdAt 
                  databaseId  
                  description 
                  stargazerCount           
                  forkCount 
                  diskUsage 
                    watchers {
                    totalCount # Total count of users watching the repository
                  }
            # ENVIRONMENTS
                  environments(first: 5) {
                    edges { 
                      node {  
                        name # Name of the environment
                      }
                    }
                    totalCount # Total count of environments in the repository
                  }
            # LABELS
                  labels {
                    totalCount # Total count of labels in the repository
                  }
            # ISSUES
                  issues { 
                    totalCount #Total count of issues in the repository
                  }
            # LANGUAGES
                  languages(first: 10) {
                    edges {
                      node {
                        name # Name of the programming language used in the repository
                      }
                    }
                    totalCount # Total count of programming languages used in the repository
                  }
                  primaryLanguage {
                    name  # Name of the primary programming language used in the repository
                  }
            # PROJECTS
                  projects {
                    totalCount # Total count of projects in the repository
                  }
            # TOPICS
                  repositoryTopics(first: 10) {
                    edges {
                      node {
                        topic {
                          name # Name of the topic associated with the repository
                          stargazerCount # Number of users who have starred the topic
                        }
                      }
                    }
                    totalCount # Total count of topics associated with the repository
                  }
            # SUBMODULES
                  submodules(first: 10) {
                    edges {
                      node {
                        name # Name of the submodule
                      }
                    }
                    totalCount # Total count of submodules in the repository
                  }         
                }
              }
            }
          }
        }
        `;
}

function queryCreatedCursor(queryGit, first, cursor) {
  return `{
          rateLimit {
            limit
            cost
            remaining
            used
            resetAt
            nodeCount
          }
          search(first: ${first}, query:"${queryGit}", type: REPOSITORY,after: "${cursor}") {
            pageInfo { # Retrieving page information
              hasNextPage 
              endCursor 
            }
            # GENERAL INFO
            repositoryCount # Total count of repositories matching the search query
            userCount 
            wikiCount 
            # PARTICULAR INFO
            edges { 
              cursor # The cursor for the current item in the list
              node { 
                ... on Repository {
                  name # Name of the repository
                  nameWithOwner # Name of the owner
                  id 
                  url #URL of the repository
                  mirrorUrl 
                  tempCloneToken 
                  assignableUsers { 
                    totalCount # Total count of users that can be assigned to issues in the repository
                  }
                  createdAt 
                  databaseId  
                  description 
                  stargazerCount           
                  forkCount 
                  diskUsage 
                    watchers {
                    totalCount # Total count of users watching the repository
                  }
            # ENVIRONMENTS
                  environments(first: 5) {
                    edges { 
                      node {  
                        name # Name of the environment
                      }
                    }
                    totalCount # Total count of environments in the repository
                  }
            # LABELS
                  labels {
                    totalCount # Total count of labels in the repository
                  }
            # ISSUES
                  issues { 
                    totalCount #Total count of issues in the repository
                  }
            # LANGUAGES
                  languages(first: 10) {
                    edges {
                      node {
                        name # Name of the programming language used in the repository
                      }
                    }
                    totalCount # Total count of programming languages used in the repository
                  }
                  primaryLanguage {
                    name  # Name of the primary programming language used in the repository
                  }
            # PROJECTS
                  projects {
                    totalCount # Total count of projects in the repository
                  }
            # TOPICS
                  repositoryTopics(first: 10) {
                    edges {
                      node {
                        topic {
                          name # Name of the topic associated with the repository
                          stargazerCount # Number of users who have starred the topic
                        }
                      }
                    }
                    totalCount # Total count of topics associated with the repository
                  }
            # SUBMODULES
                  submodules(first: 10) {
                    edges {
                      node {
                        name # Name of the submodule
                      }
                    }
                    totalCount # Total count of submodules in the repository
                  }        
                }
              }
            }
          }
        }
        `;
}
function queryRepoCount(queryGit) {
  return `{
          search(query:"${queryGit}", type: REPOSITORY) {
            repositoryCount
          }
        }
        `;
}


module.exports = {
  queryCreated,
  queryCreatedCursor,
  queryRepoCount,
};
