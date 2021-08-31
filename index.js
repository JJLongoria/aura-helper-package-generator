const { XML } = require('@ah/languages');
const XMLParser = XML.XMLParser;
const XMLUtils = XML.XMLUtils;
const { Validator, ProjectUtils, Utils } = require('@ah/core').CoreUtils;
const { DataNotFoundException } = require('@ah/core').Exceptions;
const { MetadataTypes } = require('@ah/core').Values;
const { MetadataType, MetadataObject, MetadataItem, PackageGeneratorOptions, PackageGeneratorResult } = require('@ah/core').Types;
const { FileReader, FileWriter, PathUtils } = require('@ah/core').FileSystem;
const Ignore = require('@ah/ignore');
const TypesFactory = require('@ah/metadata-factory');

const START_XML_FILE = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
const PACKAGE_TAG_START = "<Package xmlns=\"http://soap.sforce.com/2006/04/metadata\">";
const PACKAGE_TAG_END = "</Package>";
const VERSION_TAG_START = "<version>";
const VERSION_TAG_END = "</version>";
const TYPES_TAG_START = "<types>";
const TYPES_TAG_END = "</types>";
const NAME_TAG_START = "<name>";
const NAME_TAG_END = "</name>";
const MEMBERS_TAG_START = "<members>";
const MEMBERS_TAG_END = "</members>";
const NEWLINE = '\n';
const DESTRUCT_BEFORE_FILENAME = 'destructiveChanges.xml';
const DESTRUCT_AFTER_FILENAME = 'destructiveChangesPost.xml';
const PACKAGE_FILENAME = 'package.xml';
const DESTRUCT_BEFORE_NO_EXT = 'destructiveChanges';
const DESTRUCT_AFTER_NO_EXT = 'destructiveChangesPost';
const PACKAGE_NO_EXT = 'package';
const NOT_ALLOWED_WILDCARDS = [

];

/**
 * Class to create and merge package files to deploy, retrieve or delete metadata from your Salesforce's projects.
 * 
 * Can merge several package xml files (including destructiveChanges.xml and destructiveChangesPost.xml files) to combine into one file of each type, 
 * combine all packages in one file and all detructives in another file or merge all files into one package or destructive file.
 * 
 * The file names must contains at least the "package" word to identify the package XML files 
 * and destructiveChanges or destrutiveChangesPost to the destructive files. 
 * For example: package1.xml, destructiveChanges_uat.xml, destructiveChangesPost-v34...
 * 
 * You can choose a custom API Version to create the packages, 
 * if not specified API version, the package generator get the higher API version 
 * from each file types, that is, for package XML files, 
 * get the higher API of the Package XML files passed, and the same with other file types.
 * 
 * The setters methods are defined like a builder pattern to make it more usefull
 */
class PackageGenerator {

    /**
     * Constructor to instance a new PackageGenerator object
     * @param {String | Number} [apiVersion] Api version to create the package. If not provided use the latest api version of the provided files
     */
    constructor(apiVersion) {
        this.apiVersion = apiVersion;
        this.mergePackageFiles = true;
        this.mergeDestructives = false;
        this.isDestructive = false;
        this.beforeDeploy = false;
        this.explicit = true;
        this.ignoreFile = undefined;
        this.typesToIgnore = undefined;
    }

    /**
     * Method to Set the api version to create the packages
     * @param {String | Number} apiVersion Api version to create the package. If not provided use the latest api version of the provided files
     * 
     * @returns {PackageGenerator} Return the package generator instance
     */
    setApiVersion(apiVersion) {
        this.apiVersion = apiVersion;
        return this;
    }

    /**
     * Method to set if merge package files
     * @param {Boolean} mergePackageFiles true if want to merge the provided package files. If undefiend ot not has param, also set to true
     * 
     * @returns {PackageGenerator} Return the package generator instance
     */
    setMergePackagesFiles(mergePackageFiles) {
        this.mergePackageFiles = (mergePackageFiles !== undefined && Utils.isBoolean(mergePackageFiles)) ? mergePackageFiles : true;
        return this;
    }


    /**
     * Method to set if merge destructive files
     * @param {Boolean} mergeDestructives true if want to merge the provided destructive files into one single file. If undefiend ot not has param, also set to true
     * 
     * @returns {PackageGenerator} Return the package generator instance
     */
    setMergeDestructives(mergeDestructives) {
        this.mergeDestructives = (mergeDestructives !== undefined && Utils.isBoolean(mergeDestructives)) ? mergeDestructives : true;
        return this;
    }


    /**
     * Method to set if merge all package and XML destructive files into one destructive file
     * @param {Boolean} isDestructive true if you want to merge all files into one destructive file (valid option to merge packages full). If undefiend ot not has param, also set to true
     * 
     * @returns {PackageGenerator} Return the package generator instance
     */
    setIsDestructive(isDestructive) {
        this.isDestructive = (isDestructive !== undefined && Utils.isBoolean(isDestructive)) ? isDestructive : true;
        return this;
    }

    /**
     * Method to set if the destructive file to create is before deploy, in otherwise create destructive files after deploy
     * @param {Boolean} beforeDeploy true if want to merge destructive files into before deploy destructive file when select mergeDestructives. If undefiend ot not has param, also set to true
     * 
     * @returns {PackageGenerator} Return the package generator instance
     */
    setBeforeDeploy(beforeDeploy) {
        this.beforeDeploy = (beforeDeploy !== undefined && Utils.isBoolean(beforeDeploy)) ? beforeDeploy : true;
        return this;
    }

    /**
     * Method to set if put all elements explicit on the package XML or use wildcards when apply
     * @param {Boolean} explicit true if you want to put all metadata types explicit into the file, false to use wildcards when are all checked
     * 
     * @returns {PackageGenerator} Return the package generator instance
     */
    setExplicit(explicit) {
        this.explicit = (explicit !== undefined && Utils.isBoolean(explicit)) ? explicit : true;
        return this;
    }

    /**
     * Method to set the path to the ignore file
     * @param {String} ignoreFile path to the ignore file to ignore some metadata types from the packages
     * 
     * @returns {PackageGenerator} Return the package generator instance
     */
    setIgnoreFile(ignoreFile) {
        this.ignoreFile = ignoreFile;
        return this;
    }

    /**
     * Method to set the Metadata Types to ignore from package (Also must be exists on ignore file)
     * @param {Object} typesToIgnore List with the Metadata Type API Names to ignore. This parameter is used to ignore only the specified metadata (also must be in ignore file) and avoid ignore all metadata types specified on the file.
     * 
     * @returns {PackageGenerator} Return the package generator instance
     */
    setTypesToIgnore(typesToIgnore) {
        this.typesToIgnore = typesToIgnore ? Utils.forceArray(typesToIgnore) : typesToIgnore;
        return this;
    }

    /**
     * Method to merge several package xml files (including destructiveChanges.xml and destructiveChangesPost.xml files) to combine into one file of each type, combine all packages in one file and all detructives in another file.
     * @param {String | Array<String>} packageOrDestructiveFiles File or list of files to merge (including package and destructive files in the same list)
     * @param {String} outputFolder Folder to save the created files
     * 
     * @returns {PackageGeneratorResult} Object with the merge result including the paths of the merged files
     * 
     * @throws {WrongDatatypeException} If api version is not a String or number (can be undefined)
     * @throws {DataNotFoundException} If not package or destructive files provided
     * @throws {WrongFilePathException} If the package or destructive files path is not a String or cant convert to absolute path
     * @throws {FileNotFoundException} If the package or destructive files path not exists or not have access to it
     * @throws {InvalidFilePathException} If the package or destructive files path is not a file
     * @throws {WrongDirectoryPathException} If the output Folder is not a String or cant convert to absolute path
     * @throws {DirectoryNotFoundException} If the directory not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the path is not a directory
     */
    mergePackages(packageOrDestructiveFiles, outputFolder) {
        if (this.apiVersion)
            this.apiVersion = ProjectUtils.getApiAsNumber(this.apiVersion);
        if (this.mergePackageFiles === undefined)
            this.mergePackageFiles = true;
        const packages = [];
        let beforeDestructivePackages = [];
        let afterDestructivePackages = [];
        packageOrDestructiveFiles = XMLUtils.forceArray(packageOrDestructiveFiles);
        for (let file of packageOrDestructiveFiles) {
            file = Validator.validateFilePath(file);
            const fileName = PathUtils.getBasename(file);
            if (fileName.indexOf(PACKAGE_NO_EXT) !== -1 && this.mergePackageFiles) {
                packages.push(file);
            } else if (fileName.indexOf(DESTRUCT_AFTER_NO_EXT) !== -1) {
                afterDestructivePackages.push(file);
            } else if ((fileName.indexOf(DESTRUCT_BEFORE_NO_EXT) !== -1 && fileName.indexOf(DESTRUCT_AFTER_NO_EXT) == -1)) {
                beforeDestructivePackages.push(file);
            }
            if (this.mergeDestructives) {
                if (this.beforeDeploy) {
                    beforeDestructivePackages = beforeDestructivePackages.concat(afterDestructivePackages);
                    afterDestructivePackages = [];
                } else {
                    afterDestructivePackages = afterDestructivePackages.concat(beforeDestructivePackages);
                    beforeDestructivePackages = [];
                }
            }
        }
        if (packages.length === 0 && beforeDestructivePackages.length === 0 && afterDestructivePackages.length === 0)
            throw new DataNotFoundException('Not package files (' + PACKAGE_NO_EXT + ') or destructive files (' + DESTRUCT_BEFORE_NO_EXT + ', ' + DESTRUCT_AFTER_NO_EXT + ') selected to merge');
        const mergedPackage = mergePackageFiles(packages, this.apiVersion);
        const mergedBeforeDestructive = mergePackageFiles(beforeDestructivePackages, this.apiVersion);
        const mergedAfterDestructive = mergePackageFiles(afterDestructivePackages, this.apiVersion);
        const result = new PackageGeneratorResult();
        if (mergedPackage) {
            this.apiVersion = mergedPackage.version;
            result[PACKAGE_NO_EXT] = this.createPackage(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder);
        }
        if (mergedBeforeDestructive) {
            this.apiVersion = mergedBeforeDestructive.version;
            result[DESTRUCT_BEFORE_NO_EXT] = this.createBeforeDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedBeforeDestructive), outputFolder);
        }
        if (mergedAfterDestructive) {
            this.apiVersion = mergedAfterDestructive.version;
            result[DESTRUCT_AFTER_NO_EXT] = this.createAfterDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedAfterDestructive), outputFolder);
        }
        return result;
    }

    /**
     * Method to merge all provided files into only one file. You can choose if merge all into a package.xml, destructiveChanges.xml or destructiveChangesPost.xml
     * @param {String | Array<String>} packageOrDestructiveFiles file or list of files to merge (including package and destructive files in the same list)
     * @param {String} outputFolder Folder to save the created files. If not provided use the default options calling options() method
     * 
     * @returns {PackageGeneratorResult} Object with the merge result including the paths of the merged files
     * 
     * @throws {WrongDatatypeException} If api version is not a String or number (can be undefined)
     * @throws {DataNotFoundException} If not package or destructive files provided
     * @throws {WrongFilePathException} If the package or destructive files path is not a String or cant convert to absolute path
     * @throws {FileNotFoundException} If the package or destructive files path not exists or not have access to it
     * @throws {InvalidFilePathException} If the package or destructive files path is not a file
     * @throws {WrongDirectoryPathException} If the output Folder is not a String or cant convert to absolute path
     * @throws {DirectoryNotFoundException} If the directory not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the path is not a directory
     */
    mergePackagesFull(packageOrDestructiveFiles, outputFolder) {
        if (this.apiVersion)
            this.apiVersion = ProjectUtils.getApiAsNumber(this.apiVersion);
        const packages = [];
        packageOrDestructiveFiles = XMLUtils.forceArray(packageOrDestructiveFiles);
        for (let file of packageOrDestructiveFiles) {
            file = Validator.validateFilePath(file);
            const fileName = PathUtils.getBasename(file);
            if (fileName.indexOf(PACKAGE_NO_EXT) !== -1) {
                packages.push(file);
            } else if (fileName.indexOf(DESTRUCT_AFTER_NO_EXT) !== -1) {
                packages.push(file);
            } else if (fileName.indexOf(DESTRUCT_BEFORE_NO_EXT) !== -1) {
                packages.push(file);
            }
        }
        if (packages.length === 0)
            throw new DataNotFoundException('Not package files (' + PACKAGE_NO_EXT + ') or destructive files (' + DESTRUCT_BEFORE_NO_EXT + ', ' + DESTRUCT_AFTER_NO_EXT + ') selected to merge');
        const mergedPackage = mergePackageFiles(packages, this.apiVersion);
        const result = new PackageGeneratorResult();
        if (mergedPackage) {
            this.apiVersion = mergedPackage.version;
            if (!this.isDestructive) {
                result[PACKAGE_NO_EXT] = this.createPackage(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder);
            } else {
                if (this.beforeDeploy) {
                    result[DESTRUCT_BEFORE_NO_EXT] = this.createBeforeDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder);
                } else {
                    result[DESTRUCT_AFTER_NO_EXT] = this.createAfterDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder);
                }
            }
        }
        return result;
    }

    /**
     * Method to get the Package XML format content as String to the selected Metadata JSON file or Metadata JSON Object
     * @param {String | Object} metadataOrPath Metadata JSON file or Metadata JSON object to get the package or destructive XML content. If not provided use the default options calling options() method
     * 
     * @returns {String} Returns an String with the XML content
     * 
     * @throws {WrongDatatypeException} If api version is not a String or number. Can't be empty or undefined
     * @throws {WrongFilePathException} If the package or destructive file path is not a String or cant convert to absolute path
     * @throws {FileNotFoundException} If the package or destructive file path not exists or not have access to it
     * @throws {InvalidFilePathException} If the package or destructive file path is not a file
     * @throws {WrongFormatException} If file is not a JSON file or not have the correct Metadata JSON format
     * @throws {WrongDirectoryPathException} If the output Folder is not a String or cant convert to absolute path
     * @throws {DirectoryNotFoundException} If the directory not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the path is not a directory
     */
    getPackageContent(metadataOrPath) {
        let metadata;
        metadata = PackageGenerator.validateJSON(metadataOrPath);
        if (this.ignoreFile) {
            metadata = new Ignore(this.ignoreFile).setTypesToIgnore(this.typesToIgnore).ignoreMetadata(metadata);
        }
        this.apiVersion = ProjectUtils.getApiAsString(this.apiVersion);
        PackageGenerator.validateJSON(metadata);
        this.explicit = (this.explicit != undefined) ? this.explicit : true;
        let packageContent = '';;
        packageContent += START_XML_FILE + NEWLINE;
        packageContent += PACKAGE_TAG_START + NEWLINE;
        Object.keys(metadata).forEach((key) => {
            const typesBlock = makeTypesBlock(metadata[key], this.explicit);
            if (typesBlock)
                packageContent += typesBlock
        });
        packageContent += '\t' + VERSION_TAG_START + this.apiVersion + VERSION_TAG_END + NEWLINE;
        packageContent += PACKAGE_TAG_END;
        return packageContent;
    }

    /**
     * Method to create a package XML file with the selected Metadata JSON file or Metadata JSON Object
     * @param {String | Object} metadataOrPath Metadata JSON file or Metadata JSON object to create the package file
     * @param {String} outputFolder Folder to save the created file. If not provided use the default options calling options() method
     * 
     * @returns {String} Returns the path to the created file
     * 
     * @throws {WrongDatatypeException} If api version is not a String or number. Can't be empty or undefined
     * @throws {WrongFilePathException} If the package or destructive file path is not a String or cant convert to absolute path
     * @throws {FileNotFoundException} If the package or destructive file path not exists or not have access to it
     * @throws {InvalidFilePathException} If the package or destructive file path is not a file
     * @throws {WrongDirectoryPathException} If the output Folder is not a String or cant convert to absolute path
     * @throws {DirectoryNotFoundException} If the directory not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the path is not a directory
     * @throws {WrongFormatException} If file is not a JSON file or not have the correct Metadata JSON format
     */
    createPackage(metadataOrPath, outputFolder) {
        return createPackageFile(outputFolder, PACKAGE_FILENAME, this.getPackageContent(metadataOrPath));
    }

    /**
     * Method to create a before deploy destructive file with the selected Metadata JSON file or Metadata JSON Object
     * @param {String | Object} metadataOrPath Metadata JSON file or Metadata JSON object to create the destructive file
     * @param {String} outputFolder Folder to save the created file. If not provided use the default options calling options() method
     * 
     * @returns {String} Returns the path to the created file
     * 
     * @throws {WrongDatatypeException} If api version is not a String or number. Can't be empty or undefined
     * @throws {WrongFilePathException} If the package or destructive file path is not a String or cant convert to absolute path
     * @throws {FileNotFoundException} If the package or destructive file path not exists or not have access to it
     * @throws {InvalidFilePathException} If the package or destructive file path is not a file
     * @throws {WrongFormatException} If file is not a JSON file or not have the correct Metadata JSON format
     * @throws {WrongDirectoryPathException} If the output Folder is not a String or cant convert to absolute path
     * @throws {DirectoryNotFoundException} If the directory not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the path is not a directory
     */
    createBeforeDeployDestructive(metadataOrPath, outputFolder) {
        return createPackageFile(outputFolder, DESTRUCT_BEFORE_FILENAME, this.getPackageContent(metadataOrPath));
    }

    /**
     * Method to create an after deploy destructive file with the selected Metadata JSON file or Metadata JSON Object
     * @param {String | Object} metadataOrPath Metadata JSON file or Metadata JSON object to create the destructive file
     * @param {String} outputFolder Folder to save the created file. If not provided use the default options calling options() method
     * 
     * @returns {String} Returns the path to the created file
     * 
     * @throws {WrongDatatypeException} If api version is not a String or number. Can't be empty or undefined
     * @throws {WrongFilePathException} If the package or destructive file path is not a String or cant convert to absolute path
     * @throws {FileNotFoundException} If the package or destructive file path not exists or not have access to it
     * @throws {InvalidFilePathException} If the package or destructive file path is not a file
     * @throws {WrongFormatException} If file is not a JSON file or not have the correct Metadata JSON format
     * @throws {WrongDirectoryPathException} If the output Folder is not a String or cant convert to absolute path
     * @throws {DirectoryNotFoundException} If the directory not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the path is not a directory
     */
    createAfterDeployDestructive(metadataOrPath, outputFolder) {
        return createPackageFile(outputFolder, DESTRUCT_AFTER_FILENAME, this.getPackageContent(metadataOrPath));
    }

    /**
     * Method to validate a Metadata JSON file or Metadata JSON Object format. If is not valid, throw several exceptions.
     * @param {String | Object} metadataOrPath Metadata JSON file or Metadata JSON object to validate
     * 
     * @throws {WrongFilePathException} If the filePath is not a String or cant convert to absolute path
     * @throws {FileNotFoundException} If the file not exists or not have access to it
     * @throws {InvalidFilePathException} If the path is not a file
     * @throws {WrongFormatException} If file is not a JSON file or not have the correct Metadata JSON format
     * 
     * @returns {Object} Returns the Metadata Object Content validated
     */
    static validateJSON(metadataOrPath) {
        return Validator.validateMetadataJSON(metadataOrPath);
    }
}
module.exports = PackageGenerator;

function createPackageFile(outputPath, fileName, content) {
    outputPath = Validator.validateFolderPath(outputPath, 'Output');
    const path = outputPath + '/' + fileName;
    FileWriter.createFileSync(path, content);
    return path;
}

function makeTypesBlock(metadataType, explicit) {
    metadataType = new MetadataType(metadataType);
    let typesBlockContent = '';
    let addBlock = false;
    if (!metadataType.haveChilds())
        return '';
    typesBlockContent += '\t' + TYPES_TAG_START + NEWLINE;
    if (!explicit && metadataType.checked && metadataType.allChildsChecked() && !NOT_ALLOWED_WILDCARDS[metadataType.name]) {
        typesBlockContent += '\t\t' + MEMBERS_TAG_START + '*' + MEMBERS_TAG_END + NEWLINE;
        addBlock = true;
    } else {
        let folderAdded = false;
        Object.keys(metadataType.childs).forEach(function (key) {
            let mtObject = new MetadataObject(metadataType.getChild(key));
            if (mtObject.haveChilds()) {
                if (!folderAdded && mtObject.checked && (metadataType.name === MetadataTypes.DOCUMENT || metadataType.name === MetadataTypes.EMAIL_TEMPLATE || metadataType.name === MetadataTypes.REPORT || metadataType.name === MetadataTypes.DASHBOARD)) {
                    typesBlockContent += '\t\t' + MEMBERS_TAG_START + mtObject.name + MEMBERS_TAG_END + NEWLINE
                    addBlock = true;
                    folderAdded = true;
                }
                Object.keys(mtObject.childs).forEach(function (key) {
                    let mtItem = new MetadataItem(mtObject.getChild(key));
                    let separator;
                    if (metadataType.name === MetadataTypes.EMAIL_TEMPLATE || metadataType.name === MetadataTypes.DOCUMENT || metadataType.name === MetadataTypes.REPORT || metadataType.name === MetadataTypes.DASHBOARD) {
                        separator = '/';
                    } else if (metadataType.name === MetadataTypes.LAYOUT || metadataType.name === MetadataTypes.CUSTOM_OBJECT_TRANSLATIONS || metadataType.name === MetadataTypes.FLOW) {
                        separator = '-';
                    } else {
                        separator = '.';
                    }
                    if (mtItem.checked) {
                        typesBlockContent += '\t\t' + MEMBERS_TAG_START + mtObject.name + separator + mtItem.name + MEMBERS_TAG_END + NEWLINE
                        addBlock = true;
                    }
                });
            } else if (mtObject.checked) {
                typesBlockContent += '\t\t' + MEMBERS_TAG_START + mtObject.name + MEMBERS_TAG_END + NEWLINE
                addBlock = true;
            }
        });
    }
    typesBlockContent += '\t\t' + NAME_TAG_START + metadataType.name + NAME_TAG_END + NEWLINE;
    typesBlockContent += '\t' + TYPES_TAG_END + NEWLINE;
    if (addBlock) {
        return typesBlockContent;
    }
    else
        return '';
}

function preparePackageFromXML(pkg, apiVersion) {
    let result = {};
    if (pkg.Package) {
        result.prepared = true;
        result.version = apiVersion || pkg.Package.version;
        let types = XMLUtils.forceArray(pkg.Package.types);
        for (const type of types) {
            result[type.name] = [];
            let members = XMLUtils.forceArray(type.members);
            for (const member of members) {
                result[type.name].push(member);
            }
        }
    }
    return result;
}

function mergePackageFiles(packages, apiVersion) {
    let result;
    let api = 0;
    for (const pkg of packages) {
        const xmlRoot = XMLParser.parseXML(FileReader.readFileSync(pkg));
        let preparedPackage = preparePackageFromXML(xmlRoot, apiVersion);
        if (!result)
            result = preparedPackage;
        else
            result = mergePackage(result, preparedPackage);
        if (result.version > api)
            api = result.version;
    }
    if (result)
        result.version = apiVersion || api;
    if (result && Object.keys(result).length === 2)
        result = undefined;
    return result;
}

function mergePackage(target, source) {
    Object.keys(target).forEach(function (key) {
        if (key !== 'version' && key !== 'prepared') {
            if (source[key]) {
                for (const sourceMember of source[key]) {
                    if (!target[key].includes(sourceMember))
                        target[key].push(sourceMember);
                }
            }
            target[key] = target[key].sort();
        }
    });
    return target
}
