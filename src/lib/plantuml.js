const plantuml = (function () {
  const plantuml_gen = tree => { 
    let result = '@startuml\nskinparam classAttributeIconSize 0\n';
    for (const type of tree.types) {
      result += plantuml_proc(type);
    }
    result += "@enduml\n";
    console.log(result);
  }

  const ast_body = body => {
    let fields = []
    let methods = []
    
    for (const type of body) {
      switch (type.node) {
        case "FieldDeclaration":
          fields.push(ast_field(type))
          break
        case "MethodDeclaration":
          methods.push(ast_method(type))
          break
        default:
          throw `Error: ${type.node} at ast_body`
      }
    }
  }

  const ast_single_variable = node => {
    switch (node.node) {
      case "SingleVariableDeclaration":
        break
      default:
        throw `Error: ${node.node} at ast_single_variable`
    }
  }

  // TODO
  const ast_method = method => {
    let name = ""
    let modifiers = ""
    let returnType = ""
    let parameters = []

    switch (method.node) {
      case "MethodDeclaration":
        name = ast_name(method.name)
        returnType = ast_type(method.returnType2)
        modifiers = ast_modifiers(method.modifiers)
        for (const param in method.parameters) {
          parameters.push(ast_single_variable(param))
        }
    }
  }

  const ast_field = field => {
    let modifiers = ""
    let type = ""
    let result = []

    switch (field.node) {
      case "FieldDeclaration":
        modifiers = ast_modifiers(field.modifiers)
        type = ast_type(field.type)
        result = ast_frag(field.fragments)

        return (
          `${modifiers}${type} ` + result.join(`${modifiers}${type}`)
        )
      default:
        throw `Error: ${field.node} at ast_field`
    }
  }

  const ast_frag = fragments => {
    let res = []
    for (const frag of fragments) {
      switch (frag.node) {
        case "VariableDeclarationFragment":
          res.push(ast_name(frag.name))
          break
        default:
        throw `Error: ${frag.node} at ast_frag`
      }
    }
  }

  const ast_modifiers = modifiers => {
    let res = []
    for (const mod of modifiers) {
      switch (mod.node) {
        case "Modifier":
          switch (mod.keyword) {
            case "private":
              res.append("-") 
              break
            case "public":
              res.append("+")
              break
            case "protected":
              res.append("#")
              break
            case "package":
              res.append("~")
              break
            case "internal":
              res.append("~")
              break
            case "static":
              res.append(`{static}`)
              break
            default:
              throw `Error: ${mod.keyword} at ast_visibility modifier`
          }
          break
        case "MarkerAnnotation":
          break
        default:
          throw `Error: ${mod.node} at ast_visibility`
      }
    }
    return res.join(' ')
  }

  const ast_name = node => {
    if (node.node == 'SimpleName') {
        return node.identifier
    }
    throw `Error: ${node.node} at ast_name`
  }

  const ast_param = parameters => {
    if (parameters.length === 0) {
        return null;
    }
    let arr = []
    for (const param of parameters) {
        if (param.node === "TypeParameter") {
            arr.push(ast_name(param.name))
        } else {
            throw `Error: ${param.node} at ast_param`
        }
    }
    return arr.join(", ")
  }

  const ast_type = sup => {
    let args = []
    switch (sup.node) {
        case "SimpleType":
            const name = ast_name(sup.name);
            return name
        case "PrimitiveType":
            return sup.primitiveTypeCode
        case "ParameterizedType":
            for (const arg of sup.typeArguments) {
                let temp = ast_type(arg)
                if (arg.bound != null) {
                    arg.upperBound 
                        ? temp += " extends " + ast_type(arg.bound)
                        : temp += " super " + ast_type(arg.bound)
                }
                args.push(temp)
            }
            return `${ast_type(sup.type)}<${args.join(", ")}>`
        case "WildcardType":
            return "?"
        case "ArrayType":
            return `${ast_type(sup.componontType)}[]`
        default:
            throw `Error: ${sup.node} at ast_type`
    }
  }

  const ast_get_decl = node => {
    let name = ast_name(node.name)
    let parameters = ast_param(node.typeParameters)
    if (parameters) {
        return name + "<" + parameters + ">"
    }
    return name
  }

  const plantuml_proc = type => {
    let res = '';
    let decl = ast_get_decl(type)
    // console.log(decl)
    if (type.superclassType) {
        const sup = ast_type(type.superclassType)
        res += `${sup} <|-- ${decl}`
    }
    const body = ast_body(type.bodyDeclarations)
    res += `class ${decl} {
      ${body}
    }`
    console.log("LMAO");
    console.log(res);
    return res
  }
  return {
    gen: plantuml_gen,
  }
})();

export default plantuml;
