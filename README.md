# **Aura Helper Package Generator Module**
Aura Helper Package Generator Module contains a powerfull class to create and merge package files to deploy, retrieve or delete metadata from your Salesforce's projects.

You can choose to merge several package xml files (including destructiveChanges.xml and destructiveChangesPost.xml files) to combine into one file of each type, combine all packages in one file and all detructives in another file or merge all files into one package or destructive file.

Also you can create packages XML files from a JSON file (See [Metadata JSON Format](#metadata-file) section). Use TypesFactory class from Types module from [@ah/core](https://github.com/JJLongoria/aura-helper-core) to help to you to create the JSON file from a downloaded metadata (yo can use [@ah/connetor](https://github.com/JJLongoria/aura-helper-connector) to download it) or getting it from a project in your computer ([@ah/core](https://github.com/JJLongoria/aura-helper-core) > Types > TypesFactory).

To handle the JSON file types better, you can use MetadataType, MetadataObject and MetadataItem classes from [@ah/core](https://github.com/JJLongoria/aura-helper-core) > Types. Also you can use this classes to create your own JSON file and use the validateJSON() method to check if the file is correct.

# [**Usage**](#usage)
 
## [**Merge Package Files**](#mergePackageFiles)
You have several options to merge package files: 
- [Merge by type](#mergePackageFilesByType): You can choose a list of package XML and destructive XML files to combine into one file by type (package.xml, destructiveChanges.xml and destructiveChangesPost.xml).
- [Merge all Destructive XML post deployment](#mergePackageFilesPostDeploy):Merge all package files into one package XML file, and all destructive file into only one destructive XML file pre post deployment
- [Merge all Destructive XML pre deployment](#mergePackageFilesPreDeploy): Merge all package files into one package XML file, and all destructive file into only one destructive XML file pre deployment
- [Full Merge into Package XML](#mergeFullPackage): Merge all package XML and destructive XML files into only one package XML
- [Full Merge into Destructive XML post deployment](#mergeFullPostDeploy): Merge all package XML and destructive XML files into only one destructive XML file pre post deployment
- [Full Merge into Destructive XML pre deployment](#mergeFullPreDeploy): Merge all destructive pre deployment: Merge all package XML and destructive XML files into only one destructive XML file pre deployment

The file names must contains at least the "package" word to identify the package XML files and destructiveChanges or destrutiveChangesPost to the destructive files. For example: package1.xml, destructiveChanges_uat.xml, destructiveChangesPost-v34...

You can choose a custom API Version to create the packages, if not specified API version, the package generator get the higher API version from each file types, that is, for package XML files, get the higher API of the Package XML files passed, and the same with other file types. 

***

### [**Merge By Type**](#mergePackageFilesByType)
Merge all package XML file into one package XML file, merge all destructive changes pre deployment into one destructiveChanges XML and merge all destructive changes post deployment into one destructiveChangesPost XML.

    const PackageGenerator = require('@ah/package-generator');
    const filePaths = [
        '/test/package/package1.xml',                       // package.xml
        '/test/package/package2.xml',                       // package.xml
        '/test/package/package3.xml',                       // package.xml
        '/test/package/destructiveChanges-dev.xml',         // destructiveChanges.xml
        '/test/package/destructiveChanges-uat.xml',         // destructiveChanges.xml
        '/test/package/destructiveChangesPost1.xml',        // destructiveChangesPost.xml
        '/test/package/destructiveChangesPost-v34.xml'      // destructiveChangesPost.xml
        '/test/package/destructiveChangesPostCustom.xml'    // destructiveChangesPost.xml
    ];
    const outputFolder = 'path/to/the/output/folder';

    const result = PackageGenerator.mergePackages(filePaths, outputFolder); // Return an object with the full path of the created files;

    console.log(result.package);                    // [pathFromRoot]/path/to/the/output/folder/package.xml
    console.log(result.destructiveChanges);         // [pathFromRoot]/path/to/the/output/folder/destructiveChanges.xml
    console.log(result.destructiveChangesPost);     // [pathFromRoot]/path/to/the/output/folder/destructiveChangesPost.xml
 
***
### [**Merge All Destructive XML Post Deployment**](#mergePackageFilesPostDeploy)
Merge all package XML file into one package XML file and merge all destructive changes pre and post deployment into one destructiveChanges XML post deployment. 

    const PackageGenerator = require('@ah/package-generator');
    const filePaths = [
        '/test/package/package1.xml',                       // package.xml
        '/test/package/package2.xml',                       // package.xml
        '/test/package/package3.xml',                       // package.xml
        '/test/package/destructiveChanges-dev.xml',         // destructiveChanges.xml
        '/test/package/destructiveChanges-uat.xml',         // destructiveChanges.xml
        '/test/package/destructiveChangesPost1.xml',        // destructiveChangesPost.xml
        '/test/package/destructiveChangesPost-v34.xml'      // destructiveChangesPost.xml
        '/test/package/destructiveChangesPostCustom.xml'    // destructiveChangesPost.xml
    ];
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';
    const mergeDestructives = true;

    const result = PackageGenerator.mergePackages(filePaths, outputFolder, apiVersion, mergeDestructives); // Return an object with the full path of the created files;
    
    console.log(result.package);                    // [pathFromRoot]/path/to/the/output/folder/package.xml
    console.log(result.destructiveChanges);         // undefined    (By default, create destructives after deploy)
    console.log(result.destructiveChangesPost);     // [pathFromRoot]/path/to/the/output/folder/destructiveChangesPost.xml

***
### [**Merge All Destructive XML Pre Deployment**](#mergePackageFilesPreDeploy)
Merge all package XML file into one package XML file and merge all destructive changes pre and post deployment into one destructiveChanges XML pre deployment.

    const PackageGenerator = require('@ah/package-generator');
    const filePaths = [
        '/test/package/package1.xml',                       // package.xml
        '/test/package/package2.xml',                       // package.xml
        '/test/package/package3.xml',                       // package.xml
        '/test/package/destructiveChanges-dev.xml',         // destructiveChanges.xml
        '/test/package/destructiveChanges-uat.xml',         // destructiveChanges.xml
        '/test/package/destructiveChangesPost1.xml',        // destructiveChangesPost.xml
        '/test/package/destructiveChangesPost-v34.xml'      // destructiveChangesPost.xml
        '/test/package/destructiveChangesPostCustom.xml'    // destructiveChangesPost.xml
    ];
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';
    const mergeDestructives = true;
    const beforeDeploy = true;

    const result = PackageGenerator.mergePackages(filePaths, outputFolder, apiVersion, mergeDestructives, beforeDeploy); // Return an object with the full path of the created files;
    
    console.log(result.package);                    // [pathFromRoot]/path/to/the/output/folder/package.xml
    console.log(result.destructiveChanges);         // [pathFromRoot]/path/to/the/output/folder/destructiveChanges.xml
    console.log(result.destructiveChangesPost);     // undefined

***
### [**Merge Full into Package XML**](#mergeFullPackage)
Merge all package XML, all destructiveChanges XML and all destructiveChangesPost XML files into one package XML file.

    const PackageGenerator = require('@ah/package-generator');
    const filePaths = [
        '/test/package/package1.xml',                       // package.xml
        '/test/package/package2.xml',                       // package.xml
        '/test/package/package3.xml',                       // package.xml
        '/test/package/destructiveChanges-dev.xml',         // destructiveChanges.xml
        '/test/package/destructiveChanges-uat.xml',         // destructiveChanges.xml
        '/test/package/destructiveChangesPost1.xml',        // destructiveChangesPost.xml
        '/test/package/destructiveChangesPost-v34.xml'      // destructiveChangesPost.xml
        '/test/package/destructiveChangesPostCustom.xml'    // destructiveChangesPost.xml
    ];
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';

    const result = PackageGenerator.mergePackagesFull(filePaths, outputFolder, apiVersion); // Return an object with the full path of the created files;
    
    console.log(result.package);                    // [pathFromRoot]/path/to/the/output/folder/package.xml
    console.log(result.destructiveChanges);         // undefined
    console.log(result.destructiveChangesPost);     // undefined

***
### [**Merge Full into Destructive XML Post Deployment**](#mergeFullPostDeploy)
Merge all package XML, all destructiveChanges XML and all destructiveChangesPost XML files into one destructiveChangesPost XML file.

    const PackageGenerator = require('@ah/package-generator');
    const filePaths = [
        '/test/package/package1.xml',                       // package.xml
        '/test/package/package2.xml',                       // package.xml
        '/test/package/package3.xml',                       // package.xml
        '/test/package/destructiveChanges-dev.xml',         // destructiveChanges.xml
        '/test/package/destructiveChanges-uat.xml',         // destructiveChanges.xml
        '/test/package/destructiveChangesPost1.xml',        // destructiveChangesPost.xml
        '/test/package/destructiveChangesPost-v34.xml'      // destructiveChangesPost.xml
        '/test/package/destructiveChangesPostCustom.xml'    // destructiveChangesPost.xml
    ];
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';
    const isDestructive = true;

    const result = PackageGenerator.mergePackagesFull(filePaths, outputFolder, apiVersion, isDestructive); // Return an object with the full path of the created files;
    
    console.log(result.package);                    // undefined
    console.log(result.destructiveChanges);         // undefined        (By default, create destructives after deploy)
    console.log(result.destructiveChangesPost);     // [pathFromRoot]/path/to/the/output/folder/destructiveChangesPost.xml

***
### [**Merge Full into Destructive XML Pre Deployment**](#mergeFullPreDeploy)
Merge all package XML, all destructiveChanges XML and all destructiveChangesPost XML files into one destructiveChanges XML file.

    const PackageGenerator = require('@ah/package-generator');
    const filePaths = [
        '/test/package/package1.xml',                       // package.xml
        '/test/package/package2.xml',                       // package.xml
        '/test/package/package3.xml',                       // package.xml
        '/test/package/destructiveChanges-dev.xml',         // destructiveChanges.xml
        '/test/package/destructiveChanges-uat.xml',         // destructiveChanges.xml
        '/test/package/destructiveChangesPost1.xml',        // destructiveChangesPost.xml
        '/test/package/destructiveChangesPost-v34.xml'      // destructiveChangesPost.xml
        '/test/package/destructiveChangesPostCustom.xml'    // destructiveChangesPost.xml
    ];
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';
    const isDestructive = true;
    const beforeDeploy = true;

    const result = PackageGenerator.mergePackagesFull(filePaths, outputFolder, apiVersion, isDestructive, beforeDeploy); // Return an object with the full path of the created files;
    
    console.log(result.package);                    // undefined
    console.log(result.destructiveChanges);         // [pathFromRoot]/path/to/the/output/folder/destructiveChanges.xml
    console.log(result.destructiveChangesPost);     // undefined

***
***

## [**Create Package from Metadata JSON File**](#createPackages)
You can create easy a package XML, destructiveChanges XML or destructiveChangesPost XML files from a JSON Metadata file. Options:
- [Create Package XML](#createPackageXML): Create Package XML file from a JSON Metadata File.
- [Create Destrtuctive Changes XML](#createDestructiveChangesXML): Create Destructive Changes XML file from a JSON Metadata File.
- [Create Destructive Changes Post XML](#createDestructiveChangesPostXML): Create Destructive Changes Post XML file from a JSON Metadata File.
- [Get XML Content only](#getPackageContent): Get the XML Content from a JSON Metadata File.
- [Create and Validate your own JSON File](#createJSONFile): Create your own JSON file easy and validate to check if is valid.

***
### [**Create Package XML**](#createPackageXML)
Create Package XML file from a JSON Metadata File. See [Metadata JSON Format](#metadata-file) section to understand the JSON Metadata File.

    const PackageGenerator = require('@ah/package-generator');
    const jsonFilePath = 'path/to/json/metadata.json';
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';
    const explicit = true;      // true to put all element names explicit in package, false to use wildcards if apply. (recommended explicit=true)

    const packageFromFileResult = PackageGenerator.createPackage(jsonFilePath, outputFolder, apiVersion, explicit);

    console.log(packageFromFileResult);                    // [pathFromRoot]/path/to/json/package.xml

    // Also you can create the package from a JSON
    
    const jsonContent = JSON.parse(fs.readFileSync('jsonFilePath', 'utf8'));
    const packageFromJSONObjectResult = PackageGenerator.createPackage(jsonContent, outputFolder, apiVersion, explicit);

    console.log(packageFromJSONObjectResult);                    // [pathFromRoot]/path/to/json/package.xml

***
### [**Create Destrtuctive Changes XML**](#createDestructiveChangesXML)
Create Destructive Changes XML file from a JSON Metadata File. See [Metadata JSON Format](#metadata-file) section to understand the JSON Metadata File.

    const PackageGenerator = require('@ah/package-generator');
    const jsonFilePath = 'path/to/json/metadata.json';
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';
    const explicit = true;      // true to put all element names explicit in package, false to use wildcards if apply. (recommended explicit=true)

    const packageFromFileResult = PackageGenerator.createBeforeDeployDestructive(jsonFilePath, outputFolder, apiVersion, explicit);

    console.log(packageFromFileResult);                    // [pathFromRoot]/path/to/json/destructiveChanges.xml

    // Also you can create the package from a JSON
    
    const jsonContent = JSON.parse(fs.readFileSync('jsonFilePath', 'utf8'));
    const packageFromJSONObjectResult = PackageGenerator.createPackage(jsonContent, outputFolder, apiVersion, explicit);

    console.log(packageFromJSONObjectResult);                    // [pathFromRoot]/path/to/json/destructiveChanges.xml

***
### [**Create Destructive Changes Post XML**](#createDestructiveChangesPostXML)
Create Destructive Changes Post XML file from a JSON Metadata File. See [Metadata JSON Format](#metadata-file) section to understand the JSON Metadata File.

    const PackageGenerator = require('@ah/package-generator');
    const jsonFilePath = 'path/to/json/metadata.json';
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';
    const explicit = true;      // true to put all element names explicit in package, false to use wildcards if apply. (recommended explicit=true)

    const packageFromFileResult = PackageGenerator.createAfterDeployDestructive(jsonFilePath, outputFolder, apiVersion, explicit);

    console.log(packageFromFileResult);                    // [pathFromRoot]/path/to/json/destructiveChangesPost.xml

    // Also you can create the package from a JSON
    
    const jsonContent = JSON.parse(fs.readFileSync('jsonFilePath', 'utf8'));
    const packageFromJSONObjectResult = PackageGenerator.createPackage(jsonContent, outputFolder, apiVersion, explicit);

    console.log(packageFromJSONObjectResult);                    // [pathFromRoot]/path/to/json/destructiveChangesPost.xml

***

### [**Get XML Content only**](#getPackageContent)
In addition to creating the files, you can instead get the content of the XML file from the JSON file to handle as you want. See [Metadata JSON Format](#metadata-file) section to understand the JSON Metadata File.

    const PackageGenerator = require('@ah/package-generator');
    const jsonFilePath = 'path/to/json/metadata.json';
    const outputFolder = 'path/to/the/output/folder';
    const apiVersion = '50.0';
    const explicit = true;      // true to put all element names explicit in package, false to use wildcards if apply. (recommended explicit=true)

    const xmlResultFromFile = PackageGenerator.createAfterDeployDestructive(jsonFilePath, outputFolder, apiVersion, explicit);

    console.log(xmlResultFromFile);                    // <?xml version="1.0" encoding="UTF-8"?>
                                                       // <Package xmlns="http://soap.sforce.com/2006/04/metadata">
                                                       // ...


    // Also you can get XML package content from a JSON
    
    const jsonContent = JSON.parse(fs.readFileSync('jsonFilePath', 'utf8'));
    const xmlResultFromJSON = PackageGenerator.createPackage(jsonContent, outputFolder, apiVersion, explicit);

    console.log(xmlResultFromJSON);                    // <?xml version="1.0" encoding="UTF-8"?>
                                                       // <Package xmlns="http://soap.sforce.com/2006/04/metadata">
                                                       // ...

***

### [**Create and Validate your own JSON File**](#createJSONFile)
Also, you can create your own JSON file to create package files and handle metadata types easy with the MetadataType, MetadataObject and MetadataItem classes from  from [@ah/core](https://github.com/JJLongoria/aura-helper-core). After create the JSON you can validate easy yo check if is correct (PackageGenerator Class always validate theh JSON content before create the package). See [Metadata JSON Format](#metadata-file) section to understand the JSON Metadata File.

    const PackageGenerator = require('@ah/package-generator');
    const { MetadataType, MetadataObject, MetadataItem } = require('@ah/core').Types;

    // Instance a Metadata Type
    const customObjectType = new MetadataType('CustomObject', checkedOrNot, '.../force-app/main/default/objects', 'object');

    // Add Childs to the Metadata Type
    customObjectType.addChild('Account', new MetadataObject('Account', checkedOrNot, '.../force-app/main/default/objects/Account/Account.object-meta.xml'));
    customObjectType.addChild('Case', new MetadataObject('Case', checkedOrNot, '.../force-app/main/default/objects/Case/Case.object-meta.xml'));
    customObjectType.addChild('CustomObject__c', new MetadataObject('CustomObject__c', checkedOrNot, '.../force-app/main/default/objects/CustomObject__c/CustomObject__c.object-meta.xml'));

    // Instance other Metadata Type
    const customFieldType = new MetadataType('CustomField', checkedOrNot, '.../force-app/main/default/objects', 'field');

    // Add child to the Metadata Type
    customFieldType.addChild('Account', new MetadataObject('Account', checkedOrNot, '.../force-app/main/default/objects/Account'));
    
    // Add childs to the Metadata Object
    customFieldType.getChild('Account').addChild('Name', new MetadataItem('Name', checkedOrNot, '.../force-app/main/default/objects/Account/fields/Name.field-meta.xml'));
    customFieldType.getChild('Account').addChild('CustomField__c', new MetadataItem('CustomField__c', checkedOrNot, '.../force-app/main/default/objects/Account/fields/CustomField__c.field-meta.xml'));

    // Add child to the Metadata Type
    customFieldType.addChild('Case', new MetadataObject('Case', checkedOrNot, '.../force-app/main/default/objects/Case'));

    // Add childs to the Metadata Object
    customFieldType.getChild('Case').addChild('Subject', new MetadataItem('Subject', checkedOrNot, '.../force-app/main/default/objects/Case/fields/Subject.field-meta.xml'));
    customFieldType.getChild('Case').addChild('CustomField__c', new MetadataItem('CustomField__c', checkedOrNot, '.../force-app/main/default/objects/Case/fields/CustomField__c.field-meta.xml'));

    // Add the MetadataTypes to the main Object
    const metadataJSON = {
        CustomObject: customObjectType,
        CustomField: customFieldType
    };

    
    // Now you can create a package XML or validate the created object to ensure that is correct.
    try{
        PackageGenerator.validateJSON(metadataJSON);
    } catch(error){
        // JSON is not valid
        console.log(error.message);     // Description about the error
    }

    // Also you can validate directly a JSON file
    try{
        PackageGenerator.validateJSON('path/to/the/json/metadata');
    } catch(error){
        // JSON is not valid
        console.log(error.message);     // Description about the error
    }

***
***

# [**Metadata JSON Format**](#metadata-file)

The JSON file used by the Package Generator Module have the next structure. Some fields are required and the datatypes checked to ensure the correct file structure. 

    {
        "MetadataAPIName": {
            "name": "MetadataAPIName",                                  // Required (String). Contains the Metadata Type API Name (like object Key)
            "checked": false,                                           // Required (Boolean). Field for include this type on package or not
            "path": "path/to/the/metadata/folder",                      // Optional (String). Path to the Metadata Type folder in local project
            "suffix": "fileSuffix",                                     // Optional (String). Metadata File suffix
            "childs": {                                                 // Object with a collection of childs (Field required (JSON Object) but can be an empty object)
                "MetadataObjectName":{
                    "name": "MetadataObjectName",                       // Required (String). Contains the Metadata Object API Name (like object Key)
                    "checked": false,                                   // Required (Boolean). Field for include this object on package or not
                    "path": "path/to/the/metadata/file/or/folder",      // Optional (String). Path to the object file or folder path
                    "childs": {                                         // Object with a collection of childs (Field required (JSON Object) but can be an empty object)
                        "MetadataItemName": {
                            "name": "MetadataItemName",                 // Required (String). Contains the Metadata Item API Name (like object Key)
                            "checked": false,                           // Required (Boolean). Field for include this object on package or not
                            "path": "path/to/the/metadata/file"
                        },
                        "MetadataItemName2": {
                            ...
                        },
                        ...,
                        ...,
                        ...
                    }
                }
                "MetadataObjectName2":{
                   ...
                },
                ...,
                ...,
                ...
            }
        }
    }

*Example*:

***
    {
        "CustomObject": {
            "name": "CustomObject",
            "checked": false,
            "path":  "path/to/root/project/force-app/main/default/objects",
            "suffix": "object",
            "childs": {
                "Account": {
                    "name": "Account",
                    "checked": true,            // Add Account Object to the package
                    "path": "path/to/root/project/force-app/main/default/objects/Account/Account.object-meta.xml",
                    "childs": {}
                },
                "Case": {
                    "name": "Case",
                    "checked": true,            // Add Case Object to the package
                    "path": "path/to/root/project/force-app/main/default/objects/Case/Case.object-meta.xml",
                    "childs": {}
                },
                ...,
                ...,
                ...
            }
        },
        "CustomField": {
            "name": "CustomField",
            "checked": false,
            "path":  "path/to/root/project/force-app/main/default/objects",
            "suffix": "field",
            "childs": {
                "Account": {
                    "name": "Account",
                    "checked": false,            
                    "path": "path/to/root/project/force-app/main/default/objects/Account/fields",
                    "childs": {
                        "customField__c": {
                            "name": "customField__c",
                            "checked": true,    // Add customField__c to the package
                            "path": "path/to/root/project/force-app/main/default/objects/Account/fields/customField__c.field-meta.xml",
                        },
                        ...,
                        ...,
                        ...
                    }
                },
                "Case": {
                    "name": "Case",
                    "checked": false,           
                    "path": "path/to/root/project/force-app/main/default/objects/Case/fields",
                    "childs": {
                        "CaseNumber": {
                            "name": "CaseNumber",
                            "checked": true,    // Add CaseNumber to the package
                            "path": "path/to/root/project/force-app/main/default/objects/Account/fields/CaseNumber.field-meta.xml",
                        },
                        ...,
                        ...,
                        ...
                    }
                },
                ...,
                ...,
                ...
            }
        }
    }










