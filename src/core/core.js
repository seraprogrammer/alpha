const Fragment = Symbol("Fragment");

let currentEffect;
const setSignal = (initialValue) => {
  const subscribers = new Set();
  return [
    () => {
      try {
        if (currentEffect) subscribers.add(currentEffect);
        return initialValue;
      } catch (error) {
        console.error("Error in signal getter:", error);
        throw error;
      }
    },
    (newValue) => {
      try {
        initialValue =
          typeof newValue === "function" ? newValue(initialValue) : newValue;
        [...subscribers].forEach((subscriberFunction) => {
          try {
            subscriberFunction();
          } catch (error) {
            console.error("Error in signal subscriber:", error);
          }
        });
        return initialValue;
      } catch (error) {
        console.error("Error in signal setter:", error);
        throw error;
      }
    },
  ];
};

const setEffect = (effectFunction) => {
  const runEffect = () => {
    try {
      currentEffect = runEffect;
      const result = effectFunction();
      currentEffect = null;
      return result;
    } catch (error) {
      currentEffect = null;
      console.error("Error in effect:", error);
      throw error;
    }
  };
  try {
    runEffect();
  } catch (error) {
    console.error("Error initializing effect:", error);
  }
};

const setMemo = (memoFunction) => {
  try {
    const [getMemoValue, setMemoValue] = setSignal();
    setEffect(() => {
      try {
        setMemoValue(memoFunction());
      } catch (error) {
        console.error("Error in memo function:", error);
        throw error;
      }
    });
    return getMemoValue;
  } catch (error) {
    console.error("Error creating memo:", error);
    return () => undefined;
  }
};

const html = (tagName, properties, ...children) => {
  try {
    if (typeof tagName === "function") {
      try {
        return tagName(properties, ...children);
      } catch (error) {
        console.error(`Error in function component:`, error);
        return document.createComment(`Error in component: ${error.message}`);
      }
    }

    if (tagName === Fragment || !tagName) {
      const documentFragment = document.createDocumentFragment();
      children.flat(Infinity).forEach((child) => {
        if (child !== null && child !== undefined) {
          documentFragment.appendChild(
            child instanceof Node
              ? child
              : document.createTextNode(String(child))
          );
        }
      });
      return documentFragment;
    }

    const SVG_TAGS = new Set([
      "svg",
      "path",
      "circle",
      "rect",
      "line",
      "polygon",
      "polyline",
      "ellipse",
      "g",
      "text",
      "defs",
      "filter",
      "mask",
      "marker",
      "pattern",
      "linearGradient",
      "radialGradient",
      "stop",
      "use",
      "clipPath",
      "textPath",
      "tspan",
      "foreignObject",
    ]);

    const isSvgElement = SVG_TAGS.has(tagName);

    const element = isSvgElement
      ? document.createElementNS("http://www.w3.org/2000/svg", tagName)
      : document.createElement(tagName);

    if (properties) {
      for (const [propertyName, propertyValue] of Object.entries(properties)) {
        if (propertyValue === null || propertyValue === undefined) continue;

        if (propertyName === "value") {
          element.value = propertyValue;
        } else if (propertyName === "className" || propertyName === "class") {
          element.setAttribute("class", propertyValue);
        } else if (
          propertyName === "style" &&
          typeof propertyValue === "object"
        ) {
          Object.entries(propertyValue).forEach(([styleName, styleValue]) => {
            element.style[styleName] = styleValue;
          });
        } else if (
          propertyName === "dangerouslySetInnerHTML" &&
          propertyValue.__html
        ) {
          element.innerHTML = propertyValue.__html;
        } else if (propertyName === "ref") {
          if (typeof propertyValue === "function") propertyValue(element);
          else if (propertyValue && "current" in propertyValue)
            propertyValue.current = element;
        } else if (propertyName.startsWith("on")) {
          const eventName = propertyName.slice(2).toLowerCase();
          element.addEventListener(eventName, propertyValue);
        } else if (isSvgElement) {
          if (propertyName.includes(":")) {
            const [namespace, attrName] = propertyName.split(":");
            const namespaceMap = {
              xlink: "http://www.w3.org/1999/xlink",
              xml: "http://www.w3.org/XML/1998/namespace",
            };
            if (namespaceMap[namespace]) {
              element.setAttributeNS(
                namespaceMap[namespace],
                attrName,
                propertyValue
              );
            } else {
              element.setAttribute(propertyName, propertyValue);
            }
          } else {
            element.setAttribute(propertyName, propertyValue);
          }
        } else {
          if (typeof propertyValue === "boolean") {
            if (propertyValue) element.setAttribute(propertyName, "");
            else element.removeAttribute(propertyName);
          } else {
            element.setAttribute(propertyName, propertyValue);
          }
        }
      }
    }

    const appendChild = (parentElement, childElement) => {
      try {
        if (childElement === null || childElement === undefined) return;

        if (Array.isArray(childElement)) {
          childElement
            .flat(Infinity)
            .forEach((nestedChild) => appendChild(parentElement, nestedChild));
          return;
        }

        if (childElement instanceof Node) {
          parentElement.appendChild(childElement);
        } else if (typeof childElement === "function") {
          const placeholderNode = document.createTextNode("");
          parentElement.appendChild(placeholderNode);

          setEffect(() => {
            try {
              const functionResult = childElement();
              if (functionResult === null || functionResult === undefined) {
                placeholderNode.textContent = "";
                return;
              }

              if (Array.isArray(functionResult)) {
                const resultFragment = document.createDocumentFragment();
                functionResult.flat(Infinity).forEach((resultItem) => {
                  if (resultItem !== null && resultItem !== undefined) {
                    resultFragment.appendChild(
                      resultItem instanceof Node
                        ? resultItem
                        : document.createTextNode(String(resultItem))
                    );
                  }
                });

                while (placeholderNode.nextSibling) {
                  parentElement.removeChild(placeholderNode.nextSibling);
                }

                parentElement.insertBefore(
                  resultFragment,
                  placeholderNode.nextSibling
                );
              } else if (functionResult instanceof Node) {
                while (placeholderNode.nextSibling) {
                  parentElement.removeChild(placeholderNode.nextSibling);
                }
                parentElement.insertBefore(
                  functionResult,
                  placeholderNode.nextSibling
                );
              } else {
                placeholderNode.textContent = String(functionResult);
              }
            } catch (error) {
              console.error("Error in reactive child function:", error);
              placeholderNode.textContent = `Error: ${error.message}`;
            }
          });
        } else if (
          typeof childElement === "object" &&
          "then" in childElement &&
          typeof childElement.then === "function"
        ) {
          const placeholderNode = document.createTextNode("");
          parentElement.appendChild(placeholderNode);

          childElement
            .then((promiseResult) => {
              try {
                if (promiseResult instanceof Node) {
                  parentElement.replaceChild(promiseResult, placeholderNode);
                } else {
                  placeholderNode.textContent = String(promiseResult);
                }
              } catch (error) {
                console.error("Error resolving promise in DOM:", error);
                placeholderNode.textContent = `Error: ${error.message}`;
              }
            })
            .catch((error) => {
              console.error("Promise rejected in DOM:", error);
              placeholderNode.textContent = `Error: ${error.message}`;
            });
        } else {
          parentElement.appendChild(
            document.createTextNode(String(childElement))
          );
        }
      } catch (error) {
        console.error("Error appending child:", error);
      }
    };

    children.forEach((child) => appendChild(element, child));
    return element;
  } catch (error) {
    console.error("Error creating element:", error);
    return document.createComment(`Error creating element: ${error.message}`);
  }
};

const render = (component, rootElement, options = {}) => {
  try {
    if (typeof rootElement === "string") {
      rootElement = document.querySelector(rootElement);
      if (!rootElement) {
        console.error(`Cannot find element matching selector: ${rootElement}`);
        return;
      }
    }

    const { clear = true, hydrate = false, beforeRender = null } = options;

    if (clear && !hydrate) {
      rootElement.textContent = "";
    }

    if (beforeRender && typeof beforeRender === "function") {
      try {
        beforeRender(rootElement);
      } catch (error) {
        console.error("Error in beforeRender hook:", error);
      }
    }

    let viewContent;
    try {
      viewContent = typeof component === "function" ? component() : component;
    } catch (error) {
      console.error("Error rendering component:", error);
      const errorNode = document.createElement("div");
      errorNode.className = "olova-error";
      errorNode.textContent = `Render Error: ${error.message}`;
      rootElement.appendChild(errorNode);
      return errorNode;
    }

    if (!viewContent) return null;

    if (Array.isArray(viewContent)) {
      const contentFragment = document.createDocumentFragment();
      viewContent.flat(Infinity).forEach((node) => {
        if (node) {
          contentFragment.appendChild(
            node instanceof Node ? node : document.createTextNode(String(node))
          );
        }
      });
      rootElement.appendChild(contentFragment);
      return contentFragment;
    }

    rootElement.appendChild(
      viewContent instanceof Node
        ? viewContent
        : document.createTextNode(String(viewContent))
    );

    return viewContent;
  } catch (error) {
    console.error("Error in render function:", error);
    return null;
  }
};

const setRef = () => {
  let current = null;
  return (element) => {
    if (element !== undefined) current = element;
    return current;
  };
};

const onMount = (mountFunction) => {
  setEffect(() => {
    queueMicrotask(() => {
      try {
        mountFunction();
      } catch (error) {
        console.error("Error in onMount callback:", error);
      }
    });
  });
};

const onUnmount = (cleanupFunction) => {
  setEffect(() => {
    return () => {
      try {
        cleanupFunction();
      } catch (error) {
        console.error("Error in onUnmount cleanup:", error);
      }
    };
  });
};

// Export enhanced API
export {
  setSignal,
  setEffect,
  setMemo,
  setRef,
  html,
  render,
  onMount,
  onUnmount,
  Fragment,
};
