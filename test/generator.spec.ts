/**
 * Created by eddy spreeuwers on 14-02-18.
 */
import * as fs from "fs";
import {generateTemplateClassesFromXSD} from "../src/index";

describe("generator", () => {
    describe("generator simpleClass", () => {
        //let simpleClassXsd = "";
        //let simpleInheritedClassXsd = "";
        //let formClassXsd = "";


        beforeEach(() => {
            //simpleClassXsd = fs.readFileSync("./test/simpleClass.xsd").toString();
            //simpleInheritedClassXsd = fs.readFileSync("./test/simpleInheritedClass.xsd").toString();
            //formClassXsd = fs.readFileSync("./test/form.xsd").toString();
        });



        it(" has function generateTemplateClassesFromXSD", () => {
            expect(generateTemplateClassesFromXSD).toBeDefined();
        });

        it("ClassGenerator heeft een types property", () => {
            expect(generateTemplateClassesFromXSD("./test/xsd/simpleClass.xsd"));
        });
        it("ClassGenerator heeft een types property", () => {
            expect(generateTemplateClassesFromXSD("./test/xsd/importedClass.xsd",
                {dep: "xml-parser"} as Map<string, string>));
        });

        it("ClassGenerator heeft een types property", () => {
            expect(generateTemplateClassesFromXSD("./test/xsd/simpleInheritedClass.xsd",
                {dep: "xml-parser"} as Map<string, string>));
        });

        it("ClassGenerator heeft een types property", () => {
            expect(generateTemplateClassesFromXSD("./test/xsd/xep-004.xsd"));
        });
        it("ClassGenerator heeft een types property", () => {
            expect(generateTemplateClassesFromXSD("./test/xsd/simpleType.xsd"));
        });

        it("ClassGenerator heeft een types property", () => {
            expect(generateTemplateClassesFromXSD("./test/xsd/group.xsd"));
        });
        it("ClassGenerator heeft een types property", () => {
            expect(generateTemplateClassesFromXSD("./test/xsd/types.xsd"));
        });
    });
});
