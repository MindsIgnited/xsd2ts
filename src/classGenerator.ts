/**
 * Created by Eddy Spreeuwers at 11 march 2018
 */
import {ClassDefinition, createFile, EnumDefinition, FileDefinition} from "ts-code-generator";
import {DOMParser} from "xmldom-reborn";
import {XsdGrammar} from "./xsd-grammar";

enum xsdTypes {
    XS_STRING = 'xs:string',
    XS_ENUM = "xs:enumeration",
}

const COLUMN = ":";

const XS_SCHEMA = "xs:schema";
const XS_RESTRICTION = "xs:restriction";
const XS_SEQUENCE = "xs:sequence";
const XS_ELEMENT = "xs:element";
const XS_EXTENSION = "xs:extension";
const XS_COMPLEX_TYPE = "xs:complexType";
const XS_SIMPLE_TYPE = "xs:simpleType";
const XS_GROUP = "xs:group";
const XS_ANNOTATION = "xs:annotation";
const XS_DOCUMENTATION = "xs:documentation";
const XS_ATTRIBUTE = "xs:attribute";
const XS_ATTRGROUP = "xs:attributeGroup";
const XS_ENUM = "xs:enum";
const UNKNOWN = "Unknown";

const GROUP_PREFIX = 'group_';

const CLASS_PREFIX = ".";

class State {
    public path: string;
    public fieldName: string;
    public className: string;
    public fieldType: string;
    public parentName: string;
    public parentClass: string;
    constructor(s?: State) {
        Object.keys(s || {}).forEach( (key) => this[key] = s[key]);

    }
}


export type namespaceResolver = (ns:string) => void;


function log(s: string) {
    console.log(s);
}

function logLine() {
    const line = "-------------------------------------------------------------------------------------";
    log(line);
}

function capfirst(s: string = "") {
    return s[0]?.toUpperCase() + s?.substring(1);
}

function addClassForASTNode(fileDef: FileDefinition, astNode: any, indent ='') {
    let c = fileDef.addClass({name: astNode.name});
    console.log(indent+ 'created: ', astNode.name, ', fields: ', astNode?.fields?.length);
    (astNode.fields || []).forEach(
        f => {
            console.log(indent + 'adding field:', {name: f.fieldName, type: f.fieldType});
            c.addProperty({name: f.fieldName, type: f.fieldType, scope: "protected"});
            const typeParts = f.fieldType.split('.');
            if (typeParts.length == 2) {
                const ns = typeParts[0];
                fileDef.addImport({moduleSpecifier: this.dependencies[ns], starImportName: ns});
            }
            console.log(indent + 'nested class', f.fieldName, JSON.stringify(f.nestedClass,));
            if ( f.nestedClass ){

                addClassForASTNode(fileDef, f.nestedClass, indent + ' ');
            }
        }
    )
};
export class ClassGenerator {
    private fileDef = createFile({classes: []});
    private verbose = false;
    private pluralPostFix = 's';
    private dependencies: Map<string, string>;
    private importMap: string[] = [];
    public types: string[] = [];
    private specifiedClasses: Map<string,string> = {};
    private referencedClasses: Map<string,string> = {};

    constructor(dependencies?: Map<string,string>, private classPrefix = CLASS_PREFIX) {
        this.dependencies = dependencies || <Map<string,string>>{};
        log(JSON.stringify(this.dependencies));
    }

    private nsResolver(ns: string): void {
        this.importMap[ns] = this.dependencies[ns] || "ns";
    }

    private findAttrValue(node: HTMLElement, attrName: string): string {
        return node?.attributes?.getNamedItem(attrName)?.value;
    }

    private nodeName(node: HTMLElement): string{
        return this.findAttrValue(node , 'name');
    }

    private findChildren(node: HTMLElement): HTMLElement[] {
        const result: HTMLElement[] = [];
        let child = node?.firstChild;
        while (child) {
            if (!/function Text/.test("" + child.constructor)) {
                result.push(child as HTMLElement);
            }
            child = child.nextSibling;
        }
        return result;
    }

    private findFirstChild(node: HTMLElement): HTMLElement {
        return this.findChildren(node)[0];
    }

    private arrayfy(nodes: HTMLCollection): HTMLElement[] {
        return Array.prototype.slice.call(nodes||[], 0);
    }




    public generateClassFileDefinition(xsd: string, pluralPostFix= 's',  verbose?: boolean): FileDefinition {
        this.fileDef = createFile();
        const xmlDom = new DOMParser().parseFromString(xsd, 'application/xml');

        this.verbose = verbose;
        this.pluralPostFix = pluralPostFix;


        this.log('--------------------generating classFile definition for----------------------------------');
        this.log('');
        this.log(xsd);
        this.log('');
        this.log('-------------------------------------------------------------------------------------');
        if (xmlDom?.documentElement) {

            this.traverse(xmlDom.documentElement);

        }



        this.log('\nspecified: ', Object.keys(this.specifiedClasses).join(';'));
        this.log('referenced:',Object.keys(this.referencedClasses).join(';'));

        this.log('\n-----generated------');
        let sortedClasses = this.fileDef.classes;
        this.log(sortedClasses.map(c =>  '' + c.name).join(';').replace('[]', ''));

        sortedClasses = sortedClasses
            .filter(c => this.specifiedClasses[c.name] || this.referencedClasses[c.name] )
            .sort( (a, b) => a.name.localeCompare(b.name)
        );
        this.log('\n----filtered----');
        this.log(sortedClasses.map(c =>  c.name).join(';'));
        this.log('--------');
        // remove Schema class when not needed, when there are no toplevel elements
        sortedClasses = sortedClasses.filter(c => (c.name === "Schema") ?  c.properties.length < 0 : true);

        console.log("-------------------------------generated classes-------------------------------------");
        console.log("Nr of classes generated: ", sortedClasses.length);
        sortedClasses.forEach(c => this.log(c.name));

        logLine();

        const outfile =  this.makeSortedFileDefinition(sortedClasses);
        outfile.enums = this.fileDef.enums;
        return outfile;

    }

    public generateClassFileDefinition2(xsd: string, pluralPostFix= 's',  verbose?: boolean): FileDefinition {
        const fileDef = createFile();
        const xmlDom = new DOMParser().parseFromString(xsd, 'application/xml');
        const groups: { [key: string]: object }= {};
        this.verbose = verbose;
        this.pluralPostFix = pluralPostFix;


        this.log('--------------------generating classFile definition for----------------------------------');
        this.log('');
        this.log(xsd);
        this.log('');
        this.log('-------------------------------------------------------------------------------------');
        let ast = this.parseXsd(xsd);
        console.log(JSON.stringify(ast,null,3));
        (ast.obj.types || [])
            .filter(t => t.nodeType === 'Group')
            .forEach(t => groups[t.name] = t);
        (ast.obj.types || [])
            .filter(t => t.nodeType === 'Class')
            .forEach(t => addClassForASTNode(fileDef, t) );
        (ast.obj.types || [])
            .filter(t => t.nodeType === 'AliasType')
            .forEach( t => fileDef.addTypeAlias({name: t.name, type:t.type}) );

        (ast.obj.types || [])
            .filter(t => t.nodeType === 'Enumeration')
            .forEach(t => {
                let e = fileDef.addEnum({name: t.name});
                t.obj.values.forEach (
                    m => { e.addMember( {name: m.value , value: `"${m.value}"` as any } ); }
                );
            });

        let tmp = this.makeSortedFileDefinition(fileDef.classes);
        fileDef.classes = tmp.classes;
        return fileDef;
    }


    private parseXsd(xsd:string){
        const xsdGrammar = new XsdGrammar();
        const xmlDom = new DOMParser().parseFromString(xsd, 'application/xml');
        const xmlNode = xmlDom?.documentElement;
        return xsdGrammar.parse(xmlNode);

    }

    private log(message?: any, ...optionalParams: any[]):void {
        if (this.verbose) {
            console.log.apply(console, [message].concat(optionalParams));
        }
    }

    /**
     * Recursive function to retrieve all types from the XSD
     * @param node
     * @param parentClassDef
     * @param parent
     */
    private traverse(node: HTMLElement, state?: State, parent?: HTMLElement, indent?: string): string {
        // console.log(node.name);
        // let classDef = parentClassDef;
        if (!node?.tagName) {
            this.log(indent + `<!--   comment    -->`);
            return "";
        }
        indent = indent || "";
        state = new State(state);
        let superClassName: string;
        // let arrayPostfix='';
        // let newField:{name:string, type:string, parent: string};
        // let newClass:{name:string, super:string, abstract: boolean};
        let fileDef = this.fileDef;
        const nodeName = this.findAttrValue(node, "name");
        // const parentName = this.findAttrValue(parent,'name');
        const nodeType = this.findAttrValue(node, 'type');
        const minOccurs = this.findAttrValue(node, 'minOccurs');
        const maxOccurs = this.findAttrValue(node, 'maxOccurs');
        const abstract = this.findAttrValue(node, 'abstract');
        const final = this.findAttrValue(node, 'final');
        const nillable = this.findAttrValue(node, 'nillable');
        const ref = this.findAttrValue(node, 'ref');
        if (ref) this.referencedClasses[capfirst(ref)] = node.tagName;

        this.log(indent + `<${node?.tagName} name="${nodeName}" type="${nodeType}">`);
        state.path = (state.path || '') + node?.tagName.replace('xs:', '/');
        this.log(indent, ' path', state.path);
        switch (node.tagName) {

            case XS_SCHEMA:
                state.className = "Schema";
                this.createClass(state.className, indent);
                break

            case XS_EXTENSION:
                superClassName = this.findAttrValue(node, 'base');
                fileDef.getClass(state.className)?.addExtends(superClassName);
                break;
            case XS_ANNOTATION:
                break;
            case XS_SEQUENCE:
                break;
            case XS_RESTRICTION:
                if (state.fieldName) {
                    state.fieldType = this.findAttrValue(node, 'base');
                }
                break;
            case XS_DOCUMENTATION:
                break;
            case XS_ENUM:
                break
            case XS_SIMPLE_TYPE:
                this.log(indent + "XS_SIMPLE_TYPE");
                // make a typedef for string enums
                let typeName = (nodeName) ? nodeName : capfirst(state.fieldName);
                const simpleType = `export type ${typeName} `;
                const child = this.findFirstChild(node);
                const options = [];
                const enums  = [];
                // let childName = this.nodeName(<HTMLElement>child);
                let childBase = this.findAttrValue(<HTMLElement>child, 'base');
                if (child && child.attributes) {
                    this.log('  export type: ' + simpleType);


                    if (child.tagName === XS_RESTRICTION) {
                        this.log('  restriction: ' + simpleType);


                        // Array.prototype.slice.call(child.children,0).filter(
                        this.findChildren(child).filter(
                            (c) => (c.tagName === xsdTypes.XS_ENUM)
                        ).forEach(
                            (c) => {
                                const value = this.findAttrValue( c as HTMLElement, 'value');

                                if (value) {
                                    enums.push(value.replace(/\W/g, "_"));
                                } else {
                                    options.push(`"${value}"`);
                                }
                            }
                        );
                    }
                }

                if (enums.length > 0) {
                    this.createEnum(nodeName || capfirst(state.fieldName), enums, indent);
                } else {
                    if (options.length === 0) {
                        options.push(this.getFieldType(childBase));
                    }
                    // convert to typedef statement
                    this.types.push(simpleType + '= ' + options.join(' | ') + ';');
                    this.log('  export types: ' + this.types);
                }
                break;


            case XS_COMPLEX_TYPE:
                // this.log(indent + 'XS_COMPLEX_TYPE');


                if (nodeName) {
                    state.className = capfirst(nodeName);

                } else {
                    // when there is no name attribute take the parent fieldName

                    state.parentClass = state.className;
                    state.parentName = state.fieldName;
                    state.className = capfirst(state.fieldName);
                }
                this.createClass( state.className, indent).isAbstract = /true/i.test(abstract);
                //if  ('/schema/element/complexType' === state.path) {
                    this.specifiedClasses[state.className] = state.path;
                //}
                break;
            case XS_ATTRGROUP:
                 // treat as group
            case XS_GROUP:
                // console.log(indent, nodeName);
                if (nodeName) {
                    state.className = GROUP_PREFIX + nodeName;
                    this.createClass(state.className, indent).isAbstract= true;
                    this.specifiedClasses[state.className] = node.tagName
                    break;
                }
                //treat as element
            case XS_ATTRIBUTE:
                // treat as element

            case XS_ELEMENT:
                // console.log(indent+"XS_ELEMENT");
                //could be referenced somewhere
                const nrOfSiblings =  this.findChildren(parent).filter(c => c.tagName === XS_ELEMENT).length;

                if (nodeName && nodeType ) {
                    this.createClass( capfirst(nodeName), indent);
                }

                state.fieldName = nodeName;
                state.fieldType = nodeType || capfirst(state.fieldName || "");
                if (node.tagName === XS_ATTRIBUTE)
                    state.fieldType = nodeType || "xs:string";
                const requiredPostfix = ((minOccurs === "0") ? "?" : "");
                const arrayPostfix = (maxOccurs === "unbounded") ? "[]" : "";



                this.log(indent, 'elm siblings:' , parent.tagName, nrOfSiblings);
                const isArrayClass = nrOfSiblings === 1 && arrayPostfix;
                // nested field with nested class
                if (isArrayClass) {
                    this.log(indent, 'isArrayClass:' , isArrayClass, state.className);
                    const fieldName = state.parentName  + ((minOccurs === "0") ? "?" : "");
                    this.adjustField(state.parentClass, fieldName, nodeType, arrayPostfix, indent);

                } else {

                    if (ref) {
                        state.fieldType = [XS_GROUP, XS_ATTRGROUP].some(n => n === node.tagName) ? GROUP_PREFIX + ref : capfirst(ref);
                        state.fieldName = nodeName || ref;
                   }
                   this.log(indent, 'createField:' , state);
                   this.createField(state, arrayPostfix, requiredPostfix, indent);

                }

        }
        ////////////////////////////////////////////////////////////////
        //this.log("classes: " , this.fileDef.classes.map(c => c.name).join(';'));
        const elms = this.findChildren(node);
        elms.map( (child) => this.traverse(child, state, node, indent + " "));
   }

    private createField(state: State, arrayPostfix: string, requiredPoastfix: string, indent: string) {
        const fldName = state.fieldName + requiredPoastfix;
        let fldType: string;
        if (/^group_/.test(state.fieldType)) {
            fldType =  state.fieldType;
        } else {
            fldType = this.getFieldType(state.fieldType) + arrayPostfix;
        }
        this.log('creating field:', fldName, 'on class: ', state.className, ' with type: ', fldType);
        const classDef = this.fileDef?.getClass(state?.className || UNKNOWN);
        let property = classDef?.getProperty(fldName);

        if (!property) {
            property = classDef?.addProperty({name: fldName, type: fldType, scope: "protected"});
        }

        this.log('created field:', fldName, 'on class: ', state.className, ' with type: ', fldType);
        this.log(indent, 'prop: ', property?.name, property?.type?.text);

    }

    private adjustField(className: string, fldName: string, fieldType: string, arrayPostfix: string, indent: string) {

        const fldType = this.getFieldType(fieldType) + arrayPostfix;
        const classDef = this.fileDef.getClass(className);
        classDef?.getProperty(fldName)?.setType(fldType);

    }


    /////////////////////////////////////////////////////////////////////////
    private createEnum(name: string, names: string[], indent: string): EnumDefinition {
        let enumDef = null;//this.fileDef.getEnum(name);
        if (!enumDef) {
            this.log(indent, 'defining Enum: ', name);
            enumDef = this.fileDef.addEnum({name});
            enumDef.isExported = true;
            names.forEach(
                (n, i) => enumDef.addMember({name: n, value: `"${n}"`})
            );
         }
        return enumDef;
    }


    private createClass(name: string, indent: string): ClassDefinition {
        let classDef = this.fileDef.getClass(name);
        if (!classDef) {
            this.log(indent, 'defining class: ', name);
            classDef = this.fileDef.addClass({name});
            classDef.isExported = true;
            this.log(indent, 'defined class: ', classDef.name);
        }
        return classDef;
    }

    private makeSortedFileDefinition(sortedClasses: ClassDefinition[]): FileDefinition {
        //  console.log('makeSortedFileDefinition ');
        const outFile = createFile({classes: []});
        for ( let ns in this.importMap) {
            // console.log('ns ',ns);
            outFile.addImport({moduleSpecifier:this.importMap[ns], starImportName: ns});
        }

        let depth = 0;
        let max_depth = 1;
        // console.log('max_depth ',max_depth);
        while (depth <= max_depth) {
            // console.log('depth ');
            sortedClasses.forEach(
                (c) => {

                    let hDepth = this.findHierachyDepth(c, this.fileDef);

                    if (hDepth > max_depth) {
                        max_depth = hDepth;
                    }
                    this.log(c.name + '\t' + hDepth);
                    if (hDepth === depth) {

                        if (c.name.indexOf(GROUP_PREFIX) === 0) {
                            // return;
                        }



                        outFile.addClass({name: c.name});


                        const classDef = outFile.getClass( c.name);
                        classDef.isExported = true;
                        classDef.isAbstract = c.isAbstract;
                        c.extendsTypes.forEach((t) => classDef.addExtends(t.text));
                        c.getPropertiesAndConstructorParameters().forEach(
                            (prop) => {

                                this.addProtectedPropToClass(classDef, prop);

                            }
                        );
                        const constructor = classDef.addMethod({name: 'constructor'});
                        constructor.scope = "protected";
                        constructor.addParameter({name:"props?", type:c.name});
                        constructor.onWriteFunctionBody = (writer) => {
                            if (c.extendsTypes.length) {
                                writer.write(`super();\n`);
                            }
                            writer.write(`this["@class"] = "${this.classPrefix}${c.name}";\n`);
                            writer.write('(<any>Object).assign(this, <any> props);');
                        };
                    }
                }
            );
            // console.log('depth:', depth);
            depth++;
        }
        console.log('ready');
        return outFile;
    }

    private addProtectedPropToClass(classDef: ClassDefinition, prop) {
        let type = prop.type.text;

        if (/^group_/.test(type)) {
            let c = this.fileDef.getClass(type);
            if (c) {
                c.getPropertiesAndConstructorParameters().forEach(
                    (p) => {
                        this.addProtectedPropToClass(classDef, p);
                    }
                );
                return;
            }
        }


        classDef.addProperty(
            {
                defaultExpression: (prop.defaultExpression) ? prop.defaultExpression.text : null,
                name: prop.name,
                scope: "protected",
                type: prop.type.text,
            }
        );
    }


    private findHierachyDepth(c: ClassDefinition, f: FileDefinition) {
        let result = 0;
        let superClassName = (c.extendsTypes[0]) ? c.extendsTypes[0].text : '';
        while (superClassName) {
            // console.log('superClassName',c,superClassName)
            result++;
            c = f.getClass(superClassName);
            superClassName =  c?.extendsTypes[0]?.text;
        }
        return result;
    }


    private getFieldType(type: string): string {
        let result = capfirst(type);
        switch (type?.toLowerCase()) {
            case "xs:string":
                result = "string";
                break;
            case "xs:float":
                result = "number";
                break;
            case "xs:double":
                result = "number";
                break;
            case "xs:integer":
                result = "number";
                break;
            case "xs:int":
                result = "number";
                break;
            case "xs:boolean":
                result = "boolean";
                break;
            case "xs:dateTime":
                result = "Date";
                break;
            case "xs:date":
                result = "Date";
                break;
            case "xs:long":
                result = "number";
                break;
            case "xs:decimal":
                result = "number";
                break;
            case "xs:base64Binary":
                result = "string";
                break;
        }

        if (result) {

            if (result.indexOf(COLUMN) > 0) {
                let ns = result.split(COLUMN)[0];
                this.nsResolver(ns);
                console.log("namespace",ns);
            }

            return result.replace(COLUMN, '.');
        } else {
            return 'any';
        }

    }



}

