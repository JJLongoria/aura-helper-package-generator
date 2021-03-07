const { XMLParser } = require('@ah/core').Languages;
const { XMLUtils, Utils, Validator } = require('@ah/core').Utils;
const { MetadataTypes } = require('@ah/core').Values;
const { TypesFactory, MetadataType, MetadataObject, MetadataItem } = require('@ah/core').Types;
const { FileReader, FileWriter, PathUtils } = require('@ah/core').FileSystem;
const Ignore = require('@ah/ignore');

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

    static mergePackages(packageOrDestructiveFiles, outputFolder, options) {
        if (!options)
            options = {
                apiVersion: undefined,
                mergeDestructives: false,
                beforeDeploy: false,
                explicit: false,
                ignoreFile: undefined,
                typesForIgnore: undefined,
            }
        if (options.apiVersion)
            options.apiVersion = Utils.getApiAsNumber(options.apiVersion);
        const packages = [];
        let beforeDestructivePackages = [];
        let afterDestructivePackages = [];
        packageOrDestructiveFiles = XMLUtils.forceArray(packageOrDestructiveFiles);
        for (let file of packageOrDestructiveFiles) {
            file = Validator.validateFilePath(file);
            const fileName = PathUtils.getBasename(file);
            if (fileName.indexOf(PACKAGE_NO_EXT) !== -1) {
                packages.push(file);
            } else if (fileName.indexOf(DESTRUCT_AFTER_NO_EXT) !== -1) {
                afterDestructivePackages.push(file);
            } else if ((fileName.indexOf(DESTRUCT_BEFORE_NO_EXT) !== -1 && fileName.indexOf(DESTRUCT_AFTER_NO_EXT) == -1)) {
                beforeDestructivePackages.push(file);
            }
            if (options.mergeDestructives) {
                if (options.beforeDeploy) {
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
        const mergedPackage = mergePackageFiles(packages, options.apiVersion);
        const mergedBeforeDestructive = mergePackageFiles(beforeDestructivePackages, options.apiVersion);
        const mergedAfterDestructive = mergePackageFiles(afterDestructivePackages, options.apiVersion);
        const result = {};
        result[PACKAGE_NO_EXT] = undefined;
        result[DESTRUCT_BEFORE_NO_EXT] = undefined;
        result[DESTRUCT_AFTER_NO_EXT] = undefined;
        if (mergedPackage) {
            options.apiVersion = mergedPackage.version;
            result[PACKAGE_NO_EXT] = this.createPackage(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder, options);
        }
        if (mergedBeforeDestructive) {
            options.apiVersion = mergedBeforeDestructive.version;
            result[DESTRUCT_BEFORE_NO_EXT] = this.createBeforeDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedBeforeDestructive), outputFolder, options);
        }
        if (mergedAfterDestructive) {
            options.apiVersion = mergedAfterDestructive.version;
            result[DESTRUCT_AFTER_NO_EXT] = this.createAfterDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedAfterDestructive), outputFolder, options);
        }
        return result;
    }

    static mergePackagesFull(packageOrDestructiveFiles, outputFolder, options) {
        if (!options)
            options = {
                apiVersion: undefined,
                isDestructive: false,
                beforeDeploy: false,
                explicit: false,
                ignoreFile: undefined,
                typesForIgnore: undefined,
            }
        if (options.apiVersion)
            options.apiVersion = Utils.getApiAsNumber(options.apiVersion);
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
            throw new Error('Not package files (' + PACKAGE_NO_EXT + ') or destructive files (' + DESTRUCT_BEFORE_NO_EXT + ', ' + DESTRUCT_AFTER_NO_EXT + ') selected to merge');
        const mergedPackage = mergePackageFiles(packages, options.apiVersion);
        const result = {};
        result[PACKAGE_NO_EXT] = undefined;
        result[DESTRUCT_BEFORE_NO_EXT] = undefined;
        result[DESTRUCT_AFTER_NO_EXT] = undefined;
        if (mergedPackage) {
            options.apiVersion = mergedPackage.version;
            if (!options.isDestructive) {
                result[PACKAGE_NO_EXT] = this.createPackage(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder, options);
            } else {
                if (options.beforeDeploy) {
                    result[DESTRUCT_BEFORE_NO_EXT] = this.createBeforeDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder, options);
                } else {
                    result[DESTRUCT_AFTER_NO_EXT] = this.createAfterDeployDestructive(TypesFactory.createMetadataTypesFromPackageXML(mergedPackage), outputFolder, options);
                }
            }
        }
        return result;
    }

    static getPackageContent(metadataOrPath, options) {
        if (!options)
            options = {
                apiVersion: undefined,
                explicit: false,
                ignoreFile: undefined,
                typesForIgnore: undefined,
            }
        let metadata;
        if (typeof metadataOrPath === 'object') {
            metadata = metadataOrPath;
        } else {
            metadata = Validator.validateJSONFile(metadataOrPath);
        }
        if (options.ignoreFile)
            metadata = Ignore.ignoreMetadata(metadata, options.ignoreFile, options.typesForIgnore);
        options.apiVersion = Utils.getApiAsString(options.apiVersion);
        PackageGenerator.validateJSON(metadata);
        options.explicit = (options.explicit != undefined) ? options.explicit : true;
        let packageContent = '';;
        packageContent += START_XML_FILE + NEWLINE;
        packageContent += PACKAGE_TAG_START + NEWLINE;
        Object.keys(metadata).forEach((key) => {
            const typesBlock = makeTypesBlock(metadata[key], options.explicit);
            if (typesBlock)
                packageContent += typesBlock
        });
        packageContent += '\t' + VERSION_TAG_START + options.apiVersion + VERSION_TAG_END + NEWLINE;
        packageContent += PACKAGE_TAG_END;
        return packageContent;
    }

    static createPackage(metadataOrPath, folder, options) {
        if (!options)
            options = {
                apiVersion: undefined,
                explicit: false,
                ignoreFile: undefined,
                typesForIgnore: undefined,
            }
        return createPackageFile(folder, PACKAGE_FILENAME, PackageGenerator.getPackageContent(metadataOrPath, options));
    }

    static createBeforeDeployDestructive(metadataOrPath, folder, options) {
        if (!options)
            options = {
                apiVersion: undefined,
                explicit: false,
                ignoreFile: undefined,
                typesForIgnore: undefined,
            }
        return createPackageFile(folder, DESTRUCT_BEFORE_FILENAME, PackageGenerator.getPackageContent(metadataOrPath, options));
    }

    static createAfterDeployDestructive(metadataOrPath, folder, options) {
        if (!options)
            options = {
                apiVersion: undefined,
                explicit: false,
                ignoreFile: undefined,
                typesForIgnore: undefined,
            }
        return createPackageFile(folder, DESTRUCT_AFTER_FILENAME, PackageGenerator.getPackageContent(metadataOrPath, options));
    }

    static validateJSON(metadataOrPath) {
        Validator.validateMetadataJSON(metadataOrPath);
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
