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

      const mappingCode =
        componentNames.length > 0
          ? `const components = { ${componentNames.join(", ")} };`
          : "const components = {};";

      // --- Generate the final module code ---
      const code = `
        ${scriptContent}
        export default function(target) {
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
          temp.innerHTML = \`${templateContent}\`;
          
          // Mapping for custom components
          ${mappingCode}
          
          // Mount custom components
          Object.keys(components).forEach(compName => {
            const elems = temp.querySelectorAll(compName.toLowerCase());
            elems.forEach(el => {
              // Create a marker comment to identify where to mount
              const marker = document.createComment(\`Mount point for \${compName}\`);
              el.parentNode.replaceChild(marker, el);
              
              // Create a fragment for the component
              const fragment = document.createDocumentFragment();
              components[compName](fragment);
              
              // Replace the marker with the component content
              marker.parentNode.replaceChild(fragment, marker);
            });
          });
          
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
  };
}
