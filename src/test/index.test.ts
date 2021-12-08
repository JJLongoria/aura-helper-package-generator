import { MetadataItem, MetadataObject, MetadataType } from '@aurahelper/core';
import { PackageGenerator } from '../index';
const packages = ['./src/test/assets/packages/package1.xml', './src/test/assets/packages/package2.xml', './src/test/assets/packages/destructiveChanges1.xml', './src/test/assets/packages/destructiveChanges2.xml', './src/test/assets/packages/destructiveChangesPost1.xml', './src/test/assets/packages/destructiveChangesPost2.xml'];
const onlyPackages = ['./src/test/assets/packages/package1.xml', './src/test/assets/packages/package2.xml'];
const onlyBeforeDeploy = ['./src/test/assets/packages/destructiveChanges1.xml', './src/test/assets/packages/destructiveChanges2.xml',];
const onlyafterDeploy = ['./src/test/assets/packages/destructiveChangesPost1.xml', './src/test/assets/packages/destructiveChangesPost2.xml'];
describe('Testing ./index.js', () => {
    test('Testing getPackageContent()', () => {
        const generator = new PackageGenerator(50);
        let metadata: { [key: string]: MetadataType } = {};
        metadata['CustomField'] = new MetadataType('CustomField', false);
        metadata['CustomField'].addChild(new MetadataObject('Account', false));
        metadata['CustomField'].getChild('Account')!.addChild(new MetadataItem('Name', false));
        let content = generator.getPackageContent(metadata);
        metadata = {};
        metadata['CustomApplication'] = new MetadataType('CustomApplication', false);
        metadata['CustomApplication'].addChild(new MetadataObject('AppName', false));
        content = generator.getPackageContent(metadata);
        generator.setExplicit(false);
        content = generator.getPackageContent('./src/test/assets/packages/noPackageFile.json');
        generator.setIgnoreFile('./src/test/assets/.ahignore.json');
        content = generator.getPackageContent('./src/test/assets/packages/noPackageFile.json');
        try {
            content = generator.getPackageContent('./src/test/assets/packages/noPackageFiles.json');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            content = generator.getPackageContent('./src/test/assets/packages/package1.xml');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
        try {
            content = generator.createPackage('./src/test/assets/packages/package1.xml', './src/test/assets/merged');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
        try {
            content = generator.createBeforeDeployDestructive('./src/test/assets/packages/package1.xml', './src/test/assets/merged');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
        try {
            content = generator.createAfterDeployDestructive('./src/test/assets/packages/package1.xml', './src/test/assets/merged');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
    });
    test('Testing mergePackages()', () => {
        const generator = new PackageGenerator(50);
        generator.setMergePackagesFiles();
        let result = generator.mergePackages(packages, './src/test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeTruthy();
        generator.setMergeDestructives();
        generator.setBeforeDeploy();
        result = generator.mergePackages(packages, './src/test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeFalsy();
        generator.setBeforeDeploy(false);
        result = generator.mergePackages(packages, './src/test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeTruthy();
        generator.setMergeDestructives(false);
        result = generator.mergePackages(packages, './src/test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeTruthy();
        result = generator.mergePackages(onlyPackages, './src/test/assets/merged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeFalsy();
        result = generator.mergePackages(onlyBeforeDeploy, './src/test/assets/merged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeFalsy();
        result = generator.mergePackages(onlyafterDeploy, './src/test/assets/merged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeTruthy();
        try {
            generator.mergePackages('./src/test/assets/merged/assets', './src/test/assets/merged');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            generator.mergePackages('./src/test/assets/packages/noPackageFile.json', './src/test/assets/merged');
        } catch (error) {
            expect(error.message).toMatch('Not package files (package) or destructive files (destructiveChanges, destructiveChangesPost) selected to merge');
        }
    });
    test('Testing mergePackagesFull()', () => {
        const generator = new PackageGenerator(50);
        let result = generator.mergePackagesFull('./src/test/assets/packages/package3.xml', './src/test/assets/merged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeFalsy();
        try {
            result = generator.mergePackagesFull('./src/test/assets/packages/package4.xml', './src/test/assets/merged');
            expect(result.package).toBeFalsy();
            expect(result.destructiveChanges).toBeFalsy();
            expect(result.destructiveChangesPost).toBeFalsy();
        } catch (error) {

        }
        generator.setBeforeDeploy();
        result = generator.mergePackagesFull(packages, './src/test/assets/fullMerged');
        expect(result.package).toBeTruthy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeFalsy();
        generator.setIsDestructive();
        result = generator.mergePackagesFull(packages, './src/test/assets/fullMerged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeTruthy();
        expect(result.destructiveChangesPost).toBeFalsy();
        generator.setBeforeDeploy(false);
        result = generator.mergePackagesFull(packages, './src/test/assets/fullMerged');
        expect(result.package).toBeFalsy();
        expect(result.destructiveChanges).toBeFalsy();
        expect(result.destructiveChangesPost).toBeTruthy();
        try {
            generator.mergePackagesFull(packages, './src/test/assets/fullMergeds');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            generator.mergePackagesFull(packages, './src/test/assets/packages/package4.xml');
        } catch (error) {
            expect(error.message).toMatch('is not a valid directory path');
        }
        try {
            generator.mergePackagesFull('./src/test/assets/fullMerged/assets', './src/test/assets/fullMerged');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            generator.mergePackagesFull('./src/test/assets/packages/noPackageFile.json', './src/test/assets/fullMerged');
        } catch (error) {
            expect(error.message).toMatch('Not package files (package) or destructive files (destructiveChanges, destructiveChangesPost) selected to merge');
        }
        let content = PackageGenerator.validateJSON('./src/test/assets/packages/noPackageFile.json');
        try {
            content = PackageGenerator.validateJSON('./src/test/assets/packages/noPackageFiles.json');
        } catch (error) {
            expect(error.message).toMatch('does not exists or not have access to it');
        }
        try {
            content = PackageGenerator.validateJSON('./src/test/assets/packages/package1.xml');
        } catch (error) {
            expect(error.message).toMatch('does not have a valid JSON content');
        }
    })
});