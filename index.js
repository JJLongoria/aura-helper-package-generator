const { XMLParser } = require('@ah/core').Languages;
const { XMLUtils, Utils } = require('@ah/core').Utils;
const { MetadataTypes } = require('@ah/core').Values;
const { TypesFactory, MetadataType, MetadataObject, MetadataItem } = require('@ah/core').Types;
const { FileReader, FileWriter, PathUtils, FileChecker } = require('@ah/core').FileSystem;

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

class PackageGenerator {

    static mergePackages(packageOrDestructiveFiles, outputFolder, apiVersion, mergeDestructives, beforeDeploy) {
        if (apiVersion)
            apiVersion = Utils.getApiAsNumber(apiVersion);
        const packages = [];
        let beforeDestructivePackages = [];
        let afterDestructivePackages = [];
        packageOrDestructiveFiles = XMLUtils.forceArray(packageOrDestructiveFiles);
        for (let file of packageOrDestructiveFiles) {
            try {
                file = PathUtils.getAbsolutePath(file);
            } catch (error) {
                throw new Error('Wrong file path. Expect a folder path and receive ' + file);
            }
            if (!FileChecker.isExists(file))
                throw new Error('File ' + file + ' does not exists or not have access to it');
            const fileName = PathUtils.getBasename(file);
            if (fileName.indexOf(PACKAGE_NO_EXT) !== -1) {
                packages.push(file);
            } else if (fileName.indexOf(DESTRUCT_AFTER_NO_EXT) !== -1) {
                afterDestructivePackages.push(file);
            } else if ((fileName.indexOf(DESTRUCT_BEFORE_NO_EXT) !== -1 && fileName.indexOf(DESTRUCT_AFTER_NO_EXT) == -1)) {
                beforeDestructivePackages.push(file);
            }
            if (mergeDestructives) {
                if (beforeDeploy) {
                    beforeDestructivePackages = beforeDestructivePackages.concat(afterDestructivePackages);
                    afterDestructivePackages = [];
                } else {
                    afterDestructivePackages = afterDestructivePackages.concat(beforeDestructivePackages);
                    beforeDestructivePackages = [];
                }
            }
        }
        if (packages.length === 0 && beforeDestructivePackages.length === 0 && afterDestructivePackages.length === 0)
            throw new Error('Not package files (' + PACKAGE_NO_EXT + ') or destructive files (' + DESTRUCT_BEFORE_NO_EXT + ', ' + DESTRUCT_AFTER_NO_EXT + ') selected to merge');
        const mergedPackage = mergePackageFiles(packages, apiVersion);
        const mergedBeforeDestructive = mergePackageFiles(beforeDestructivePackages, apiVersion);
        const mergedAfterDestructive = mergePackageFiles(afterDestructivePackages, apiVersion);
        const result = {};
        result[PACKAGE_NO_EXT] = undefined;
        result[DESTRUCT_BEFORE_NO_EXT] = undefined;
        result[DESTRUCT_AFTER_NO_EXT] = undefined;
        if (mergedPackage) {
            result[PACKAGE_NO_EXT] = this.createPackage(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder, mergedPackage.version, false);
        }
        if (mergedBeforeDestructive) {
            result[DESTRUCT_BEFORE_NO_EXT] = this.createBeforeDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedBeforeDestructive), outputFolder, mergedBeforeDestructive.version, false);
        }
        if (mergedAfterDestructive) {
            result[DESTRUCT_AFTER_NO_EXT] = this.createAfterDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedAfterDestructive), outputFolder, mergedAfterDestructive.version, false);
        }
        return result;
    }

    static mergePackagesFull(packageOrDestructiveFiles, outputFolder, apiVersion, isDestructive, beforeDeploy) {
        if (apiVersion)
            apiVersion = Utils.getApiAsNumber(apiVersion);
        const packages = [];
        packageOrDestructiveFiles = XMLUtils.forceArray(packageOrDestructiveFiles);
        for (let file of packageOrDestructiveFiles) {
            try {
                file = PathUtils.getAbsolutePath(file);
            } catch (error) {
                throw new Error('Wrong file path. Expect a folder path and receive ' + file);
            }
            if (!FileChecker.isExists(file))
                throw new Error('File ' + file + ' does not exists or not have access to it');
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
            throw new Error('Not package files (' + PACKAGE_NO_EXT + ') or destructive files (' + DESTRUCT_BEFORE_NO_EXT + ', ' + DESTRUCT_AFTER_NO_EXT + ') selected to merge');
        const mergedPackage = mergePackageFiles(packages, apiVersion);
        const result = {};
        result[PACKAGE_NO_EXT] = undefined;
        result[DESTRUCT_BEFORE_NO_EXT] = undefined;
        result[DESTRUCT_AFTER_NO_EXT] = undefined;
        if (mergedPackage) {
            if (!isDestructive) {
                result[PACKAGE_NO_EXT] = this.createPackage(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder, mergedPackage.version, false);
            } else {
                if (beforeDeploy) {
                    result[DESTRUCT_BEFORE_NO_EXT] = this.createBeforeDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder, mergedPackage.version, false);
                } else {
                    result[DESTRUCT_AFTER_NO_EXT] = this.createAfterDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder, mergedPackage.version, false);
                }
            }
        }
        return result;
    }

    static getPackageContent(metadataOrPath, apiVersion, explicit) {
        let metadata;
        if (typeof metadataOrPath === 'object') {
            metadata = metadataOrPath;
        } else {
            try {
                metadataOrPath = PathUtils.getAbsolutePath(metadataOrPath);
            } catch (error) {
                throw new Error('Wrong file path. Expect a JSON file path and receive ' + metadataOrPath);
            }
            if (!FileChecker.isExists(metadataOrPath))
                throw new Error('File ' + metadataOrPath + ' does not exists or not have access to it');
            try {
                metadata = JSON.parse(FileReader.readFileSync(metadataOrPath));
            } catch(error){
                throw new Error('File ' + metadataOrPath + ' does not have a valid JSON content. ' + error.message);
            }
        }
        apiVersion = Utils.getApiAsString(apiVersion);
        PackageGenerator.validateJSON(metadata);
        explicit = (explicit != undefined) ? explicit : true;
        let packageContent = '';;
        packageContent += START_XML_FILE + NEWLINE;
        packageContent += PACKAGE_TAG_START + NEWLINE;
        Object.keys(metadata).forEach((key) => {
            const typesBlock = makeTypesBlock(metadata[key], explicit);
            if (typesBlock)
                packageContent += typesBlock
        });
        packageContent += '\t' + VERSION_TAG_START + apiVersion + VERSION_TAG_END + NEWLINE;
        packageContent += PACKAGE_TAG_END;
        return packageContent;
    }

    static createPackage(metadata, folder, apiVersion, explicit) {
        return createPackageFile(folder, PACKAGE_FILENAME, PackageGenerator.getPackageContent(metadata, apiVersion, explicit));
    }

    static createBeforeDeployDestructive(metadata, folder, apiVersion, explicit) {
        return createPackageFile(folder, DESTRUCT_BEFORE_FILENAME, PackageGenerator.getPackageContent(metadata, apiVersion, explicit));
    }

    static createAfterDeployDestructive(metadata, folder, apiVersion, explicit) {
        return createPackageFile(folder, DESTRUCT_AFTER_FILENAME, PackageGenerator.getPackageContent(metadata, apiVersion, explicit));
    }

    static validateJSON(metadataOrPath) {
        let metadata;
        if (typeof metadataOrPath === 'object') {
            metadata = metadataOrPath;
        } else {
            try {
                metadataOrPath = PathUtils.getAbsolutePath(metadataOrPath);
            } catch (error) {
                throw new Error('Wrong file path. Expect a JSON file path and receive ' + metadataOrPath);
            }
            if (!FileChecker.isExists(metadataOrPath))
                throw new Error('File ' + metadataOrPath + ' does not exists or not have access to it');
            try {
                metadata = JSON.parse(FileReader.readFileSync(metadataOrPath));
            } catch(error){
                throw new Error('File ' + metadataOrPath + ' does not have a valid JSON content. ' + error.message);
            }
        }
        if (Array.isArray(metadata))
            throw new Error("Wrong JSON Format file. The main object must be a JSON Object not an Array");
        Object.keys(metadata).forEach(function (key) {
            let metadataType = metadata[key];
            validateMetadataType(metadataType, key);
            if (metadataType.childs && Object.keys(metadataType.childs).length > 0) {
                Object.keys(metadataType.childs).forEach(function (childKey) {
                    let metadataObject = metadataType.childs[childKey];
                    validateMetadataObject(metadataObject, childKey, key);
                    if (metadataObject.childs && Object.keys(metadataObject.childs).length > 0) {
                        Object.keys(metadataObject.childs).forEach(function (grandChildKey) {
                            let metadataItem = metadataObject.childs[grandChildKey];
                            validateMetadataItem(metadataItem, grandChildKey, childKey, key);
                        });
                    }
                });
            }
        });
    }
}
module.exports = PackageGenerator;

function createPackageFile(outputPath, fileName, content) {
    try {
        outputPath = PathUtils.getAbsolutePath(outputPath);
    } catch (error) {
        throw new Error('Wrong output path. Expect a folder path and receive ' + outputPath);
    }
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

function validateMetadataType(metadataType, key) {
    if (metadataType.name === undefined)
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". Missing name field");
    if (typeof metadataType.name !== 'string')
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". name field must be a string, not a " + typeof metadataType.name);
    if (metadataType.checked === undefined)
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". Missing checked field");
    if (typeof metadataType.checked !== 'boolean')
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". checked field must be a boolean, not a " + typeof metadataType.checked);
    if (metadataType.path !== undefined && typeof metadataType.path !== 'string')
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". path field must be a string, not a " + typeof metadataType.path);
    if (metadataType.suffix !== undefined && typeof metadataType.suffix !== 'string')
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". suffix field must be a string, not a " + typeof metadataType.suffix);
    if (metadataType.childs === undefined)
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". Missing childs field");
    if (Array.isArray(metadataType.childs))
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". childs field must be a JSON Object, not an Array");
    if (typeof metadataType.childs !== 'object')
        throw new Error("Wrong JSON Format for Metadata Type with key " + key + ". childs field must be a JSON Object, not a " + typeof metadataType.childs);
}

function validateMetadataObject(metadataObject, key, type) {
    if (metadataObject.name === undefined)
        throw new Error("Wrong JSON Format for Metadata Object with key " + key + " (" + type + "). Missing name field");
    if (typeof metadataObject.name !== 'string')
        throw new Error("Wrong JSON Format for Metadata Object with key " + key + " (" + type + "). name field must be a string, not a " + typeof metadataObject.name);
    if (metadataObject.checked === undefined)
        throw new Error("Wrong JSON Format for Metadata Object with key " + key + " (" + type + "). Missing checked field");
    if (typeof metadataObject.checked !== 'boolean')
        throw new Error("Wrong JSON Format for Metadata Object with key " + key + " (" + type + "). checked field must be a boolean, not a " + typeof metadataObject.checked);
    if (metadataObject.path !== undefined && typeof metadataObject.path !== 'string')
        throw new Error("Wrong JSON Format for Metadata Object with key " + key + " (" + type + "). path field must be a string, not a " + typeof metadataObject.path);
    if (metadataObject.childs === undefined)
        throw new Error("Wrong JSON Format for Metadata Object with key " + key + " (" + type + "). Missing childs field");
    if (Array.isArray(metadataObject.childs))
        throw new Error("Wrong JSON Format for Metadata Object with key " + key + " (" + type + "). childs field must be a JSON Object, not an Array");
    if (typeof metadataObject.childs !== 'object')
        throw new Error("Wrong JSON Format for Metadata Object with key " + key + " (" + type + "). childs field must be a JSON Object, not a " + typeof metadataObject.childs);
}

function validateMetadataItem(metadataItem, key, object, type) {
    if (metadataItem.name === undefined)
        throw new Error("Wrong JSON Format for Metadata Item with key " + key + " (" + type + ": " + object + "). Missing name field");
    if (typeof metadataItem.name !== 'string')
        throw new Error("Wrong JSON Format for Metadata Item with key " + key + " (" + type + ": " + object + "). name field must be a string, not a " + typeof metadataItem.name);
    if (metadataItem.path !== undefined && typeof metadataItem.path !== 'string')
        throw new Error("Wrong JSON Format for Metadata Item with key " + key + " (" + type + ": " + object + "). path field must be a string, not a " + typeof metadataItem.path);
    if (metadataItem.checked === undefined)
        throw new Error("Wrong JSON Format for Metadata Item with key " + key + " (" + type + ": " + object + "). Missing checked field");
    if (typeof metadataItem.checked !== 'boolean')
        throw new Error("Wrong JSON Format for Metadata Item with key " + key + " (" + type + ": " + object + "). checked field must be a boolean, not a " + typeof metadataItem.checked);
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
