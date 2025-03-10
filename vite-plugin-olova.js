// plugins/vite-plugin-olova.js

export default function olovaPlugin() {
  return {
    name: "vite-plugin-olova",
    transform(src, id) {
      if (!id.endsWith(".olova")) return;

      // --- Extract <script> block (if any) ---
      let scriptContent = "";
      const scriptMatch = src.match(/<script>([\s\S]*?)<\/script>/);
      if (scriptMatch) {
        scriptContent = scriptMatch[1].trim();
      }
      // Remove the <script> block from the source
      let templateContent = src.replace(/<script>[\s\S]*?<\/script>/, "");

      // --- Extract <style> block (if any) ---
      let styleContent = "";
      const styleMatch = templateContent.match(/<style>([\s\S]*?)<\/style>/);
      if (styleMatch) {
        styleContent = styleMatch[1].trim();
      }
      // Remove the <style> block from the template
      templateContent = templateContent
        .replace(/<style>[\s\S]*?<\/style>/, "")
        .trim();

      // --- Auto-bind functions declared in the script block to window ---
      // This simple regex finds functions declared as "function functionName(...)".
      const fnRegex = /function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(/g;
      let autoBindCode = "";
      let match;
      while ((match = fnRegex.exec(scriptContent)) !== null) {
        autoBindCode += `\nwindow.${match[1]} = ${match[1]};`;
      }

      // IMPORTANT: Check if the script contains a declaration of 'props'
      // If it does, we need to modify the script to avoid conflicts
      const hasPropsDeclaration =
        /\blet\s+props\b|\bconst\s+props\b|\bvar\s+props\b/.test(scriptContent);

      // If there's a props declaration, we'll rename it in our internal code
      const internalPropsName = hasPropsDeclaration
        ? "__olova_internal_props"
        : "props";

      // Append the auto-binding code to the scriptContent
      scriptContent += autoBindCode;

      // --- Detect component tags in the template ---
      const componentNames = [];
      const componentTagRegex = /<([A-Z][A-Za-z0-9]*)\b/g;
      while ((match = componentTagRegex.exec(templateContent))) {
        if (!componentNames.includes(match[1])) {
          componentNames.push(match[1]);
        }
      }

      // --- Generate the final module code ---
      const code = `
        // Keep the original imports from the script
        ${scriptContent}
        
        // Component implementation
        export default function(target, passedProps = {}) {
          // Store props for access within the component
          const ${internalPropsName} = passedProps;
          
          // Insert component style into document head if available
          ${
            styleContent
              ? `
          const style = document.createElement('style');
          style.textContent = \`${styleContent}\`;
          document.head.appendChild(style);
          `
              : ""
          }
          
          // Create a temporary container to parse the HTML
          const temp = document.createElement('div');
          
          // Process template with props interpolation
          let processedTemplate = \`${templateContent}\`;
          
          // Replace {props.X} with actual values
          for (const key in ${internalPropsName}) {
            const regex = new RegExp('{${internalPropsName}.' + key + '}', 'g');
            processedTemplate = processedTemplate.replace(regex, ${internalPropsName}[key]);
          }
          
          // Replace {X} with actual values (for direct props access)
          for (const key in ${internalPropsName}) {
            const regex = new RegExp('{' + key + '}', 'g');
            processedTemplate = processedTemplate.replace(regex, ${internalPropsName}[key]);
          }
          
          temp.innerHTML = processedTemplate;
          
          // Mount custom components
          ${componentNames
            .map(
              (compName) => `
            const ${compName.toLowerCase()}Elems = temp.querySelectorAll('${compName.toLowerCase()}');
            ${compName.toLowerCase()}Elems.forEach(el => {
              // Collect props from attributes
              const elementProps = {};
              
              // Process regular attributes as props
              Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith(':')) {
                  // Dynamic binding (evaluate the expression)
                  const propName = attr.name.substring(1);
                  try {
                    // Use eval safely for expressions in the current scope
                    elementProps[propName] = eval(attr.value);
                  } catch (e) {
                    console.error(\`Error evaluating prop \${propName}:\`, e);
                    elementProps[propName] = attr.value;
                  }
                } else if (!attr.name.startsWith('@') && attr.name !== 'class' && attr.name !== 'style') {
                  // Regular props (string values)
                  elementProps[attr.name] = attr.value;
                }
              });
              
              // Create a marker comment to identify where to mount
              const marker = document.createComment(\`Mount point for ${compName}\`);
              el.parentNode.replaceChild(marker, el);
              
              // Create a fragment for the component
              const fragment = document.createDocumentFragment();
              ${compName}(fragment, elementProps);
              
              // Replace the marker with the component content
              marker.parentNode.replaceChild(fragment, marker);
            });
          `
            )
            .join("\n")}
          
          // Use DocumentFragment for better performance
          const fragment = document.createDocumentFragment();
          while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
          }
          
          // Append the content to the target
          target.appendChild(fragment);
        }
      `;
      return { code, map: null };
    },

    // Add a virtual module resolver for component imports
    resolveId(id) {
      if (id === "virtual:olova-components") {
        return id;
      }
      return null;
    },

    // Provide the virtual module content
    load(id) {
      if (id === "virtual:olova-components") {
        return `
          // This is a virtual module that re-exports all components
          export {};
        `;
      }
      return null;
    },
  };
}
