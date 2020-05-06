//  **  Dependencies

const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");

//  **  Declarations

const _myGitHubAccessToken = "1a25e08c59656340753ca20819a746dda5c4a1a5";
const _GITHUBAPI_USER_ENDPOINT = `https://api.github.com/users/%NAME%`;
const _GITHUBAPI_USERSEARCH_ENDPOINT = `https://api.github.com/users/search?q=%NAME%`
const _DEFAULT_OUTPUT_FILENAME = "README.out.md";

const _LICENSE_NONE = 0;
const _LICENSE_APACHE = 1;
const _LICENSE_BSD_3CLAUSE = 2;
const _LICENSE_CREATIVE_COMMONS_1 = 3;
const _LICENSE_GNU_GPL3 = 4;
const _LICENSE_MIT = 5;
const _LICENSE_MOZILLA = 6;
const _LICENSE_UNLICENSE = 7;

const _LICENSE_TYPES = [
    "No license",
    "Apache 2.0 License",
    "BSD 3-Clause License",
    "Creative Commons Zero 1.0",
    "GNU GPL v3",
    "The MIT License",
    "Mozilla Public License 2.0",
    "The Unlicense"
];
const _BASIC_USERSTORY = `
\`\`\`
AS A 
I WANT 
SO THAT 
\`\`\`

\`\`\`
GIVEN THAT 
WHEN I 
THEN 
\`\`\`
            `

let _user, _project;
let _team = [];
let _filename = "";

//  **  Constructors

/**
 * Constructor function for UserInfo objects
 * @param {Text} login GitHub username
 * @param {Text} avatarUrl URL for avatar image
 * @param {Text} email GitHub public email address
 * @param {Text} htmlUrl URL for GitHub profile page
 * @param {Text} type User type
 * @param {Boolean} siteAdmin TRUE if the user is an admin
 */
const UserInfo = function(login, avatarUrl, email, htmlUrl, type, siteAdmin) {
    return {
        name: login,
        avatar: avatarUrl,
        email: email,
        url: htmlUrl,
        type: type,
        isSiteAdmin: siteAdmin
    };
};

/**
 * Constructor function for Project data structures
 * @param {Text} name function name (with alt-name included)
 * @param {Text} logoUrl URL for project logo image
 * @param {Text} badges space-delimited list of MD image links for shield/badges
 * @param {Text} tag Project tagline
 * @param {Text} story Project User Story
 * @param {Text} desc Project Introduction
 * @param {Text} imageUrl URL(s) for main project screenshots
 * @param {Text} tech Technologies incorporated in project
 * @param {Text} install Installation instructions with MD screenshot links
 * @param {Text} usage Usage instructions with MS screenshot links
 * @param {Text} status Current project status
 * @param {Text} license License type
 * @param {Text} contrib List of contributors
 * @param {Text} tests Test instructions with MS screenshot links
 * @param {Text} faq Frequently asked questions
 * @param {Text} questions Contact details for asking questions
 */
const ProjectInfo = function (name, logoUrl, badges, tag, story, desc, imageUrl, tech, install, 
    usage, status, license, contrib, tests, faq, questions) {
    return {
        title: name,
        logo: logoUrl,
        badges: badges,
        tagline: tag,
        userStory: story,
        introduction: desc,
        image: imageUrl,
        technologies: tech,
        installation: install,
        usage: usage,
        status: status,
        license: license,
        contributing: contrib,
        tests: tests,
        FAQ: faq,
        questions: questions
    }
};

//  **  Functions

/**
 * Prompt the user for user and project details
 */
function getProjectData() {
    _filename = _DEFAULT_OUTPUT_FILENAME;
    if (process.argv[2] && process.argv[2] != "") {
        _filename = process.argv[2];
    };

    inquirer
    .prompt({
        message: "Please enter your GitHub username",
        name: "userName"
    })
    .then(response => {
        getGitUser(response.userName);
        return true;
    })
    .then(response => {
        inquirer
        .prompt([
        {
            type: "input",
            message: "Project Name?",
            default: "myProject",
            name: "projectName"
        },
        {
            type: "input",
            message: "Alternate Project Name?",
            name: "projectName2"            
        },
        {
            type: "input",
            message: "URL to project logo (blank if N/A):",
            name: "projectLogo"            
        },
        {
            type: "input",
            message: "Project Badges (separate with commas, blank for none):",
            name: "projectBadges"            
        },
        {
            type: "input",
            message: "Project tagline -",
            name: "projectTag"            
        },
        {
            type: "editor",
            message: "User Story -",
            name: "projectUserStory",
            default: _BASIC_USERSTORY
        },
        {
            type: "editor",
            message: "Project Introduction:",
            name: "projectIntro"
        },
        {
            type: "input",
            message: "Project Image URL (blank for none):",
            name: "projectImage"            
        },
        {
            type: "input",
            message: "Technologies incorporated in project (separate with commas):",
            name: "projectTech"            
        },
        {
            type: "editor",
            message: "Installation Instructions:",
            name: "projectInstall"
        },
        {
            type: "input",
            message: "Installation Screenshot URLs (separate with commas; blank for none):",
            name: "projectInstallScreenshots"            
        },
        {
            type: "editor",
            message: "Project Usage:",
            name: "projectUsage"
        },
        {
            type: "input",
            message: "Usage Screenshots (separate with commas; blank for none) -",
            name: "projectUsageScreenshots"            
        },
        {
            type: "list",
            message: "Project License",
            choices: _LICENSE_TYPES,
            name: "projectLicense"
        },
        {
            type: "input",
            message: "Current status of the project:",
            name: "projectStatus"
        },
        {
            type: "input",
            message: "Contributing Git Usernames (separate entries by commas; blank if none):",
            name: "projectCollab"
        },
        {
            type: "editor",
            message: "Tests:",
            name: "projectTests"
        },
        {
            type: "input",
            message: "Test Screenshots (separate with commas; blank for none) -",
            name: "projectTestScreenshots"            
        },
        {
            type: "editor",
            message: "Frequently Asked Questions:",
            name: "projectFAQ"
        },
        {
            type: "input",
            message: "For additional questions:",
            name: "projectQs"
        }])
        .then(response => {
            let projectContribList = [];
            let projectContributors = "";
            if (response.projectCollab != "") {
                projectContribList = splitAndTrim(response.projectCollab);
                //      Wanted to get user details on GitHub, but didn't have time to get the code working.
                // getTeam(projectContribList);
                projectContributors = projectContribList.join(", ");
            };

            let licenseIndex = _LICENSE_TYPES.indexOf(response.projectLicense);
            let licenseUrl = licenseURL(licenseIndex);
            let projectTitle = response.projectName
            
            if ((response.projectName2 != projectTitle) || (response.projectName2 == "")) {
                projectTitle += " - " + response.projectName2;
            };

            let projectLogo = "";
            if (response.projectLogo != "") {
                projectLogo = "![Project Logo](" + response.projectLogo + ")";
            };

            let projectBadgeList = [];
            if (response.projectBadges != "") {
                projectBadgeList = splitAndTrim(response.projectBadges);
            };
            projectBadgeList.push(licenseUrl);
            let projectBadges = projectBadgeList.join("   ");

            let projectTagline = response.projectTag;
            let projectUserStory = response.projectUserStory;
            let projectIntro = response.projectIntro;

            let projectImageArray = [];
            let projectImages = "";
            if (response.projectImage != "") {
                projectImageArray = splitAndTrim(response.projectImage);
                projectImageArray = projectImageArray.map((element, index) => `![Project Image ${index}](${element})`);
                projectImages = projectImageArray.join("\n");
            };

            let projectTech = response.projectTech;
            if (projectTech) {
                projectTech = splitAndTrim(projectTech);
                projectTech = projectTech.join("\\\n");
            }

            let projectInstall = response.projectInstall;

            let projectInstallScreenshots = [];
            if (response.projectInstallScreenshots != "") {
                projectInstallScreenshots = splitAndTrim(response.projectInstallScreenshots);
                projectInstallScreenshots = projectInstallScreenshots.map((element, index) => `![Project Install Image ${index}](${element})`);    
                projectInstallScreenshots.forEach(element => projectInstall += "\n" + element);
            };

            let projectUsage = response.projectUsage;

            let projectUsageScreenshots = [];
            if (response.projectUsageScreenshots != "") {
                projectUsageScreenshots = splitAndTrim(response.projectUsageScreenshots);
                projectUsageScreenshots = projectUsageScreenshots.map((element, index) => `![Project Usage Image ${index}](${element})`);    
                projectUsageScreenshots.forEach(element => projectUsage += "\n" + element);
            };

            let projectTests = response.projectTests;

            let projectTestScreenshots = [];
            if (response.projectTestScreenshots != "") {
                projectTestScreenshots = splitAndTrim(response.projectTestScreenshots);
                projectTestScreenshots = projectTestScreenshots.map((element, index) => `![Project Tests Image ${index}](${element})`);    
                projectTestScreenshots.forEach(element => projectTests += "\n" + element);
            };

            let projectStatus = response.projectStatus;
            let projectFAQ = response.projectFAQ;
            let projectForQuestions = response.projectQs;

            //  Plug the answers into a data structure for projects
            _project = new ProjectInfo(projectTitle, projectLogo, projectBadges, projectTagline, projectUserStory, projectIntro, projectImages, 
                projectTech, projectInstall, projectUsage, projectStatus, response.projectLicense, projectContributors, projectTests, 
                projectFAQ, projectForQuestions);
            
            //  Now create the readme with the user answers
            generateReadme(_user, _project);
        });
    });
};

/**
 * Create and output the ReadMe.md file
 * @param {Object} userData Data structure for user information
 * @param {Object} projectData Data structure for project information
 */
function generateReadme(userData, projectData) {
    const {
        title, 
        logo, 
        badges, 
        tagline, 
        userStory, 
        introduction, 
        image, 
        technologies, 
        installation, 
        usage, 
        status, 
        license, 
        contributing, 
        tests, 
        FAQ,
        questions
    } = projectData;

    let hasLogo = (logo != "");
    let hasBadges = (badges != "");
    let hasTagline = (tagline != "");
    let hasIntro = (introduction != "");
    let hasProjectImage = (image != "");
    let hasTeam = (contributing != "");
    let hasLicense = !((license == "") || (license == _LICENSE_TYPES[_LICENSE_NONE]));
    let hasTests = (tests != "");
    let hasFAQ = (FAQ != "");
    let hasUserName = (userData.name != "");
    let hasAvatar = (userData.avatar != "");
    let currentDate = new Date().toLocaleDateString();

    let mdText = "";
    if (hasLogo) {
        mdText = logo + "\n";
    };
    
    mdText +=
`# ${title}
`;

    if (hasBadges) {
        mdText += badges + "\n";
    };

    mdText += "\n";

    if (hasTagline) {
        mdText += "> " + tagline + "\n\n";
    };

    if (hasIntro) {
        mdText += introduction + "\n\n";
    };

    mdText += 
`## User Story
${userStory}

`;

    if (hasProjectImage) {
        mdText += "## Graphic\n" + image + "\n";
    };

    mdText +=
`
## Table of Contents
* [Technologies](#Technologies)
* [Getting Started](#Getting)
* [Usage](#Usage)
`;

    if (hasTests) {
        mdText += `* [Tests](#Running)\n`;
    };

    if (hasTeam) {
        mdText += `* [Team](#Team)\n`;
    };

    mdText +=
`* [Project Status](#Project)
* [Frequently Asked Questions](#FAQ)
* [Questions](#Additional)
* [Contributing](#Contributing)
`;

    if (hasLicense) {
        mdText += "* [License](#License)\n";
    };

    mdText +=
`## Technologies
${technologies}

## Getting Started
${installation}

## Usage
${usage}

`;

    if (hasTests) {
        mdText += 
`## Running the Tests
${tests}
`;
    };

    if (hasTeam) {
        mdText += 
`## Team
${contributing}
`;
    };

    mdText +=
`## Project Status
${status}

`

if (hasFAQ) {
    mdText += 
`## FAQ
${FAQ}
`
};

    mdText +=
`
## Additional Questions
${questions}

## Contributing
Contact us for guidelines on submitting contributions.

`;

    if (hasLicense) {
        mdText += 
`## License
This project is licensed under the ${license}.

`
    };

    if (hasAvatar) {
        mdText += `![User Avatar Picture](${userData.avatar})\n`;
    };
    if (hasUserName) {
        mdText += `## ${userData.name}\n`
    }
    mdText +=
`
This file generated on ${currentDate} by goodReadMeGenerator, copyright 2020 Jonathan Andrews\n
`

   fs.writeFileSync(_filename, mdText, "utf8");
   console.log(`'${_filename}' written to file successfully!`)
};

//  **  Utility Functions

/**
 * Query the GitHub API to learn details on the user
 * @param {Text} userName GitHub user name
 */
function getGitUser(userName) {
    let queryUrl = _GITHUBAPI_USER_ENDPOINT.replace("%NAME%", userName);
    axios
    .get(queryUrl, {headers: {Authorization: _myGitHubAccessToken}})
    .then(data => {
        const responseData = data.data;
        const { login, id, node_id, avatar_url, email, url, html_url, type, site_admin } = responseData;

        userData = new UserInfo(login, avatar_url, email, html_url, type, site_admin);
        _user = userData;
    });
};

/**
 * Query the GitHub search API to find the listed user
 * @param {Text} searchTerm GitHub user name
 */
function findGitUser(searchTerm) {
    let userData;
    let queryUrl = _GITHUBAPI_USERSEARCH_ENDPOINT.replace("%NAME%", searchTerm);

    axios
    .get(queryUrl, {headers: {Authorization: _myGitHubAccessToken}})
    .then(data => {
        if (!data.data) {
            userData = null;
            return;
        }

        for (let i = 0; i < data.data.items.length; i++) {
            const userItems = data.data.items[i];
            const { login, id, node_id, avatar_url, email, url, html_url, type, site_admin } = userItems;

            userData = new UserInfo(login, avatar_url, email, html_url, type, site_admin);
            _team.push(userData);
        };
    });
};

/**
 * Iterate through a list of collaborators to gain and store information on each
 * @param {Array} teamNameArray Array of GitHub user names
 */
function getTeam(teamNameArray) {
    teamNameArray.forEach(element => {
        let userData;
        let queryUrl = _GITHUBAPI_USERSEARCH_ENDPOINT.replace("%NAME%", element);

        axios
        .get(queryUrl, {headers: {Authorization: _myGitHubAccessToken}})
        .then(data => {
            if (!data.data) {
                userData = null;
                return;
            }

            for (let i = 0; i < data.data.items.length; i++) {
                const userItems = data.data.items[i];
                const { login, id, node_id, avatar_url, email, url, html_url, type, site_admin } = userItems;

                userData = new UserInfo(login, avatar_url, email, html_url, type, site_admin);
                _team.push(userData);
            };
        });
    });
};

/**
 * Return the MD image link for the given license
 * @param {Number} licenseType License type per the enumerated constant _LICENSE_ values
 */
function licenseURL(licenseType) {
    let returnString = "";
    switch (licenseType) {
        case _LICENSE_APACHE:
            returnString = "[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)";
            break;
        case _LICENSE_BSD_3CLAUSE:
            returnString = "[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)";
            break;
        case _LICENSE_CREATIVE_COMMONS_1:
            returnString = "[![License: CC0-1.0](https://img.shields.io/badge/License-CC0%201.0-lightgrey.svg)](http://creativecommons.org/publicdomain/zero/1.0/)";
            break;
        case _LICENSE_GNU_GPL3:
            returnString = "[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)";
            break;
        case _LICENSE_MIT:
            returnString = "[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)";
            break;
        case _LICENSE_MOZILLA:
            returnString = "[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)";
            break;
        case _LICENSE_UNLICENSE:
            returnString = "[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](http://unlicense.org/)";
            break;
        default:
    };
    return returnString;
};

/**
 * Breaks string into an array along a given delimiter and trims the results
 * @param {Text} targetString String to split
 * @param {Text} delimiter Delimiter on which to split the string, or a comma (,) if none given
 */
function splitAndTrim(targetString, delimiter) {
    if (!delimiter || (delimiter == "")) {
        delimiter = ","
    };
    let returnArray = targetString.split(delimiter);
    returnArray = returnArray.map(element => element.trim());
    return returnArray;
};

//  **  Logic

_user = new UserInfo(null, null, null, null, null, null);
_project = new ProjectInfo(null, null, null, null, null, null, null, null);

getProjectData();


