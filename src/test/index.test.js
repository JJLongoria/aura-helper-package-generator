const PackageGenerator = require('../index');
const packages = ['./test/assets/packages/package1.xml', './test/assets/packages/package2.xml', './test/assets/packages/destructiveChanges1.xml', './test/assets/packages/destructiveChanges2.xml', './test/assets/packages/destructiveChangesPost1.xml', './test/assets/packages/destructiveChangesPost2.xml'];
const onlyPackages = ['./test/assets/packages/package1.xml', './test/assets/packages/package2.xml'];
const onlyBeforeDeploy = ['./test/assets/packages/destructiveChanges1.xml', './test/assets/packages/destructiveChanges2.xml',];
const onlyafterDeploy = ['./test/assets/packages/destructiveChangesPost1.xml', './test/assets/packages/destructiveChangesPost2.xml'];
describe('Testing ./index.js', () => {
    test('Testing getPackageContent()', () => {
        const generator = new PackageGenerator(50);
        let content = generator.getPackageContent({
            CustomField: {
                name: 'CustomField',
                checked: false,
                childs: {
                    Account: {
                        name: 'Account',
                        checked: false,
                        childs: {
                            Name: {
                                name: 'Name',
                                checked: false
                            }
                        },
                    }
                },
            }
        });
        content = generator.getPackageContent({
            CustomField: {
                name: 'CustomField',
                checked: false,
                childs: {
                    Account: {
                        name: 'Account',
                        checked: false,
                        childs: {},
                    }
                },
            }
        });
        generator.setExplicit(false);
        content = generator.getPackageContent({
            CustomField: {
                name: 'CustomField',
                checked: false,
                childs: {},
            }
        });
        content = generator.getPackageContent('./test/assets/packages/noPackageFile.json');
        generator.setIgnoreFile('./test/assets/.ahignore.json');
        content = generator.getPackageContent('./test/assets/packages/noPackageFile.json');
        try {
            content = generator.getPackageContent(55);
        } catch (error) {
            expect(error.message).toMatch('Wrong file path');
        }
        try {
            content = generator.getPackageContent('./test/assets/packages/noPackageFiles.json');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            content = generator.getPackageContent('./test/assets/packages/package1.xml');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
        try {
            content = generator.createPackage('./test/assets/packages/package1.xml');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
        try {
            content = generator.createBeforeDeployDestructive('./test/assets/packages/package1.xml');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
        try {
            content = generator.createAfterDeployDestructive('./test/assets/packages/package1.xml');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
    });
    test('Testing mergePackages()', () => {
        const generator = new PackageGenerator(50);
        generator.setMergePackagesFiles();
        let result = generator.mergePackages(packages, './test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeTruthy();
        generator.setMergeDestructives();
        generator.setBeforeDeploy();
        result = generator.mergePackages(packages, './test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeFalsy();
        generator.setBeforeDeploy(false);
        result = generator.mergePackages(packages, './test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeTruthy();
        generator.setMergeDestructives(false);
        result = generator.mergePackages(packages, './test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeTruthy();
        result = generator.mergePackages(onlyPackages, './test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeFalsy();
        result = generator.mergePackages(onlyBeforeDeploy, './test/assets/merged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeFalsy();
        result = generator.mergePackages(onlyafterDeploy, './test/assets/merged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeTruthy();
        try {
            generator.mergePackages({}, './test/assets/merged');
        } catch (error) {
            expect(error.message).toMatch('Wrong file path. Expect a file path and receive');
        }
        try {
            generator.mergePackages(packages, {});
        } catch (error) {
            expect(error.message).toMatch('Wrong Output path. Expect a folder path and receive');
        }
        try {
            generator.mergePackages('./test/assets/merged/assets', './test/assets/merged');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            generator.mergePackages('./test/assets/packages/noPackageFile.json', './test/assets/merged');
        } catch (error) {
            expect(error.message).toMatch('Not package files (package) or destructive files (destructiveChanges, destructiveChangesPost) selected to merge');
        }
    });
    test('Testing mergePackagesFull()', () => {
        const generator = new PackageGenerator(50);
        let result = generator.mergePackagesFull('./test/assets/packages/package3.xml', './test/assets/merged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeFalsy();
        try {
            result = generator.mergePackagesFull('./test/assets/packages/package4.xml', './test/assets/merged');
            expect(result.package).toBeFalsy();
            expect(result.destructiveChanges).toBeFalsy();
            expect(result.destructiveChangesPost).toBeFalsy();
        } catch (error) {

        }
        generator.setBeforeDeploy();
        result = generator.mergePackagesFull(packages, './test/assets/fullMerged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeFalsy();
        generator.setIsDestructive();
        result = generator.mergePackagesFull(packages, './test/assets/fullMerged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeFalsy();
        generator.setBeforeDeploy(false);
        result = generator.mergePackagesFull(packages, './test/assets/fullMerged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeTruthy();
        try {
            generator.mergePackagesFull(packages, './test/assets/fullMergeds');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            generator.mergePackagesFull(packages, './test/assets/packages/package4.xml');
        } catch (error) {
            expect(error.message).toMatch('is not a valid directory path');
        }
        try {
            generator.mergePackagesFull({}, './test/assets/fullMerged');
        } catch (error) {
            expect(error.message).toMatch('Wrong file path. Expect a file path and receive');
        }
        try {
            generator.mergePackagesFull(packages, {});
        } catch (error) {
            expect(error.message).toMatch('Wrong Output path. Expect a folder path and receive');
        }
        try {
            generator.mergePackagesFull('./test/assets/fullMerged/assets', './test/assets/fullMerged');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            generator.mergePackagesFull('./test/assets/packages/noPackageFile.json', './test/assets/fullMerged');
        } catch (error) {
            expect(error.message).toMatch('Not package files (package) or destructive files (destructiveChanges, destructiveChangesPost) selected to merge');
        }
    });
    test('Testing validateJSON()', () => {
        try {
            PackageGenerator.validateJSON([]);
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format file. The main object must be a JSON Object not an Array');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: undefined,
                    checked: undefined,
                    childs: undefined,
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. Missing name field');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: [],
                    checked: undefined,
                    childs: undefined,
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. name field must be a string, not a object');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: 'CustomObject',
                    checked: undefined,
                    childs: undefined,
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. Missing checked field');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: 'CustomObject',
                    checked: [],
                    childs: undefined,
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. checked field must be a boolean, not a object');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: 'CustomObject',
                    checked: false,
                    childs: undefined,
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. Missing childs field');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: 'CustomObject',
                    checked: false,
                    childs: [],
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. childs field must be a JSON Object, not an Array');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: 'CustomObject',
                    checked: false,
                    childs: '',
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. childs field must be a JSON Object, not a string');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: 'CustomObject',
                    checked: false,
                    childs: {},
                    path: []
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. path field must be a string, not a object');
        }
        try {
            PackageGenerator.validateJSON({
                CustomObject: {
                    name: 'CustomObject',
                    checked: false,
                    childs: {},
                    path: 'path',
                    suffix: [],
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Type with key CustomObject. suffix field must be a string, not a object');
        }
        PackageGenerator.validateJSON({
            CustomObject: {
                name: 'CustomObject',
                checked: false,
                childs: {},
                path: 'path',
                suffix: 'suffix',
            }
        });
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: undefined,
                            checked: undefined,
                            childs: undefined,
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Object with key Account (CustomField). Missing name field');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: [],
                            checked: undefined,
                            childs: undefined,
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Object with key Account (CustomField). name field must be a string, not a object');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: undefined,
                            childs: undefined,
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Object with key Account (CustomField). Missing checked field');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: [],
                            childs: undefined,
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Object with key Account (CustomField). checked field must be a boolean, not a object');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: undefined,
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Object with key Account (CustomField). Missing childs field');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: [],
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Object with key Account (CustomField). childs field must be a JSON Object, not an Array');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: '',
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Object with key Account (CustomField). childs field must be a JSON Object, not a string');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: {},
                            path: []
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Object with key Account (CustomField). path field must be a string, not a object');
        }
        PackageGenerator.validateJSON({
            CustomField: {
                name: 'CustomField',
                checked: false,
                childs: {
                    Account: {
                        name: 'Account',
                        checked: true,
                        childs: {},
                        path: 'path',
                    }
                },
            }
        });
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: {
                                Name: {
                                    name: undefined,
                                    chacked: undefined
                                }
                            },
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Item with key Name (CustomField: Account). Missing name field');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: {
                                Name: {
                                    name: [],
                                    chacked: undefined
                                }
                            },
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Item with key Name (CustomField: Account). name field must be a string, not a object');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: {
                                Name: {
                                    name: 'Name',
                                    chacked: undefined
                                }
                            },
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Item with key Name (CustomField: Account). Missing checked field');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: {
                                Name: {
                                    name: 'Name',
                                    checked: []
                                }
                            },
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Item with key Name (CustomField: Account). checked field must be a boolean, not a object');
        }
        try {
            PackageGenerator.validateJSON({
                CustomField: {
                    name: 'CustomField',
                    checked: false,
                    childs: {
                        Account: {
                            name: 'Account',
                            checked: true,
                            childs: {
                                Name: {
                                    name: 'Name',
                                    checked: false,
                                    path: []
                                }
                            },
                        }
                    },
                }
            });
        } catch (error) {
            expect(error.message).toMatch('Wrong JSON Format for Metadata Item with key Name (CustomField: Account). path field must be a string, not a object');
        }
        content = PackageGenerator.validateJSON('./test/assets/packages/noPackageFile.json');
        try {
            content = PackageGenerator.validateJSON(55);
        } catch (error) {
            expect(error.message).toMatch('Wrong file path');
        }
        try {
            content = PackageGenerator.validateJSON('./test/assets/packages/noPackageFiles.json');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            content = PackageGenerator.validateJSON('./test/assets/packages/package1.xml');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
    })
});